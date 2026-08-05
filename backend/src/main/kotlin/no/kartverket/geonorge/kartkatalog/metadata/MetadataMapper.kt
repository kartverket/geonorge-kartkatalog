package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.Contact
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.DistributionFormat
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.KeywordGroup
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.ReferenceSystem
import no.kartverket.geonorge.kartkatalog.integrations.register.CodeList
import no.kartverket.geonorge.kartkatalog.metadata.models.AccessState
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductDataQualityMeasure
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductDistributionFormat
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductDistributionFormatEntry
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductDistributionGroup
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductKeyword
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductMetadata
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductMetadataContact
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductReferenceSystem

class MetadataMapper(
    private val codeListTranslator: CodeListTranslator,
    private val staticNorgeskartUrl: String,
) {
    suspend fun toProductMetadata(record: MetadataRecord): ProductMetadata {
        val accessState = resolveAccessState(record)
        return ProductMetadata(
            title = record.title,
            organization = record.metadataContact.organization.orEmpty(),
            hierarchyLevel = record.hierarchyLevel,
            accessState = accessState,
            dateUpdated = record.dates.firstOrNull { it.type == "revision" }?.date,
            maintenanceFrequency =
                codeListTranslator.translate(
                    CodeList.MAINTENANCE_FREQUENCY,
                    record.maintenanceFrequency,
                ),
            spatialRepresentation =
                codeListTranslator.translate(
                    CodeList.SPATIAL_REPRESENTATIONS,
                    record.spatialRepresentationTypes.firstOrNull(),
                ),
            spatialScope = mapSpatialScope(record),
            resolutionScale = record.resolutionScale,
            keywordsTheme = mapThemeKeywords(record),
            nationalKeywords = mapNationalKeywords(record),
            distributionFormats =
                record.distributionInfo?.formats.orEmpty().map {
                    it.toProductDistributionFormat()
                },
            referenceSystems =
                record.referenceSystems.map {
                    it.toProductReferenceSystem()
                },
            distributionGroups =
                record.distributionInfo?.formats.orEmpty()
                    .groupBy { it.onlineResources.firstOrNull { !it.protocol.isNullOrBlank() }?.protocol }
                    .map { (protocol, formatsInGroup) ->
                        val resources =
                            formatsInGroup.flatMap {
                                it.onlineResources
                            }
                        val distributionType =
                            codeListTranslator.findItem(
                                CodeList.DISTRIBUTION_TYPES,
                                protocol,
                            )
                        ProductDistributionGroup(
                            protocolName =
                                distributionType?.label
                                    ?: protocol.orEmpty(),
                            protocolDescription =
                                distributionType?.description,
                            formats =
                                formatsInGroup.map {
                                    ProductDistributionFormatEntry(
                                        name = it.name,
                                        urls =
                                            it.onlineResources.map { r ->
                                                r.url
                                            }.distinct(),
                                    )
                                },
                            unitsOfDistribution =
                                resources.firstOrNull {
                                    it.unitsOfDistribution != null
                                }
                                    ?.unitsOfDistribution,
                        )
                    },
            thumbnailUrl =
                record.thumbnails.firstOrNull {
                    it.type?.equals("medium", ignoreCase = true) == true
                }?.url ?: record.thumbnails.firstOrNull()?.url,
            dataQualityMeasures =
                record.dataQualityMeasures
                    .mapNotNull { measure ->
                        if (measure.value == null) return@mapNotNull null
                        ProductDataQualityMeasure(
                            explanation = measure.measureDescription,
                            quantitativeResult = measure.value,
                            quantitativeResultValueUnit = getSimpleValueUnit(measure.valueUnit),
                            title = measure.nameOfMeasure,
                        )
                    },
            fairStatusPercentFromMetadata = findFairPercent(record),
            abstractText = record.abstract,
            purpose = record.purpose,
            specificUsage = record.specificUsage,
            processHistory = record.processHistory,
            constraints =
                record.legalConstraints?.let { constraints ->
                    constraints.copy(
                        accessConstraints = describeAccessConstraints(record, accessState),
                        useConstraints =
                            describeUseConstraints(
                                constraints.useConstraints,
                                constraints.otherConstraintsLink,
                            ),
                    )
                },
            securityClassification =
                codeListTranslator.translate(
                    CodeList.CLASSIFICATION,
                    record.securityConstraints?.classification,
                ),
            contactMetadata = record.metadataContact.toProductMetadataContact(),
            contactOwner =
                record.contacts
                    .firstOrNull { it.role.equals("owner", ignoreCase = true) }
                    ?.toProductMetadataContact(),
            contactPublisher =
                record.contacts
                    .firstOrNull { it.role.equals("publisher", ignoreCase = true) }
                    ?.toProductMetadataContact(),
            coverageUrl =
                getCoverageLink(
                    record.extensionResources,
                    staticNorgeskartUrl = staticNorgeskartUrl,
                ),
        )
    }

    private fun describeAccessConstraints(
        record: MetadataRecord,
        accessState: AccessState?,
    ): String {
        return when {
            accessState == AccessState.OPEN -> "Åpne data"
            accessState == AccessState.RESTRICTED -> "Norge digitalt-begrenset"
            else -> record.legalConstraints?.accessConstraints ?: "-"
        }
    }

    private suspend fun describeUseConstraints(
        useConstraints: String?,
        otherConstraintsLink: String?,
    ): String? {
        val code = if (!otherConstraintsLink.isNullOrEmpty()) "license" else useConstraints
        return codeListTranslator.translate(CodeList.RESTRICTIONS, code)
    }

    private fun mapThemeKeywords(record: MetadataRecord): List<ProductKeyword> =
        mapKeywords(record) { it.type.equals("theme", ignoreCase = true) }

    private fun mapNationalKeywords(record: MetadataRecord): List<ProductKeyword> =
        mapKeywords(record) {
            it.thesaurus.equals("Nasjonal tematisk inndeling (DOK-kategori)", ignoreCase = true)
        }

    private fun mapSpatialScope(record: MetadataRecord): String? =
        mapKeywords(record) {
            it.thesaurus?.equals("Spatial scope", ignoreCase = true) == true ||
                it.thesaurusHref?.contains("SpatialScope", ignoreCase = true) == true
        }.firstOrNull()?.keywordValue

    private fun mapKeywords(
        record: MetadataRecord,
        predicate: (KeywordGroup) -> Boolean,
    ): List<ProductKeyword> =
        record.keywordGroups
            .filter(predicate)
            .flatMap { group ->
                group.keywords.map { keyword ->
                    ProductKeyword(
                        keywordValue = keyword.value,
                        type = group.type,
                    )
                }
            }

    private fun resolveAccessState(record: MetadataRecord): AccessState? =
        when {
            isRestricted(record) -> AccessState.RESTRICTED
            isProtected(record) -> AccessState.PROTECTED
            isOpenData(record) -> AccessState.OPEN
            else -> null
        }

    private fun isOpenData(record: MetadataRecord): Boolean {
        val accessText = listOfNotNull(record.legalConstraints?.otherConstraintsAccess).joinToString(" ")
        return containsAny(
            accessText,
            "no restrictions",
            "noLimitations",
            "no limitations",
            "åpne data",
        )
    }

    private fun isRestricted(record: MetadataRecord): Boolean {
        val accessText = listOfNotNull(record.legalConstraints?.otherConstraintsAccess).joinToString(" ")
        return containsAny(
            accessText,
            "norway digital restricted",
            "INSPIRE_Directive_Article13_1d",
        )
    }

    private fun isProtected(record: MetadataRecord): Boolean {
        val accessConstraint = listOfNotNull(record.legalConstraints?.otherConstraintsAccess).joinToString(" ")
        return containsAny(accessConstraint, "Beskyttet", "restricted", "INSPIRE_Directive_Article13_1b") ||
            record.securityConstraints?.classification.equals("restricted", ignoreCase = true)
    }

    private fun containsAny(
        value: String,
        vararg searchTerms: String,
    ): Boolean {
        val normalized = value.lowercase()
        return searchTerms.any { term -> normalized.contains(term.lowercase()) }
    }

    private fun getSimpleValueUnit(value: String?): String? {
        if (value == null) return null
        return when {
            value == "http://www.opengis.net/def/uom/SI/second" ||
                value.contains("second", ignoreCase = true) -> "second"
            value == "urn:ogc:def:uom:OGC::percent" ||
                value.contains("percent", ignoreCase = true) -> "percent"
            value == "http://www.opengis.net/def/uom/OGC/1.0/unity" ||
                value.contains("integer", ignoreCase = true) -> "integer"
            else -> value
        }
    }

    private fun DistributionFormat.toProductDistributionFormat() =
        ProductDistributionFormat(
            name = name,
            version = version,
        )

    private fun ReferenceSystem.toProductReferenceSystem() =
        ProductReferenceSystem(
            code = code,
            codeSpace = codeSpace,
        )

    private fun Contact.toProductMetadataContact() =
        ProductMetadataContact(
            name = name,
            email = email,
            organization = organization,
            organizationEnglish = organizationEnglish,
            role = role,
        )

    private fun findFairPercent(record: MetadataRecord): Int? =
        record.dataQualityMeasures
            .firstOrNull { it.nameOfMeasure == "Prosentvis oppfyllelse av FAIR-prinsipper" }
            ?.value
}

package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.Contact
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.DistributionFormat
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.KeywordGroup
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.LegalConstraints
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.ReferenceSystem
import no.kartverket.geonorge.kartkatalog.integrations.register.CodeList
import no.kartverket.geonorge.kartkatalog.metadata.models.AccessState
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductConstraints
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
        val rawSpatialScope = mapRawSpatialScope(record)
        val spatialScope = mapSpatialScope(rawSpatialScope)
        val collaborationKeywords = mapCollaborationKeywords(record)
        val hvdKeywords = mapHvdKeywords(record)
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
            spatialScope = spatialScope,
            resolutionScale = record.resolutionScale,
            keywordsTheme = mapThemeKeywords(record),
            nationalKeywords = mapNationalKeywords(record),
            nationalInitiatives = mapNationalInitiatives(collaborationKeywords),
            dokStatus = mapDokStatus(collaborationKeywords, rawSpatialScope),
            isHighValueDataset = hvdKeywords.isNotEmpty(),
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
                            protocol = protocol,
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
                                                DistributionProtocols.appendUuidForGeonorgeDownload(
                                                    r.url,
                                                    protocol,
                                                    record.uuid,
                                                )
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
            thumbnailUrl = pickThumbnailUrl(record),
            fairStatusPercentFromMetadata = findFairPercent(record),
            abstractText = record.abstract,
            purpose = record.purpose,
            specificUsage = record.specificUsage,
            supplementalDescription = record.supplementalDescription,
            helpUrl =
                record.extensionResources
                    .firstOrNull { it.applicationProfile.equals("hjelp", ignoreCase = true) }
                    ?.url,
            processHistory = record.processHistory,
            constraints = record.legalConstraints?.toProductConstraints(accessState = accessState),
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
            productSpecificationUrl =
                record.extensionResources.firstOrNull {
                    it.applicationProfile.trim().equals("produktspesifikasjon", ignoreCase = true)
                }?.url,
        )
    }

    private fun describeAccessConstraints(
        recordAccessConstraints: String?,
        accessState: AccessState?,
    ): String {
        return when {
            accessState == AccessState.OPEN -> "Åpne data"
            accessState == AccessState.RESTRICTED -> "Norge digitalt-begrenset"
            else -> recordAccessConstraints ?: "-"
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

    private fun mapCollaborationKeywords(record: MetadataRecord): List<ProductKeyword> =
        mapKeywords(record) {
            it.thesaurusHref?.contains("samarbeid-og-lover", ignoreCase = true) == true
        }

    private fun mapHvdKeywords(record: MetadataRecord): List<ProductKeyword> =
        mapKeywords(record) {
            it.thesaurusHref?.contains("data.europa.eu/bna/", ignoreCase = true) == true
        }

    private val relevantCollaborationTags =
        mapOf(
            "mareano" to "Mareano",
            "marinegrunnkart" to "Marine grunnkart",
            "økologiskgrunnkart" to "Økologisk grunnkart",
        )

    private fun String.normalizedForMatch(): String = replace(" ", "").lowercase()

    private fun mapNationalInitiatives(collaborationKeywords: List<ProductKeyword>): List<String> {
        val matchedKeys =
            collaborationKeywords
                .mapNotNull { it.keywordValue?.normalizedForMatch() }
                .toSet()
        return relevantCollaborationTags
            .filterKeys { it in matchedKeys }
            .values
            .toList()
    }

    private fun mapDokStatus(
        collaborationKeywords: List<ProductKeyword>,
        rawSpatialScope: String?,
    ): String? {
        val isDok =
            collaborationKeywords.any {
                it.keywordValue.equals("Det offentlige kartgrunnlaget", ignoreCase = true)
            }
        return when {
            !isDok -> null
            rawSpatialScope.equals("Local", ignoreCase = true) -> "Lokalt DOK-datasett"
            else -> "DOK-datasett"
        }
    }

    private val spatialScopeTranslations =
        mapOf(
            "European" to "Europeisk",
            "Global" to "Global",
            "Local" to "Lokal",
            "National" to "Nasjonal",
            "Regional" to "Regional",
        )

    private fun mapRawSpatialScope(record: MetadataRecord): String? =
        mapKeywords(record) {
            it.thesaurus?.equals("Spatial scope", ignoreCase = true) == true ||
                it.thesaurusHref?.contains("SpatialScope", ignoreCase = true) == true
        }.firstOrNull()?.keywordValue

    private fun mapSpatialScope(rawSpatialScope: String?): String? =
        rawSpatialScope?.let { raw -> spatialScopeTranslations[raw] ?: raw }

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

    private suspend fun LegalConstraints.toProductConstraints(accessState: AccessState?) =
        ProductConstraints(
            accessConstraints = describeAccessConstraints(this.accessConstraints, accessState),
            useConstraints =
                describeUseConstraints(
                    this.useConstraints,
                    this.otherConstraintsLink,
                ),
            useLimitations = useLimitations,
            otherConstraintsLink = otherConstraintsLink,
            otherConstraintsLinkText = otherConstraintsLinkText,
            otherConstraintsAccess = otherConstraintsAccess,
        )

    private fun findFairPercent(record: MetadataRecord): Int? =
        record.dataQualityMeasures
            .firstOrNull { it.nameOfMeasure == "Prosentvis oppfyllelse av FAIR-prinsipper" }
            ?.value

    private fun pickThumbnailUrl(record: MetadataRecord): String? {
        fun pickFrom(prefix: String): String? {
            val matches =
                record.thumbnails.filter {
                    it.url.startsWith(prefix, ignoreCase = true)
                }
            return matches.firstOrNull { it.type.equals("medium", ignoreCase = true) }?.url
                ?: matches.firstOrNull()?.url
        }

        return pickFrom("https://editor.geonorge.no/thumbnails/")
            ?: pickFrom("https://editor.test.geonorge.no/thumbnails/")
    }
}

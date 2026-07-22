package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.GeonetworkClient
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.Contact
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.DistributionFormat
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.KeywordGroup
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.integrations.register.CodeList
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductDataQualityMeasure
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductDistributionFormat
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductKeyword
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductMetadataContact
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductMetadataInfo
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductMetadataSummary
import java.util.UUID
import kotlin.coroutines.cancellation.CancellationException

class MetadataSummaryService(
    private val geonetworkClient: GeonetworkClient,
    private val registerClient: RegisterClient,
) {
    suspend fun getMetadataInformation(uuid: UUID): ProductMetadataInfo {
        val geonetworkRecord =
            geonetworkClient.getRecordByUuid(uuid)
                ?: throw MetadataRecordNotFoundException(uuid)
        return ProductMetadataInfo(
            abstractText = geonetworkRecord.abstract,
            specificUsage = geonetworkRecord.specificUsage,
            constraints = geonetworkRecord.legalConstraints,
            contactMetadata = geonetworkRecord.metadataContact.toProductMetadataContact(),
            contactOwner =
                geonetworkRecord.contacts
                    .firstOrNull {
                        it.role.equals("owner", ignoreCase = true)
                    }?.toProductMetadataContact(),
            contactPublisher =
                geonetworkRecord.contacts
                    .firstOrNull {
                        it.role.equals("publisher", ignoreCase = true)
                    }?.toProductMetadataContact(),
        )
    }

    suspend fun getMetadataSummary(uuid: UUID): ProductMetadataSummary {
        val record =
            geonetworkClient.getRecordByUuid(uuid)
                ?: throw MetadataRecordNotFoundException(uuid)

        val accessState = resolveAccessState(record)

        return ProductMetadataSummary(
            title = record.title,
            organization =
                record.metadataContact.organization.orEmpty(),
            hierarchyLevel = record.hierarchyLevel,
            accessIsRestricted = accessState.restricted,
            accessIsOpenData = accessState.openData,
            accessIsProtected = accessState.protected,
            dateUpdated = record.dates.firstOrNull { it.type == "revision" }?.date,
            maintenanceFrequency =
                translateCodeListValue(
                    CodeList.MAINTENANCE_FREQUENCY,
                    record.maintenanceFrequency,
                ),
            spatialRepresentation =
                translateCodeListValue(
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
            thumbnailUrl = record.thumbnails.firstOrNull { it.type?.equals("medium", ignoreCase = true) == true }?.url,
            dataQualityMeasures =
                record.dataQualityMeasures
                    .mapNotNull { m ->
                        if (m.value == null) return@mapNotNull null
                        ProductDataQualityMeasure(
                            explanation = m.measureDescription,
                            quantitativeResult = m.value,
                            quantitativeResultValueUnit = getSimpleValueUnit(m.valueUnit),
                            title = m.nameOfMeasure,
                        )
                    },
        )
    }

    private suspend fun translateCodeListValue(
        codeList: CodeList,
        value: String?,
    ): String {
        val codeValue = value?.takeIf { it.isNotBlank() } ?: return ""

        val codeListItems =
            try {
                registerClient.getCodeList(codeList).containedItems
            } catch (e: CancellationException) {
                throw e
            } catch (_: Exception) {
                null
            }
        return codeListItems
            ?.firstOrNull { item ->
                item.effectiveCodeValue.equals(codeValue, ignoreCase = true) ||
                    item.label.equals(codeValue, ignoreCase = true)
            }?.label
            ?: codeValue
    }

    private fun mapThemeKeywords(record: MetadataRecord): List<ProductKeyword> =
        mapKeywords(record, { it.type.equals("theme", ignoreCase = true) })

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

    private fun resolveAccessState(
        record: MetadataRecord,
//        solrDocument: SolrDocument,
    ): AccessState =
        when {
            isRestricted(record) -> AccessState(restricted = true, openData = false, protected = false)
            isProtected(record) -> AccessState(restricted = false, openData = false, protected = true)
            isOpenData(record) -> AccessState(restricted = false, openData = true, protected = false)
            else -> AccessState(restricted = false, openData = false, protected = false)
        }

    private fun isOpenData(
        record: MetadataRecord,
    ): Boolean {
        val accessText =
            listOfNotNull(record.legalConstraints?.otherConstraintsAccess)
                .joinToString(" ")
        return containsAny(
            accessText,
            "no restrictions",
            "noLimitations",
            "no limitations",
            "åpne data",
        )
    }

    private fun isRestricted(
        record: MetadataRecord,
    ): Boolean {
        val accessText =
            listOfNotNull(record.legalConstraints?.otherConstraintsAccess)
                .joinToString(" ")
        return containsAny(
            accessText,
            "norway digital restricted",
            "INSPIRE_Directive_Article13_1d",
        )
    }

    private fun isProtected(
        record: MetadataRecord,
    ): Boolean {
        val accessConstraint =
            listOfNotNull(record.legalConstraints?.otherConstraintsAccess)
                .joinToString(" ")
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

    private data class AccessState(
        val restricted: Boolean,
        val openData: Boolean,
        val protected: Boolean,
    )

    private fun DistributionFormat.toProductDistributionFormat() =
        ProductDistributionFormat(
            name = name,
            version = version,
        )

    private fun Contact.toProductMetadataContact() =
        ProductMetadataContact(
            name = name,
            email = email,
            organization = organization,
            organizationEnglish = organizationEnglish,
            role = role,
        )
}

class MetadataRecordNotFoundException(
    uuid: UUID,
) : RuntimeException("Metadata record not found for UUID: $uuid")

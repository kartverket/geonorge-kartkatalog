package no.kartverket.geonorge.kartkatalog.service

import no.kartverket.geonorge.kartkatalog.client.CodeList
import no.kartverket.geonorge.kartkatalog.client.GeonetworkClient
import no.kartverket.geonorge.kartkatalog.client.RegisterClient
import no.kartverket.geonorge.kartkatalog.client.SolrClient
import no.kartverket.geonorge.kartkatalog.models.api.Keyword
import no.kartverket.geonorge.kartkatalog.models.api.ProductDistributionFormat
import no.kartverket.geonorge.kartkatalog.models.api.ProductMetadataSummary
import no.kartverket.geonorge.kartkatalog.models.responses.geonetwork.DistributionFormat
import no.kartverket.geonorge.kartkatalog.models.responses.geonetwork.MetadataRecord
import no.kartverket.geonorge.kartkatalog.models.responses.solr.SolrDocument
import java.util.UUID
import kotlin.coroutines.cancellation.CancellationException

class MetadataSummaryService(
    private val geonetworkClient: GeonetworkClient,
    private val registerClient: RegisterClient,
    private val solrClient: SolrClient,
) {
    suspend fun getMetadataSummary(uuid: UUID): ProductMetadataSummary? =
        geonetworkClient.getRecordByUuid(uuid)?.let { record ->
            // Only fetch Solr after GeoNetwork confirms the record exists.
            val solrDocument =
                solrClient
                    .getMetadataByUuid(uuid)
                    .response
                    .docs
                    .firstOrNull()
                    ?: SolrDocument(uuid = uuid.toString())
            val accessState = resolveAccessState(record, solrDocument)

            ProductMetadataSummary(
                title = record.title.ifBlank { solrDocument.title.orEmpty() },
                organization = resolveOrganization(record, solrDocument),
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
                resolutionScale = record.resolutionScale,
                keywordsTheme = mapThemeKeywords(record),
                nationalKeywords = mapNationalKeywords(record),
                distributionFormats =
                    record.distributionInfo?.formats.orEmpty().map {
                        it.toDistributionFormat()
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

    private fun resolveOrganization(
        record: MetadataRecord,
        solrDocument: SolrDocument,
    ): String =
        listOfNotNull(
            solrDocument.organization,
            solrDocument.organizations?.firstOrNull(),
            record.metadataContact.organization,
            record.contacts.firstOrNull { !it.organization.isNullOrBlank() }?.organization,
        ).firstOrNull { it.isNotBlank() }.orEmpty()

    private fun mapThemeKeywords(record: MetadataRecord): List<Keyword> =
        mapKeywords(record, { it.type.equals("theme", ignoreCase = true) })

    private fun mapNationalKeywords(record: MetadataRecord): List<Keyword> =
        mapKeywords(record) { group ->
            group.thesaurus.equals("Nasjonal tematisk inndeling (DOK-kategori)", ignoreCase = true)
        }

    private fun mapKeywords(
        record: MetadataRecord,
        predicate: (no.kartverket.geonorge.kartkatalog.models.responses.geonetwork.KeywordGroup) -> Boolean,
    ): List<Keyword> =
        record.keywordGroups
            .filter(predicate)
            .flatMap { group ->
                group.keywords.map { keyword ->
                    Keyword(
                        keywordValue = keyword.value,
                        type = group.type,
                    )
                }
            }

    private fun resolveAccessState(
        record: MetadataRecord,
        solrDocument: SolrDocument,
    ): AccessState {
        val openData = isOpenData(record, solrDocument)
        return when {
            openData -> AccessState(restricted = false, openData = true, protected = false)
            isProtected(record, solrDocument) -> AccessState(restricted = false, openData = false, protected = true)
            isRestricted(record, solrDocument) -> AccessState(restricted = true, openData = false, protected = false)
            else -> AccessState(restricted = false, openData = false, protected = false)
        }
    }

    private fun isOpenData(
        record: MetadataRecord,
        solrDocument: SolrDocument,
    ): Boolean {
        val accessText =
            listOfNotNull(record.legalConstraints?.otherConstraintsAccess, solrDocument.otherconstraintsaccess)
                .joinToString(" ")
        return containsAny(
            accessText,
            "no restrictions",
            "noLimitations",
            "no limitations",
            "åpne data",
        ) || solrDocument.dataaccess.equals("open", ignoreCase = true)
    }

    private fun isRestricted(
        record: MetadataRecord,
        solrDocument: SolrDocument,
    ): Boolean {
        val accessText =
            listOfNotNull(record.legalConstraints?.otherConstraintsAccess, solrDocument.otherconstraintsaccess)
                .joinToString(" ")
        return containsAny(
            accessText,
            "norway digital restricted",
            "INSPIRE_Directive_Article13_1d",
        )
    }

    private fun isProtected(
        record: MetadataRecord,
        solrDocument: SolrDocument,
    ): Boolean {
        val accessConstraint =
            listOfNotNull(record.legalConstraints?.accessConstraints, solrDocument.accessconstraint)
                .joinToString(" ")
        return containsAny(accessConstraint, "Beskyttet", "restricted") ||
            solrDocument.dataaccess.equals("protected", ignoreCase = true) ||
            record.securityConstraints?.classification.equals("restricted", ignoreCase = true)
    }

    private fun containsAny(
        value: String,
        vararg needles: String,
    ): Boolean {
        val normalized = value.lowercase()
        return needles.any { needle -> normalized.contains(needle.lowercase()) }
    }

    private data class AccessState(
        val restricted: Boolean,
        val openData: Boolean,
        val protected: Boolean,
    )

    private fun DistributionFormat.toDistributionFormat() =
        ProductDistributionFormat(
            name = name,
            version = version,
        )
}

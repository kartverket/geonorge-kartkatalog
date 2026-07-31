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
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductMetadata
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductMetadataContact
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.UUID
import kotlin.coroutines.cancellation.CancellationException

class MetadataSummaryService(
    private val geonetworkClient: GeonetworkClient,
    private val registerClient: RegisterClient,
    private val staticNorgeskartUrl: String,
) {
    suspend fun getMetadata(uuid: UUID): ProductMetadata {
        val record =
            geonetworkClient.getRecordByUuid(uuid)
                ?: throw MetadataRecordNotFoundException(uuid)
        val accessState = resolveAccessState(record)
        return ProductMetadata(
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
            thumbnailUrl =
                record.thumbnails.firstOrNull {
                    it.type?.equals("medium", ignoreCase = true) == true
                }?.url ?: record.thumbnails.firstOrNull()?.url,
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
            fairStatusPercentFromMetadata = findFairPercent(record),
            abstractText = record.abstract,
            purpose = record.purpose,
            specificUsage = record.specificUsage,
            processHistory = record.processHistory,
            constraints =
                record.legalConstraints?.let {
                        constraints ->
                    constraints.copy(
                        accessConstraints =
                            describeAccessConstraints(record),
                        useConstraints =
                            describeUseConstraints(
                                constraints.useConstraints,
                                constraints.otherConstraintsLink,
                            ),
                    )
                },
            securityClassification =
                translateCodeListValue(
                    CodeList.CLASSIFICATION,
                    record.securityConstraints?.classification,
                ),
            contactMetadata = record.metadataContact.toProductMetadataContact(),
            contactOwner =
                record.contacts
                    .firstOrNull {
                        it.role.equals("owner", ignoreCase = true)
                    }?.toProductMetadataContact(),
            contactPublisher =
                record.contacts
                    .firstOrNull {
                        it.role.equals("publisher", ignoreCase = true)
                    }?.toProductMetadataContact(),
            coverageUrl =
                getCoverageLink(
                    extensionResources = record.extensionResources,
                    staticNorgeskartUrl = staticNorgeskartUrl,
                ),
        )
    }

    private fun describeAccessConstraints(record: MetadataRecord): String {
        val state = resolveAccessState(record)
        return when {
            state.openData -> "Åpne data"
            state.restricted -> "Norge digitalt-begrenset"
            else -> record.legalConstraints?.accessConstraints ?: "-"
        }
    }

    private suspend fun describeUseConstraints(
        useConstraints: String?,
        otherConstraintsLink: String?,
    ): String {
        val code =
            if (!otherConstraintsLink.isNullOrEmpty()) {
                "license"
            } else {
                useConstraints
            }
        return translateCodeListValue(CodeList.RESTRICTIONS, code)
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

    private fun resolveAccessState(record: MetadataRecord): AccessState =
        when {
            isRestricted(record) -> AccessState(restricted = true, openData = false, protected = false)
            isProtected(record) -> AccessState(restricted = false, openData = false, protected = true)
            isOpenData(record) -> AccessState(restricted = false, openData = true, protected = false)
            else -> AccessState(restricted = false, openData = false, protected = false)
        }

    private fun isOpenData(record: MetadataRecord): Boolean {
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

    private fun isRestricted(record: MetadataRecord): Boolean {
        val accessText =
            listOfNotNull(record.legalConstraints?.otherConstraintsAccess)
                .joinToString(" ")
        return containsAny(
            accessText,
            "norway digital restricted",
            "INSPIRE_Directive_Article13_1d",
        )
    }

    private fun isProtected(record: MetadataRecord): Boolean {
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

    private fun findFairPercent(record: MetadataRecord): Int? =
        record.dataQualityMeasures
            .firstOrNull { it.nameOfMeasure == "Prosentvis oppfyllelse av FAIR-prinsipper" }
            ?.value
}

class MetadataRecordNotFoundException(
    uuid: UUID,
) : RuntimeException("Metadata record not found for UUID: $uuid")

private data class ParsedCoverage(val type: String, val path: String, val layer: String)

private fun parseCoverage(input: String?): ParsedCoverage? {
    val m = Regex("""^TYPE:(.+?)@PATH:(.+?)@LAYER:(.+)$""").find(input?.trim() ?: return null) ?: return null
    return ParsedCoverage(m.groupValues[1].trim(), m.groupValues[2].trim(), m.groupValues[3].trim())
}

private fun String?.removeQueryString(): String = this?.substringBefore('?') ?: ""

fun getCoverageLink(
    extensionResources: List<no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.ExtensionResource>,
    zoomLevel: Int = 7,
    staticNorgeskartUrl: String,
): String? {
    val coverageUrl =
        extensionResources.firstOrNull {
            it.applicationProfile.trim().equals("dekningsoversikt", ignoreCase = true)
        }?.url
    val coverageGridUrl =
        extensionResources.firstOrNull {
            it.applicationProfile.trim().equals("dekningsoversikt rutenett", ignoreCase = true)
        }?.url
    val coverageCellUrl =
        extensionResources.firstOrNull {
            it.applicationProfile.trim().equals("dekningsoversikt celle", ignoreCase = true)
        }?.url

    val cov = parseCoverage(coverageUrl)
    val grid = parseCoverage(coverageGridUrl)

    if (cov == null && grid == null) return coverageUrl

    val base = "$staticNorgeskartUrl#!?zoom=$zoomLevel&"
    val primary = cov ?: grid!!

    var link =
        when (primary.type) {
            "GEONORGE-WMS" ->
                when {
                    cov != null && grid != null ->
                        "${base}project=geonorge&layers=1002&lat=6768825.17&lon=217236.30" +
                            "&wms=https://wms.geonorge.no/skwms1/wms.geonorge_dekningskart?datasett=${cov.layer}," +
                            "https://wms.geonorge.no/skwms1/wms.gp_dek_oversikt?datasett=${cov.layer}" +
                            "&addLayers=geonorgedekningskart,gp_dek_oversikt_wms&type=dek"
                    cov != null ->
                        "${base}project=geonorge&layers=1002&lat=6768825.17&lon=217236.30" +
                            "&wms=https://wms.geonorge.no/skwms1/wms.gp_dek_oversikt?datasett=${cov.layer}" +
                            "&addLayers=geonorgedekningskart,gp_dek_oversikt_wms&type=dek"
                    else -> {
                        val path = grid!!.path.replace("wms?", "")
                        "${base}lon=96090.37&lat=6564869.00" +
                            "&wms=${path}skwms1%2Fwms.geonorge_dekningskart%3Fdatasett%3D${grid.layer}" +
                            "&project=geonorge&layers=1002&addLayers=datasett_dekning"
                    }
                }
            "WMS" ->
                "${base}lat=269663&long=6802350&wms=${primary.path}&addLayer=${primary.layer}"
            "WFS" ->
                "${base}lat=255216&long=6653881&wfs=${primary.path.removeQueryString()}&addLayer=${primary.layer}"
            "GeoJSON" ->
                "${base}lat=355422&long=6668909&geojson=${primary.path.removeQueryString()}&addLayer=${primary.layer}"
            else -> coverageUrl ?: coverageGridUrl
        }

    if (!coverageCellUrl.isNullOrBlank()) {
        link += "&geojson=${URLEncoder.encode(coverageCellUrl, StandardCharsets.UTF_8)}"
    }

    return link
}

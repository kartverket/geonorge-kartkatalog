package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.ExtensionResource
import no.kartverket.geonorge.kartkatalog.metadata.models.CoverageData
import no.kartverket.geonorge.kartkatalog.metadata.models.CoverageDataSource
import no.kartverket.geonorge.kartkatalog.metadata.models.CoverageDataType
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

const val COVERAGE_BASE_URL = "https://wms.geonorge.no/skwms1/wms.geonorge_dekningskart?datasett="
const val GRID_BASE_URL = "https://wms.geonorge.no/skwms1/wms.gp_dek_oversikt?datasett="

fun getCoverageLinks(extensionResources: List<ExtensionResource>): CoverageData {
    val coverageUrl =
        extensionResources.firstOrNull {
            it.applicationProfile.trim().equals("dekningsoversikt", ignoreCase = true)
        }?.url
    val coverageGridUrl =
        extensionResources.firstOrNull {
            it.applicationProfile.trim().equals("dekningsoversikt rutenett", ignoreCase = true)
        }?.url
    val surveyAreaMapUrl =
        extensionResources
            .firstOrNull { it.applicationProfile.trim().equals("fullstendighetsdekningskart", ignoreCase = true) }?.url
    val surveyAreaMapUrlWms =
        extensionResources
            .firstOrNull {
                it.applicationProfile.trim().equals(
                    "fullstendighetsdekningskart wms",
                    ignoreCase = true,
                )
            }?.url

    val parsedCoverage = parseCoverage(coverageUrl)
    val parsedCoverageGrid = parseCoverage(coverageGridUrl)

    var coverage: ParsedCoverage? = null
    var coverageGrid: ParsedCoverage? = null

    if (parsedCoverage != null && parsedCoverageGrid != null)
        {
            coverage = parsedCoverage
            coverageGrid = parsedCoverageGrid
        } else if (parsedCoverage != null) {
        coverage = null
        coverageGrid = parsedCoverage
    }

    val coverageData =
        when (coverage?.type) {
            "GEONORGE-WMS" -> {
                val fullCoverageUrl = "${COVERAGE_BASE_URL}${coverage.layer}"
                CoverageDataSource(
                    fullCoverageUrl,
                    CoverageDataType.WMS,
                    layers = "geonorgedekningskart",
                )
            }
            "WMS" -> {
                null
            }
            "WFS" -> {
                null
            }
            "GeoJSON" -> {
                null
            }
            null -> {
                null
            }
            else -> throw IllegalArgumentException("Unsupported coverage type: ${coverage.type}")
        }

    val coverageOverviewData =
        when (coverageGrid?.type) {
            "GEONORGE-WMS" -> {
                val fullCoverageGridUrl = "${GRID_BASE_URL}${coverageGrid.layer}"
                CoverageDataSource(
                    fullCoverageGridUrl,
                    CoverageDataType.WMS,
                    layers = "gp_dek_oversikt_wms",
                )
            }
            "WMS" -> {
                null
            }
            "WFS" -> {
                null
            }
            "GeoJSON" -> {
                null
            }
            null -> {
                null
            }
            else -> throw IllegalArgumentException("Unsupported coverage type: ${coverageGrid.type}")
        }

    val completenessCoverageData =
        surveyAreaMapUrl?.let { CoverageDataSource(it, CoverageDataType.GEOJSON) }
            ?: surveyAreaMapUrlWms?.let { CoverageDataSource(it, CoverageDataType.WMS) }
    return CoverageData(
        coverageData = coverageData,
        coverageOverviewData = coverageOverviewData,
        completenessCoverageData = completenessCoverageData,
    )
}

fun getCoverageLink(
    extensionResources: List<ExtensionResource>,
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
    val surveyAreaMapUrl =
        extensionResources
            .firstOrNull { it.applicationProfile.trim().equals("fullstendighetsdekningskart", ignoreCase = true) }?.url
    val surveyAreaMapUrlWms =
        extensionResources
            .firstOrNull {
                it.applicationProfile.trim().equals(
                    "fullstendighetsdekningskart wms",
                    ignoreCase = true,
                )
            }?.url

    val cov = parseCoverage(coverageUrl)
    val grid = parseCoverage(coverageGridUrl)

    if (cov == null && grid == null) return coverageUrl ?: coverageGridUrl

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
    link = link?.let { addSurveyAreaMap(it, surveyAreaMapUrl, surveyAreaMapUrlWms) }
    return link
}

private data class ParsedCoverage(val type: String, val path: String, val layer: String)

private fun String?.removeQueryString(): String = this?.substringBefore('?') ?: ""

private fun parseCoverage(input: String?): ParsedCoverage? {
    val m = Regex("""^TYPE:(.+?)@PATH:(.+?)@LAYER:(.+)$""").find(input?.trim() ?: return null) ?: return null
    return ParsedCoverage(m.groupValues[1].trim(), m.groupValues[2].trim(), m.groupValues[3].trim())
}

private fun addSurveyAreaMap(
    incomingLink: String,
    surveyAreaMapUrl: String?,
    surveyAreaMapUrlWms: String?,
): String {
    var link = incomingLink

    val wms = parseCoverage(surveyAreaMapUrlWms)
    if (wms != null) {
        link += if (link.contains("&wms=")) ",${wms.path}" else "&wms=${wms.path}"
        link += if (link.contains("&addLayers=")) ",${wms.layer}" else "&addLayers=${wms.layer}"
    }

    if (!surveyAreaMapUrl.isNullOrBlank()) {
        link += "&geojson=${URLEncoder.encode(surveyAreaMapUrl, StandardCharsets.UTF_8)}"
        link += if (link.contains("&addLayers=")) ",geojson" else "&addLayers=geojson"
    }

    return link
}

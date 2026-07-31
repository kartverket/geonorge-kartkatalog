package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.ExtensionResource
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

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

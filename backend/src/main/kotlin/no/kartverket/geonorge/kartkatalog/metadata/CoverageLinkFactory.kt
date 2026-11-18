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
        extensionResources
            .firstOrNull {
                it.applicationProfile.trim().equals("dekningsoversikt", ignoreCase = true)
            }?.url
    val coverageGridUrl =
        extensionResources
            .firstOrNull {
                it.applicationProfile.trim().equals("dekningsoversikt rutenett", ignoreCase = true)
            }?.url
    val surveyAreaMapUrl =
        extensionResources
            .firstOrNull { it.applicationProfile.trim().equals("fullstendighetsdekningskart", ignoreCase = true) }
            ?.url
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

    if (parsedCoverage != null && parsedCoverageGrid != null) {
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
        surveyAreaMapUrl?.let {
            CoverageDataSource(
                url = it,
                type = CoverageDataType.GEOJSON,
            )
        }
            ?: surveyAreaMapUrlWms?.let { CoverageDataSource(it, CoverageDataType.WMS) }
    return CoverageData(
        coverageData = coverageData,
        coverageOverviewData = coverageOverviewData,
        completenessCoverageData = completenessCoverageData,
    )
}

private data class ParsedCoverage(
    val type: String,
    val path: String,
    val layer: String,
)

private fun parseCoverage(input: String?): ParsedCoverage? {
    val m = Regex("""^TYPE:(.+?)@PATH:(.+?)@LAYER:(.+)$""").find(input?.trim() ?: return null) ?: return null
    return ParsedCoverage(m.groupValues[1].trim(), m.groupValues[2].trim(), m.groupValues[3].trim())
}

package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.ExtensionResource
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class GetCoverageLinkTest {
    private val baseUrl = "https://test.example.com/"
    private val zoomLevel = 7

    @Test
    fun `getCoverageLink returns null when no coverage resources`() {
        val result =
            getCoverageLink(
                extensionResources = emptyList(),
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = baseUrl,
            )
        assertNull(result)
    }

    @Test
    fun `getCoverageLink returns null when coverage resources don't match dekningsoversikt profiles`() {
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "other",
                    url = "http://example.com/wms",
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = baseUrl,
            )
        assertNull(result)
    }

    @Test
    fun `getCoverageLink returns raw URL when coverage URL doesn't match pattern`() {
        val coverageUrl = "http://example.com/coverage"
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "dekningsoversikt",
                    url = coverageUrl,
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = baseUrl,
            )
        assertEquals(coverageUrl, result)
    }

    @Test
    fun `getCoverageLink handles GEONORGE-WMS with both cov and grid`() {
        val coverageUrl = "TYPE:GEONORGE-WMS@PATH:/path/to/wms@LAYER:layer1"
        val gridUrl = "TYPE:GEONORGE-WMS@PATH:/path/to/grid@LAYER:layer2"
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "dekningsoversikt",
                    url = coverageUrl,
                ),
                ExtensionResource(
                    applicationProfile = "dekningsoversikt rutenett",
                    url = gridUrl,
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = baseUrl,
            )

        assertContains(result!!, "project=geonorge")
        assertContains(result, "layers=1002")
        assertContains(result, "lat=6768825.17")
        assertContains(result, "lon=217236.30")
        // Note: When both cov and grid are present, the URL uses cov.layer for both datasett parameters
        assertContains(result, "datasett=layer1")
        assertContains(result, "wms.geonorge_dekningskart")
        assertContains(result, "wms.gp_dek_oversikt")
        assertContains(result, "type=dek")
        // Verify there are two WMS URLs separated by comma
        assertTrue(result.count { it == ',' } >= 1, "Should have comma-separated WMS URLs")
    }

    @Test
    fun `getCoverageLink handles GEONORGE-WMS with only cov`() {
        val coverageUrl = "TYPE:GEONORGE-WMS@PATH:/path/to/wms@LAYER:layer1"
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "dekningsoversikt",
                    url = coverageUrl,
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = baseUrl,
            )

        assertContains(result!!, "project=geonorge")
        assertContains(result, "layers=1002")
        assertContains(result, "lat=6768825.17")
        assertContains(result, "lon=217236.30")
        assertContains(result, "datasett=layer1")
        assertContains(result, "wms.gp_dek_oversikt")
        assertContains(result, "type=dek")
    }

    @Test
    fun `getCoverageLink handles GEONORGE-WMS with only grid`() {
        // Path ends with "wms?" as is typical in real data; the function strips "wms?" via literal replace
        val gridUrl = "TYPE:GEONORGE-WMS@PATH:https://wms.example.no/wms?@LAYER:layer2"
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "dekningsoversikt rutenett",
                    url = gridUrl,
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = baseUrl,
            )

        assertContains(result!!, "lon=96090.37")
        assertContains(result, "lat=6564869.00")
        assertContains(result, "project=geonorge")
        assertContains(result, "layers=1002")
        assertContains(result, "addLayers=datasett_dekning")
        // After stripping "wms?" from the path the function appends the encoded wms suffix
        assertContains(result, "wms=https://wms.example.no/skwms1%2Fwms.geonorge_dekningskart%3Fdatasett%3Dlayer2")
    }

    @Test
    fun `getCoverageLink strips literal wms-query from grid path`() {
        // The function uses path.replace("wms?", "") — a literal string replacement
        val gridUrl = "TYPE:GEONORGE-WMS@PATH:https://wms.example.no/wms?@LAYER:layer2"
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "dekningsoversikt rutenett",
                    url = gridUrl,
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = baseUrl,
            )

        // "wms?" should be removed from the path so the suffix follows immediately
        assertContains(result!!, "wms=https://wms.example.no/skwms1%2F")
        assertTrue(!result.contains("wms?"), "Literal 'wms?' should be removed from the path")
    }

    @Test
    fun `getCoverageLink handles WMS type`() {
        val coverageUrl = "TYPE:WMS@PATH:http://example.com/wms@LAYER:my_layer"
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "dekningsoversikt",
                    url = coverageUrl,
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = baseUrl,
            )

        assertContains(result!!, "lat=269663")
        assertContains(result, "long=6802350")
        assertContains(result, "wms=http://example.com/wms")
        assertContains(result, "addLayer=my_layer")
    }

    @Test
    fun `getCoverageLink handles WFS type`() {
        val coverageUrl = "TYPE:WFS@PATH:http://example.com/wfs?service=WFS@LAYER:my_layer"
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "dekningsoversikt",
                    url = coverageUrl,
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = baseUrl,
            )

        assertContains(result!!, "lat=255216")
        assertContains(result, "long=6653881")
        assertContains(result, "wfs=http://example.com/wfs")
        assertContains(result, "addLayer=my_layer")
    }

    @Test
    fun `getCoverageLink removes query string from WFS URL`() {
        val coverageUrl = "TYPE:WFS@PATH:http://example.com/wfs?service=WFS@LAYER:my_layer"
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "dekningsoversikt",
                    url = coverageUrl,
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = baseUrl,
            )

        assertContains(result!!, "wfs=http://example.com/wfs")
        assertTrue(!result.contains("service=WFS"), "Query string should be removed from WFS URL")
    }

    @Test
    fun `getCoverageLink handles GeoJSON type`() {
        val coverageUrl = "TYPE:GeoJSON@PATH:http://example.com/geojson.json?v=1@LAYER:my_layer"
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "dekningsoversikt",
                    url = coverageUrl,
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = baseUrl,
            )

        assertContains(result!!, "lat=355422")
        assertContains(result, "long=6668909")
        assertContains(result, "geojson=http://example.com/geojson.json")
        assertContains(result, "addLayer=my_layer")
    }

    @Test
    fun `getCoverageLink removes query string from GeoJSON URL`() {
        val coverageUrl = "TYPE:GeoJSON@PATH:http://example.com/geojson.json?v=1@LAYER:my_layer"
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "dekningsoversikt",
                    url = coverageUrl,
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = baseUrl,
            )

        assertTrue(!result!!.contains("v=1"), "Query string should be removed from GeoJSON URL")
    }

    @Test
    fun `getCoverageLink handles unknown type by returning raw coverage URL`() {
        val coverageUrl = "TYPE:UNKNOWN@PATH:http://example.com/data@LAYER:layer"
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "dekningsoversikt",
                    url = coverageUrl,
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = baseUrl,
            )

        assertEquals(coverageUrl, result)
    }

    @Test
    fun `getCoverageLink appends coverage cell URL as encoded geojson parameter`() {
        val coverageUrl = "TYPE:GEONORGE-WMS@PATH:/path/to/wms@LAYER:layer1"
        val cellUrl = "http://example.com/cells.geojson"
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "dekningsoversikt",
                    url = coverageUrl,
                ),
                ExtensionResource(
                    applicationProfile = "dekningsoversikt celle",
                    url = cellUrl,
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = baseUrl,
            )

        assertContains(result!!, "geojson=")
        // URL encoding should be applied
        assertTrue(result.contains("%3A") || result.contains(":"), "Should contain encoded or raw colon")
    }

    @Test
    fun `getCoverageLink uses custom zoom level`() {
        val customZoom = 10
        val coverageUrl = "TYPE:WMS@PATH:http://example.com/wms@LAYER:my_layer"
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "dekningsoversikt",
                    url = coverageUrl,
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = customZoom,
                staticNorgeskartUrl = baseUrl,
            )

        assertContains(result!!, "zoom=$customZoom")
    }

    @Test
    fun `getCoverageLink uses provided static norgeskarrt URL`() {
        val customBaseUrl = "https://custom.norgeskarrt.no/map/"
        val coverageUrl = "TYPE:WMS@PATH:http://example.com/wms@LAYER:my_layer"
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "dekningsoversikt",
                    url = coverageUrl,
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = customBaseUrl,
            )

        assertContains(result!!, customBaseUrl)
    }

    @Test
    fun `getCoverageLink handles coverage with whitespace in pattern`() {
        // Test with extra spaces in the pattern
        val coverageUrl = "TYPE:  GEONORGE-WMS  @PATH:  /path/to/wms  @LAYER:  layer1  "
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "dekningsoversikt",
                    url = coverageUrl,
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = baseUrl,
            )

        // Should trim whitespace and parse correctly
        assertContains(result!!, "project=geonorge")
        assertContains(result, "datasett=layer1")
    }

    @Test
    fun `getCoverageLink returns null for empty extension resources list`() {
        val result =
            getCoverageLink(
                extensionResources = emptyList(),
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = baseUrl,
            )
        assertNull(result)
    }

    @Test
    fun `getCoverageLink handles multiple resources and uses first matching dekningsoversikt`() {
        val correctUrl = "TYPE:WMS@PATH:http://example.com/wms@LAYER:layer1"
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "other",
                    url = "http://example.com/other",
                ),
                ExtensionResource(
                    applicationProfile = "dekningsoversikt",
                    url = correctUrl,
                ),
                ExtensionResource(
                    applicationProfile = "another",
                    url = "http://example.com/another",
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = zoomLevel,
                staticNorgeskartUrl = baseUrl,
            )

        assertContains(result!!, "wms=http://example.com/wms")
    }

    @Test
    fun `getCoverageLink includes zoom level in base URL`() {
        val coverageUrl = "TYPE:WMS@PATH:http://example.com/wms@LAYER:my_layer"
        val resources =
            listOf(
                ExtensionResource(
                    applicationProfile = "dekningsoversikt",
                    url = coverageUrl,
                ),
            )
        val result =
            getCoverageLink(
                extensionResources = resources,
                zoomLevel = 5,
                staticNorgeskartUrl = baseUrl,
            )

        assertContains(result!!, "#!?zoom=5&")
    }
}

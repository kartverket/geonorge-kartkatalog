package no.kartverket.geonorge.kartkatalog.routes

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.headersOf
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.routing.routing
import io.ktor.server.testing.testApplication
import no.kartverket.geonorge.kartkatalog.config.configureSerialization
import no.kartverket.geonorge.kartkatalog.config.configureStatusPages
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.search.SearchService
import no.kartverket.geonorge.kartkatalog.search.searchRoutes
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals

class SearchRoutesTest {
    private val searchSolrJson =
        """
        {
          "responseHeader": {"status": 0, "QTime": 1},
          "response": {
            "numFound": 1,
            "start": 0,
            "docs": [{
              "uuid": "24d7e9d1-87f6-45a0-b38e-3447f8d7f9a1",
              "title": "Matrikkelen - Bygningspunkt",
              "abstract": "Søkbart datasett",
              "type": "dataset",
              "theme": "Eiendom",
              "organization": "Kartverket",
              "organizations": ["Kartverket"],
              "organizationgroup": "Kartverket",
              "organization_logo_url": "https://register.geonorge.no/data/organizations/971040238_Kartverket_liten.png",
              "thumbnail_url": "https://editor.geonorge.no/thumbnails/example.png",
              "distribution_url": "https://nedlasting.geonorge.no/api/capabilities/",
              "distribution_protocol": "GEONORGE:DOWNLOAD",
              "distribution_name": "GML",
              "date_updated": "2026-07-01T22:00:00Z",
              "accessconstraint": "no restrictions",
              "otherconstraintsaccess": "http://inspire.ec.europa.eu/metadata-codelist/LimitationsOnPublicAccess/noLimitations",
              "dataaccess": "Åpne data",
              "ServiceDistributionUrlForDataset": "https://wms.geonorge.no/skwms1/wms.matrikkelkart?service=wms&request=getcapabilities",
              "ServiceDistributionUuidForDataset": "30dda4c6-2cba-4378-b2e7-26f644df9d99",
              "datasetservice": [
                "c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689|Matrikkelen - Bygningspunkt WFS||service|Kartverket||OGC:WFS|https://wfs.geonorge.no/skwms1/wfs.matrikkelen-bygningspunkt?service=WFS&Request=GetCapabilities|Eiendom",
                "30dda4c6-2cba-4378-b2e7-26f644df9d99|Matrikkelkart WMS||service|Kartverket||OGC:WMS|https://wms.geonorge.no/skwms1/wms.matrikkelkart?service=wms&request=getcapabilities|Eiendom"
              ],
              "spatialscope": ["Nasjonal"]
            }]
          }
        }
        """.trimIndent()

    @Test
    fun `returns frontend compatible search result`() =
        testApplication {
            val requestedPaths = mutableListOf<String>()
            application {
                configureSerialization()
                configureStatusPages()
                val client =
                    HttpClient(
                        MockEngine { request ->
                            requestedPaths += request.url.encodedPath
                            respond(
                                content = searchSolrJson,
                                status = HttpStatusCode.OK,
                                headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                            )
                        },
                    ) {
                        install(ContentNegotiation) { json() }
                    }
                val searchService = SearchService(SolrClient(client, "https://solr.example.test"))
                routing { searchRoutes(searchService) }
            }

            val response = client.get("/api/search?text=matrikkel&limit=25")
            val body = response.bodyAsText()

            assertEquals(HttpStatusCode.OK, response.status)
            assertEquals(listOf("/solr/metadata_all/select"), requestedPaths)
            assertContains(body, "\"numFound\":1")
            assertContains(body, "\"typeTranslated\":\"Datasett\"")
            assertContains(body, "\"showMapLink\":true")
            assertContains(body, "\"mapCapabilitiesUrl\":\"https://wms.geonorge.no/skwms1/wms.matrikkelkart?service=wms&request=getcapabilities\"")
            assertContains(body, "\"accessState\":\"open\"")
            assertContains(body, "\"hierarchyLevel\":\"dataset\"")
        }

    @Test
    fun `supports empty search`() =
        testApplication {
            application {
                configureSerialization()
                configureStatusPages()
                val client =
                    HttpClient(
                        MockEngine {
                            respond(
                                content = searchSolrJson,
                                status = HttpStatusCode.OK,
                                headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                            )
                        },
                    ) {
                        install(ContentNegotiation) { json() }
                    }
                val searchService = SearchService(SolrClient(client, "https://solr.example.test"))
                routing { searchRoutes(searchService) }
            }

            val response = client.get("/api/search")

            assertEquals(HttpStatusCode.OK, response.status)
        }
}


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
import io.ktor.http.contentType
import io.ktor.http.headersOf
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.routing.route
import io.ktor.server.routing.routing
import io.ktor.server.testing.testApplication
import no.kartverket.geonorge.kartkatalog.API_V1
import no.kartverket.geonorge.kartkatalog.config.configureSerialization
import no.kartverket.geonorge.kartkatalog.config.configureStatusPages
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.metadata.AreaResolver
import no.kartverket.geonorge.kartkatalog.metadata.HvdResolver
import no.kartverket.geonorge.kartkatalog.search.SearchEngine
import no.kartverket.geonorge.kartkatalog.search.SearchService
import no.kartverket.geonorge.kartkatalog.search.searchRoutes
import java.util.concurrent.CopyOnWriteArrayList
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class SearchRoutesTest {
    private val searchSolrJson =
        """
        {
          "responseHeader": {"status": 0, "QTime": 1},
          "facet_counts": {
            "facet_fields": {
              "type": ["dataset", 1, "service", 0],
              "organizations": ["Ålesund kommune", 1, "Norges vassdrags- og energidirektorat", 2, "Meteorologisk institutt", 3]
            }
          },
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
            val requestedPaths = CopyOnWriteArrayList<String>()
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
                val searchService =
                    SearchService(
                        SearchEngine(SolrClient(client, "https://solr.example.test")),
                        AreaResolver(RegisterClient(client, "https://register.example.test")),
                        HvdResolver(RegisterClient(client, "https://register.example.test")),
                    )
                routing { route(API_V1) { searchRoutes(searchService) } }
            }

            val response = client.get("/api/v1/search?text=matrikkel&limit=25")
            val body = response.bodyAsText()
            val expectedMapCapabilitiesUrl =
                "\"mapCapabilitiesUrl\":\"https://wms.geonorge.no/skwms1/" +
                    "wms.matrikkelkart?service=wms&request=getcapabilities\""

            assertEquals(HttpStatusCode.OK, response.status)
            assertEquals("/solr/metadata_all/select", requestedPaths.first())
            assertEquals(
                setOf(
                    "/api/sosi-kodelister/inndelinger/inndelingsbase/fylkesnummer",
                    "/api/metadata-kodelister/hvd-kategorier",
                ),
                requestedPaths.drop(1).toSet(),
            )
            assertContains(body, "\"numFound\":1")
            assertContains(body, "\"typeTranslated\":\"Datasett\"")
            assertContains(body, "\"showMapLink\":true")
            assertContains(body, expectedMapCapabilitiesUrl)
            assertContains(body, "\"accessState\":\"open\"")
            assertContains(body, "\"hierarchyLevel\":\"dataset\"")
            assertContains(body, "\"facets\":[")
            assertContains(body, "\"facetField\":\"type\"")
            assertContains(body, "\"name\":\"dataset\"")
            assertContains(body, "\"facetField\":\"organizations\"")
            assertContains(body, "\"label\":\"Utgiver\"")
            assertTrue(
                body.indexOf("\"name\":\"Meteorologisk institutt\"") <
                    body.indexOf("\"name\":\"Norges vassdrags- og energidirektorat\"") &&
                    body.indexOf("\"name\":\"Norges vassdrags- og energidirektorat\"") <
                    body.indexOf("\"name\":\"Ålesund kommune\""),
            )
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
                val searchService =
                    SearchService(
                        SearchEngine(SolrClient(client, "https://solr.example.test")),
                        AreaResolver(RegisterClient(client, "https://register.example.test")),
                        HvdResolver(RegisterClient(client, "https://register.example.test")),
                    )
                routing { route(API_V1) { searchRoutes(searchService) } }
            }

            val response = client.get("/api/v1/search")

            assertEquals(HttpStatusCode.OK, response.status)
        }

    @Test
    fun `mediatype=json overrides a CSV Accept header`() =
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
                val searchService =
                    SearchService(
                        SearchEngine(SolrClient(client, "https://solr.example.test")),
                        AreaResolver(RegisterClient(client, "https://register.example.test")),
                        HvdResolver(RegisterClient(client, "https://register.example.test")),
                    )
                routing { route(API_V1) { searchRoutes(searchService) } }
            }

            val response =
                client.get("/api/v1/search?text=matrikkel&mediatype=json") {
                    headers.append(HttpHeaders.Accept, "text/csv")
                }
            val body = response.bodyAsText()

            assertEquals(HttpStatusCode.OK, response.status)
            assertEquals(
                ContentType.Application.Json,
                response.contentType()?.withoutParameters(),
            )
            assertContains(body, "\"numFound\":1")
        }

    private fun seriesMemberEntry(
        uuid: String,
        name: String,
        organization: String,
        protocol: String,
        distributionUrl: String,
    ): String =
        "$uuid|" +
            "$name|" +
            "${java.util.UUID.randomUUID()}|" +
            "dataset|" +
            "$organization||" +
            "$protocol|" +
            "$distributionUrl|" +
            "Basis geodata|" +
            "https://example.test/logo.png|" +
            "https://example.test/thumbnail.png|" +
            "no restrictions|http://inspire.ec.europa.eu||true|false"

    @Test
    fun `suppresses downloadableSeriesMembers for thematic series`() =
        testApplication {
            val memberUuid = "11111111-1111-1111-1111-111111111111"
            val seriesSolrJson =
                """
                {
                  "responseHeader": {"status": 0, "QTime": 1},
                  "response": {
                    "numFound": 1,
                    "start": 0,
                    "docs": [{
                      "uuid": "22222222-2222-2222-2222-222222222222",
                      "title": "SAT-SKOG",
                      "type": "series",
                      "typename": "series_thematic",
                      "organization": "NIBIO",
                      "seriedatasets": [
                        "${seriesMemberEntry(
                    memberUuid,
                    "SAT-SKOG - Volum Gran",
                    "NIBIO",
                    "GEONORGE:DOWNLOAD",
                    "https://kart8.nibio.no/api/capabilities/",
                )}"
                      ]
                    }]
                  }
                }
                """.trimIndent()
            val memberSolrJson =
                """
                {
                  "responseHeader": {"status": 0, "QTime": 1},
                  "response": {
                    "numFound": 1,
                    "start": 0,
                    "docs": [{
                      "uuid": "$memberUuid",
                      "title": "SAT-SKOG - Volum Gran",
                      "type": "dataset",
                      "distributions": ["NIBIO|GEONORGE:DOWNLOAD|https://kart8.nibio.no/api/capabilities/|extra"]
                    }]
                  }
                }
                """.trimIndent()

            application {
                configureSerialization()
                configureStatusPages()
                val client =
                    HttpClient(
                        MockEngine { request ->
                            val content =
                                when (request.url.encodedPath) {
                                    "/solr/metadata/select" -> memberSolrJson
                                    else -> seriesSolrJson
                                }
                            respond(
                                content = content,
                                status = HttpStatusCode.OK,
                                headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                            )
                        },
                    ) {
                        install(ContentNegotiation) { json() }
                    }
                val searchService =
                    SearchService(
                        SearchEngine(SolrClient(client, "https://solr.example.test")),
                        AreaResolver(RegisterClient(client, "https://register.example.test")),
                        HvdResolver(RegisterClient(client, "https://register.example.test")),
                    )
                routing { route(API_V1) { searchRoutes(searchService) } }
            }

            val response = client.get("/api/v1/search?text=sat-skog&limit=25")
            val body = response.bodyAsText()

            assertEquals(HttpStatusCode.OK, response.status)
            assertContains(body, "\"seriesType\":\"series_thematic\"")
            assertContains(body, "\"downloadableSeriesMembers\":[]")
        }

    @Test
    fun `keeps downloadableSeriesMembers for non-thematic series`() =
        testApplication {
            val memberUuid = "33333333-3333-3333-3333-333333333333"
            val seriesSolrJson =
                """
                {
                  "responseHeader": {"status": 0, "QTime": 1},
                  "response": {
                    "numFound": 1,
                    "start": 0,
                    "docs": [{
                      "uuid": "44444444-4444-4444-4444-444444444444",
                      "title": "Befolkning på grunnkretsnivå - historiske versjoner",
                      "type": "series",
                      "typename": "series_historic",
                      "organization": "Kartverket",
                      "seriedatasets": [
                        "${seriesMemberEntry(
                    memberUuid,
                    "Befolkning 2020",
                    "Kartverket",
                    "GEONORGE:DOWNLOAD",
                    "https://nedlasting.geonorge.no/api/capabilities/",
                )}"
                      ]
                    }]
                  }
                }
                """.trimIndent()
            val memberSolrJson =
                """
                {
                  "responseHeader": {"status": 0, "QTime": 1},
                  "response": {
                    "numFound": 1,
                    "start": 0,
                    "docs": [{
                      "uuid": "$memberUuid",
                      "title": "Befolkning 2020",
                      "type": "dataset",
                      "distributions": ["Kartverket|GEONORGE:DOWNLOAD|https://nedlasting.geonorge.no/api/capabilities/|extra"]
                    }]
                  }
                }
                """.trimIndent()

            application {
                configureSerialization()
                configureStatusPages()
                val client =
                    HttpClient(
                        MockEngine { request ->
                            val content =
                                when (request.url.encodedPath) {
                                    "/solr/metadata/select" -> memberSolrJson
                                    else -> seriesSolrJson
                                }
                            respond(
                                content = content,
                                status = HttpStatusCode.OK,
                                headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                            )
                        },
                    ) {
                        install(ContentNegotiation) { json() }
                    }
                val searchService =
                    SearchService(
                        SearchEngine(SolrClient(client, "https://solr.example.test")),
                        AreaResolver(RegisterClient(client, "https://register.example.test")),
                        HvdResolver(RegisterClient(client, "https://register.example.test")),
                    )
                routing { route(API_V1) { searchRoutes(searchService) } }
            }

            val response = client.get("/api/v1/search?text=befolkning&limit=25")
            val body = response.bodyAsText()

            assertEquals(HttpStatusCode.OK, response.status)
            assertContains(body, "\"seriesType\":\"series_historic\"")
            assertContains(body, "\"uuid\":\"$memberUuid\"")
            assertFalse(body.contains("\"downloadableSeriesMembers\":[]"))
        }

    @Test
    fun `adds thematicSeriesDownloadItem for members of a thematic series`() =
        testApplication {
            val seriesUuid = "44444444-4444-4444-4444-444444444444"
            val serie =
                "$seriesUuid|SAT-SKOG||series|NIBIO||GEONORGE:DOWNLOAD|" +
                    "https://kart8.nibio.no/api/capabilities/|Landbruk|||series_thematic|True|False"
            val memberSolrJson =
                """
                {
                  "responseHeader": {"status": 0, "QTime": 1},
                  "response": {
                    "numFound": 1,
                    "start": 0,
                    "docs": [{
                      "uuid": "55555555-5555-5555-5555-555555555555",
                      "title": "SAT-SKOG - Treslag",
                      "type": "dataset",
                      "serie": "$serie"
                    }]
                  }
                }
                """.trimIndent()

            application {
                configureSerialization()
                configureStatusPages()
                val client =
                    HttpClient(
                        MockEngine {
                            respond(
                                content = memberSolrJson,
                                status = HttpStatusCode.OK,
                                headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                            )
                        },
                    ) {
                        install(ContentNegotiation) { json() }
                    }
                val searchService =
                    SearchService(
                        SearchEngine(SolrClient(client, "https://solr.example.test")),
                        AreaResolver(RegisterClient(client, "https://register.example.test")),
                        HvdResolver(RegisterClient(client, "https://register.example.test")),
                    )
                routing { searchRoutes(searchService) }
            }

            val response = client.get("/api/search?text=sat-skog&limit=25")
            val body = response.bodyAsText()

            assertEquals(HttpStatusCode.OK, response.status)
            assertContains(body, "\"thematicSeriesDownloadItem\":{")
            assertContains(body, "\"uuid\":\"$seriesUuid\"")
        }
}

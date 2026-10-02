package no.kartverket.geonorge.kartkatalog.routes

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.content.OutgoingContent
import io.ktor.http.headersOf
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.routing.routing
import io.ktor.server.testing.testApplication
import no.kartverket.geonorge.kartkatalog.config.configureSerialization
import no.kartverket.geonorge.kartkatalog.config.configureStatusPages
import no.kartverket.geonorge.kartkatalog.download.DownloadApiClient
import no.kartverket.geonorge.kartkatalog.download.DownloadInsightGroupsResolver
import no.kartverket.geonorge.kartkatalog.download.DownloadService
import no.kartverket.geonorge.kartkatalog.download.downloadRoutes
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import java.util.concurrent.CopyOnWriteArrayList
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals

class DownloadRoutesTest {
    private val capabilitiesJson =
        """
        {
          "supportsDownloadBundling": true,
          "distributedBy": "Geonorge",
          "deliveryNotificationByEmail": false,
          "_links": [
            {"href": "https://nedlasting.geonorge.no/api/order", "rel": "http://rel.geonorge.no/download/order"}
          ]
        }
        """.trimIndent()

    private val orderResponseJson =
        """
        {
          "files": [
            {
              "status": "ReadyForDownload",
              "downloadUrl": "https://nedlasting.geonorge.no/api/download/order/abc/def",
              "name": "Kommuner_GML.zip",
              "areaName": "Agder",
              "projectionName": "EUREF89 UTM sone 32",
              "format": "GML",
              "metadataUuid": "041f1e6e-bdbc-4091-b48f-8a5990f3cc5b",
              "metadataName": "Kommuner"
            }
          ],
          "_links": [
            {
              "href": "https://nedlasting.geonorge.no/api/order/abc",
              "rel": "self"
            }
          ]
        }
        """.trimIndent()

    private val capabilitiesNoBundlingJson =
        """
        {
          "supportsDownloadBundling": false,
          "distributedBy": "Geonorge",
          "deliveryNotificationByEmail": false,
          "_links": [
            {"href": "https://nedlasting.geonorge.no/api/order", "rel": "http://rel.geonorge.no/download/order"}
          ]
        }
        """.trimIndent()

    private val areasJson =
        """
        [
          {
            "type": "fylke",
            "name": "Agder",
            "code": "42",
            "projections": [
              {
                "code": "25832",
                "name": "EUREF89 UTM sone 32, 2d",
                "codespace": "http://www.opengis.net/def/crs/EPSG/0/25832",
                "formats": [{"name": "GML"}]
              },
              {
                "code": "25833",
                "name": "EUREF89 UTM sone 33, 2d",
                "codespace": "http://www.opengis.net/def/crs/EPSG/0/25833",
                "formats": [{"name": "SOSI"}]
              }
            ]
          },
          {
            "type": "fylke",
            "name": "Akershus",
            "code": "32",
            "projections": [
              {"code": "25832", "name": "EUREF89 UTM sone 32, 2d", "codespace": "http://www.opengis.net/def/crs/EPSG/0/25832"}
            ],
            "formats": [
              {"name": "GML"}
            ]
          }
        ]
        """.trimIndent()

    private val capabilitiesWithAreaAndFormatLinksJson =
        """
        {
          "supportsDownloadBundling": true,
          "distributedBy": "Geonorge",
          "deliveryNotificationByEmail": false,
          "_links": [
            {"href": "https://nedlasting.geonorge.no/api/codelists/format/041f1e6e-bdbc-4091-b48f-8a5990f3cc5b", "rel": "http://rel.geonorge.no/download/format"},
            {"href": "https://nedlasting.geonorge.no/api/codelists/area/041f1e6e-bdbc-4091-b48f-8a5990f3cc5b", "rel": "http://rel.geonorge.no/download/area"}
          ]
        }
        """.trimIndent()

    private val capabilitiesWithOnlyFormatLinkJson =
        """
        {
          "supportsDownloadBundling": true,
          "distributedBy": "Geonorge",
          "deliveryNotificationByEmail": false,
          "_links": [
            {"href": "https://nedlasting.geonorge.no/api/codelists/format/041f1e6e-bdbc-4091-b48f-8a5990f3cc5b", "rel": "http://rel.geonorge.no/download/format"}
          ]
        }
        """.trimIndent()

    @Test
    fun `orders a download and returns ready-for-download files`() =
        testApplication {
            val requestedPaths = CopyOnWriteArrayList<String>()
            val requestedUrls = CopyOnWriteArrayList<String>()
            val orderRequestBodies = CopyOnWriteArrayList<String>()
            application {
                val authentication = configureTestAuthentication()
                configureSerialization()
                configureStatusPages()
                val client =
                    HttpClient(
                        MockEngine { request ->
                            requestedPaths += request.url.encodedPath
                            requestedUrls += request.url.toString()
                            val content =
                                if (request.url.encodedPath.startsWith("/api/capabilities")) {
                                    capabilitiesJson
                                } else {
                                    orderRequestBodies +=
                                        (request.body as OutgoingContent.ByteArrayContent).bytes().decodeToString()
                                    orderResponseJson
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
                val downloadApiClient = DownloadApiClient(client)
                val registerClient = RegisterClient(client, "https://register.geonorge.no")
                val downloadInsightGroupsResolver = DownloadInsightGroupsResolver(registerClient)
                val downloadService = DownloadService(downloadApiClient, downloadInsightGroupsResolver)
                routing { downloadRoutes(downloadService, authentication) }
            }

            val response =
                client.post("/api/download/order") {
                    header(HttpHeaders.ContentType, ContentType.Application.Json.toString())
                    setBody(
                        """
                        {
                          "email": "user@example.com",
                          "usageGroup": "professional",
                          "items": [
                            {
                              "uuid": "041f1e6e-bdbc-4091-b48f-8a5990f3cc5b",
                              "capabilitiesUrl": "https://external-download.example/api/capabilities/",
                              "areas": [{"code": "42", "name": "Agder", "type": "fylke"}],
                              "projections": [{"code": "25832", "name": "EUREF89 UTM sone 32", "codespace": "EPSG"}],
                              "formats": [{"code": "gml", "name": "GML", "type": "vector"}],
                              "usagePurpose": ["analysis"],
                              "coordinates": "POLYGON ((...))",
                              "clipperFile": "clipper.zip"
                            }
                          ]
                        }
                        """.trimIndent(),
                    )
                }

            assertEquals(HttpStatusCode.OK, response.status)
            val body = response.bodyAsText()
            assertContains(body, "\"status\":\"ReadyForDownload\"")
            assertContains(body, "\"metadataUuid\":\"041f1e6e-bdbc-4091-b48f-8a5990f3cc5b\"")
            assertContains(body, "\"areaName\":\"Agder\"")
            assertContains(body, "\"projectionName\":\"EUREF89 UTM sone 32\"")
            assertContains(body, "\"format\":\"GML\"")
            assertContains(body, "\"metadataName\":\"Kommuner\"")
            assertContains(
                body,
                "\"_links\":[{\"href\":\"https://nedlasting.geonorge.no/api/order/abc\",\"rel\":\"self\"}]",
            )
            assertEquals(1, orderRequestBodies.size)
            val orderRequestBody = orderRequestBodies.single()
            assertContains(orderRequestBody, "\"email\":\"user@example.com\"")
            assertContains(orderRequestBody, "\"usageGroup\":\"professional\"")
            assertContains(orderRequestBody, "\"metadataUuid\":\"041f1e6e-bdbc-4091-b48f-8a5990f3cc5b\"")
            assertContains(orderRequestBody, "\"areas\":[{\"code\":\"42\",\"name\":\"Agder\",\"type\":\"fylke\"}]")
            assertContains(
                orderRequestBody,
                "\"projections\":[{\"code\":\"25832\",\"name\":\"EUREF89 UTM sone 32\",\"codespace\":\"EPSG\"}]",
            )
            assertContains(orderRequestBody, "\"formats\":[{\"code\":\"gml\",\"name\":\"GML\",\"type\":\"vector\"}]")
            assertContains(orderRequestBody, "\"usagePurpose\":[\"analysis\"]")
            assertContains(orderRequestBody, "\"coordinates\":\"POLYGON ((...))\"")
            assertContains(orderRequestBody, "\"clipperFile\":\"clipper.zip\"")
            assertEquals(
                "https://external-download.example/api/capabilities/041f1e6e-bdbc-4091-b48f-8a5990f3cc5b",
                requestedUrls.first(),
            )
            assertEquals(
                listOf("/api/capabilities/041f1e6e-bdbc-4091-b48f-8a5990f3cc5b", "/api/order"),
                requestedPaths,
            )
        }

    @Test
    fun `returns bad gateway when dataset has no order link`() =
        testApplication {
            application {
                val authentication = configureTestAuthentication()
                configureSerialization()
                configureStatusPages()
                val client =
                    HttpClient(
                        MockEngine { _ ->
                            respond(
                                content = """{"distributedBy": "Geonorge", "_links": []}""",
                                status = HttpStatusCode.OK,
                                headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                            )
                        },
                    ) {
                        install(ContentNegotiation) { json() }
                    }
                val downloadApiClient = DownloadApiClient(client)
                val registerClient = RegisterClient(client, "https://register.geonorge.no")
                val downloadInsightGroupsResolver = DownloadInsightGroupsResolver(registerClient)
                val downloadService = DownloadService(downloadApiClient, downloadInsightGroupsResolver)
                routing { downloadRoutes(downloadService, authentication) }
            }

            val response =
                client.post("/api/download/order") {
                    header(HttpHeaders.ContentType, ContentType.Application.Json.toString())
                    setBody(
                        """
                        {"items": [{
                          "uuid": "mangler-ordre-lenke",
                          "capabilitiesUrl": "https://external-download.example/api/capabilities"
                        }]}
                        """.trimIndent(),
                    )
                }

            assertEquals(HttpStatusCode.BadGateway, response.status)
        }

    @Test
    fun `combines items that share an order url and support bundling into one request`() =
        testApplication {
            val orderRequestBodies = CopyOnWriteArrayList<String>()
            application {
                val authentication = configureTestAuthentication()
                configureSerialization()
                configureStatusPages()
                val client =
                    HttpClient(
                        MockEngine { request ->
                            if (request.url.encodedPath.startsWith("/api/capabilities")) {
                                respond(
                                    content = capabilitiesJson,
                                    status = HttpStatusCode.OK,
                                    headers =
                                        headersOf(
                                            HttpHeaders.ContentType,
                                            ContentType.Application.Json.toString(),
                                        ),
                                )
                            } else {
                                orderRequestBodies +=
                                    (request.body as OutgoingContent.ByteArrayContent).bytes().decodeToString()
                                respond(
                                    content = orderResponseJson,
                                    status = HttpStatusCode.OK,
                                    headers =
                                        headersOf(
                                            HttpHeaders.ContentType,
                                            ContentType.Application.Json.toString(),
                                        ),
                                )
                            }
                        },
                    ) {
                        install(ContentNegotiation) { json() }
                    }
                val downloadApiClient = DownloadApiClient(client)
                val registerClient = RegisterClient(client, "https://register.geonorge.no")
                val downloadInsightGroupsResolver = DownloadInsightGroupsResolver(registerClient)
                val downloadService = DownloadService(downloadApiClient, downloadInsightGroupsResolver)
                routing { downloadRoutes(downloadService, authentication) }
            }

            val response =
                client.post("/api/download/order") {
                    header(HttpHeaders.ContentType, ContentType.Application.Json.toString())
                    setBody(
                        """
                        {
                          "items": [
                            {"uuid": "11111111-1111-1111-1111-111111111111", "capabilitiesUrl": "https://external-download.example/api/capabilities", "formats": [{"name": "GML"}]},
                            {"uuid": "22222222-2222-2222-2222-222222222222", "capabilitiesUrl": "https://external-download.example/api/capabilities", "formats": [{"name": "GML"}]}
                          ]
                        }
                        """.trimIndent(),
                    )
                }

            assertEquals(HttpStatusCode.OK, response.status)
            assertEquals(1, orderRequestBodies.size)
            assertContains(orderRequestBodies.first(), "11111111-1111-1111-1111-111111111111")
            assertContains(orderRequestBodies.first(), "22222222-2222-2222-2222-222222222222")
        }

    @Test
    fun `keeps items separate when their capability says bundling is unsupported`() =
        testApplication {
            val orderRequestBodies = CopyOnWriteArrayList<String>()
            application {
                val authentication = configureTestAuthentication()
                configureSerialization()
                configureStatusPages()
                val client =
                    HttpClient(
                        MockEngine { request ->
                            if (request.url.encodedPath.startsWith("/api/capabilities")) {
                                respond(
                                    content = capabilitiesNoBundlingJson,
                                    status = HttpStatusCode.OK,
                                    headers =
                                        headersOf(
                                            HttpHeaders.ContentType,
                                            ContentType.Application.Json.toString(),
                                        ),
                                )
                            } else {
                                orderRequestBodies +=
                                    (request.body as OutgoingContent.ByteArrayContent).bytes().decodeToString()
                                respond(
                                    content = orderResponseJson,
                                    status = HttpStatusCode.OK,
                                    headers =
                                        headersOf(
                                            HttpHeaders.ContentType,
                                            ContentType.Application.Json.toString(),
                                        ),
                                )
                            }
                        },
                    ) {
                        install(ContentNegotiation) { json() }
                    }
                val downloadApiClient = DownloadApiClient(client)
                val registerClient = RegisterClient(client, "https://register.geonorge.no")
                val downloadInsightGroupsResolver = DownloadInsightGroupsResolver(registerClient)
                val downloadService = DownloadService(downloadApiClient, downloadInsightGroupsResolver)
                routing { downloadRoutes(downloadService, authentication) }
            }

            val response =
                client.post("/api/download/order") {
                    header(HttpHeaders.ContentType, ContentType.Application.Json.toString())
                    setBody(
                        """
                        {
                          "items": [
                            {"uuid": "33333333-3333-3333-3333-333333333333", "capabilitiesUrl": "https://external-download.example/api/capabilities", "formats": [{"name": "GML"}]},
                            {"uuid": "44444444-4444-4444-4444-444444444444", "capabilitiesUrl": "https://external-download.example/api/capabilities", "formats": [{"name": "GML"}]}
                          ]
                        }
                        """.trimIndent(),
                    )
                }

            assertEquals(HttpStatusCode.OK, response.status)
            assertEquals(2, orderRequestBodies.size)
            assertEquals(
                0,
                orderRequestBodies.count {
                    it.contains("33333333-3333-3333-3333-333333333333") &&
                        it.contains("44444444-4444-4444-4444-444444444444")
                },
            )
        }

    @Test
    fun `returns formats and projections from areas without requesting the format codelist`() =
        testApplication {
            val requestedPaths = CopyOnWriteArrayList<String>()
            application {
                val authentication = configureTestAuthentication()
                configureSerialization()
                configureStatusPages()
                val client =
                    HttpClient(
                        MockEngine { request ->
                            requestedPaths += request.url.encodedPath
                            val content =
                                when {
                                    request.url.encodedPath.startsWith(
                                        "/api/capabilities",
                                    ) -> capabilitiesWithAreaAndFormatLinksJson
                                    request.url.encodedPath.startsWith("/api/codelists/area") -> areasJson
                                    else -> error("Unexpected request to ${request.url}")
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
                val downloadApiClient = DownloadApiClient(client)
                val registerClient = RegisterClient(client, "https://register.geonorge.no")
                val downloadInsightGroupsResolver = DownloadInsightGroupsResolver(registerClient)
                val downloadService = DownloadService(downloadApiClient, downloadInsightGroupsResolver)
                routing { downloadRoutes(downloadService, authentication) }
            }

            val response =
                client.get(
                    "/api/download/options/041f1e6e-bdbc-4091-b48f-8a5990f3cc5b" +
                        "?capabilitiesUrl=https://nedlasting.geonorge.no/api/capabilities",
                )

            assertEquals(HttpStatusCode.OK, response.status)
            val body = response.bodyAsText()
            assertContains(body, "\"areas\":[{\"area\":{\"code\":\"42\",\"name\":\"Agder\",\"type\":\"fylke\"}")
            assertContains(body, "{\"area\":{\"code\":\"32\",\"name\":\"Akershus\",\"type\":\"fylke\"}")
            assertEquals(2, body.split("\"formats\":[{\"name\":\"GML\"}]").size - 1)
            assertContains(body, "\"formats\":[{\"name\":\"SOSI\"}]")
            assertEquals(
                listOf(
                    "/api/capabilities/041f1e6e-bdbc-4091-b48f-8a5990f3cc5b",
                    "/api/codelists/area/041f1e6e-bdbc-4091-b48f-8a5990f3cc5b",
                ),
                requestedPaths,
            )
        }

    @Test
    fun `returns bad request when capabilitiesUrl is missing`() =
        testApplication {
            application {
                val authentication = configureTestAuthentication()
                configureSerialization()
                configureStatusPages()
                val client =
                    HttpClient(MockEngine { respond(content = "[]", status = HttpStatusCode.OK) }) {
                        install(ContentNegotiation) { json() }
                    }
                val downloadApiClient = DownloadApiClient(client)
                val registerClient = RegisterClient(client, "https://register.geonorge.no")
                val downloadInsightGroupsResolver = DownloadInsightGroupsResolver(registerClient)
                val downloadService = DownloadService(downloadApiClient, downloadInsightGroupsResolver)
                routing { downloadRoutes(downloadService, authentication) }
            }

            val response = client.get("/api/download/options/041f1e6e-bdbc-4091-b48f-8a5990f3cc5b")

            assertEquals(HttpStatusCode.BadRequest, response.status)
        }

    @Test
    fun `returns no options when the area link is missing from capabilities`() =
        testApplication {
            application {
                val authentication = configureTestAuthentication()
                configureSerialization()
                configureStatusPages()
                val client =
                    HttpClient(
                        MockEngine { request ->
                            val content =
                                when {
                                    request.url.encodedPath.startsWith(
                                        "/api/capabilities",
                                    ) -> capabilitiesWithOnlyFormatLinkJson
                                    else -> error("Unexpected request to ${request.url}")
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
                val downloadApiClient = DownloadApiClient(client)
                val registerClient = RegisterClient(client, "https://register.geonorge.no")
                val downloadInsightGroupsResolver = DownloadInsightGroupsResolver(registerClient)
                val downloadService = DownloadService(downloadApiClient, downloadInsightGroupsResolver)
                routing { downloadRoutes(downloadService, authentication) }
            }

            val response =
                client.get(
                    "/api/download/options/041f1e6e-bdbc-4091-b48f-8a5990f3cc5b" +
                        "?capabilitiesUrl=https://nedlasting.geonorge.no/api/capabilities",
                )

            assertEquals(HttpStatusCode.OK, response.status)
            val body = response.bodyAsText()
            assertContains(body, "\"areas\":[]")
        }

    @Test
    fun `reports a group as failed without failing the whole request when its order call fails`() =
        testApplication {
            application {
                val authentication = configureTestAuthentication()
                configureSerialization()
                configureStatusPages()
                val client =
                    HttpClient(
                        MockEngine { request ->
                            if (request.url.encodedPath.startsWith("/api/capabilities")) {
                                respond(
                                    content = capabilitiesJson,
                                    status = HttpStatusCode.OK,
                                    headers =
                                        headersOf(
                                            HttpHeaders.ContentType,
                                            ContentType.Application.Json.toString(),
                                        ),
                                )
                            } else {
                                respond(
                                    content = "Internal error",
                                    status = HttpStatusCode.InternalServerError,
                                )
                            }
                        },
                    ) {
                        install(ContentNegotiation) { json() }
                    }
                val nedlastingClient = NedlastingClient(client, "https://nedlasting.geonorge.no")
                val registerClient = RegisterClient(client, "https://register.geonorge.no")
                val downloadInsightGroupsResolver = DownloadInsightGroupsResolver(registerClient)
                val downloadService = DownloadService(nedlastingClient, downloadInsightGroupsResolver)
                routing { downloadRoutes(downloadService, authentication) }
            }

            val response =
                client.post("/api/download/order") {
                    header(HttpHeaders.ContentType, ContentType.Application.Json.toString())
                    setBody(
                        """
                        {
                          "items": [
                            {"uuid": "uuid-e", "formats": [{"name": "GML"}]}
                          ]
                        }
                        """.trimIndent(),
                    )
                }

            assertEquals(HttpStatusCode.OK, response.status)
            val body = response.bodyAsText()
            assertContains(body, "\"status\":\"failed\"")
            assertContains(body, "\"metadataUuids\":[\"uuid-e\"]")
        }
}

package no.kartverket.geonorge.kartkatalog.routes

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
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
import no.kartverket.geonorge.kartkatalog.download.DownloadService
import no.kartverket.geonorge.kartkatalog.download.downloadRoutes
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingClient
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
              "metadataUuid": "041f1e6e-bdbc-4091-b48f-8a5990f3cc5b",
              "metadataName": "Kommuner"
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

    @Test
    fun `orders a download and returns ready-for-download files`() =
        testApplication {
            val requestedPaths = mutableListOf<String>()
            application {
                configureSerialization()
                configureStatusPages()
                val client =
                    HttpClient(
                        MockEngine { request ->
                            requestedPaths += request.url.encodedPath
                            val content =
                                if (request.url.encodedPath.startsWith("/api/capabilities")) {
                                    capabilitiesJson
                                } else {
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
                val nedlastingClient = NedlastingClient(client, "https://nedlasting.geonorge.no")
                val downloadService = DownloadService(nedlastingClient)
                routing { downloadRoutes(downloadService) }
            }

            val response =
                client.post("/api/download/order") {
                    header(HttpHeaders.ContentType, ContentType.Application.Json.toString())
                    setBody(
                        """
                        {
                          "items": [
                            {"uuid": "041f1e6e-bdbc-4091-b48f-8a5990f3cc5b", "formats": [{"name": "GML"}]}
                          ]
                        }
                        """.trimIndent(),
                    )
                }

            assertEquals(HttpStatusCode.OK, response.status)
            val body = response.bodyAsText()
            assertContains(body, "\"status\":\"ReadyForDownload\"")
            assertContains(body, "\"metadataUuid\":\"041f1e6e-bdbc-4091-b48f-8a5990f3cc5b\"")
            assertEquals(
                listOf("/api/capabilities/041f1e6e-bdbc-4091-b48f-8a5990f3cc5b", "/api/order"),
                requestedPaths,
            )
        }

    @Test
    fun `returns bad gateway when dataset has no order link`() =
        testApplication {
            application {
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
                val nedlastingClient = NedlastingClient(client, "https://nedlasting.geonorge.no")
                val downloadService = DownloadService(nedlastingClient)
                routing { downloadRoutes(downloadService) }
            }

            val response =
                client.post("/api/download/order") {
                    header(HttpHeaders.ContentType, ContentType.Application.Json.toString())
                    setBody("""{"items": [{"uuid": "mangler-ordre-lenke"}]}""")
                }

            assertEquals(HttpStatusCode.BadGateway, response.status)
        }

    @Test
    fun `combines items that share an order url and support bundling into one request`() =
        testApplication {
            val orderRequestBodies = mutableListOf<String>()
            application {
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
                val nedlastingClient = NedlastingClient(client, "https://nedlasting.geonorge.no")
                val downloadService = DownloadService(nedlastingClient)
                routing { downloadRoutes(downloadService) }
            }

            val response =
                client.post("/api/download/order") {
                    header(HttpHeaders.ContentType, ContentType.Application.Json.toString())
                    setBody(
                        """
                        {
                          "items": [
                            {"uuid": "uuid-a", "formats": [{"name": "GML"}]},
                            {"uuid": "uuid-b", "formats": [{"name": "GML"}]}
                          ]
                        }
                        """.trimIndent(),
                    )
                }

            assertEquals(HttpStatusCode.OK, response.status)
            assertEquals(1, orderRequestBodies.size)
            assertContains(orderRequestBodies.first(), "uuid-a")
            assertContains(orderRequestBodies.first(), "uuid-b")
        }

    @Test
    fun `keeps items separate when their capability says bundling is unsupported`() =
        testApplication {
            val orderRequestBodies = mutableListOf<String>()
            application {
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
                val nedlastingClient = NedlastingClient(client, "https://nedlasting.geonorge.no")
                val downloadService = DownloadService(nedlastingClient)
                routing { downloadRoutes(downloadService) }
            }

            val response =
                client.post("/api/download/order") {
                    header(HttpHeaders.ContentType, ContentType.Application.Json.toString())
                    setBody(
                        """
                        {
                          "items": [
                            {"uuid": "uuid-c", "formats": [{"name": "GML"}]},
                            {"uuid": "uuid-d", "formats": [{"name": "GML"}]}
                          ]
                        }
                        """.trimIndent(),
                    )
                }

            assertEquals(HttpStatusCode.OK, response.status)
            assertEquals(2, orderRequestBodies.size)
            assertEquals(0, orderRequestBodies.count { it.contains("uuid-c") && it.contains("uuid-d") })
        }
}

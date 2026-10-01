package no.kartverket.geonorge.kartkatalog.download

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.headersOf
import io.ktor.serialization.kotlinx.json.json
import kotlinx.coroutines.test.runTest
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import kotlin.test.Test
import kotlin.test.assertEquals

class DownloadServiceTest {
    @Test
    fun `orders a restricted dataset with the GeoID access token`() =
        runTest {
            val authorizationHeaders = mutableListOf<String?>()
            val client =
                HttpClient(
                    MockEngine { request ->
                        val content =
                            if (request.url.encodedPath.startsWith("/api/capabilities")) {
                                """
                                {
                                  "accessConstraintRequiredRole": "nd.metadata",
                                  "_links": [
                                    {
                                      "href": "https://nedlasting.geonorge.no/api/order",
                                      "rel": "http://rel.geonorge.no/download/order"
                                    }
                                  ]
                                }
                                """.trimIndent()
                            } else {
                                authorizationHeaders += request.headers[HttpHeaders.Authorization]
                                """{"files": [], "_links": []}"""
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
            val downloadApiClient =
                DownloadApiClient(
                    client,
                    DownloadTokenAllowlist.fromCommaSeparated("https://nedlasting.geonorge.no"),
                )
            val registerClient = RegisterClient(client, "https://register.geonorge.no")
            val service = DownloadService(downloadApiClient, DownloadInsightGroupsResolver(registerClient))

            val result =
                service.order(
                    DownloadOrderRequest(
                        items =
                            listOf(
                                DownloadOrderItem(
                                    uuid = "restricted-dataset",
                                    capabilitiesUrl = "https://nedlasting.geonorge.no/api/capabilities",
                                ),
                            ),
                    ),
                    geoIdAccessToken = "valid-token",
                )

            assertEquals(1, result.responses.size)
            assertEquals("Bearer valid-token", authorizationHeaders.single())
        }

    @Test
    fun `orders public datasets without the GeoID access token`() =
        runTest {
            val authorizationHeaders = mutableListOf<String?>()
            val client =
                HttpClient(
                    MockEngine { request ->
                        val content =
                            if (request.url.encodedPath.startsWith("/api/capabilities")) {
                                """
                                {
                                  "_links": [
                                    {
                                      "href": "https://nedlasting.geonorge.no/api/order",
                                      "rel": "http://rel.geonorge.no/download/order"
                                    }
                                  ]
                                }
                                """.trimIndent()
                            } else {
                                authorizationHeaders += request.headers[HttpHeaders.Authorization]
                                """{"files": [], "_links": []}"""
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
            val service =
                DownloadService(
                    DownloadApiClient(client),
                    DownloadInsightGroupsResolver(RegisterClient(client, "https://register.geonorge.no")),
                )

            service.order(
                DownloadOrderRequest(
                    items =
                        listOf(
                            DownloadOrderItem(
                                "public-dataset",
                                "https://nedlasting.geonorge.no/api/capabilities",
                            ),
                        ),
                ),
                geoIdAccessToken = "valid-token",
            )

            assertEquals(listOf<String?>(null), authorizationHeaders)
        }

    @Test
    fun `separates public and restricted datasets that share an order URL`() =
        runTest {
            val authorizationHeaders = mutableListOf<String?>()
            val client =
                HttpClient(
                    MockEngine { request ->
                        val content =
                            if (request.url.encodedPath.startsWith("/api/capabilities")) {
                                val restricted = request.url.encodedPath.endsWith("/restricted-dataset")
                                """
                                {
                                  ${if (restricted) "\"accessConstraintRequiredRole\": \"nd.metadata\"," else ""}
                                  "supportsDownloadBundling": true,
                                  "_links": [
                                    {
                                      "href": "https://nedlasting.geonorge.no/api/order",
                                      "rel": "http://rel.geonorge.no/download/order"
                                    }
                                  ]
                                }
                                """.trimIndent()
                            } else {
                                authorizationHeaders += request.headers[HttpHeaders.Authorization]
                                """{"files": [], "_links": []}"""
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
            val service =
                DownloadService(
                    DownloadApiClient(
                        client,
                        DownloadTokenAllowlist.fromCommaSeparated("https://nedlasting.geonorge.no"),
                    ),
                    DownloadInsightGroupsResolver(RegisterClient(client, "https://register.geonorge.no")),
                )

            val result =
                service.order(
                    DownloadOrderRequest(
                        items =
                            listOf(
                                DownloadOrderItem(
                                    "public-dataset",
                                    "https://nedlasting.geonorge.no/api/capabilities",
                                ),
                                DownloadOrderItem(
                                    "restricted-dataset",
                                    "https://nedlasting.geonorge.no/api/capabilities",
                                ),
                            ),
                    ),
                    geoIdAccessToken = "valid-token",
                )

            assertEquals(2, result.responses.size)
            assertEquals(setOf(null, "Bearer valid-token"), authorizationHeaders.toSet())
        }
}

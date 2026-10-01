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
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingClient
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
            val nedlastingClient = NedlastingClient(client, "https://nedlasting.geonorge.no")
            val registerClient = RegisterClient(client, "https://register.geonorge.no")
            val service = DownloadService(nedlastingClient, DownloadInsightGroupsResolver(registerClient))

            val result =
                service.order(
                    DownloadOrderRequest(items = listOf(DownloadOrderItem(uuid = "restricted-dataset"))),
                    geoIdAccessToken = "valid-token",
                )

            assertEquals(1, result.responses.size)
            assertEquals("Bearer valid-token", authorizationHeaders.single())
        }
}

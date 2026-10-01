package no.kartverket.geonorge.kartkatalog.download

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import kotlinx.coroutines.runBlocking
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse

class DownloadApiClientTest {
    private val areasUrl = "https://nedlasting.example.com/api/codelists/area/dataset"

    @Test
    fun `getAreas parses a successful response`() =
        runBlocking {
            val httpClient =
                mockHttpClient(
                    content =
                        """
                        [
                          {
                            "code": "42",
                            "name": "Agder",
                            "type": "fylke",
                            "projections": [
                              {
                                "code": "25832",
                                "name": "EUREF89 UTM sone 32",
                                "formats": [{"name": "GML"}]
                              }
                            ]
                          }
                        ]
                        """.trimIndent(),
                )

            try {
                val areas = DownloadApiClient(httpClient).getAreas(areasUrl)

                assertEquals(1, areas.size)
                assertEquals("42", areas.single().code)
                assertEquals("25832", areas.single().projections.single().code)
                assertEquals("GML", areas.single().projections.single().formats?.single()?.name)
            } finally {
                httpClient.close()
            }
        }

    @Test
    fun `getAreas rejects a non-success response containing a valid JSON array`() =
        runBlocking {
            val httpClient =
                mockHttpClient(
                    content = "[]",
                    status = HttpStatusCode.InternalServerError,
                )

            try {
                val exception =
                    assertFailsWith<DownloadApiException> {
                        DownloadApiClient(httpClient).getAreas(areasUrl)
                    }

                assertContains(exception.message.orEmpty(), "500 Internal Server Error")
            } finally {
                httpClient.close()
            }
        }

    @Test
    fun `getCapabilities appends a validated UUID as a path segment`() =
        runBlocking {
            var requestedPath: String? = null
            val httpClient =
                HttpClient(
                    MockEngine { request ->
                        requestedPath = request.url.encodedPath
                        respond("""{"_links": []}""", HttpStatusCode.OK)
                    },
                )

            try {
                DownloadApiClient(httpClient).getCapabilities(
                    "https://nedlasting.example.com/api/capabilities/",
                    "041f1e6e-bdbc-4091-b48f-8a5990f3cc5b",
                )

                assertEquals("/api/capabilities/041f1e6e-bdbc-4091-b48f-8a5990f3cc5b", requestedPath)
            } finally {
                httpClient.close()
            }
        }

    @Test
    fun `getCapabilities rejects query fragments and invalid UUIDs before making a request`() =
        runBlocking {
            var requestWasMade = false
            val httpClient =
                HttpClient(
                    MockEngine {
                        requestWasMade = true
                        respond("""{"_links": []}""", HttpStatusCode.OK)
                    },
                )
            val client = DownloadApiClient(httpClient)
            val validUuid = "041f1e6e-bdbc-4091-b48f-8a5990f3cc5b"

            try {
                listOf(
                    "https://nedlasting.example.com/api/capabilities?target=other" to validUuid,
                    "https://nedlasting.example.com/api/capabilities?" to validUuid,
                    "https://nedlasting.example.com/api/capabilities#fragment" to validUuid,
                    "https://nedlasting.example.com/api/capabilities" to "invalid/uuid?target=other",
                ).forEach { (capabilitiesUrl, uuid) ->
                    assertFailsWith<DownloadApiException> {
                        client.getCapabilities(capabilitiesUrl, uuid)
                    }
                }

                assertFalse(requestWasMade)
            } finally {
                httpClient.close()
            }
        }

    @Test
    fun `order rejects an invalid URL before making a request`() =
        runBlocking {
            var requestWasMade = false
            val httpClient =
                HttpClient(
                    MockEngine {
                        requestWasMade = true
                        respond("""{"files": [], "_links": []}""", HttpStatusCode.OK)
                    },
                )

            try {
                assertFailsWith<DownloadApiException> {
                    DownloadApiClient(httpClient).order(
                        "https://nedlasting.example.com/api/order#fragment",
                        DownloadApiOrderRequest(orderLines = emptyList()),
                    )
                }

                assertFalse(requestWasMade)
            } finally {
                httpClient.close()
            }
        }

    @Test
    fun `order sends the GeoID token to an allowlisted origin`() =
        runBlocking {
            var authorizationHeader: String? = null
            val httpClient =
                HttpClient(
                    MockEngine { request ->
                        authorizationHeader = request.headers[HttpHeaders.Authorization]
                        respond("""{"files": [], "_links": []}""", HttpStatusCode.OK)
                    },
                )

            try {
                DownloadApiClient(
                    httpClient,
                    DownloadTokenAllowlist.fromCommaSeparated("https://nedlasting.geonorge.no"),
                ).order(
                    "https://nedlasting.geonorge.no/api/order",
                    DownloadApiOrderRequest(orderLines = emptyList()),
                    geoIdAccessToken = "valid-token",
                )

                assertEquals("Bearer valid-token", authorizationHeader)
            } finally {
                httpClient.close()
            }
        }

    @Test
    fun `order rejects a token for a non-allowlisted origin before making a request`() =
        runBlocking {
            var requestWasMade = false
            val httpClient =
                HttpClient(
                    MockEngine {
                        requestWasMade = true
                        respond("""{"files": [], "_links": []}""", HttpStatusCode.OK)
                    },
                )

            try {
                assertFailsWith<DownloadTokenDestinationNotAllowedException> {
                    DownloadApiClient(
                        httpClient,
                        DownloadTokenAllowlist.fromCommaSeparated("https://nedlasting.geonorge.no"),
                    ).order(
                        "https://attacker.example/api/order",
                        DownloadApiOrderRequest(orderLines = emptyList()),
                        geoIdAccessToken = "valid-token",
                    )
                }

                assertFalse(requestWasMade)
            } finally {
                httpClient.close()
            }
        }

    private fun mockHttpClient(
        content: String,
        status: HttpStatusCode = HttpStatusCode.OK,
    ) = HttpClient(MockEngine { respond(content = content, status = status) })
}

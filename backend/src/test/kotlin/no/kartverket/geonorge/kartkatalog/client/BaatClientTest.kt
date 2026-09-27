package no.kartverket.geonorge.kartkatalog.client

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.headersOf
import kotlinx.coroutines.runBlocking
import no.kartverket.geonorge.kartkatalog.download.GeoIdUser
import no.kartverket.geonorge.kartkatalog.integrations.baat.BaatClient
import kotlin.test.Test
import kotlin.test.assertEquals

class BaatClientTest {
    @Test
    fun `gets user info with the GeoID bearer token`() =
        runBlocking {
            var authorizationHeader: String? = null
            var requestedPath: String? = null
            val httpClient =
                HttpClient(
                    MockEngine { request ->
                        authorizationHeader = request.headers[HttpHeaders.Authorization]
                        requestedPath = request.url.encodedPath
                        respond(
                            content =
                                """
                                {
                                  "user": "frodo",
                                  "baat_email": "frodo@example.com",
                                  "baat_name": "Frodo Baggins",
                                  "baat_authorized_from": 29991231,
                                  "baat_authorized_until": 20000101,
                                  "baat_organization": {
                                    "name": "Oslo kommune",
                                    "orgnr": 123456789
                                  },
                                  "baat_services": ["nd.restricted", "service.two"]
                                }
                                """.trimIndent(),
                            status = HttpStatusCode.OK,
                            headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                        )
                    },
                )
            val client = BaatClient(httpClient, "https://baat.example.com")

            val info = client.getUserInfo(GeoIdUser("frodo", "secret-token"))

            assertEquals("/info/frodo", requestedPath)
            assertEquals("Bearer secret-token", authorizationHeader)
            assertEquals("Frodo Baggins", info.name)
            assertEquals("frodo@example.com", info.email)
            assertEquals(29991231, info.authorizedFrom)
            assertEquals(20000101, info.authorizedUntil)
            assertEquals("Oslo kommune", info.organization.name)
            assertEquals("123456789", info.organization.organizationNumber)
            assertEquals(setOf("nd.restricted", "service.two"), info.services)
        }
}

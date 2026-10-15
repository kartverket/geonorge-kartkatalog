package no.kartverket.geonorge.kartkatalog.routes

import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.Url
import io.ktor.server.application.install
import io.ktor.server.plugins.forwardedheaders.XForwardedHeaders
import io.ktor.server.testing.testApplication
import no.kartverket.geonorge.kartkatalog.config.AppConfig
import no.kartverket.geonorge.kartkatalog.config.configureHttp
import no.kartverket.geonorge.kartkatalog.config.configureSerialization
import no.kartverket.geonorge.kartkatalog.config.configureStatusPages
import no.kartverket.geonorge.kartkatalog.configureRouting
import kotlin.test.Test
import kotlin.test.assertEquals

class ServerTest {
    @Test
    fun `oidc login uses forwarded https for callback`() =
        testApplication {
            application {
                install(XForwardedHeaders)
                configureTestAuthentication()
            }
            val noRedirectClient = createClient { followRedirects = false }
            val response =
                noRedirectClient.get("/oidc/test-geoid/login") {
                    header(HttpHeaders.XForwardedProto, "https")
                    header(HttpHeaders.XForwardedHost, "api.example.com")
                }

            assertEquals(HttpStatusCode.Found, response.status)
            val location = requireNotNull(response.headers[HttpHeaders.Location])
            assertEquals(
                "https://api.example.com/oidc/test-geoid/callback",
                Url(location).parameters["redirect_uri"],
            )
        }

    @Test
    fun `oidc login uses forwarded frontend port for callback`() =
        testApplication {
            application {
                install(XForwardedHeaders)
                configureTestAuthentication("http://localhost:8080/beta/api/auth/geoid/callback")
            }
            val noRedirectClient = createClient { followRedirects = false }
            val response =
                noRedirectClient.get("/oidc/test-geoid/login") {
                    header(HttpHeaders.XForwardedProto, "http")
                    header(HttpHeaders.XForwardedHost, "localhost:3000")
                    header(HttpHeaders.XForwardedPort, "3000")
                }

            assertEquals(HttpStatusCode.Found, response.status)
            val location = requireNotNull(response.headers[HttpHeaders.Location])
            assertEquals(
                "http://localhost:3000/beta/api/auth/geoid/callback",
                Url(location).parameters["redirect_uri"],
            )
        }

    @Test
    fun `test root endpoint`() =
        testApplication {
            application {
                val authentication = configureTestAuthentication()
                configureHttp()
                configureSerialization()
                configureStatusPages()
                configureRouting(
                    AppConfig(
                        mapOf(
                            "GEONETWORK_BASE_URL" to "https://test.example.com/geonetwork",
                            "REGISTER_BASE_URL" to "https://test.example.com/register",
                            "SOLR_BASE_URL" to "https://test.example.com/solr",
                            "NORGESKART_BASE_URL" to "https://test.example.com/norgeskart",
                            "GEOID_ISSUER" to "https://test.example.com/geoid",
                            "GEOID_CLIENT_ID" to "kartkatalog-test",
                            "GEOID_CLIENT_SECRET" to "test-secret",
                            "PUBLIC_BASE_URL" to "https://test.example.com/kartkatalog",
                        ),
                    ),
                    authentication,
                )
            }
            assertEquals(HttpStatusCode.OK, client.get("/").status)
        }
}

package no.kartverket.geonorge.kartkatalog.routes

import io.ktor.client.request.get
import io.ktor.http.HttpStatusCode
import io.ktor.server.testing.testApplication
import no.kartverket.geonorge.kartkatalog.config.AppConfig
import no.kartverket.geonorge.kartkatalog.config.configureHttp
import no.kartverket.geonorge.kartkatalog.config.configureSerialization
import no.kartverket.geonorge.kartkatalog.config.configureStatusPages
import no.kartverket.geonorge.kartkatalog.configureRouting
import kotlin.String
import kotlin.test.Test
import kotlin.test.assertEquals

class ServerTest {
    @Test
    fun `test root endpoint`() =
        testApplication {
            application {
                configureHttp()
                configureSerialization()
                configureStatusPages()
                configureRouting(
                    AppConfig(
                        mapOf(
                            "GEONETWORK_BASE_URL" to "https://test.example.com/geonetwork",
                            "REGISTER_BASE_URL" to "https://test.example.com/register",
                            "SOLR_BASE_URL" to "https://test.example.com/solr",
                            "NORGESKART_BASE_URL" to "https://test.example.com/norgeskart"),
                    ),
                )
            }
            assertEquals(HttpStatusCode.OK, client.get("/").status)
        }
}

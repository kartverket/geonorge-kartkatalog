package no.kartverket.geonorge.kartkatalog

import io.ktor.client.request.get
import io.ktor.http.HttpStatusCode
import io.ktor.server.testing.testApplication
import no.kartverket.geonorge.kartkatalog.config.configureHttp
import no.kartverket.geonorge.kartkatalog.config.configureSerialization
import no.kartverket.geonorge.kartkatalog.config.configureStatusPages
import no.kartverket.geonorge.kartkatalog.routes.configureRouting
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
                configureRouting()
            }
            assertEquals(HttpStatusCode.OK, client.get("/").status)
        }
}

package no.kartverket.geonorge.kartkatalog.config

import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import io.ktor.server.testing.testApplication
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class MetricsTest {
    @Test
    fun `exposes Prometheus metrics`() =
        testApplication {
            application {
                configureMetrics()
                routing { get("/test") { call.respondText("ok") } }
            }
            client.get("/test")

            val response = client.get("/actuator/prometheus")

            assertEquals(200, response.status.value)
            assertTrue(response.bodyAsText().contains("ktor_http_server_requests"))
        }
}

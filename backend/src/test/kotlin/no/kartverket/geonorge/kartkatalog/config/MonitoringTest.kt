package no.kartverket.geonorge.kartkatalog.config

import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpHeaders
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import io.ktor.server.testing.ApplicationTestBuilder
import io.ktor.server.testing.testApplication
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class MonitoringTest {
    private fun ApplicationTestBuilder.setup() {
        application {
            configureMonitoring()
            routing { get("/test") { call.respondText("ok") } }
        }
    }

    @Test
    fun `echoes a valid request id`() =
        testApplication {
            setup()
            val response = client.get("/test") { header(HttpHeaders.XRequestId, "Abc-123") }
            assertEquals("Abc-123", response.headers[HttpHeaders.XRequestId])
        }

    @Test
    fun `generates a request id when missing`() =
        testApplication {
            setup()
            val response = client.get("/test")
            assertNotNull(response.headers[HttpHeaders.XRequestId])
        }

    @Test
    fun `replaces a request id with characters outside the allowlist`() =
        testApplication {
            setup()
            val forged = "abc] ERROR fake-entry"
            val response = client.get("/test") { header(HttpHeaders.XRequestId, forged) }
            val callId = assertNotNull(response.headers[HttpHeaders.XRequestId])
            assertNotEquals(forged, callId)
            assertEquals(200, response.status.value)
        }

    @Test
    fun `rejects request ids that are too long`() =
        testApplication {
            setup()
            val tooLong = "a".repeat(65)
            val response = client.get("/test") { header(HttpHeaders.XRequestId, tooLong) }
            assertNotEquals(tooLong, response.headers[HttpHeaders.XRequestId])
        }

    @Test
    fun `exposes Prometheus metrics`() =
        testApplication {
            setup()
            client.get("/test")

            val response = client.get("/metrics")

            assertEquals(200, response.status.value)
            assertTrue(response.bodyAsText().contains("ktor_http_server_requests"))
        }
}

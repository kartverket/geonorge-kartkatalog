package no.kartverket.geonorge.kartkatalog.config

import ch.qos.logback.classic.Logger
import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.core.read.ListAppender
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.http.HttpHeaders
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import io.ktor.server.testing.ApplicationTestBuilder
import io.ktor.server.testing.testApplication
import org.slf4j.LoggerFactory
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class CallLoggingTest {
    private fun ApplicationTestBuilder.setup() {
        application {
            configureCallLogging()
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
    fun `logs request fields as MDC entries, with status only on the completed-request line`() {
        val root = LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME) as Logger
        val appender = ListAppender<ILoggingEvent>().apply { start() }
        root.addAppender(appender)
        try {
            testApplication {
                application {
                    configureCallLogging()
                    routing {
                        get("/test") {
                            LoggerFactory.getLogger("handler").info("inside")
                            call.respondText("ok")
                        }
                    }
                }
                client.get("/test?text=secret") { header(HttpHeaders.UserAgent, "test-agent") }
            }
        } finally {
            root.detachAppender(appender)
        }

        val inside = appender.list.single { it.message == "inside" }
        assertEquals("GET", inside.mdcPropertyMap["method"])
        assertNull(inside.mdcPropertyMap["status"])
        assertTrue(assertNotNull(inside.mdcPropertyMap["durationMs"]?.toLongOrNull()) >= 0)

        val completed = appender.list.single { it.formattedMessage == "OK" }
        assertTrue(assertNotNull(completed.mdcPropertyMap["durationMs"]?.toLongOrNull()) >= 0)
        assertEquals(
            mapOf("method" to "GET", "status" to "200", "path" to "/test", "userAgent" to "test-agent"),
            completed.mdcPropertyMap.filterKeys { it in setOf("method", "status", "path", "userAgent") },
        )
    }
}

package no.kartverket.geonorge.kartkatalog.config

import io.ktor.http.HttpHeaders
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.plugins.callid.CallId
import io.ktor.server.plugins.callid.callIdMdc
import io.ktor.server.plugins.calllogging.CallLogging
import io.ktor.server.plugins.calllogging.processingTimeMillis
import io.ktor.server.request.httpMethod
import io.ktor.server.request.path
import io.ktor.server.request.userAgent
import org.slf4j.event.Level
import java.util.UUID

private const val MAX_CALL_ID_LENGTH = 64
private const val MAX_USER_AGENT_LENGTH = 512

internal fun isValidCallId(callId: String): Boolean =
    callId.length in 1..MAX_CALL_ID_LENGTH &&
        callId.all { it in 'a'..'z' || it in 'A'..'Z' || it in '0'..'9' || it == '-' }

fun Application.configureMonitoring() {
    install(CallId) {
        retrieveFromHeader(HttpHeaders.XRequestId)
        generate { UUID.randomUUID().toString() }
        verify(::isValidCallId)
        replyToHeader(HttpHeaders.XRequestId)
    }
    install(CallLogging) {
        level = Level.INFO
        disableDefaultColors()
        callIdMdc("callId")
        mdc("method") { call -> call.request.httpMethod.value }
        mdc("status") { call ->
            call.response
                .status()
                ?.value
                ?.toString()
        }
        mdc("durationMs") { call -> call.response.status()?.let { call.processingTimeMillis().toString() } }
        mdc("path") { call -> call.request.path() }
        mdc("userAgent") { call -> call.request.userAgent()?.take(MAX_USER_AGENT_LENGTH) }
        format { call -> call.response.status()?.description ?: "Unhandled" }
        filter { call -> call.request.path() != "/" }
    }
}

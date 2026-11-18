package no.kartverket.geonorge.kartkatalog.config

import io.ktor.http.HttpHeaders
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.plugins.callid.CallId
import io.ktor.server.plugins.callid.callIdMdc
import io.ktor.server.plugins.calllogging.CallLogging
import io.ktor.server.request.path
import org.slf4j.event.Level
import java.util.UUID

private const val MAX_CALL_ID_LENGTH = 64

// The call id is client-controlled and written to every log line, so restrict it to prevent log injection.
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
        callIdMdc("callId")
        filter { call -> call.request.path() != "/" }
    }
}

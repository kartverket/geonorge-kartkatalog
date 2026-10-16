package no.kartverket.geonorge.kartkatalog.config

import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import kotlinx.serialization.json.Json

// Shared with routes that must bypass Accept-based content negotiation (e.g. to honor an
// explicit ?mediatype= override) while still serializing with the app's configured settings.
val searchJson = Json { encodeDefaults = true }

fun Application.configureSerialization() {
    install(ContentNegotiation) {
        json(searchJson)
    }
}

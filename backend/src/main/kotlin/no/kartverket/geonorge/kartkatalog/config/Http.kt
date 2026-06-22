package no.kartverket.geonorge.kartkatalog.config

import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.plugins.cors.routing.CORS

fun Application.configureHttp() {
    install(CORS) {
        anyHost()
    }
}

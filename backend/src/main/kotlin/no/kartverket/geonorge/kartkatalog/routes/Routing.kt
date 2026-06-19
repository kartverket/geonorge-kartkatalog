package no.kartverket.geonorge.kartkatalog.routes

import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.Application
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import no.kartverket.geonorge.kartkatalog.client.GeonetworkClient

fun Application.configureRouting() {
    val httpClient =
        HttpClient(CIO) {
            install(ContentNegotiation) {
                json()
            }
        }
    val geonetworkClient = GeonetworkClient(httpClient)
    routing {
        get("/") {
            call.respondText("Hello, World!")
        }
        metadataRoutes(geonetworkClient)
    }
}

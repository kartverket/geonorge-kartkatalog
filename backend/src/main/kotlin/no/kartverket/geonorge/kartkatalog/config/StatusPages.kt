package no.kartverket.geonorge.kartkatalog.config

import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.response.respond
import io.ktor.server.response.respondText
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.GeoNetworkException
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterException
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrException
import no.kartverket.geonorge.kartkatalog.metadata.MetadataRecordNotFoundException
import org.slf4j.LoggerFactory

private val log = LoggerFactory.getLogger("StatusPages")

fun Application.configureStatusPages() {
    install(StatusPages) {
        exception<MetadataRecordNotFoundException> { call, cause ->
            log.warn("Metadata record not found", cause)
            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Record not found"))
        }
        exception<IllegalArgumentException> { call, cause ->
            log.warn("Invalid request", cause)
            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid request"))
        }
        exception<GeoNetworkException> { call, cause ->
            log.warn("GeoNetwork request failed", cause)
            call.respond(HttpStatusCode.BadGateway, mapOf("error" to "Upstream GeoNetwork error"))
        }
        exception<SolrException> { call, cause ->
            log.warn("Solr request failed", cause)
            call.respond(HttpStatusCode.BadGateway, mapOf("error" to "Upstream Solr error"))
        }
        exception<RegisterException> { call, cause ->
            log.warn("Register request failed", cause)
            call.respond(HttpStatusCode.BadGateway, mapOf("error" to "Upstream Register error"))
        }
        exception<Throwable> { call, cause ->
            log.error("Unhandled exception", cause)
            call.respondText(text = "Internal server error", status = HttpStatusCode.InternalServerError)
        }
    }
}

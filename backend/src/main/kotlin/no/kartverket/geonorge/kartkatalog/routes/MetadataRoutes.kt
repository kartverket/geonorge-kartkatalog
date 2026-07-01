package no.kartverket.geonorge.kartkatalog.routes

import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import no.kartverket.geonorge.kartkatalog.service.MetadataSummaryService
import java.util.UUID

fun Route.metadataRoutes(metadataSummaryService: MetadataSummaryService) {
    get("/metadata/{uuid}") {
        val uuid = UUID.fromString(call.parameters["uuid"])

        val result = metadataSummaryService.getMetadataSummary(uuid)
        if (result == null) {
            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Record not found"))
            return@get
        }

        call.respond(result)
    }
}

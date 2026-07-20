package no.kartverket.geonorge.kartkatalog.metadata

import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import java.util.UUID

fun Route.metadataRoutes(metadataSummaryService: MetadataSummaryService) {
    // TODO: se på grupperingen av data og navngivning
    route("/metadata/") {
        get("summary/{uuid}") {
            val uuid = UUID.fromString(call.parameters["uuid"])

            val result = metadataSummaryService.getMetadataSummary(uuid)
            if (result == null) {
                call.respond(HttpStatusCode.NotFound, mapOf("error" to "Record not found"))
                return@get
            }

            call.respond(result)
        }

        get("/info/{uuid}") {
            val uuid = UUID.fromString(call.parameters["uuid"])

            val result = metadataSummaryService.getMetadataInformation(uuid)

            call.respond(result)
        }
    }
}

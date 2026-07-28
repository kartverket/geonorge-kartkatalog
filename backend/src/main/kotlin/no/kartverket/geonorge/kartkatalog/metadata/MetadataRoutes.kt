package no.kartverket.geonorge.kartkatalog.metadata

import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import java.util.UUID

fun Route.metadataRoutes(metadataSummaryService: MetadataSummaryService) {
    route("/metadata/") {
        get("summary/{uuid}") {
            val uuid = UUID.fromString(call.parameters["uuid"])
            val result = metadataSummaryService.getMetadataSummary(uuid)
            call.respond(result)
        }

        get("info/{uuid}") {
            val uuid = UUID.fromString(call.parameters["uuid"])
            val result = metadataSummaryService.getMetadataInformation(uuid)
            call.respond(result)
        }

        get("fair/{uuid}") {
            val uuid = UUID.fromString(call.parameters["uuid"])
            val result = metadataSummaryService.getFairStatus(uuid)
            if (result == null) {
                call.respond(HttpStatusCode.NoContent)
            } else {
                call.respond(result)
            }
        }
    }
}

package no.kartverket.geonorge.kartkatalog.metadata

import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import java.util.UUID

fun Route.metadataRoutes(metadataSummaryService: MetadataSummaryService) {
    route("/metadata/") {
        get("{uuid}") {
            val uuid = UUID.fromString(call.parameters["uuid"])
            val result = metadataSummaryService.getMetadata(uuid)
            call.respond(result)
        }
    }
}

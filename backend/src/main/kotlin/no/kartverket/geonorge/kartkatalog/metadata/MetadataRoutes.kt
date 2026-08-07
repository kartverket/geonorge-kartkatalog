package no.kartverket.geonorge.kartkatalog.metadata

import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route

fun Route.metadataRoutes(
    metadataService: MetadataService,
    linkedDistributionsService: LinkedDistributionsService,
) {
    route("/metadata/") {
        get("{uuid}") {
            val uuid =
                call.parameters["uuid"]?.takeIf {
                    it.isNotBlank()
                }
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing id"))
            val result = metadataService.getMetadata(uuid)
            call.respond(result)
        }
        get("{uuid}/linked-distributions") {
            val uuid =
                call.parameters["uuid"]?.takeIf {
                    it.isNotBlank()
                }
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing id"))
            val result = linkedDistributionsService.getLinkedDistributions(uuid)
            call.respond(result)
        }
    }
}

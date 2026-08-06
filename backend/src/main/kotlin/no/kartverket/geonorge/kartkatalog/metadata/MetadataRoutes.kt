package no.kartverket.geonorge.kartkatalog.metadata

import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route

fun Route.metadataRoutes(metadataService: MetadataService) {
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
    }
    route("/documentation/") {
        get("tegneregler/{uuid}") {
            val uuid =
                call.parameters["uuid"]?.takeIf {
                    it.isNotBlank()
                }
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing id"))
            val notFoundResponse = mapOf("error" to "No tegneregler found for UUID: $uuid")
            val result =
                metadataService.getTegneregler(uuid)
                    ?: return@get call.respond(HttpStatusCode.NotFound, notFoundResponse)
            call.respond(result)
        }
    }
}

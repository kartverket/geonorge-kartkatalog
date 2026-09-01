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
        get("{uuid}/tegneregler") {
            val uuid =
                call.parameters["uuid"]?.takeIf {
                    it.isNotBlank()
                }
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing id"))
            val result = metadataService.getTegneregler(uuid)
            if (result == null) {
                return@get call.respond(
                    HttpStatusCode.NotFound,
                    mapOf("error" to "No tegneregler found for UUID: $uuid"),
                )
            }
            call.respond(result)
        }
        get("{uuid}/produktark") {
            val uuid =
                call.parameters["uuid"]?.takeIf {
                    it.isNotBlank()
                }
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing id"))
            val result = metadataService.getProduktark(uuid)
            if (result == null) {
                return@get call.respond(
                    HttpStatusCode.NotFound,
                    mapOf("error" to "No produktark found for UUID: $uuid"),
                )
            }
            call.respond(result)
        }
        get("{uuid}/produktspesifikasjon") {
            val uuid =
                call.parameters["uuid"]?.takeIf {
                    it.isNotBlank()
                }
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing id"))
            val result = metadataService.getProduktspesifikasjon(uuid)
            if (result == null) {
                return@get call.respond(
                    HttpStatusCode.NotFound,
                    mapOf("error" to "No produktspesifikasjon found for UUID: $uuid"),
                )
            }
            call.respond(result)
        }
    }
}

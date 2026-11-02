package no.kartverket.geonorge.kartkatalog.distribution

import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get

fun Route.distributionsRoutes(distributionsService: DistributionsService) {
    get("/api/distributions/{uuid}") {
        val uuid =
            call.parameters["uuid"]?.takeIf { it.isNotBlank() }
                ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing id"))
        val result =
            distributionsService.getDistributions(uuid)
                ?: return@get call.respond(
                    HttpStatusCode.NotFound,
                    mapOf("error" to "No metadata found for UUID: $uuid"),
                )
        call.respond(result)
    }
}

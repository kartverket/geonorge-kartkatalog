package no.kartverket.geonorge.kartkatalog.distribution

import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.openapi.describe
import io.ktor.server.routing.route

fun Route.distributionsRoutes(distributionsService: DistributionsService) {
    route("/distributions/{uuid}") {
        describe { tag("Distributions") }
        get {
            val uuid =
                call.parameters["uuid"]?.takeIf { it.isNotBlank() }
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing id"))
            call.respond(distributionsService.getDistributions(uuid))
        }
    }
}

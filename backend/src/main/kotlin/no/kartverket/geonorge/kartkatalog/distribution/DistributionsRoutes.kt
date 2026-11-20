package no.kartverket.geonorge.kartkatalog.distribution

import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get

// TODO: er dette et bakoverkompatibelt endepunkt? I så fall legg det inn med den andre legacy-koden
fun Route.distributionsRoutes(distributionsService: DistributionsService) {
    get("/api/distributions/{uuid}") {
        val uuid =
            call.parameters["uuid"]?.takeIf { it.isNotBlank() }
                ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing id"))
        call.respond(distributionsService.getDistributions(uuid))
    }
}

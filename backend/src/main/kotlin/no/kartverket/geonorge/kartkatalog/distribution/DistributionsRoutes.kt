package no.kartverket.geonorge.kartkatalog.distribution

import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import no.kartverket.geonorge.kartkatalog.tagArea

fun Route.distributionsRoutes(distributionsService: DistributionsService) {
    route("/distributions/{uuid}") {
        tagArea("Distributions")

        /**
         * Returns the distributions (downloads and services) for a metadata record.
         *
         * Path: uuid [String] Metadata record UUID.
         * Response: 200 application/json [List<no.kartverket.geonorge.kartkatalog.distribution.Distribution>] The distributions.
         * Response: 400 Missing UUID.
         */
        get {
            val uuid =
                call.parameters["uuid"]?.takeIf { it.isNotBlank() }
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing id"))
            call.respond(distributionsService.getDistributions(uuid))
        }
    }
}

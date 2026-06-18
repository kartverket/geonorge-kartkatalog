package no.kartverket.geonorge.kartkatalog.routes

import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import no.kartverket.geonorge.kartkatalog.client.GeonetworkClient

fun Route.metadataRoutes(geonetworkClient: GeonetworkClient) {
    get("/metadata/{uuid}") {
        val uuid = call.parameters["uuid"]

        if (uuid == null) {
            call.respond(HttpStatusCode.BadRequest, "Missing uuid")
            return@get
        }

        val result = geonetworkClient.getRecordByUuid(uuid)
        if (result == null) {
            call.respond(HttpStatusCode.BadRequest, "Record not found")
            return@get
        }

        call.respond(result)
    }
}

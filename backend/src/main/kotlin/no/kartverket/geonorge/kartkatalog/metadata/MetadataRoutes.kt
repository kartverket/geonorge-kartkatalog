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
        /**
         * Returns the mapped catalog metadata record for a UUID.
         *
         * Path: uuid [String] Metadata record UUID.
         * Response: 200 application/json [no.kartverket.geonorge.kartkatalog.metadata.models.ProductMetadata] The metadata record.
         * Response: 400 Missing UUID.
         * Response: 404 No metadata record exists for this UUID.
         */
        get("{uuid}") {
            val uuid =
                call.parameters["uuid"]?.takeIf {
                    it.isNotBlank()
                }
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing id"))
            val result = metadataService.getMetadata(uuid)
            call.respond(result)
        }
        /**
         * Returns metadata records and services related to the specified record.
         *
         * Path: uuid [String] Metadata record UUID.
         * Response: 200 application/json [no.kartverket.geonorge.kartkatalog.metadata.models.LinkedDistributions] Related records and services.
         * Response: 400 Missing UUID.
         */
        get("{uuid}/linked-distributions") {
            val uuid =
                call.parameters["uuid"]?.takeIf {
                    it.isNotBlank()
                }
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing id"))
            val result = linkedDistributionsService.getLinkedDistributions(uuid)
            call.respond(result)
        }
        /**
         * Returns map styling rules for a metadata record.
         *
         * Path: uuid [String] Metadata record UUID.
         * Response: 200 application/json [no.kartverket.geonorge.kartkatalog.metadata.models.TegnereglerItem] The map styling rules.
         * Response: 400 Missing UUID.
         * Response: 404 No styling rules exist for this UUID.
         */
        get("{uuid}/tegneregler") {
            val uuid =
                call.parameters["uuid"]?.takeIf {
                    it.isNotBlank()
                }
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing id"))
            val result =
                metadataService.getTegneregler(uuid) ?: return@get call.respond(
                    HttpStatusCode.NotFound,
                    mapOf("error" to "No tegneregler found for UUID: $uuid"),
                )
            call.respond(result)
        }
        /**
         * Returns the product sheet for a metadata record.
         *
         * Path: uuid [String] Metadata record UUID.
         * Response: 200 application/json [no.kartverket.geonorge.kartkatalog.metadata.models.ProduktarkItem] The product sheet.
         * Response: 400 Missing UUID.
         * Response: 404 No product sheet exists for this UUID.
         */
        get("{uuid}/produktark") {
            val uuid =
                call.parameters["uuid"]?.takeIf {
                    it.isNotBlank()
                }
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing id"))
            val result =
                metadataService.getProduktark(uuid) ?: return@get call.respond(
                    HttpStatusCode.NotFound,
                    mapOf("error" to "No produktark found for UUID: $uuid"),
                )
            call.respond(result)
        }
        /**
         * Returns the product specification for a metadata record.
         *
         * Path: uuid [String] Metadata record UUID.
         * Response: 200 application/json [no.kartverket.geonorge.kartkatalog.metadata.models.ProduktspesifikasjonItem] The product specification.
         * Response: 400 Missing UUID.
         * Response: 404 No product specification exists for this UUID.
         */
        get("{uuid}/produktspesifikasjon") {
            val uuid =
                call.parameters["uuid"]?.takeIf {
                    it.isNotBlank()
                }
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing id"))
            val result =
                metadataService.getProduktspesifikasjon(uuid) ?: return@get call.respond(
                    HttpStatusCode.NotFound,
                    mapOf("error" to "No produktspesifikasjon found for UUID: $uuid"),
                )
            call.respond(result)
        }
    }
}

package no.kartverket.geonorge.kartkatalog.metadata

import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.response.respondText
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import kotlinx.serialization.json.Json
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyMetadataViewModel
import org.slf4j.LoggerFactory
import kotlin.coroutines.cancellation.CancellationException

private val log = LoggerFactory.getLogger("MetadataRoutes")

fun Route.metadataRoutes(
    metadataService: MetadataService,
    linkedDistributionsService: LinkedDistributionsService,
) {
    route("/api") {
        get("getdata/{uuid}") {
            val uuid = call.parameters["uuid"] ?: return@get call.respond(HttpStatusCode.NotFound)
            try {
                call.respondText(
                    legacyJson.encodeToString(
                        LegacyMetadataViewModel.serializer(),
                        metadataService.getLegacyMetadata(uuid),
                    ),
                    ContentType.Application.Json,
                )
            } catch (cause: CancellationException) {
                throw cause
            } catch (cause: MetadataRecordNotFoundException) {
                log.warn("Metadata record not found for getdata UUID: {}", uuid, cause)
                call.respond(HttpStatusCode.NotFound)
            } catch (cause: Exception) {
                log.error("Failed to fetch getdata for UUID: {}", uuid, cause)
                call.respond(HttpStatusCode.InternalServerError)
            }
        }
    }
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

private val legacyJson =
    Json {
        encodeDefaults = true
        explicitNulls = false
    }

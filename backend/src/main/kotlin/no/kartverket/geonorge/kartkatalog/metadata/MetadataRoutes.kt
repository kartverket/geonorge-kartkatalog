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
            val result =
                metadataService.getTegneregler(uuid) ?: return@get call.respond(
                    HttpStatusCode.NotFound,
                    mapOf("error" to "No tegneregler found for UUID: $uuid"),
                )
            call.respond(result)
        }
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

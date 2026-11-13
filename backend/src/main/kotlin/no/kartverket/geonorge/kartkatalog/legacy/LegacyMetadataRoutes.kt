package no.kartverket.geonorge.kartkatalog.legacy

import io.ktor.http.HttpStatusCode
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import kotlinx.coroutines.CancellationException
import no.kartverket.geonorge.kartkatalog.search.applyLanguageHeaders
import no.kartverket.geonorge.kartkatalog.search.resolveSearchLanguage
import no.kartverket.geonorge.kartkatalog.search.respondSearchJson
import org.slf4j.LoggerFactory

fun Route.legacyMetadataRoutes(legacyMetadataService: LegacyMetadataService) {
    /**
     * Legacy-compatible metadata lookup (used by Register, ApiServices, Produktark, Rapportgenerator,
     * Kartografi, MetadataEditor and the download client). Returns a PascalCase subset of the legacy
     * metadata view model; null fields are omitted.
     *
     * Path: uuid [String] Metadata uuid.
     * Query: lang [String] Response language, en or Norwegian (no, nb, nn).
     * Header: Accept-Language [String] Language preference used when lang is not supplied.
     * Cookie: _culture [String] Remembered response language.
     * Response: 200 application/json The metadata.
     * Response: 404 The metadata was not found.
     * Response: 500 The lookup failed.
     */
    get("/api/getdata/{uuid}") {
        val uuid = call.parameters["uuid"].orEmpty()
        val language = call.resolveSearchLanguage()
        call.applyLanguageHeaders(language)
        try {
            val data = legacyMetadataService.getData(uuid, language)
            if (data == null) {
                call.respondSearchJson(mapOf("error" to "Record not found"), HttpStatusCode.NotFound)
            } else {
                call.respondSearchJson(data)
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            LoggerFactory.getLogger("LegacyMetadataRoutes").error("Legacy-compatible getdata failed", e)
            call.respondSearchJson(
                mapOf("error" to "An error occurred while fetching metadata"),
                HttpStatusCode.InternalServerError,
            )
        }
    }
}

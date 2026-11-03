package no.kartverket.geonorge.kartkatalog.search

import io.ktor.http.Cookie
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import kotlinx.coroutines.CancellationException
import org.slf4j.LoggerFactory

fun Route.legacySearchRoutes(service: LegacySearchService) {
    /**
     * Legacy-compatible catalog search. Returns the legacy Kartkatalog response contract as JSON or CSV.
     *
     * Query: text [String] Text to search for.
     * Query: limit [Int] Maximum number of results (default 10; clamped to 1-1000).
     * Query: offset [Int] One-based result offset (default 1).
     * Query: orderby [String] Sort order (score, title, title_desc, organization, organization_desc, newest, updated, popularMetadata).
     * Query: listhidden [Boolean] Include hidden metadata (default false).
     * Query: facets[0]name [String] Facet field for indexed facet 0. Increment the index for each additional facet.
     * Query: facets[0]value [String] Facet value for indexed facet 0. Increment the index for each additional facet.
     * Query: mediatype [String] Select csv or a CSV media type; overrides Accept.
     * Query: lang [String] Response language, en or Norwegian (no, nb, nn).
     * Header: Accept-Language [String] Language preference used when lang is not supplied.
     * Header: Accept [String] Request text/csv or application/csv to receive a CSV export.
     * Cookie: _culture [String] Remembered response language.
     * Response: 200 text/csv [String] Search results as CSV.
     * Response: 200 application/json Legacy search results as JSON, or CSV when requested.
     * Response: 500 The legacy search request failed.
     */
    get("/search") {
        val params = call.request.queryParameters
        val language = call.resolveSearchLanguage()
        call.response.headers.append(HttpHeaders.ContentLanguage, language)
        val csvContentType = call.resolveSearchCsvContentType()
        if (!params["lang"].isNullOrBlank() || call.request.cookies["_culture"] == null) {
            call.response.cookies.append(
                Cookie(
                    name = "_culture",
                    value = language,
                    path = "/",
                    maxAge =
                        365 * 24 * 60 * 60,
                ),
            )
        }
        val request = LegacySearchRequest.fromQuery(params)
        try {
            if (csvContentType != null) {
                call.respondSearchCsv(service.searchHits(request, language), language, csvContentType)
            } else {
                call.respondSearchJson(service.search(request, language))
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            // The legacy controller returns a 500 rather than an upstream error for failures after querying Solr.
            LoggerFactory.getLogger("LegacySearchRoutes").error("Legacy-compatible search failed", e)
            call.respondSearchJson(
                mapOf(
                    "error" to "An error occurred while processing your search request",
                ),
                HttpStatusCode.InternalServerError,
            )
        }
    }
}

package no.kartverket.geonorge.kartkatalog.search

import io.ktor.http.Cookie
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respondText
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import kotlinx.coroutines.CancellationException
import org.slf4j.LoggerFactory

fun Route.legacySearchRoutes(service: LegacySearchService) {
    /**
     * Legacy-compatible catalog search. Returns the legacy Kartkatalog response contract as JSON or CSV.
     *
     * Query: text [String] Text to search for.
     * Query: limit [Int] Maximum number of results (default 10; clamped to at least 1).
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

    /**
     * Legacy-compatible simple dataset list (used by MetadataEditor). Returns up to 1000 Norwegian-profile
     * ISO19115 datasets from the metadata core as legacy search JSON. Only organization is honoured.
     *
     * Query: organization [String] Optional organization filter; also adds the organization facet to the response.
     * Query: lang [String] Response language, en or Norwegian; takes precedence over the _culture cookie.
     * Header: Accept-Language [String] Language preference used when neither lang nor _culture is supplied.
     * Cookie: _culture [String] Remembered response language.
     * Response: 200 application/json Legacy search results as JSON.
     * Response: 204 The request failed (legacy returns no body on errors).
     */
    get("/api/datasets-simple") {
        val language = call.resolveSearchLanguage()
        call.response.headers.append(HttpHeaders.ContentLanguage, language)
        call.response.headers.append(HttpHeaders.Vary, "Accept-Language, Cookie")
        if (!call.request.queryParameters["lang"].isNullOrBlank() || call.request.cookies["_culture"] == null) {
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
        try {
            call.respondSearchJson(service.simpleSearch(call.request.queryParameters["organization"], language))
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            LoggerFactory.getLogger("LegacySearchRoutes").error("datasets-simple failed", e)
            // Legacy returns null on any error, which ASP.NET Core serialises as 204 No Content.
            call.respondText("", status = HttpStatusCode.NoContent)
        }
    }

    /**
     * Legacy-compatible check of whether a dataset name (resourceReferenceCodeName) is already used by another
     * metadata record (used by MetadataEditor). The name is unique across namespaces.
     *
     * Query: datasetName [String] The dataset name to check. If missing, nothing can match and IsValid is true.
     * Query: uuid [String] The record being edited; excluded from the check. If missing, IsValid is false.
     * Query: namespace [String] Currently ignored, as in legacy.
     * Response: 200 application/json IsValid, and Result (the conflicting uuid, or an error message when IsValid=false).
     */
    get("/api/valid-dataset-name") {
        // TODO: namespace is accepted but ignored (legacy also ignores it). To scope uniqueness to a namespace,
        //  read it here and add resourceReferenceCodespace to the query in SolrClient.findUuidByDatasetName.
        val params = call.request.queryParameters
        call.respondSearchJson(service.validDatasetName(params["datasetName"], params["uuid"]))
    }
}

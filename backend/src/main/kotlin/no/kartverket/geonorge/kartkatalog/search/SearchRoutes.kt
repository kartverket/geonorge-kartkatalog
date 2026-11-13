package no.kartverket.geonorge.kartkatalog.search

import io.ktor.http.HttpHeaders
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.openapi.describe
import io.ktor.server.routing.route

fun Route.searchRoutes(searchService: SearchService) {
    route("/search") {
        describe { tag("Search") }

        /**
         * Searches the catalog. Returns JSON by default; CSV can be selected through Accept or mediatype.
         *
         * Query: text [String] Text to search for. The q parameter is accepted as an alias.
         * Query: q [String] Alias for text.
         * Query: limit [Int] Maximum number of results (default 10; clamped to 1-1000).
         * Query: offset [Int] One-based result offset (default 1).
         * Query: orderby [String] Sort order (score, title, title_desc, organization, organization_desc, newest, updated, popularMetadata).
         * Query: listhidden [Boolean] Include hidden metadata (default false).
         * Query: facets[0]name [String] Facet field for indexed facet 0. Increment the index for each additional facet.
         * Query: facets[0]value [String] Facet value for indexed facet 0. Increment the index for each additional facet.
         * Query: mediatype [String] Select csv or a CSV media type; overrides Accept.
         * Query: lang [String] CSV response language, en or Norwegian (no, nb, nn). JSON always uses Norwegian.
         * Header: Accept-Language [String] CSV language preference used when neither lang nor _culture selects a supported language.
         * Cookie: _culture [String] Remembered CSV response language, used when lang does not select a supported language.
         * Header: Accept [String] Request text/csv or application/csv to receive a CSV export.
         * Response: 200 text/csv [String] Search results as CSV.
         * Response: 200 application/json [SearchResponse] Search results as JSON, or CSV when requested.
         * Response: 502 The upstream search service failed.
         */
        get {
            val request =
                SearchRequest(
                    text = call.request.queryParameters["text"] ?: call.request.queryParameters["q"],
                    limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 10,
                    offset = call.request.queryParameters["offset"]?.toIntOrNull() ?: 1,
                    orderBy = call.request.queryParameters["orderby"] ?: "score",
                    listHidden = call.request.queryParameters["listhidden"]?.toBooleanStrictOrNull() ?: false,
                    facets = call.request.queryParameters.toFacetInputs(),
                )
            val csvContentType = call.resolveSearchCsvContentType()
            if (csvContentType != null) {
                val language = call.resolveSearchLanguage()
                call.response.headers.append(HttpHeaders.ContentLanguage, language)
                call.respondSearchCsv(
                    searchService.searchHits(request, language == "en"),
                    language,
                    csvContentType,
                )
            } else {
                call.respondSearchJson(searchService.search(request))
            }
        }
    }
}

private fun io.ktor.http.Parameters.toFacetInputs(): List<SearchFacetInput> {
    val facetIndices =
        names()
            .mapNotNull { key ->
                Regex("""facets\[(\d+)]name""")
                    .matchEntire(key)
                    ?.groupValues
                    ?.get(1)
                    ?.toIntOrNull()
            }.distinct()
            .sorted()

    return facetIndices.mapNotNull { index ->
        val name = this["facets[$index]name"]?.trim().orEmpty()
        val value = this["facets[$index]value"]?.trim().orEmpty()
        if (name.isBlank() || value.isBlank()) null else SearchFacetInput(name = name, value = value)
    }
}

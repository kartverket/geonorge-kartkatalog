package no.kartverket.geonorge.kartkatalog.search

import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route

fun Route.searchRoutes(searchService: SearchService) {
    route("/api") {
        get("/search") {
            val request =
                SearchRequest(
                    text = call.request.queryParameters["text"] ?: call.request.queryParameters["q"],
                    limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 10,
                    offset = call.request.queryParameters["offset"]?.toIntOrNull() ?: 1,
                    orderBy = call.request.queryParameters["orderby"] ?: "score",
                    listHidden = call.request.queryParameters["listhidden"]?.toBooleanStrictOrNull() ?: false,
                    facets = call.request.queryParameters.toFacetInputs(),
                )
            call.respond(searchService.search(request))
        }
    }
}

private fun io.ktor.http.Parameters.toFacetInputs(): List<SearchFacetInput> {
    val facetIndices =
        names()
            .mapNotNull { key ->
                Regex("""facets\[(\d+)]name""").matchEntire(key)?.groupValues?.get(1)?.toIntOrNull()
            }
            .distinct()
            .sorted()

    return facetIndices.mapNotNull { index ->
        val name = this["facets[$index]name"]?.trim().orEmpty()
        val value = this["facets[$index]value"]?.trim().orEmpty()
        if (name.isBlank() || value.isBlank()) null else SearchFacetInput(name = name, value = value)
    }
}

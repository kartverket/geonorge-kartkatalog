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
                )
            call.respond(searchService.search(request))
        }
    }
}


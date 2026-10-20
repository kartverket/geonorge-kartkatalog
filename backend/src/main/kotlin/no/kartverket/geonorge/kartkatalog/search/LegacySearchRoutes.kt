package no.kartverket.geonorge.kartkatalog.search

import io.ktor.http.Cookie
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import kotlinx.coroutines.CancellationException
import org.slf4j.LoggerFactory

fun Route.legacySearchRoutes(service: LegacySearchService) {
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

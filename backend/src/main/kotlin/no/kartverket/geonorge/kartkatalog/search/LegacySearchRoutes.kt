package no.kartverket.geonorge.kartkatalog.search

import io.ktor.http.Cookie
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import kotlinx.coroutines.CancellationException
import kotlinx.serialization.json.JsonObject
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrException
import no.kartverket.geonorge.kartkatalog.metadata.TimedCache
import org.slf4j.LoggerFactory

class LegacySearchService(
    private val engine: SearchEngine,
    private val registerClient: RegisterClient,
    private val kartkatalogUrl: String,
) {
    private val log = LoggerFactory.getLogger(LegacySearchService::class.java)
    private val areasCache = TimedCache<String, Map<String, String>>(12 * 60 * 60 * 1000L)

    internal suspend fun searchHits(
        request: LegacySearchRequest,
        language: String,
    ): SearchHits =
        try {
            engine.search(LegacySearchQuery.build(request), language == "en")
        } catch (e: CancellationException) {
            throw e
        } catch (e: SolrException) {
            // SearchServiceAll returns an empty result (HTTP 200) for Solr failures.
            log.warn("Legacy-compatible Solr search failed", e)
            SearchHits.Empty
        }

    internal suspend fun search(
        request: LegacySearchRequest,
        language: String,
    ): JsonObject {
        val hits = searchHits(request, language)
        // The legacy controller fetches municipality and county names even for empty searches.
        val areas = areasCache.getOrFetch("areas") {
            listOf("fylkesnummer", "kommunenummer").flatMap { list ->
                registerClient.getSosiCodeList("inndelinger/inndelingsbase/$list").containedItems.mapNotNull { item ->
                    val code = item.codeValue?.takeIf { it.isNotBlank() && item.status == "Gyldig" } ?: return@mapNotNull null
                    val key = if (list == "fylkesnummer") "0/$code" else "0/${code.take(2)}/$code"
                    key to (item.description ?: item.label).substringBefore(" – ").trim()
                }
            }.toMap()
        }.orEmpty()
        return LegacySearchResponse(language, kartkatalogUrl, areas).build(request, hits)
    }
}

fun Route.legacySearchRoutes(service: LegacySearchService) {
    get("/search") {
        val params = call.request.queryParameters
        val language = searchLanguage(params["lang"], call.request.cookies["_culture"], call.request.headers[HttpHeaders.AcceptLanguage])
        call.response.headers.append(HttpHeaders.ContentLanguage, language)
        if (params["lang"] != null || call.request.cookies["_culture"] == null) {
            call.response.cookies.append(Cookie(name = "_culture", value = language, path = "/", maxAge = 365 * 24 * 60 * 60))
        }
        val request = LegacySearchRequest.fromQuery(params)
        val csv = params.wantsSearchCsv(call.request.headers[HttpHeaders.Accept])
        try {
            if (csv) {
                call.respondSearchCsv(service.searchHits(request, language), language)
            } else {
                call.respond(service.search(request, language))
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            // The legacy controller returns a 500 rather than an upstream error for failures after querying Solr.
            LoggerFactory.getLogger("LegacySearchRoutes").error("Legacy-compatible search failed", e)
            call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "An error occurred while processing your search request"))
        }
    }
}







package no.kartverket.geonorge.kartkatalog.search

import io.ktor.http.HttpHeaders
import io.ktor.server.application.ApplicationCall

private val englishCultures =
    setOf(
        "en",
        "en-au",
        "en-bz",
        "en-ca",
        "en-029",
        "en-in",
        "en-ie",
        "en-jm",
        "en-my",
        "en-nz",
        "en-ph",
        "en-sg",
        "en-za",
        "en-tt",
        "en-gb",
        "en-us",
        "en-zw",
    )

// Mirrors the legacy CultureMiddleware: ?lang wins over the _culture cookie, and only without
// either is the raw Accept-Language header used. The header is matched as one whole culture
// name, so a browser value like "en-US,en;q=0.9" falls back to Norwegian, as in legacy.
internal fun ApplicationCall.resolveLegacyCultureLanguage(): String {
    val lang = request.queryParameters["lang"]
    val cookie = if (lang.isNullOrEmpty()) request.cookies["_culture"] else null
    val name =
        when {
            !lang.isNullOrEmpty() -> lang
            cookie != null -> cookie
            else -> request.headers[HttpHeaders.AcceptLanguage].orEmpty()
        }
    return if (name.lowercase() in englishCultures) "en" else "no"
}

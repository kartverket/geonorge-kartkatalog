package no.kartverket.geonorge.kartkatalog.search

import io.ktor.http.Cookie
import io.ktor.http.HttpHeaders
import io.ktor.http.parseHeaderValue
import io.ktor.server.application.ApplicationCall

internal const val CULTURE_COOKIE = "_culture"
private const val CULTURE_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60
private val languageTag = Regex("""^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*$""")

internal fun searchLanguage(
    lang: String?,
    cookie: String?,
    acceptLanguage: String?,
): String {
    // An unsupported lang/cookie value falls through to the next priority instead of forcing Norwegian.
    listOf(lang, cookie)
        .firstNotNullOfOrNull { it?.trim()?.takeIf(String::isNotEmpty)?.let(::supportedLanguage) }
        ?.let { return it }

    return parseHeaderValue(acceptLanguage)
        .mapNotNull { preference ->
            val quality = preference.validQuality()?.takeIf { it > 0.0 } ?: return@mapNotNull null
            supportedLanguage(preference.value)?.let { it to quality }
        }.maxByOrNull { it.second }
        ?.first ?: "no"
}

// Shared by /api/search, /search and the legacy-compatible endpoints: resolves the request's language
// using the same lang/cookie/Accept-Language priority.
internal fun ApplicationCall.resolveSearchLanguage(): String =
    searchLanguage(
        request.queryParameters["lang"],
        request.cookies[CULTURE_COOKIE],
        request.headers[HttpHeaders.AcceptLanguage],
    )

// Sets Content-Language and remembers the language in the _culture cookie when lang is given or no cookie exists.
// Callers set Vary themselves because it depends on what else the endpoint negotiates.
internal fun ApplicationCall.applyLanguageHeaders(language: String) {
    response.headers.append(HttpHeaders.ContentLanguage, language)
    if (!request.queryParameters["lang"].isNullOrBlank() || request.cookies[CULTURE_COOKIE] == null) {
        response.cookies.append(
            Cookie(name = CULTURE_COOKIE, value = language, path = "/", maxAge = CULTURE_COOKIE_MAX_AGE_SECONDS),
        )
    }
}

private fun supportedLanguage(tag: String): String? {
    if (!languageTag.matches(tag)) return null
    return when (tag.substringBefore('-').lowercase()) {
        "en" -> "en"
        "no", "nb", "nn" -> "no"
        else -> null
    }
}

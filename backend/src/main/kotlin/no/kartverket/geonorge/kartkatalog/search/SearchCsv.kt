package no.kartverket.geonorge.kartkatalog.search

import io.ktor.http.ContentType
import io.ktor.http.HeaderValue
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.Parameters
import io.ktor.http.parseHeaderValue
import io.ktor.server.application.ApplicationCall
import io.ktor.server.response.respondText
import no.kartverket.geonorge.kartkatalog.config.searchJson

private val textCsv = ContentType.parse("text/csv")
private val applicationCsv = ContentType.parse("application/csv")
private val languageTag = Regex("""^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*$""")

internal fun searchLanguage(
    lang: String?,
    cookie: String?,
    acceptLanguage: String?,
): String {
    // An unsupported lang/cookie value falls through to the next priority instead of forcing Norwegian.
    lang
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let(::supportedLanguage)
        ?.let { return it }
    cookie
        ?.trim()
        ?.takeIf { it.isNotEmpty() }
        ?.let(::supportedLanguage)
        ?.let { return it }

    return parseHeaderValue(acceptLanguage)
        .mapNotNull { preference ->
            val quality = preference.validQuality()?.takeIf { it > 0.0 } ?: return@mapNotNull null
            supportedLanguage(preference.value)?.let { it to quality }
        }.maxByOrNull { it.second }
        ?.first ?: "no"
}

// Shared by both /api/search and /search: resolves the request's language using the
// same lang/cookie/Accept-Language priority.
internal fun ApplicationCall.resolveSearchLanguage(): String =
    searchLanguage(
        request.queryParameters["lang"],
        request.cookies["_culture"],
        request.headers[HttpHeaders.AcceptLanguage],
    )

// Marks the response as varying on the headers search negotiation depends on, and
// resolves the CSV content type (if any) the same way for both search routes.
internal fun ApplicationCall.resolveSearchCsvContentType(): ContentType? {
    response.headers.append(HttpHeaders.Vary, "Accept, Accept-Language, Cookie")
    return request.queryParameters.searchCsvContentType(request.headers[HttpHeaders.Accept])
}

// Serializes with the app's configured Json settings directly, bypassing Ktor's Accept-based
// ContentNegotiation. Both search routes already resolve CSV vs. JSON themselves (honoring an
// explicit ?mediatype= override); negotiating again from the raw Accept header here could pick no
// converter at all (e.g. mediatype=json with Accept: text/csv) instead of respecting that decision.
internal suspend inline fun <reified T : Any> ApplicationCall.respondSearchJson(
    message: T,
    status: HttpStatusCode = HttpStatusCode.OK,
) {
    respondText(searchJson.encodeToString(message), ContentType.Application.Json, status)
}

private fun supportedLanguage(tag: String): String? {
    if (!languageTag.matches(tag)) return null
    return when (tag.substringBefore('-').lowercase()) {
        "en" -> "en"
        "no", "nb", "nn" -> "no"
        else -> null
    }
}

private fun HeaderValue.validQuality(): Double? {
    val quality = params.firstOrNull { it.name.equals("q", ignoreCase = true) } ?: return 1.0
    return quality.value.toDoubleOrNull()?.takeIf { it in 0.0..1.0 }
}

private data class MediaPreference(
    val type: ContentType,
    val quality: Double,
) {
    fun specificity(): Int = (if (type.contentType == "*") 0 else 1) + (if (type.contentSubtype == "*") 0 else 1)
}

internal fun Parameters.searchCsvContentType(accept: String?): ContentType? {
    this["mediatype"]?.trim()?.takeIf { it.isNotEmpty() }?.let { explicit ->
        if (explicit.equals("csv", ignoreCase = true)) return textCsv
        return when (runCatching { ContentType.parse(explicit).withoutParameters() }.getOrNull()) {
            textCsv -> textCsv
            applicationCsv -> applicationCsv
            else -> null
        }
    }

    val accepted =
        parseHeaderValue(accept).mapNotNull { value ->
            val quality = value.validQuality() ?: return@mapNotNull null
            val type = runCatching { ContentType.parse(value.value) }.getOrNull() ?: return@mapNotNull null
            MediaPreference(type, quality)
        }

    // The most specific Accept entry matching a type wins; ties break on quality.
    fun qualityFor(type: ContentType): Double =
        accepted
            .filter { type.match(it.type) }
            .maxWithOrNull(compareBy<MediaPreference> { it.specificity() }.thenBy { it.quality })
            ?.quality ?: 0.0

    val jsonQuality = qualityFor(ContentType.Application.Json)
    val best =
        listOf(textCsv, applicationCsv)
            .filter { type -> accepted.any { it.quality > 0.0 && it.type == type } }
            .map { it to qualityFor(it) }
            .maxByOrNull { it.second }
    return best?.takeIf { (_, quality) -> quality > 0.0 && quality >= jsonQuality }?.first
}

internal suspend fun ApplicationCall.respondSearchCsv(
    hits: SearchHits,
    language: String,
    contentType: ContentType,
) {
    response.headers.append(HttpHeaders.ContentDisposition, "attachment; filename=kartkatalogen.csv")
    respondText(SearchCsv.render(hits, language), contentType.withParameter("charset", "utf-8"))
}

internal object SearchCsv {
    fun render(
        hits: SearchHits,
        language: String,
    ): String {
        // CsvFormatter writes no header for a SearchResult without Type == "search".
        if (hits.documents.isEmpty()) return ""
        val english = language == "en"
        val headers =
            listOf(
                if (english) "Title" else "Tittel",
                "Type",
                if (english) "Topic" else "Tema",
                if (english) "Organization" else "Organisasjon",
                if (english) "Open data" else "Åpne data",
                "DOK-data",
                "Uuid",
                "Wms-url",
                "Wfs-url",
                "Atom-feed",
                if (english) "Spatial scope" else "Dekningsområde",
                if (english) "Distribution form" else "Distribusjonsform",
                if (english) "Distribusjons url" else "Distribusjons-url",
            )
        return buildString {
            appendLine(headers.joinToString(";"))
            hits.documents.forEach { hit ->
                appendLine(
                    listOf(
                        hit.title.orEmpty(),
                        hit.type.orEmpty(),
                        hit.theme.orEmpty(),
                        hit.organizationgroup.orEmpty(),
                        hit.dataaccess?.let { if (english && it == "Åpne data") "Open data" else it }.orEmpty(),
                        if (hit.nationalinitiative.orEmpty().contains(
                                "Det offentlige kartgrunnlaget",
                            )
                        ) {
                            "Det offentlige kartgrunnlaget"
                        } else {
                            ""
                        },
                        hit.uuid,
                        hit.serviceDistributionUrlForDataset.orEmpty(),
                        hit.datasetservice
                            .orEmpty()
                            .map { it.split('|') }
                            .filter {
                                it.getOrNull(6) == "OGC:WFS" &&
                                    it.size > 7
                            }.lastOrNull()
                            ?.get(7)
                            .orEmpty(),
                        atomFeed(hit.distributions),
                        hit.spatialscope?.firstOrNull().orEmpty(),
                        hit.distributionProtocol.orEmpty(),
                        hit.distributionUrl.orEmpty(),
                    ).joinToString(";") { escape(it) },
                )
            }
        }
    }

    private fun atomFeed(distributions: List<String>?): String {
        var fallback = ""
        distributions.orEmpty().forEach { entry ->
            val parts = entry.split('|')
            if (parts.size >= 3 && parts[1] == "W3C:AtomFeed" && parts[2].isNotEmpty()) {
                if (entry.contains("gml", true) || entry.contains("sosi", true)) {
                    return parts[2]
                }
                fallback = parts[2]
            }
        }
        return fallback
    }

    // Spreadsheet apps (Excel, Sheets, LibreOffice, ...) evaluate a cell as a formula when it starts
    // with one of these characters, even after leading whitespace. A title/value sourced from metadata
    // could otherwise execute as a formula ("CSV injection") when the export is opened in a spreadsheet.
    private val formulaPrefixes = charArrayOf('=', '+', '-', '@')

    private fun neutralizeFormula(value: String): String {
        val firstSignificant = value.indexOfFirst { it != ' ' && it != '\t' }
        return if (firstSignificant >= 0 && value[firstSignificant] in formulaPrefixes) "'$value" else value
    }

    private fun escape(value: String): String {
        val normalized = neutralizeFormula(value.replace("\r\n", " ").replace('\n', ' ').replace('\r', ' '))
        return if (normalized.any { it == ';' || it == '"' }) "\"${normalized.replace("\"", "\"\"")}\"" else normalized
    }
}

package no.kartverket.geonorge.kartkatalog.search

import io.ktor.http.ContentType
import io.ktor.http.HeaderValue
import io.ktor.http.HttpHeaders
import io.ktor.http.Parameters
import io.ktor.http.parseHeaderValue
import io.ktor.server.application.ApplicationCall
import io.ktor.server.response.respondText

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

    fun qualityFor(type: ContentType): Double =
        accepted
            .filter { type.match(it.type) }
            .maxWithOrNull(compareBy<MediaPreference> { it.specificity() }.thenBy { it.quality })
            ?.quality ?: 0.0

    val jsonQuality = qualityFor(ContentType.Application.Json)
    val csvType =
        listOf(textCsv, applicationCsv)
            .filter { type -> accepted.any { it.quality > 0.0 && it.type == type } }
            .maxByOrNull(::qualityFor)
    return csvType?.takeIf { qualityFor(it) > 0.0 && qualityFor(it) >= jsonQuality }
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

    private fun escape(value: String): String {
        val normalized = value.replace("\r\n", " ").replace('\n', ' ').replace('\r', ' ')
        return if (normalized.any { it == ';' || it == '"' }) "\"${normalized.replace("\"", "\"\"")}\"" else normalized
    }
}

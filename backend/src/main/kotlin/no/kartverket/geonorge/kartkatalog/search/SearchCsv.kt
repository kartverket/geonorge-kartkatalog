package no.kartverket.geonorge.kartkatalog.search

import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.Parameters
import io.ktor.server.application.ApplicationCall
import io.ktor.server.response.respondText

internal fun searchLanguage(
    lang: String?,
    cookie: String?,
    acceptLanguage: String?,
): String {
    val preferred =
        lang?.takeIf { it.isNotBlank() }
            ?: cookie?.takeIf { it.isNotBlank() }
            ?: acceptLanguage?.takeIf { it.isNotBlank() }
            ?: return "no"
    return if (preferred.trim().startsWith("en", ignoreCase = true)) "en" else "no"
}

internal fun Parameters.wantsSearchCsv(accept: String?): Boolean =
    this["mediatype"]?.let { value ->
        value.equals("csv", true) || value.equals("text/csv", true) || value.equals("application/csv", true)
    } ?: (accept?.contains("text/csv", true) == true || accept?.contains("application/csv", true) == true)

internal suspend fun ApplicationCall.respondSearchCsv(
    hits: SearchHits,
    language: String,
) {
    response.headers.append(HttpHeaders.ContentDisposition, "attachment; filename=kartkatalogen.csv")
    respondText(SearchCsv.render(hits, language), ContentType.parse("text/csv; charset=utf-8"))
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

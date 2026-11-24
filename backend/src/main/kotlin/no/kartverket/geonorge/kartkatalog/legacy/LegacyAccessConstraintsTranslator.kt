package no.kartverket.geonorge.kartkatalog.legacy

import no.kartverket.geonorge.kartkatalog.integrations.register.CodeList
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterCodeListItem
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterCodeListResponse
import no.kartverket.geonorge.kartkatalog.metadata.TimedCache
import org.slf4j.LoggerFactory
import kotlin.coroutines.cancellation.CancellationException

/**
 * Port of legacy `RegisterFetcher.GetRestriction`: translates access constraints via the restriction
 * code list, then lets the INSPIRE access-restriction list override a few well-known values.
 */
internal class LegacyAccessConstraintsTranslator(
    private val registerClient: RegisterClient,
) {
    private val log = LoggerFactory.getLogger(LegacyAccessConstraintsTranslator::class.java)
    private val cache =
        TimedCache<Pair<String, String>, List<RegisterCodeListItem>>(
            "legacy_access_constraints",
            12 * 60 * 60 * 1000L,
        )

    suspend fun translate(
        accessConstraints: String?,
        otherConstraintsAccess: String?,
        language: String,
    ): String? {
        val restrictions = items(RESTRICTIONS_KEY, language) { registerClient.getCodeList(CodeList.RESTRICTIONS, it) }
        val inspire = items(INSPIRE_KEY, language) { registerClient.getCodeListByName(INSPIRE_KEY, it) }

        var value = accessConstraints
        restrictions.firstOrNull { it.codeValue == value }?.let { value = it.label }

        if (value == "restricted") value = inspire.labelOf("INSPIRE_Directive_Article13_1b") ?: value
        if (value == "no restrictions" || otherConstraintsAccess == "no restrictions") {
            value = inspire.labelOf("noLimitations") ?: value
        } else if (value == "norway digital restricted" || otherConstraintsAccess == "norway digital restricted") {
            value = inspire.labelOf("INSPIRE_Directive_Article13_1d") ?: value
        }
        return value
    }

    // The register has duplicate Article13_1b entries; like legacy, the first one (the short label) wins.
    private fun List<RegisterCodeListItem>.labelOf(code: String): String? =
        firstOrNull { it.codeValue?.substringAfterLast('/') == code }?.label

    private suspend fun items(
        key: String,
        language: String,
        fetch: suspend (String) -> RegisterCodeListResponse,
    ): List<RegisterCodeListItem> =
        load(key, language, fetch)
            ?: (if (language != "no") load(key, "no", fetch) else null)
            ?: emptyList()

    private suspend fun load(
        key: String,
        language: String,
        fetch: suspend (String) -> RegisterCodeListResponse,
    ): List<RegisterCodeListItem>? =
        cache.getOrFetch(key to language) {
            try {
                fetch(language).containedItems
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                log.warn("Failed to fetch code list {} ({})", key, language, e)
                null
            }
        }

    companion object {
        private const val RESTRICTIONS_KEY = "restrictions"
        private const val INSPIRE_KEY = "inspire-tilgangsrestriksjoner"
    }
}

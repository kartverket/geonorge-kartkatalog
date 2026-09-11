package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import org.slf4j.LoggerFactory
import kotlin.coroutines.cancellation.CancellationException

class AreaResolver(
    private val registerClient: RegisterClient,
) {
    private val log = LoggerFactory.getLogger(AreaResolver::class.java)
    private val cache = TimedCache<String, Map<String, String>>(ttlMillis = 24 * 60 * 60 * 1000)

    suspend fun getFylkeNames(): Map<String, String>? =
        cache.getOrFetch("fylkesnummer") {
            try {
                registerClient
                    .getSosiCodeList("inndelinger/inndelingsbase/fylkesnummer")
                    .containedItems
                    .filter { it.status == "Gyldig" && !it.codeValue.isNullOrBlank() }
                    .associate { "0/${it.codeValue}" to removeSamiTranslation(it.label) }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                log.warn("Failed to fetch fylkesnummer code list", e)
                null
            }
        }

    private fun removeSamiTranslation(name: String): String = name.substringBefore(" – ").trim()
}

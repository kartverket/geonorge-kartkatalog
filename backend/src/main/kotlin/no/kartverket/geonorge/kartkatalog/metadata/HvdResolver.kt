package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import org.slf4j.LoggerFactory
import kotlin.coroutines.cancellation.CancellationException

class HvdResolver(
    private val registerClient: RegisterClient,
) {
    private val log = LoggerFactory.getLogger(HvdResolver::class.java)
    private val cache = TimedCache<String, Set<String>>(ttlMillis = 24 * 60 * 60 * 1000)

    suspend fun getCategories(): Set<String>? =
        cache.getOrFetch("hvd-kategorier") {
            try {
                registerClient
                    .getCodeListByName("hvd-kategorier")
                    .containedItems
                    .filter { it.status == "Gyldig" }
                    .map { it.label }
                    .toSet()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                log.warn("Failed to fetch hvd-kategorier code list", e)
                null
            }
        }
}

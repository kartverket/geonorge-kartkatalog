package no.kartverket.geonorge.kartkatalog.download

import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.metadata.TimedCache
import org.slf4j.LoggerFactory
import kotlin.coroutines.cancellation.CancellationException

class DownloadInsightGroupsResolver (
    private val registerClient: RegisterClient,
){
    private val log = LoggerFactory.getLogger(DownloadInsightGroupsResolver::class.java)
    private val cache = TimedCache<String, Set<String>>(ttlMillis = 24 * 60 * 60 * 1000)

    suspend fun getValues(term: String): Set<String>? =        cache.getOrFetch(term) {
        try {
            registerClient
                .getCodeListByName(term)
                .containedItems
                .filter { it.status == "Gyldig" }
                .map { it.label }
                .toSet()
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            log.warn("Failed to fetch code list for term: $term", e)
            null
        }
    }

}

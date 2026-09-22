package no.kartverket.geonorge.kartkatalog.download

import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.metadata.TimedCache
import org.slf4j.LoggerFactory
import kotlin.coroutines.cancellation.CancellationException

class DownloadTargetGroupResolver (
    private val registerClient: RegisterClient,
){
    private val log = LoggerFactory.getLogger(DownloadTargetGroupResolver::class.java)
    private val cache = TimedCache<String, Set<String>>(ttlMillis = 24 * 60 * 60 * 1000)

    suspend fun getFormal(): Set<String>? =
        cache.getOrFetch("formal") {
            try {
                registerClient
                    .getCodeListByName("formal")
                    .containedItems
                    .filter { it.status == "Gyldig" }
                    .map { it.label }
                    .toSet()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                log.warn("Failed to fetch formal code list", e)
                null
            }
        }
    suspend fun getBrukergrupper(): Set<String>? =
        cache.getOrFetch("brukergrupper") {
            try {
                registerClient
                    .getCodeListByName("brukergrupper")
                    .containedItems
                    .filter { it.status == "Gyldig" }
                    .map { it.label }
                    .toSet()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                log.warn("Failed to fetch brukergrupper code list", e)
                null
            }
    }

}

package no.kartverket.geonorge.kartkatalog.metadata

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import no.kartverket.geonorge.kartkatalog.metrics.countEvent

class TimedCache<K, V>(
    private val name: String,
    private val ttlMillis: Long,
) {
    private data class Entry<V>(
        val value: V,
        val expiresAtMillis: Long,
    )

    private val entries = java.util.concurrent.ConcurrentHashMap<K, Entry<V>>()
    private val mutex = Mutex()

    suspend fun getOrFetch(
        key: K,
        fetch: suspend () -> V?,
    ): V? {
        entries[key]?.let { entry ->
            if (entry.expiresAtMillis > System.currentTimeMillis()) {
                recordLookup("hit")
                return entry.value
            }
        }

        return mutex.withLock {
            entries[key]?.let { entry ->
                if (entry.expiresAtMillis > System.currentTimeMillis()) {
                    recordLookup("hit")
                    return@withLock entry.value
                }
            }

            recordLookup("miss")
            val fetched = fetch()
            if (fetched != null) {
                entries[key] = Entry(fetched, System.currentTimeMillis() + ttlMillis)
            }
            fetched
        }
    }

    private fun recordLookup(result: String) =
        countEvent("cache.requests", "Lookups in in-memory caches", "cache" to name, "result" to result)
}

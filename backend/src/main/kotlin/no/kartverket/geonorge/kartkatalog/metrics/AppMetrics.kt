package no.kartverket.geonorge.kartkatalog.metrics

import io.micrometer.core.instrument.Counter
import io.micrometer.core.instrument.Metrics
import io.micrometer.core.instrument.Timer
import kotlin.coroutines.cancellation.CancellationException

// Meters are registered on Micrometer's global registry. The Prometheus registry is attached to it in
// configureMonitoring, so code running without it (e.g. unit tests) records to a no-op composite.
private val registry get() = Metrics.globalRegistry

private const val OUTCOME_SUCCESS = "success"
private const val OUTCOME_ERROR = "error"
private const val OUTCOME_CANCELLED = "cancelled"

/**
 * Times a call to an upstream system as `upstream.requests{upstream,operation,outcome}`.
 * The call counts as an error when it throws or when [failed] returns true for the result.
 */
suspend fun <T> observeUpstream(
    upstream: String,
    operation: String,
    failed: (T) -> Boolean = { false },
    block: suspend () -> T,
): T {
    val sample = Timer.start(registry)
    var outcome = OUTCOME_ERROR
    try {
        val result = block()
        outcome = if (failed(result)) OUTCOME_ERROR else OUTCOME_SUCCESS
        return result
    } catch (e: CancellationException) {
        outcome = OUTCOME_CANCELLED
        throw e
    } finally {
        sample.stop(
            Timer
                .builder("upstream.requests")
                .description("Calls to upstream systems")
                .tag("upstream", upstream)
                .tag("operation", operation)
                .tag("outcome", outcome)
                .register(registry),
        )
    }
}

fun countEvent(
    name: String,
    description: String,
    vararg tags: Pair<String, String>,
) {
    Counter
        .builder(name)
        .description(description)
        .tags(*tags.flatMap { listOf(it.first, it.second) }.toTypedArray())
        .register(registry)
        .increment()
}

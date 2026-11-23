package no.kartverket.geonorge.kartkatalog.metrics

import io.micrometer.core.instrument.Metrics
import io.micrometer.core.instrument.simple.SimpleMeterRegistry

/**
 * Attaches a fresh registry to Micrometer's global registry so a test sees only the upstream calls it makes itself.
 */
class UpstreamMetricsRecorder : AutoCloseable {
    private val registry = SimpleMeterRegistry().also { Metrics.addRegistry(it) }

    fun count(
        upstream: String,
        operation: String,
        outcome: String,
    ): Long =
        registry
            .find("upstream.requests")
            .tags("upstream", upstream, "operation", operation, "outcome", outcome)
            .timer()
            ?.count() ?: 0

    override fun close() {
        Metrics.removeRegistry(registry)
        registry.close()
    }
}

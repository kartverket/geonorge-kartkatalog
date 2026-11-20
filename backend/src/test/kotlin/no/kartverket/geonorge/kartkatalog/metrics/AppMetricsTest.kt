package no.kartverket.geonorge.kartkatalog.metrics

import io.ktor.client.HttpClient
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.server.testing.testApplication
import no.kartverket.geonorge.kartkatalog.config.configureMonitoring
import no.kartverket.geonorge.kartkatalog.metadata.TimedCache
import kotlin.test.Test
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class AppMetricsTest {
    private suspend fun scrape(client: HttpClient) = client.get("/actuator/prometheus").bodyAsText()

    private fun upstreamCount(
        operation: String,
        outcome: String,
    ) = "upstream_requests_seconds_count{operation=\"$operation\",outcome=\"$outcome\",upstream=\"test_upstream\"}"

    @Test
    fun `records upstream calls by outcome`() =
        testApplication {
            application { configureMonitoring() }
            startApplication()

            observeUpstream("test_upstream", "ok_op") { "fine" }
            assertFailsWith<IllegalStateException> {
                observeUpstream<Unit>("test_upstream", "failing_op") { error("boom") }
            }
            observeUpstream<Int?>("test_upstream", "null_op", failed = { it == null }) { null }

            val body = scrape(client)
            assertTrue(body.contains(upstreamCount("ok_op", "success")))
            assertTrue(body.contains(upstreamCount("failing_op", "error")))
            assertTrue(body.contains(upstreamCount("null_op", "error")))
        }

    @Test
    fun `records cache hits and misses`() =
        testApplication {
            application { configureMonitoring() }
            startApplication()

            val cache = TimedCache<String, String>("test_cache", 60_000)
            cache.getOrFetch("k") { "v" }
            cache.getOrFetch("k") { "v" }

            val body = scrape(client)
            assertTrue(body.contains("cache_requests_total{cache=\"test_cache\",result=\"miss\"} 1.0"))
            assertTrue(body.contains("cache_requests_total{cache=\"test_cache\",result=\"hit\"} 1.0"))
        }
}

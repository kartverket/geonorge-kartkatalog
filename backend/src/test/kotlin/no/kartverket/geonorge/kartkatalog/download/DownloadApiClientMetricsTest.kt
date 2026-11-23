package no.kartverket.geonorge.kartkatalog.download

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.http.HttpStatusCode
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import no.kartverket.geonorge.kartkatalog.metrics.UpstreamMetricsRecorder
import kotlin.coroutines.cancellation.CancellationException
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs

class DownloadApiClientMetricsTest {
    private val metrics = UpstreamMetricsRecorder()
    private val clients = mutableListOf<HttpClient>()

    private val areasUrl = "https://nedlasting.example.com/api/codelists/area/dataset"
    private val orderUrl = "https://nedlasting.example.com/api/order"

    @AfterTest
    fun tearDown() {
        clients.forEach { it.close() }
        metrics.close()
    }

    private fun client(
        status: HttpStatusCode,
        content: String = "",
    ): DownloadApiClient {
        val httpClient = HttpClient(MockEngine { respond(content = content, status = status) })
        clients += httpClient
        return DownloadApiClient(httpClient)
    }

    private fun assertRecorded(
        operation: String,
        outcome: String,
    ) = assertEquals(1, metrics.count("download_api", operation, outcome), "download_api/$operation should be $outcome")

    /** Runs [call] against a request that never answers, cancels the caller, and returns what the caller saw. */
    private suspend fun cancelDuring(call: suspend (DownloadApiClient) -> Unit): Throwable? =
        kotlinx.coroutines.coroutineScope {
            val requestStarted = CompletableDeferred<Unit>()
            val httpClient =
                HttpClient(
                    MockEngine {
                        requestStarted.complete(Unit)
                        awaitCancellation()
                    },
                )
            clients += httpClient
            var thrown: Throwable? = null
            val job =
                launch {
                    try {
                        call(DownloadApiClient(httpClient))
                    } catch (e: Throwable) {
                        thrown = e
                        throw e
                    }
                }
            requestStarted.await()
            job.cancelAndJoin()
            thrown
        }

    @Test
    fun `caller cancellation of areas propagates as CancellationException and is recorded as cancelled`() =
        runBlocking {
            assertIs<CancellationException>(cancelDuring { it.getAreas(areasUrl) })
            assertRecorded("areas", "cancelled")
        }

    @Test
    fun `caller cancellation of availability check propagates instead of returning UNKNOWN`() =
        runBlocking {
            assertIs<CancellationException>(cancelDuring { it.checkAvailability(areasUrl) })
            assertRecorded("availability", "cancelled")
        }

    @Test
    fun `availability check that times out returns UNKNOWN and is recorded as error`() =
        runBlocking {
            val httpClient = HttpClient(MockEngine { awaitCancellation() })
            clients += httpClient
            assertEquals(
                DownloadApiClient.DownloadAvailability.UNKNOWN,
                DownloadApiClient(httpClient).checkAvailability(areasUrl),
            )
            assertRecorded("availability", "error")
        }

    @Test
    fun `successful areas fetch is recorded as success`() =
        runBlocking {
            client(HttpStatusCode.OK, "[]").getAreas(areasUrl)
            assertRecorded("areas", "success")
        }

    @Test
    fun `areas 403 is recorded as error`() =
        runBlocking {
            runCatching { client(HttpStatusCode.Forbidden).getAreas(areasUrl) }
            assertRecorded("areas", "error")
        }

    @Test
    fun `areas with invalid JSON is recorded as error`() =
        runBlocking {
            runCatching { client(HttpStatusCode.OK, "not-json").getAreas(areasUrl) }
            assertRecorded("areas", "error")
        }

    @Test
    fun `order 401 is recorded as error`() =
        runBlocking {
            runCatching {
                client(HttpStatusCode.Unauthorized).order(orderUrl, DownloadApiOrderRequest(orderLines = emptyList()))
            }
            assertRecorded("order", "error")
        }
}

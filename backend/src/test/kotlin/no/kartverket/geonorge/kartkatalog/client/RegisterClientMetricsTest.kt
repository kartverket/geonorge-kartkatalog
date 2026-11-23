package no.kartverket.geonorge.kartkatalog.client

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.http.HttpStatusCode
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.awaitCancellation
import kotlinx.coroutines.cancelAndJoin
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import no.kartverket.geonorge.kartkatalog.integrations.register.CodeList
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.metrics.UpstreamMetricsRecorder
import kotlin.coroutines.cancellation.CancellationException
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertIs

class RegisterClientMetricsTest {
    private val metrics = UpstreamMetricsRecorder()
    private val clients = mutableListOf<HttpClient>()

    @AfterTest
    fun tearDown() {
        clients.forEach { it.close() }
        metrics.close()
    }

    private fun client(
        status: HttpStatusCode,
        content: String = "",
    ): RegisterClient {
        val httpClient = HttpClient(MockEngine { respond(content = content, status = status) })
        clients += httpClient
        return RegisterClient(httpClient, "https://register.example.com")
    }

    private fun assertRecorded(
        operation: String,
        outcome: String,
    ) = assertEquals(1, metrics.count("register", operation, outcome), "register/$operation should be $outcome")

    @Test
    fun `successful code list fetch is recorded as success`() =
        runBlocking {
            client(HttpStatusCode.OK, """{"containeditems": []}""").getCodeList(CodeList.STATUS)
            assertRecorded("code_list", "success")
        }

    @Test
    fun `code list 404 is recorded as error`() =
        runBlocking {
            runCatching { client(HttpStatusCode.NotFound).getCodeList(CodeList.STATUS) }
            assertRecorded("code_list", "error")
        }

    @Test
    fun `code list with invalid JSON is recorded as error`() =
        runBlocking {
            runCatching { client(HttpStatusCode.OK, "not-json").getCodeList(CodeList.STATUS) }
            assertRecorded("code_list", "error")
        }

    @Test
    fun `missing tegneregler item is recorded as success`() =
        runBlocking {
            client(HttpStatusCode.NotFound).getTegneregler("ukjent")
            assertRecorded("tegneregler", "success")
        }

    @Test
    fun `caller cancellation propagates as CancellationException and is recorded as cancelled`() =
        runBlocking {
            val requestStarted = CompletableDeferred<Unit>()
            val httpClient =
                HttpClient(
                    MockEngine {
                        requestStarted.complete(Unit)
                        awaitCancellation()
                    },
                )
            clients += httpClient
            val client = RegisterClient(httpClient, "https://register.example.com")

            var thrown: Throwable? = null
            val job =
                launch {
                    try {
                        client.getCodeList(CodeList.STATUS)
                    } catch (e: Throwable) {
                        thrown = e
                        throw e
                    }
                }
            requestStarted.await()
            job.cancelAndJoin()

            assertIs<CancellationException>(thrown)
            assertRecorded("code_list", "cancelled")
        }
}

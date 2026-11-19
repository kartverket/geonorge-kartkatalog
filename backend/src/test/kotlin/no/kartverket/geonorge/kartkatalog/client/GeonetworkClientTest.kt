package no.kartverket.geonorge.kartkatalog.client

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.http.HttpStatusCode
import kotlinx.coroutines.runBlocking
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.GeoNetworkException
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.GeonetworkClient
import no.kartverket.geonorge.kartkatalog.metrics.UpstreamMetricsRecorder
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull

class GeonetworkClientTest {
    private val metrics = UpstreamMetricsRecorder()
    private val clients = mutableListOf<HttpClient>()

    @AfterTest
    fun tearDown() {
        clients.forEach { it.close() }
        metrics.close()
    }

    private fun client(
        status: HttpStatusCode,
        content: String,
    ): GeonetworkClient {
        val httpClient = HttpClient(MockEngine { respond(content = content, status = status) })
        clients += httpClient
        return GeonetworkClient(httpClient, "https://geonetwork.example.com")
    }

    @Test
    fun `record missing from a successful response returns null and is recorded as success`() =
        runBlocking {
            val emptyResponse = """<csw:GetRecordByIdResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2"/>"""
            assertNull(client(HttpStatusCode.OK, emptyResponse).getRecordByUuid("ukjent"))
            assertEquals(1, metrics.count("geonetwork", "get_record_by_id", "success"))
        }

    @Test
    fun `non-success response throws and is recorded as error`() =
        runBlocking {
            val exception =
                assertFailsWith<GeoNetworkException> {
                    client(HttpStatusCode.BadGateway, "<html>Bad Gateway</html>").getRecordByUuid("x")
                }
            assertContains(exception.message.orEmpty(), "502")
            assertEquals(1, metrics.count("geonetwork", "get_record_by_id", "error"))
        }
}

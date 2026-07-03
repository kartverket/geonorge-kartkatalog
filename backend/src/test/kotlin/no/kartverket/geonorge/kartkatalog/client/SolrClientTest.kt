package no.kartverket.geonorge.kartkatalog.client

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.headersOf
import io.ktor.serialization.kotlinx.json.json
import kotlinx.coroutines.runBlocking
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrResponse
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals

class SolrClientTest {
    private val minimalSolrResponse =
        """{
            "responseHeader": {"status": 0, "QTime": 1},
            "response": {"numFound": 1, "start": 0, "docs": [{"uuid": "test-uuid"}]}
        }"""

    @Test
    fun `posts form-url-encoded metadata query`() =
        runBlocking {
            val uuid = UUID.randomUUID()
            var capturedPath: String? = null
            var capturedProtocol: String? = null

            val engine =
                MockEngine { request ->
                    capturedPath = request.url.encodedPath
                    capturedProtocol = request.url.protocol.name

                    respond(
                        content = minimalSolrResponse,
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                    )
                }

            val httpClient = HttpClient(engine) { install(ContentNegotiation) { json() } }
            val solrClient = SolrClient(httpClient)

            try {
                val response = solrClient.getMetadataByUuid(uuid)

                assertEquals(1, response.response.numFound)
                assertEquals(
                    "test-uuid",
                    response.response.docs
                        .first()
                        .uuid,
                )
                assertEquals("/solr/metadata/select", capturedPath)
                assertEquals("https", capturedProtocol)
            } finally {
                httpClient.close()
            }
        }

    @Test
    fun `parses solr json even when content type is text plain`() =
        runBlocking {
            val uuid = UUID.randomUUID()

            val engine =
                MockEngine {
                    respond(
                        content = minimalSolrResponse,
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, ContentType.Text.Plain.toString()),
                    )
                }

            val httpClient = HttpClient(engine) { install(ContentNegotiation) { json() } }
            val solrClient = SolrClient(httpClient)

            httpClient.use { _ ->
                val response: SolrResponse = solrClient.getMetadataByUuid(uuid)
                assertEquals(1, response.response.numFound)
                assertEquals(
                    "test-uuid",
                    response.response.docs
                        .first()
                        .uuid,
                )
            }
        }
}

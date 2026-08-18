package no.kartverket.geonorge.kartkatalog.client

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.network.sockets.ConnectTimeoutException
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.headersOf
import io.ktor.serialization.kotlinx.json.json
import kotlinx.coroutines.runBlocking
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrException
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrResponse
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class SolrClientTest {
    private val minimalSolrResponse =
        """{
            "responseHeader": {"status": 0, "QTime": 1},
            "response": {"numFound": 1, "start": 0, "docs": [{"uuid": "test-uuid"}]}
        }"""

    private val emptySolrResponse =
        """{
        "responseHeader": {"status": 0, "QTime": 1},
        "response": {"numFound": 0, "start": 0, "docs": []}
    }"""

    private val solrBaseUrl = "https://test.example.com"

    @Test
    fun `posts form-url-encoded metadata query`() =
        runBlocking {
            val uuid = UUID.randomUUID().toString()
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
            val solrClient = SolrClient(httpClient, solrBaseUrl)

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
            val uuid = UUID.randomUUID().toString()

            val engine =
                MockEngine {
                    respond(
                        content = minimalSolrResponse,
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, ContentType.Text.Plain.toString()),
                    )
                }

            val httpClient = HttpClient(engine) { install(ContentNegotiation) { json() } }
            val solrClient = SolrClient(httpClient, solrBaseUrl)

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

    @Test
    fun `falls back to services core when metadata core is empty`() =
        runBlocking {
            val requestedPaths = mutableListOf<String>()
            val engine =
                MockEngine { request ->
                    requestedPaths.add(request.url.encodedPath)
                    val content =
                        if (request.url.encodedPath == "/solr/services/select") {
                            minimalSolrResponse
                        } else {
                            emptySolrResponse
                        }
                    respond(
                        content = content,
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                    )
                }
            val httpClient = HttpClient(engine) { install(ContentNegotiation) { json() } }
            val solrClient = SolrClient(httpClient, solrBaseUrl)

            httpClient.use {
                val response = solrClient.getMetadataByUuid(UUID.randomUUID().toString())
                assertEquals(1, response.response.numFound)
                assertEquals(listOf("/solr/metadata/select", "/solr/services/select"), requestedPaths)
            }
        }

    @Test
    fun `falls back to applications core when metadata and services are both empty`() =
        runBlocking {
            val requestedPaths = mutableListOf<String>()
            val engine =
                MockEngine { request ->
                    requestedPaths.add(request.url.encodedPath)
                    val content =
                        if (request.url.encodedPath == "/solr/applications/select") {
                            minimalSolrResponse
                        } else {
                            emptySolrResponse
                        }
                    respond(
                        content = content,
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                    )
                }
            val httpClient = HttpClient(engine) { install(ContentNegotiation) { json() } }
            val solrClient = SolrClient(httpClient, solrBaseUrl)

            httpClient.use {
                val response = solrClient.getMetadataByUuid(UUID.randomUUID().toString())
                assertEquals(1, response.response.numFound)
                assertEquals(
                    listOf("/solr/metadata/select", "/solr/services/select", "/solr/applications/select"),
                    requestedPaths,
                )
            }
        }

    @Test
    fun `does not query further cores once a result is found`() =
        runBlocking {
            val requestedPaths = mutableListOf<String>()
            val engine =
                MockEngine { request ->
                    requestedPaths.add(request.url.encodedPath)
                    respond(
                        content = minimalSolrResponse,
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                    )
                }
            val httpClient = HttpClient(engine) { install(ContentNegotiation) { json() } }
            val solrClient = SolrClient(httpClient, solrBaseUrl)

            httpClient.use {
                solrClient.getMetadataByUuid(UUID.randomUUID().toString())
                assertEquals(listOf("/solr/metadata/select"), requestedPaths)
            }
        }

    @Test
    fun `wraps network failures as SolrException`(): Unit =
        runBlocking {
            val engine = MockEngine { throw ConnectTimeoutException("boom") }
            val httpClient = HttpClient(engine) { install(ContentNegotiation) { json() } }
            val solrClient = SolrClient(httpClient, solrBaseUrl)

            httpClient.use {
                assertFailsWith<SolrException> {
                    solrClient.getMetadataByUuid(UUID.randomUUID().toString())
                }
            }
        }

    @Test
    fun `wraps non-2xx status as SolrException`(): Unit =
        runBlocking {
            val engine = MockEngine { respond(content = "", status = HttpStatusCode.InternalServerError) }
            val httpClient = HttpClient(engine) { install(ContentNegotiation) { json() } }
            val solrClient = SolrClient(httpClient, solrBaseUrl)

            httpClient.use {
                assertFailsWith<SolrException> {
                    solrClient.getMetadataByUuid(UUID.randomUUID().toString())
                }
            }
        }
}

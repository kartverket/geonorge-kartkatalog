package no.kartverket.geonorge.kartkatalog.client

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.network.sockets.ConnectTimeoutException
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.forms.FormDataContent
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.headersOf
import io.ktor.serialization.kotlinx.json.json
import kotlinx.coroutines.CancellationException
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
    fun `escapes special characters in metadata and application dataset queries`() =
        runBlocking {
            val queries = mutableListOf<String>()
            val fields = mutableListOf<String>()
            val engine =
                MockEngine { request ->
                    val formData = (request.body as FormDataContent).formData
                    queries += formData["q"]!!
                    fields += formData["fl"]!!
                    respond(
                        content = minimalSolrResponse,
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                    )
                }
            val httpClient = HttpClient(engine) { install(ContentNegotiation) { json() } }
            httpClient.use {
                val client = SolrClient(httpClient, solrBaseUrl)
                client.getMetadataByUuid("no.met:dataset/1")
                client.searchApplicationsForDataset("no.met:dataset/1")
            }
            assertEquals(
                listOf("""uuid:no.met\:dataset\/1""", """applicationdataset:no.met\:dataset\/1*"""),
                queries,
            )
            assertEquals("uuid,title,distribution_protocol", fields.last())
        }

    @Test
    fun `escapes each id in a multi-uuid query without escaping query syntax`() =
        runBlocking {
            val queries = mutableListOf<String>()
            val engine =
                MockEngine { request ->
                    queries += (request.body as FormDataContent).formData["q"]!!
                    respond(
                        content = emptySolrResponse,
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                    )
                }
            val httpClient = HttpClient(engine) { install(ContentNegotiation) { json() } }
            httpClient.use {
                val client = SolrClient(httpClient, solrBaseUrl)
                client.getMetadataByUuids(listOf("no.met:dataset/1", "second+uuid"))
            }
            assertEquals("""uuid:(no.met\:dataset\/1 OR second\+uuid)""", queries.first())
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
    fun `does not turn cancellation into a Solr failure`(): Unit =
        runBlocking {
            val engine = MockEngine { throw CancellationException("request cancelled") }
            val httpClient = HttpClient(engine) { install(ContentNegotiation) { json() } }
            httpClient.use {
                assertFailsWith<CancellationException> {
                    SolrClient(httpClient, solrBaseUrl).getMetadataByUuid("test-uuid")
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

    @Test
    fun `parse related service good`() {
        val engine = MockEngine { respond(content = "", status = HttpStatusCode.InternalServerError) }
        val httpClient = HttpClient(engine) { install(ContentNegotiation) { json() } }
        val solrClient = SolrClient(httpClient, solrBaseUrl)
        val rightUuid = UUID.randomUUID().toString()
        val serviceName = "Administrative enheter - historiske data 1997"
        val protocol = "GEONORGE:DOWNLOAD"
        val distUri = "https://nedlasting.geonorge.no/api/capabilities/"
        val isOpen = true
        val isClose = false

        val datasetSerivceString =
            "$rightUuid|" +
                "$serviceName|" +
                "${UUID.randomUUID()}|" +
                "dataset|" +
                "Kartverket||" +
                "$protocol|" + "" +
                "$distUri|" +
                "Basis geodata|" +
                "https://register.dev.geonorge.no/data/organizations/971040238_Kartverket_liten.png|" +
                "https://editor.geonorge.no/thumbnails/${UUID.randomUUID()}_medium_adm1het.png|" +
                "no restrictions|http://inspire.ec.europa.eu||$isOpen|$isClose"
        val parsedServiceDetails = solrClient.parseDatasetServices(listOf(datasetSerivceString))

        assertEquals(1, parsedServiceDetails.size)
        val parsedService = parsedServiceDetails[0]
        assertEquals(rightUuid, parsedService.uuid)
        assertEquals(serviceName, parsedService.name)
        assertEquals(protocol, parsedService.protocol)
        assertEquals(distUri, parsedService.distributionUrl)
        assertEquals(isOpen, parsedService.accessIsOpendata)
        assertEquals(isClose, parsedService.accessIsRestricted)
    }
}

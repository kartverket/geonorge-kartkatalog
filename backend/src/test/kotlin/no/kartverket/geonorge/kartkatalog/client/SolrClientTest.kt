package no.kartverket.geonorge.kartkatalog.client

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.headersOf
import kotlinx.coroutines.runBlocking
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals

class SolrClientTest {
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
                        content = """{"response":{"numFound":1}}""",
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                    )
                }

            val httpClient = HttpClient(engine)
            val solrClient = SolrClient(httpClient)

            try {
                val response = solrClient.getMetadataByUUid(uuid)

                assertEquals("""{"response":{"numFound":1}}""", response)
                assertEquals("/solr/metadata/select", capturedPath)
                assertEquals("https", capturedProtocol)
            } finally {
                httpClient.close()
            }
        }
}

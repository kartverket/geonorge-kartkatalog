package no.kartverket.geonorge.kartkatalog.routes

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.headersOf
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.routing.routing
import io.ktor.server.testing.testApplication
import no.kartverket.geonorge.kartkatalog.config.configureHttp
import no.kartverket.geonorge.kartkatalog.config.configureSerialization
import no.kartverket.geonorge.kartkatalog.config.configureStatusPages
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.GeonetworkClient
import no.kartverket.geonorge.kartkatalog.integrations.register.CodeList
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.metadata.MetadataSummaryService
import no.kartverket.geonorge.kartkatalog.metadata.metadataRoutes
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals

class MetadataRoutesTest {
    private val emptyGeonetworkXml =
        """<?xml version="1.0"?><csw:GetRecordByIdResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2"/>"""
    private val responseXml =
        javaClass.classLoader
            .getResourceAsStream("response.xml")!!
            .readBytes()
            .toString(Charsets.UTF_8)

    private val solrJson =
        """
        {
          "responseHeader": {"status": 0, "QTime": 1},
          "response": {
            "numFound": 1,
            "start": 0,
            "docs": [{
              "uuid": "c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689",
              "title": "Solr title fallback",
              "organization": "Kartverket",
              "date_updated": "2024-09-17T12:00:00Z",
              "dataaccess": "open"
            }]
          }
        }
        """.trimIndent()

    private fun createSummaryService(xml: String): MetadataSummaryService {
        val client =
            HttpClient(
                MockEngine { request ->
                    when {
                        request.url.encodedPath.endsWith("/srv/nor/csw") -> {
                            respond(
                                content = xml,
                                status = HttpStatusCode.OK,
                                headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Xml.toString()),
                            )
                        }

                        request.url.encodedPath == "/api/kodelister/${CodeList.MAINTENANCE_FREQUENCY.systemId}" -> {
                            respond(
                                content = """{"containeditems": [{"label": "Continual", "codevalue": "continual"}]}""",
                                status = HttpStatusCode.OK,
                                headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                            )
                        }

                        request.url.encodedPath == "/api/kodelister/${CodeList.SPATIAL_REPRESENTATIONS.systemId}" -> {
                            respond(
                                content = """{"containeditems": [{"label": "Vector", "codevalue": "vector"}]}""",
                                status = HttpStatusCode.OK,
                                headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                            )
                        }

                        request.url.encodedPath == "/solr/metadata/select" -> {
                            respond(
                                content = solrJson,
                                status = HttpStatusCode.OK,
                                headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                            )
                        }

                        else -> {
                            respond("{}", status = HttpStatusCode.NotFound)
                        }
                    }
                },
            ) {
                install(ContentNegotiation) {
                    json()
                }
            }

        return MetadataSummaryService(
            GeonetworkClient(client),
            RegisterClient(client),
            SolrClient(client),
        )
    }

    private fun testApp(
        metadataSummaryService: MetadataSummaryService,
        block: suspend io.ktor.server.testing.ApplicationTestBuilder.() -> Unit,
    ) = testApplication {
        application {
            configureHttp()
            configureSerialization()
            configureStatusPages()
            routing { metadataRoutes(metadataSummaryService) }
        }
        block()
    }

    @Test
    fun `returns 200 with dataset metadata-summary for valid uuid`() =
        testApp(createSummaryService(responseXml)) {
            val response = client.get("/metadata/summary/c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689")

            assertEquals(HttpStatusCode.OK, response.status)
            assertContains(response.bodyAsText(), "Matrikkelen - Bygningspunkt WFS")
        }

    @Test
    fun `returns 404 when record not found for metadata-summary`() =
        testApp(createSummaryService(emptyGeonetworkXml)) {
            val response = client.get("/metadata/summary/00000000-0000-0000-0000-000000000000")

            assertEquals(HttpStatusCode.NotFound, response.status)
            assertContains(response.bodyAsText(), "error")
        }

    @Test
    fun `returns 404 for metadata-info when record not found`() =
        testApp(createSummaryService(emptyGeonetworkXml)) {
            val response = client.get("/metadata/info/00000000-0000-0000-0000-000000000000")

            assertEquals(HttpStatusCode.NotFound, response.status)
            assertContains(response.bodyAsText(), "error")
        }

    @Test
    fun `returns 400 for invalid UUID format in metadata-summary`() =
        testApp(createSummaryService(responseXml)) {
            val response = client.get("/metadata/summary/not-a-uuid")

            assertEquals(HttpStatusCode.BadRequest, response.status)
            assertContains(response.bodyAsText(), "error")
        }
    @Test
    fun `returns 400 for invalid UUID format in metadata-info`() =
        testApp(createSummaryService(responseXml)) {
            val response = client.get("/metadata/info/not-a-uuid")

            assertEquals(HttpStatusCode.BadRequest, response.status)
            assertContains(response.bodyAsText(), "error")
        }
}

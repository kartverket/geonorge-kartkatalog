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
import no.kartverket.geonorge.kartkatalog.metadata.CodeListTranslator
import no.kartverket.geonorge.kartkatalog.metadata.LinkedDistributionsService
import no.kartverket.geonorge.kartkatalog.metadata.MetadataMapper
import no.kartverket.geonorge.kartkatalog.metadata.MetadataService
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

    private val geonetworkBaseUrl = "https://test.example.com/geonetwork"
    private val registerBaseUrl = "https://test.example.com/register"
    private val staticNorgeskartUrl = "https://test.example.com/register"

    private fun createMetadataService(xml: String): MetadataService {
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

        val registerClient = RegisterClient(client, registerBaseUrl)
        val codeListTranslator = CodeListTranslator(registerClient)
        val metadataMapper = MetadataMapper(codeListTranslator, staticNorgeskartUrl)

        val metadataService =
            MetadataService(
                GeonetworkClient(client, geonetworkBaseUrl),
                metadataMapper,
            )
        val linkedDistributionsService =
            LinkedDistributionsService(
                SolrClient(client, "https://solr.example.test"),
                GeonetworkClient(client, geonetworkBaseUrl),
            )

        return metadataService to linkedDistributionsService
    }

    private fun testApp(
        metadataService: MetadataService,
        linkedDistributionsService: LinkedDistributionsService,
        block: suspend io.ktor.server.testing.ApplicationTestBuilder.() -> Unit,
    ) = testApplication {
        application {
            configureHttp()
            configureSerialization()
            configureStatusPages()
            routing { metadataRoutes(metadataService, linkedDistributionsService) }
        }
        block()
    }

    @Test
    fun `returns 200 with dataset metadata for valid uuid`() {
        val (metadataService, linkedDistributionsService) =
            createMetadataService(responseXml)
        testApp(metadataService, linkedDistributionsService) {
            val response =
                client.get("/metadata/c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689")

            assertEquals(HttpStatusCode.OK, response.status)
            assertContains(response.bodyAsText(), "Matrikkelen - Bygningspunkt WFS")
        }
    }

    @Test
    fun `returns 404 when record not found for metadata`() {
        val (metadataService, linkedDistributionsService) =
            createMetadataService(emptyGeonetworkXml)

        testApp(metadataService, linkedDistributionsService) {
            val response = client.get("/metadata/00000000-0000-0000-0000-000000000000")
            assertEquals(HttpStatusCode.NotFound, response.status)
            assertContains(response.bodyAsText(), "error")
        }
    }

    @Test
    fun `returns 404 for non-uuid id that is not found`() {
        val (metadataService, linkedDistributionsService) =
            createMetadataService(emptyGeonetworkXml)

        testApp(metadataService, linkedDistributionsService) {
            val response = client.get("/metadata/not-a-uuid")

            assertEquals(HttpStatusCode.NotFound, response.status)
            assertContains(response.bodyAsText(), "error")
        }
    }

    @Test
    fun `returns 400 when id is blank`() {
        val (metadataService, linkedDistributionsService) =
            createMetadataService(responseXml)

        testApp(metadataService, linkedDistributionsService) {
            val response = client.get("/metadata/%20")

            assertEquals(HttpStatusCode.BadRequest, response.status)
            assertContains(response.bodyAsText(), "error")
        }
    }
}

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
    private val responseXmlWithWms =
        responseXml
            .replace(
                "https://wfs.geonorge.no/skwms1/wfs.matrikkelen-bygningspunkt?service=WFS&amp;Request=GetCapabilities",
                "https://wms.geonorge.no/skwms1/wms.matrikkelen-bygningspunkt?service=WMS&amp;Request=GetCapabilities",
            ).replace(
                "<gco:CharacterString>OGC:WFS</gco:CharacterString>",
                "<gco:CharacterString>OGC:WMS</gco:CharacterString>",
            )

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

    private val serviceSolrJson =
        """
        {
          "responseHeader": {"status": 0, "QTime": 1},
          "response": {
            "numFound": 1, "start": 0,
            "docs": [{
              "uuid": "c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689",
              "title": "Test-tjeneste",
              "type": "service",
              "servicedataset": ["11111111-1111-1111-1111-111111111111|Datasett||dataset|Org||GEONORGE:DOWNLOAD|https://example.com|Tema"],
              "servicelayers": ["22222222-2222-2222-2222-222222222222|Lag|c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689|service|Org|Lag|OGC:WMS|https://example.com|Tema"]
            }]
          }
        }
        """.trimIndent()

    private val datasetWithViewServiceSolrJson =
        """
        {
          "responseHeader": {"status": 0, "QTime": 1},
          "response": {
            "numFound": 1, "start": 0,
            "docs": [{
              "uuid": "c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689",
              "title": "Test-datasett",
              "type": "dataset",
              "datasetservice": ["666e4559-60bf-4a1d-9e72-c43502a9a58b|Administrative enheter WMS||service|Org||OGC:WMS|https://example.com|Tema"]
            }]
          }
        }
        """.trimIndent()

    private val servicelayerSolrJson =
        """
        {
          "responseHeader": {"status": 0, "QTime": 1},
          "response": {
            "numFound": 1, "start": 0,
            "docs": [{
              "uuid": "c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689",
              "title": "Test-tjenestelag",
              "type": "servicelayer",
              "servicedataset": ["11111111-1111-1111-1111-111111111111|Datasett||dataset|Org||GEONORGE:DOWNLOAD|https://example.com|Tema"],
              "parentidentifier": "33333333-3333-3333-3333-333333333333"
            }]
          }
        }
        """.trimIndent()

    private val softwareSolrJson =
        """
        {
          "responseHeader": {"status": 0, "QTime": 1},
          "response": {
            "numFound": 1, "start": 0,
            "docs": [{
              "uuid": "c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689",
              "title": "Test-applikasjon",
              "type": "software",
              "applicationdataset": ["11111111-1111-1111-1111-111111111111|Datasett||dataset|Org||GEONORGE:DOWNLOAD|https://example.com|Tema"]
            }]
          }
        }
        """.trimIndent()

    private val geonetworkBaseUrl = "https://test.example.com/geonetwork"
    private val registerBaseUrl = "https://test.example.com/register"
    private val staticNorgeskartUrl = "https://test.example.com/register"

    private fun createMetadataService(
        xml: String,
        solrDocJson: String = solrJson,
        solrFails: Boolean = false,
    ): Pair<MetadataService, LinkedDistributionsService> {
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
                            if (solrFails) {
                                respond(content = "", status = HttpStatusCode.ServiceUnavailable)
                            } else {
                                respond(
                                    content = solrDocJson,
                                    status = HttpStatusCode.OK,
                                    headers =
                                        headersOf(
                                            HttpHeaders.ContentType,
                                            ContentType.Application.Json.toString(),
                                        ),
                                )
                            }
                        }

                        request.url.encodedPath == "/solr/applications/select" -> {
                            respond(
                                content =
                                    """{"responseHeader": {"status": 0, "QTime": 1},
                                    |"response": {"numFound": 0, "start": 0, "docs": []}}
                                    """.trimMargin(),
                                status = HttpStatusCode.OK,
                                headers =
                                    headersOf(
                                        HttpHeaders.ContentType,
                                        ContentType.Application.Json.toString(),
                                    ),
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
                registerClient,
            )
        val linkedDistributionsService =
            LinkedDistributionsService(
                SolrClient(client, "https://solr.example.test"),
                GeonetworkClient(client, geonetworkBaseUrl),
                codeListTranslator,
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

    @Test
    fun `returns 200 with linked distributions for valid uuid`() {
        val (metadataService, linkedDistributionsService) =
            createMetadataService(responseXml)

        testApp(metadataService, linkedDistributionsService) {
            val response = client.get("/metadata/c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689/linked-distributions")

            assertEquals(HttpStatusCode.OK, response.status)
            assertContains(response.bodyAsText(), "applications")
            assertContains(response.bodyAsText(), "viewServices")
            assertContains(response.bodyAsText(), "downloadServices")
        }
    }

    @Test
    fun `returns WMS capabilities url for linked view service`() {
        val (metadataService, linkedDistributionsService) =
            createMetadataService(responseXmlWithWms, solrDocJson = datasetWithViewServiceSolrJson)

        testApp(metadataService, linkedDistributionsService) {
            val response = client.get("/metadata/c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689/linked-distributions")
            val body = response.bodyAsText()

            assertEquals(HttpStatusCode.OK, response.status)
            assertContains(body, "\"viewServices\"")
            assertContains(
                body,
                "\"distributionProtocol\":\"OGC:WMS\"",
            )
            assertContains(
                body,
                "\"getCapabilitiesUrl\":\"https://wms.geonorge.no/skwms1/wms.matrikkelen-bygningspunkt?service=WMS&Request=GetCapabilities\"",
            )
        }
    }

    @Test
    fun `returns 400 for linked-distributions when id is blank`() {
        val (metadataService, linkedDistributionsService) =
            createMetadataService(responseXml)

        testApp(metadataService, linkedDistributionsService) {
            val response =
                client.get("/metadata/%20/linked-distributions")

            assertEquals(HttpStatusCode.BadRequest, response.status)
            assertContains(response.bodyAsText(), "error")
        }
    }

    @Test
    fun `returns relatedDatasets and serviceLayers for a service`() {
        val (metadataService, linkedDistributionsService) =
            createMetadataService(responseXml, solrDocJson = serviceSolrJson)

        testApp(metadataService, linkedDistributionsService) {
            val response = client.get("/metadata/c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689/linked-distributions")

            assertEquals(HttpStatusCode.OK, response.status)
            assertContains(response.bodyAsText(), "relatedDatasets")
            assertContains(response.bodyAsText(), "serviceLayers")
        }
    }

    @Test
    fun `returns relatedDatasets and parentService for a servicelayer`() {
        val (metadataService, linkedDistributionsService) =
            createMetadataService(responseXml, solrDocJson = servicelayerSolrJson)

        testApp(metadataService, linkedDistributionsService) {
            val response = client.get("/metadata/c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689/linked-distributions")

            assertEquals(HttpStatusCode.OK, response.status)
            assertContains(response.bodyAsText(), "relatedDatasets")
            assertContains(response.bodyAsText(), "parentService")
        }
    }

    @Test
    fun `returns relatedDatasets for software`() {
        val (metadataService, linkedDistributionsService) =
            createMetadataService(responseXml, solrDocJson = softwareSolrJson)

        testApp(metadataService, linkedDistributionsService) {
            val response = client.get("/metadata/c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689/linked-distributions")

            assertEquals(HttpStatusCode.OK, response.status)
            assertContains(response.bodyAsText(), "relatedDatasets")
        }
    }

    @Test
    fun `returns 502 when Solr is unavailable`() {
        val (metadataService, linkedDistributionsService) =
            createMetadataService(responseXml, solrFails = true)

        testApp(metadataService, linkedDistributionsService) {
            val response = client.get("/metadata/c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689/linked-distributions")

            assertEquals(HttpStatusCode.BadGateway, response.status)
            assertContains(response.bodyAsText(), "Upstream Solr error")
        }
    }
}

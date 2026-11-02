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
import no.kartverket.geonorge.kartkatalog.distribution.DistributionsService
import no.kartverket.geonorge.kartkatalog.distribution.distributionsRoutes
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.GeonetworkClient
import no.kartverket.geonorge.kartkatalog.integrations.register.CodeList
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.metadata.CodeListTranslator
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals

class DistributionsRoutesTest {
    private val uuid = "c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689"
    private val recordXml =
        javaClass.classLoader
            .getResourceAsStream("response.xml")!!
            .readBytes()
            .toString(Charsets.UTF_8)
    private val emptyXml =
        """<?xml version="1.0"?><csw:GetRecordByIdResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2"/>"""
    private val json = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString())
    private val emptySolr =
        """{"responseHeader": {"status": 0, "QTime": 1}, "response": {"numFound": 0, "start": 0, "docs": []}}"""
    private val datasetSolr =
        """{"responseHeader": {"status": 0, "QTime": 1}, "response": {"numFound": 1, "start": 0,
          "docs": [{"uuid": "$uuid", "type": "dataset"}]}}"""

    private val appSolr =
        """{"responseHeader": {"status": 0, "QTime": 1}, "response": {"numFound": 1, "start": 0,
          "docs": [{"uuid": "app-uuid", "distribution_protocol": "OGC:WFS"}]}}"""

    private fun testApp(
        xml: String,
        block: suspend io.ktor.server.testing.ApplicationTestBuilder.() -> Unit,
    ) = testApplication {
        val client =
            HttpClient(
                MockEngine { request ->
                    val path = request.url.encodedPath
                    when {
                        path.endsWith("/srv/nor/csw") ->
                            respond(
                                xml,
                                HttpStatusCode.OK,
                                headersOf(HttpHeaders.ContentType, ContentType.Application.Xml.toString()),
                            )
                        path == "/api/kodelister/${CodeList.DISTRIBUTION_TYPES.systemId}" ->
                            respond(
                                """{"containeditems": [{"label": "WFS-tjeneste", "codevalue": "OGC:WFS"}, {"label": "WMS-tjeneste", "codevalue": "OGC:WMS"}]}""",
                                HttpStatusCode.OK,
                                json,
                            )
                        path == "/solr/metadata/select" -> respond(datasetSolr, HttpStatusCode.OK, json)
                        path == "/solr/applications/select" -> respond(appSolr, HttpStatusCode.OK, json)
                        path.startsWith("/solr/") -> respond(emptySolr, HttpStatusCode.OK, json)
                        else -> respond("{}", HttpStatusCode.NotFound)
                    }
                },
            ) {
                install(ContentNegotiation) {
                    json()
                }
            }
        val service =
            DistributionsService(
                SolrClient(client, "https://solr.example.test"),
                GeonetworkClient(client, "https://geonetwork.example.test"),
                CodeListTranslator(RegisterClient(client, "https://register.example.test")),
            )
        application {
            configureHttp()
            configureSerialization()
            configureStatusPages()
            routing { distributionsRoutes(service) }
        }
        block()
    }

    @Test
    fun `returns flat list with translated protocol and uuid`() =
        testApp(recordXml) {
            val response = client.get("/api/distributions/$uuid")

            assertEquals(HttpStatusCode.OK, response.status)
            val body = response.bodyAsText()
            assertContains(body, "\"Uuid\":\"$uuid\"")
            assertContains(body, "\"Protocol\":\"WFS-tjeneste\"")
        }

    @Test
    fun `returns 404 when metadata is missing`() =
        testApp(emptyXml) {
            assertEquals(HttpStatusCode.NotFound, client.get("/api/distributions/$uuid").status)
        }

    private val wmsXml = recordXml.replace("OGC:WFS", "OGC:WMS")
    private val nameTag =
        "</gmd:protocol><gmd:name><gco:CharacterString>Lag</gco:CharacterString></gmd:name>"

    @Test
    fun `service with distribution name and WMS protocol is reported as servicelayer`() =
        testApp(wmsXml.replace("</gmd:protocol>", nameTag)) {
            val body = client.get("/api/distributions/$uuid").bodyAsText()
            assertContains(body, "\"Protocol\":\"Tjenestelag\"")
        }

    @Test
    fun `service without distribution name keeps WMS protocol`() =
        testApp(wmsXml) {
            val body = client.get("/api/distributions/$uuid").bodyAsText()
            assertContains(body, "\"Protocol\":\"WMS-tjeneste\"")
        }

    @Test
    fun `includes applications from solr for datasets`() =
        testApp(recordXml.replace("codeListValue=\"service\"", "codeListValue=\"dataset\"")) {
            val body = client.get("/api/distributions/$uuid").bodyAsText()
            assertContains(body, "\"Uuid\":\"app-uuid\"")
        }
}

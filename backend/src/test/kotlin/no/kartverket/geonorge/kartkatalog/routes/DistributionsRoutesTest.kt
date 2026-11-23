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
import io.ktor.server.routing.route
import io.ktor.server.routing.routing
import io.ktor.server.testing.testApplication
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import no.kartverket.geonorge.kartkatalog.API_V1
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
          "docs": [{"uuid": "app-uuid", "title": "Kartapplikasjon", "distribution_protocol": "OGC:WFS"}]}}"""

    private fun xmlWithFormatAndExtraTransferOption(
        formatProtocol: String,
        sourceXml: String = recordXml,
    ): String =
        sourceXml
            .replace(
                "</gmd:MD_DigitalTransferOptions>",
                """
                <gmd:onLine>
                    <gmd:CI_OnlineResource>
                        <gmd:protocol><gco:CharacterString>W3C:AtomFeed</gco:CharacterString></gmd:protocol>
                    </gmd:CI_OnlineResource>
                </gmd:onLine>
                </gmd:MD_DigitalTransferOptions>
                """.trimIndent(),
            ).replace(
                "</gmd:version>",
                """
                </gmd:version>
                <gmd:formatDistributor>
                    <gmd:MD_Distributor>
                        <gmd:distributorTransferOptions>
                            <gmd:MD_DigitalTransferOptions>
                                <gmd:onLine>
                                    <gmd:CI_OnlineResource>
                                        <gmd:protocol><gco:CharacterString>$formatProtocol</gco:CharacterString></gmd:protocol>
                                    </gmd:CI_OnlineResource>
                                </gmd:onLine>
                            </gmd:MD_DigitalTransferOptions>
                        </gmd:distributorTransferOptions>
                    </gmd:MD_Distributor>
                </gmd:formatDistributor>
                """.trimIndent(),
            )

    private fun testApp(
        xml: String,
        metadataSolr: String = datasetSolr,
        applicationSolr: String = appSolr,
        relatedXml: String = xml,
        solrStatus: HttpStatusCode = HttpStatusCode.OK,
        applicationStatus: HttpStatusCode = HttpStatusCode.OK,
        block: suspend io.ktor.server.testing.ApplicationTestBuilder.() -> Unit,
    ) = testApplication {
        var geonetworkRequests = 0
        val client =
            HttpClient(
                MockEngine { request ->
                    val path = request.url.encodedPath
                    when {
                        path.endsWith("/srv/nor/csw") -> {
                            geonetworkRequests++
                            respond(
                                if (geonetworkRequests == 1) xml else relatedXml,
                                HttpStatusCode.OK,
                                headersOf(HttpHeaders.ContentType, ContentType.Application.Xml.toString()),
                            )
                        }
                        path == "/api/kodelister/${CodeList.DISTRIBUTION_TYPES.systemId}" ->
                            respond(
                                """{"containeditems": [{"label": "WFS-tjeneste", "codevalue": "OGC:WFS"}, {"label": "WMS-tjeneste", "codevalue": "OGC:WMS"}]}""",
                                HttpStatusCode.OK,
                                json,
                            )
                        path == "/solr/metadata/select" -> respond(metadataSolr, solrStatus, json)
                        path == "/solr/applications/select" -> respond(applicationSolr, applicationStatus, json)
                        path.startsWith("/solr/") -> respond(emptySolr, solrStatus, json)
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
            routing { route(API_V1) { distributionsRoutes(service) } }
        }
        block()
    }

    @Test
    fun `returns flat list with translated protocol uuid and title`() =
        testApp(recordXml) {
            val response = client.get("/api/v1/distributions/$uuid?lang=no")

            assertEquals(HttpStatusCode.OK, response.status)
            val distribution =
                Json
                    .parseToJsonElement(response.bodyAsText())
                    .jsonArray
                    .single()
                    .jsonObject
            assertEquals(setOf("Uuid", "Protocol", "Title"), distribution.keys)
            assertEquals(uuid, distribution["Uuid"]?.jsonPrimitive?.content)
            assertEquals("WFS-tjeneste", distribution["Protocol"]?.jsonPrimitive?.content)
            assertEquals("Matrikkelen - Bygningspunkt WFS", distribution["Title"]?.jsonPrimitive?.content)
        }

    @Test
    fun `uses Norwegian localized title for Kartografi`() {
        val xml =
            recordXml.replace(
                "<gco:CharacterString>Matrikkelen - Bygningspunkt WFS</gco:CharacterString>",
                """
                <gco:CharacterString>Building points WFS</gco:CharacterString>
                <gmd:PT_FreeText>
                    <gmd:textGroup>
                        <gmd:LocalisedCharacterString locale="#NOR">Bygningspunkt WFS</gmd:LocalisedCharacterString>
                    </gmd:textGroup>
                </gmd:PT_FreeText>
                """.trimIndent(),
            )
        testApp(xml) {
            val distribution =
                Json
                    .parseToJsonElement(client.get("/api/v1/distributions/$uuid?lang=no").bodyAsText())
                    .jsonArray
                    .single()
                    .jsonObject
            assertEquals("Bygningspunkt WFS", distribution["Title"]?.jsonPrimitive?.content)
        }
    }

    @Test
    fun `related distributions use the related metadata title`() =
        testApp(
            recordXml,
            metadataSolr =
                """{"responseHeader":{"status":0,"QTime":1},"response":{"numFound":1,"start":0,
                   "docs":[{"uuid":"$uuid","type":"service","servicedataset":["related-uuid|Dataset"]}]}}""",
            relatedXml =
                recordXml
                    .replace(uuid, "related-uuid")
                    .replace("Matrikkelen - Bygningspunkt WFS", "Relatert tjeneste"),
        ) {
            val distributions =
                Json.parseToJsonElement(client.get("/api/v1/distributions/$uuid?lang=no").bodyAsText()).jsonArray
            assertEquals(
                listOf("Matrikkelen - Bygningspunkt WFS", "Relatert tjeneste"),
                distributions.map { it.jsonObject["Title"]?.jsonPrimitive?.content },
            )
            assertEquals(
                listOf(uuid, "related-uuid"),
                distributions.map { it.jsonObject["Uuid"]?.jsonPrimitive?.content },
            )
        }

    @Test
    fun `fails rather than returning an empty list when metadata is missing`() =
        testApp(emptyXml) {
            assertEquals(HttpStatusCode.InternalServerError, client.get("/api/v1/distributions/$uuid").status)
        }

    @Test
    fun `returns own distributions when metadata Solr lookup fails`() =
        testApp(recordXml, solrStatus = HttpStatusCode.InternalServerError) {
            val response = client.get("/api/v1/distributions/$uuid")
            assertEquals(HttpStatusCode.OK, response.status)
            val distributions = Json.parseToJsonElement(response.bodyAsText()).jsonArray
            assertEquals(listOf(uuid), distributions.map { it.jsonObject["Uuid"]?.jsonPrimitive?.content })
        }

    @Test
    fun `returns own distributions when application Solr lookup fails`() =
        testApp(
            recordXml.replace("codeListValue=\"service\"", "codeListValue=\"dataset\""),
            applicationStatus = HttpStatusCode.InternalServerError,
        ) {
            val response = client.get("/api/v1/distributions/$uuid")
            assertEquals(HttpStatusCode.OK, response.status)
            val distributions = Json.parseToJsonElement(response.bodyAsText()).jsonArray
            assertEquals(listOf(uuid), distributions.map { it.jsonObject["Uuid"]?.jsonPrimitive?.content })
        }

    @Test
    fun `does not return a partial list when related metadata is missing`() =
        testApp(
            recordXml,
            metadataSolr =
                """{"responseHeader":{"status":0,"QTime":1},"response":{"numFound":1,"start":0,
                   "docs":[{"uuid":"$uuid","type":"service","servicedataset":["missing-related|Dataset"]}]}}""",
            relatedXml = emptyXml,
        ) {
            val response = client.get("/api/v1/distributions/$uuid")
            assertEquals(HttpStatusCode.InternalServerError, response.status)
        }

    private val wmsXml = recordXml.replace("OGC:WFS", "OGC:WMS")
    private val nameTag =
        "</gmd:protocol><gmd:name><gco:CharacterString>Lag</gco:CharacterString></gmd:name>"

    @Test
    fun `service with distribution name and WMS protocol is reported as servicelayer`() =
        testApp(wmsXml.replace("</gmd:protocol>", nameTag)) {
            val body = client.get("/api/v1/distributions/$uuid").bodyAsText()
            assertContains(body, "\"Protocol\":\"Tjenestelag\"")
        }

    @Test
    fun `service without distribution name keeps WMS protocol`() =
        testApp(wmsXml) {
            val body = client.get("/api/v1/distributions/$uuid").bodyAsText()
            assertContains(body, "\"Protocol\":\"WMS-tjeneste\"")
        }

    @Test
    fun `name on format resource does not turn WMS into service layer`() {
        val xml =
            xmlWithFormatAndExtraTransferOption("OGC:WMS")
                .replace(
                    "<gco:CharacterString>OGC:WMS</gco:CharacterString></gmd:protocol>",
                    "<gco:CharacterString>OGC:WMS</gco:CharacterString>$nameTag",
                )
        testApp(xml) {
            val distributions =
                Json
                    .parseToJsonElement(
                        client.get("/api/v1/distributions/$uuid").bodyAsText(),
                    ).jsonArray
            assertEquals(
                listOf("WMS-tjeneste", "W3C:AtomFeed"),
                distributions.map { it.jsonObject["Protocol"]?.jsonPrimitive?.content },
            )
        }
    }

    @Test
    fun `name on first shared resource turns format WMS into service layer`() =
        testApp(xmlWithFormatAndExtraTransferOption("OGC:WMS", wmsXml.replace("</gmd:protocol>", nameTag))) {
            val distributions =
                Json
                    .parseToJsonElement(
                        client.get("/api/v1/distributions/$uuid").bodyAsText(),
                    ).jsonArray
            assertEquals(
                listOf("Tjenestelag", "W3C:AtomFeed"),
                distributions.map { it.jsonObject["Protocol"]?.jsonPrimitive?.content },
            )
        }

    @Test
    fun `includes later shared transfer options even when format has its own protocol`() =
        testApp(xmlWithFormatAndExtraTransferOption("OGC:WMS")) {
            val distributions =
                Json
                    .parseToJsonElement(
                        client.get("/api/v1/distributions/$uuid").bodyAsText(),
                    ).jsonArray
            assertEquals(
                listOf("WMS-tjeneste", "W3C:AtomFeed"),
                distributions.map { it.jsonObject["Protocol"]?.jsonPrimitive?.content },
            )
            assertEquals(listOf(uuid, uuid), distributions.map { it.jsonObject["Uuid"]?.jsonPrimitive?.content })
        }

    @Test
    fun `uses first shared transfer option when format protocol is empty`() =
        testApp(xmlWithFormatAndExtraTransferOption("")) {
            val distributions =
                Json
                    .parseToJsonElement(
                        client.get("/api/v1/distributions/$uuid").bodyAsText(),
                    ).jsonArray
            assertEquals(
                listOf("WFS-tjeneste", "W3C:AtomFeed"),
                distributions.map { it.jsonObject["Protocol"]?.jsonPrimitive?.content },
            )
        }

    @Test
    fun `includes applications from solr for datasets`() =
        testApp(recordXml.replace("codeListValue=\"service\"", "codeListValue=\"dataset\"")) {
            val distributions =
                Json
                    .parseToJsonElement(
                        client.get("/api/v1/distributions/$uuid?lang=no").bodyAsText(),
                    ).jsonArray
            val application =
                distributions
                    .single { it.jsonObject["Uuid"]?.jsonPrimitive?.content == "app-uuid" }
                    .jsonObject
            assertEquals("Kartapplikasjon", application["Title"]?.jsonPrimitive?.content)
            assertEquals("WFS-tjeneste", application["Protocol"]?.jsonPrimitive?.content)
        }
}

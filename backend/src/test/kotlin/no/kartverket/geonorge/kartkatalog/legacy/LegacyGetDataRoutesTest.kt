package no.kartverket.geonorge.kartkatalog.legacy

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.headersOf
import io.ktor.server.routing.routing
import io.ktor.server.testing.testApplication
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.GeonetworkClient
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.legacy.LegacyMetadataService
import no.kartverket.geonorge.kartkatalog.legacy.legacyMetadataRoutes
import no.kartverket.geonorge.kartkatalog.metadata.CodeListTranslator
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class LegacyGetDataRoutesTest {
    private val responseXml =
        javaClass.classLoader
            .getResourceAsStream("response.xml")!!
            .readBytes()
            .toString(Charsets.UTF_8)
    private val emptyXml =
        """<?xml version="1.0"?><csw:GetRecordByIdResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2"/>"""

    private fun app(
        xml: String,
        block: suspend io.ktor.server.testing.ApplicationTestBuilder.() -> Unit,
    ) = testApplication {
        val json = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString())
        val http =
            HttpClient(
                MockEngine { request ->
                    when {
                        request.url.encodedPath.endsWith("/srv/nor/csw") ->
                            respond(xml, HttpStatusCode.OK, headersOf(HttpHeaders.ContentType, "application/xml"))
                        request.url.encodedPath.startsWith("/api/kodelister") ->
                            respond("""{"containeditems": []}""", HttpStatusCode.OK, json)
                        else ->
                            respond(
                                """{"response": {"numFound": 0, "start": 0, "docs": []}}""",
                                HttpStatusCode.OK,
                                json,
                            )
                    }
                },
            )
        val service =
            LegacyMetadataService(
                GeonetworkClient(http, "https://geonetwork.test"),
                SolrClient(http, "https://solr.test"),
                CodeListTranslator(RegisterClient(http, "https://register.test")),
                "https://norgeskart.test",
            )
        application { routing { legacyMetadataRoutes(service) } }
        block()
    }

    @Test
    fun `returns PascalCase metadata and omits null fields`() =
        app(responseXml) {
            val response = client.get("/api/getdata/c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689")

            assertEquals(HttpStatusCode.OK, response.status)
            val body = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            assertEquals("c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689", body["Uuid"]?.jsonPrimitive?.content)
            assertTrue(body["Title"]?.jsonPrimitive?.content?.contains("Matrikkelen") == true)
            assertNotNull(body["ContactMetadata"])
            assertFalse(body.containsKey("Distributions"))
            assertFalse(body.containsKey("ServiceDistributionUrlForDataset"))
        }

    @Test
    fun `returns 404 when record is missing`() =
        app(emptyXml) {
            val response = client.get("/api/getdata/00000000-0000-0000-0000-000000000000")

            assertEquals(HttpStatusCode.NotFound, response.status)
        }
}

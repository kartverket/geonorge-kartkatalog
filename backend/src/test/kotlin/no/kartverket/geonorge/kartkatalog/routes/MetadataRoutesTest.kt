package no.kartverket.geonorge.kartkatalog.routes

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.headersOf
import io.ktor.server.routing.routing
import io.ktor.server.testing.testApplication
import no.kartverket.geonorge.kartkatalog.client.GeonetworkClient
import no.kartverket.geonorge.kartkatalog.config.configureHttp
import no.kartverket.geonorge.kartkatalog.config.configureSerialization
import no.kartverket.geonorge.kartkatalog.config.configureStatusPages
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals

class MetadataRoutesTest {
    private val responseXml =
        javaClass.classLoader
            .getResourceAsStream("response.xml")!!
            .readBytes()
            .toString(Charsets.UTF_8)

    private fun clientReturning(xml: String): GeonetworkClient {
        val engine =
            MockEngine {
                respond(
                    content = xml,
                    status = HttpStatusCode.OK,
                    headers = headersOf("Content-Type", ContentType.Application.Xml.toString()),
                )
            }
        return GeonetworkClient(HttpClient(engine))
    }

    private fun testApp(
        geonetworkClient: GeonetworkClient,
        block: suspend io.ktor.server.testing.ApplicationTestBuilder.() -> Unit,
    ) = testApplication {
        application {
            configureHttp()
            configureSerialization()
            configureStatusPages()
            routing { metadataRoutes(geonetworkClient) }
        }
        block()
    }

    @Test
    fun `returns 200 with JSON for valid uuid`() =
        testApp(clientReturning(responseXml)) {
            val response = client.get("/metadata/c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689")
            assertEquals(HttpStatusCode.OK, response.status)
            assertContains(response.bodyAsText(), "Matrikkelen - Bygningspunkt WFS")
        }

    @Test
    fun `returns 404 when record not found`() {
        val emptyResponse =
            """<?xml version="1.0"?><csw:GetRecordByIdResponse xmlns:csw="http://www.opengis.net/cat/csw/2.0.2"/>"""
        testApp(clientReturning(emptyResponse)) {
            val response = client.get("/metadata/unknown-uuid")
            assertEquals(HttpStatusCode.NotFound, response.status)
        }
    }
}

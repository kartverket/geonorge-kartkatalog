package no.kartverket.geonorge.kartkatalog.client

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.http.content.TextContent
import kotlinx.coroutines.runBlocking
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.CswExceptionReportException
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.CswRecordClient
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.GeoNetworkException
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.MetClient
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.MetFallbackMetadataRecordSource
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.MetadataParser
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.MetadataRecordSource
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.metrics.UpstreamMetricsRecorder
import java.time.LocalDate
import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertSame

class MetFallbackMetadataRecordSourceTest {
    private val metrics = UpstreamMetricsRecorder()
    private val clients = mutableListOf<HttpClient>()
    private val metUuid = "no.met:8d0d15d7-aba6-46fa-93cd-d0322cab7252"
    private val metXml = javaClass.classLoader.getResource("met-response.xml")!!.readText()
    private val record = MetadataParser.parse(metXml.byteInputStream())

    @AfterTest
    fun tearDown() {
        clients.forEach { it.close() }
        metrics.close()
    }

    private class RecordingSource(
        private val answer: () -> MetadataRecord?,
    ) : MetadataRecordSource {
        val requested = mutableListOf<String>()

        override suspend fun getRecordByUuid(uuid: String): MetadataRecord? {
            requested += uuid
            return answer()
        }
    }

    @Test
    fun `identifiers without the MET prefix are never looked up at MET`() =
        runBlocking {
            val met = RecordingSource { record }
            val source = MetFallbackMetadataRecordSource(RecordingSource { null }, met)

            assertNull(source.getRecordByUuid("c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689"))
            assertEquals(emptyList(), met.requested)
        }

    @Test
    fun `MET identifiers missing from our GeoNetwork are fetched from MET`() =
        runBlocking {
            val met = RecordingSource { record }
            val source = MetFallbackMetadataRecordSource(RecordingSource { null }, met)

            assertSame(record, source.getRecordByUuid(metUuid))
            assertEquals(listOf(metUuid), met.requested)
        }

    @Test
    fun `MET identifiers are fetched from MET when our GeoNetwork returns a CSW ExceptionReport`() =
        runBlocking {
            val met = RecordingSource { record }
            val primary = RecordingSource { throw CswExceptionReportException("CSW ExceptionReport") }
            val source = MetFallbackMetadataRecordSource(primary, met)

            assertSame(record, source.getRecordByUuid(metUuid))
            assertEquals(listOf(metUuid), primary.requested)
            assertEquals(listOf(metUuid), met.requested)
        }

    @Test
    fun `CSW ExceptionReports for non-MET identifiers are not sent to MET`() {
        val met = RecordingSource { error("MET should not be called") }
        val primary = RecordingSource { throw CswExceptionReportException("CSW ExceptionReport") }
        val source = MetFallbackMetadataRecordSource(primary, met)

        assertFailsWith<CswExceptionReportException> {
            runBlocking { source.getRecordByUuid("c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689") }
        }
        assertEquals(emptyList(), met.requested)
    }

    @Test
    fun `other primary failures for MET identifiers do not fall back to MET`() {
        val met = RecordingSource { record }
        val source =
            MetFallbackMetadataRecordSource(RecordingSource { throw GeoNetworkException("HTTP 500") }, met)

        assertFailsWith<GeoNetworkException> { runBlocking { source.getRecordByUuid(metUuid) } }
        assertEquals(emptyList(), met.requested)
    }

    @Test
    fun `MET identifiers found in our GeoNetwork do not hit MET`() =
        runBlocking {
            val met = RecordingSource { error("MET should not be called") }
            val source = MetFallbackMetadataRecordSource(RecordingSource { record }, met)

            assertSame(record, source.getRecordByUuid(metUuid))
        }

    @Test
    fun `MET failures are not hidden as missing records`() {
        val met = RecordingSource { throw GeoNetworkException("MET down") }
        val source = MetFallbackMetadataRecordSource(RecordingSource { null }, met)

        assertFailsWith<GeoNetworkException> { runBlocking { source.getRecordByUuid(metUuid) } }
    }

    @Test
    fun `MET request uses the legacy URL, ISO 19139 schema and an escaped id`() =
        runBlocking {
            var url = ""
            var method = HttpMethod.Get
            var body = ""
            val httpClient =
                HttpClient(
                    MockEngine { request ->
                        url = request.url.toString()
                        method = request.method
                        body = (request.body as TextContent).text
                        respond(content = metXml, status = HttpStatusCode.OK)
                    },
                )
            clients += httpClient
            val client = MetClient(httpClient, "https://data.csw.met.no/?")

            val parsed = client.getRecordByUuid("no.met:a<b&c")

            assertEquals(metUuid, parsed?.uuid)
            assertEquals(HttpMethod.Post, method)
            assertEquals("https://data.csw.met.no/?srv/nor/csw", url)
            assertContains(body, """outputSchema="http://www.isotc211.org/2005/gmd"""")
            assertContains(body, "<csw:Id>no.met:a&lt;b&amp;c</csw:Id>")
            assertContains(body, "<csw:ElementSetName>full</csw:ElementSetName>")
            assertEquals(1, metrics.count("met_csw", "get_record_by_id", "success"))
        }

    @Test
    fun `CSW ExceptionReport is exposed as a fallback-eligible exception`() {
        runBlocking {
            val httpClient =
                HttpClient(
                    MockEngine {
                        respond(
                            content = """<ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows"/>""",
                            status = HttpStatusCode.OK,
                        )
                    },
                )
            clients += httpClient
            val client = CswRecordClient(httpClient, "https://geonetwork.example.test/csw", "schema", "geonetwork")

            assertFailsWith<CswExceptionReportException> {
                client.getRecordByUuid(metUuid)
            }
        }
    }

    @Test
    fun `time series members are fetched with the legacy GetRecords query`() =
        runBlocking {
            val bodies = mutableListOf<String>()
            val httpClient =
                HttpClient(
                    MockEngine { request ->
                        bodies += (request.body as TextContent).text
                        respond(
                            content = javaClass.getResource("/met-time-series-response.xml")!!.readText(),
                            status = HttpStatusCode.OK,
                        )
                    },
                )
            clients += httpClient
            val client = MetClient(httpClient, "https://data.csw.met.no/?") { LocalDate.of(2026, 11, 24) }

            val members = client.getTimeSeriesMembers("no.met:series&1")
            client.getTimeSeriesMembers("no.met:9fbe6a04-279c-46b8-a582-bb08f4b11794")

            assertEquals(2, members.size)
            val body = bodies.first()
            assertContains(body, "<csw:GetRecords")
            assertContains(body, """resultType="results"""")
            assertContains(body, """startPosition="1"""")
            assertContains(body, """maxRecords="100"""")
            assertContains(body, """outputSchema="http://www.isotc211.org/2005/gmd"""")
            assertContains(
                body,
                "<ogc:PropertyName>apiso:ParentIdentifier</ogc:PropertyName><ogc:Literal>no.met:series&amp;1</ogc:Literal>",
            )
            assertContains(
                body,
                "<ogc:PropertyName>apiso:TempExtent_begin</ogc:PropertyName><ogc:Literal>1906-11-24</ogc:Literal>",
            )
            assertContains(
                body,
                "<ogc:PropertyName>apiso:TempExtent_end</ogc:PropertyName><ogc:Literal>2026-11-24</ogc:Literal>",
            )
            assertContains(body, "<ogc:PropertyName>dc:date</ogc:PropertyName><ogc:SortOrder>DESC</ogc:SortOrder>")
            assertFalse(bodies.last().contains("apiso:TempExtent_end"))
            assertEquals(2, metrics.count("met_csw", "get_records", "success"))
        }
}

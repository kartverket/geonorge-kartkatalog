package no.kartverket.geonorge.kartkatalog.client

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.headersOf
import io.ktor.serialization.kotlinx.json.json
import kotlinx.coroutines.runBlocking
import no.kartverket.geonorge.kartkatalog.integrations.register.CodeList
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterException
import kotlin.test.AfterTest
import kotlin.test.BeforeTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class RegisterClientTest {
    private var capturedPath: String? = null
    private var responseContent: String = """{"containeditems": []}"""
    private var responseStatus: HttpStatusCode = HttpStatusCode.OK

    private lateinit var engine: MockEngine
    private lateinit var httpClient: HttpClient
    private lateinit var client: RegisterClient

    private val registerBaseUrl = "https://test.example.com"

    @BeforeTest
    fun setUp() {
        engine =
            MockEngine { request ->
                capturedPath = request.url.encodedPath
                respond(
                    content = responseContent,
                    status = responseStatus,
                    headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                )
            }
        httpClient = HttpClient(engine) { install(ContentNegotiation) { json() } }
        client = RegisterClient(httpClient, registerBaseUrl)
    }

    @AfterTest
    fun tearDown() {
        httpClient.close()
    }

    private fun mockResponse(
        content: String,
        status: HttpStatusCode = HttpStatusCode.OK,
    ) {
        capturedPath = null
        responseContent = content
        responseStatus = status
    }

    @Test
    fun `getCodeList hits correct path and parses response`() =
        runBlocking {
            mockResponse("""{"containeditems": [{"label": "Basisdata", "codevalue": "baseMaps"}]}""")
            val response = client.getCodeList(CodeList.DISTRIBUTION_TYPES)
            assertEquals("/api/kodelister/${CodeList.DISTRIBUTION_TYPES.systemId}", capturedPath)
            assertEquals(1, response.containedItems.size)
            assertEquals("Basisdata", response.containedItems.first().label)
            assertEquals("baseMaps", response.containedItems.first().codeValue)
        }

    @Test
    fun `getCodeListByName hits correct path and parses response`() =
        runBlocking {
            mockResponse("""{"containeditems": [{"label": "Forvaltning", "codevalue": "forvaltning"}]}""")
            val response = client.getCodeListByName("brukergrupper")
            assertEquals("/api/metadata-kodelister/brukergrupper", capturedPath)
            assertEquals(1, response.containedItems.size)
            assertEquals("Forvaltning", response.containedItems.first().label)
        }

    @Test
    fun `getSubRegister hits correct path and parses response`() =
        runBlocking {
            mockResponse("""{"containeditems": [{"label": "Grunnleggende", "id": "1"}]}""")
            val response = client.getSubRegister("metadata-kodelister/kartverket/norge-digitalt-tjenesteerklaering")
            assertEquals(
                "/api/subregister/metadata-kodelister/kartverket/norge-digitalt-tjenesteerklaering",
                capturedPath,
            )
            assertEquals(1, response.containedItems.size)
            assertEquals("Grunnleggende", response.containedItems.first().label)
        }

    @Test
    fun `getOrganizations hits correct path and parses response`() =
        runBlocking {
            mockResponse("""{"containeditems": [{"label": "Kartverket", "ShortName": "KV"}]}""")
            val response = client.getOrganizations()
            assertEquals("/api/register/organisasjoner", capturedPath)
            assertEquals(1, response.containedItems.size)
            assertEquals("Kartverket", response.containedItems.first().label)
            assertEquals("KV", response.containedItems.first().shortName)
        }

    @Test
    fun `throws RegisterException on non-success status`() =
        runBlocking {
            mockResponse(content = "", status = HttpStatusCode.InternalServerError)
            assertFailsWith<RegisterException> {
                client.getCodeList(CodeList.DISTRIBUTION_TYPES)
            }
            Unit
        }

    @Test
    fun `getTegneregler returns item on success`() =
        runBlocking {
            mockResponse(
                """{"id": "https://register.geonorge.no/tegneregler/test-kart",
                   "label": "Test Kart",
                   "status": "Gyldig",
                   "seoname": "test-kart",
                   "CartographyFile": "https://example.com/test-kart.zip"}""",
            )
            val result = client.getTegneregler("test-kart")
            assertEquals("/api/tegneregler/test-kart", capturedPath)
            assertNotNull(result)
            assertEquals("Test Kart", result.label)
            assertEquals("Gyldig", result.status)
            assertEquals("https://example.com/test-kart.zip", result.cartographyFile)
        }

    @Test
    fun `getTegneregler returns null on 404`() =
        runBlocking {
            mockResponse(content = "", status = HttpStatusCode.NotFound)
            val result = client.getTegneregler("ukjent-kart")
            assertNull(result)
        }

    @Test
    fun `getTegneregler throws RegisterException on server error`() =
        runBlocking {
            mockResponse(content = "", status = HttpStatusCode.InternalServerError)
            assertFailsWith<RegisterException> {
                client.getTegneregler("feil-kart")
            }
            Unit
        }

    @Test
    fun `getTegneregler throws RegisterException on invalid JSON`() =
        runBlocking {
            mockResponse(content = "not-json", status = HttpStatusCode.OK)
            assertFailsWith<RegisterException> {
                client.getTegneregler("test-kart")
            }
            Unit
        }

    @Test
    fun `getProduktark returns item on success`() =
        runBlocking {
            mockResponse(
                """{"id": "https://register.geonorge.no/produktark/test-produkt",
                   "label": "Test Produkt",
                   "status": "Gyldig",
                   "seoname": "test-produkt",
                   "documentreference": "https://example.com/test-produkt.pdf"}""",
            )
            val result = client.getProduktark("test-produkt")
            assertEquals("/api/produktark/test-produkt", capturedPath)
            assertNotNull(result)
            assertEquals("Test Produkt", result.label)
            assertEquals("Gyldig", result.status)
            assertEquals("https://example.com/test-produkt.pdf", result.documentreference)
        }

    @Test
    fun `getProduktark returns null on 404`() =
        runBlocking {
            mockResponse(content = "", status = HttpStatusCode.NotFound)
            val result = client.getProduktark("ukjent-produkt")
            assertNull(result)
        }

    @Test
    fun `getProduktark throws RegisterException on server error`() =
        runBlocking {
            mockResponse(content = "", status = HttpStatusCode.InternalServerError)
            assertFailsWith<RegisterException> {
                client.getProduktark("feil-produkt")
            }
            Unit
        }

    @Test
    fun `getProduktark throws RegisterException on invalid JSON`() =
        runBlocking {
            mockResponse(content = "not-json", status = HttpStatusCode.OK)
            assertFailsWith<RegisterException> {
                client.getProduktark("test-produkt")
            }
            Unit
        }

    @Test
    fun `getProduktspesifikasjon returns item on success`() =
        runBlocking {
            mockResponse(
                """{"id": "https://register.geonorge.no/register/versjoner/produktspesifikasjoner/test-produkt",
                   "label": "Test Produktspesifikasjon",
                   "status": "Gyldig",
                   "seoname": "test-produkt",
                   "GMLApplicationSchema": "https://example.com/test-produktspesifikasjon.gml",
                   "ApplicationSchema": "https://example.com/test-produktspesifikasjon.uml",
                   "documentreference": "https://example.com/test-produktspesifikasjon.pdf"}""",
            )
            val result = client.getProduktspesifikasjon("test-produkt")
            assertEquals("/api/produktspesifikasjoner/test-produkt", capturedPath)
            assertNotNull(result)
            assertEquals("Test Produktspesifikasjon", result.label)
            assertEquals("Gyldig", result.status)
            assertEquals(
                "https://example.com/test-produktspesifikasjon.gml",
                result.gmlApplicationSchema,
            )
            assertEquals(
                "https://example.com/test-produktspesifikasjon.uml",
                result.applicationSchema,
            )
            assertEquals("https://example.com/test-produktspesifikasjon.pdf", result.documentreference)
        }

    @Test
    fun `getProduktspesifikasjon returns null on 404`() =
        runBlocking {
            mockResponse(content = "", status = HttpStatusCode.NotFound)
            val result = client.getProduktspesifikasjon("ukjent-produkt")
            assertNull(result)
        }

    @Test
    fun `getProduktspesifikasjon throws RegisterException on server error`() =
        runBlocking {
            mockResponse(content = "", status = HttpStatusCode.InternalServerError)
            assertFailsWith<RegisterException> {
                client.getProduktspesifikasjon("feil-produkt")
            }
            Unit
        }

    @Test
    fun `getProduktspesifikasjon throws RegisterException on invalid JSON`() =
        runBlocking {
            mockResponse(content = "not-json", status = HttpStatusCode.OK)
            assertFailsWith<RegisterException> {
                client.getProduktspesifikasjon("test-produkt")
            }
            Unit
        }
}

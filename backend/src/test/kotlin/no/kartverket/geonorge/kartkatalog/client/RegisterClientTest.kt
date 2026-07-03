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

class RegisterClientTest {
    private var capturedPath: String? = null
    private var responseContent: String = """{"containeditems": []}"""
    private var responseStatus: HttpStatusCode = HttpStatusCode.OK

    private lateinit var engine: MockEngine
    private lateinit var httpClient: HttpClient
    private lateinit var client: RegisterClient

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
        client = RegisterClient(httpClient)
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
}

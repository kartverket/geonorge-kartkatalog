package no.kartverket.geonorge.kartkatalog.metadata

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
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class CodeListTranslatorTest {
    private val registerBaseUrl = "https://test.example.com/register"

    @Test
    fun `translate returns label when value matches codevalue`() =
        runBlocking {
            val translator =
                createTranslator(
                    responseContent = """{"containeditems": [{"label": "Continual", "codevalue": "continual"}]}""",
                )

            val translated = translator.translate(CodeList.MAINTENANCE_FREQUENCY, "continual")

            assertEquals("Continual", translated)
        }

    @Test
    fun `translate returns null for blank input`() =
        runBlocking {
            val translator = createTranslator(responseContent = """{"containeditems": []}""")

            val translated = translator.translate(CodeList.MAINTENANCE_FREQUENCY, " ")

            assertNull(translated)
        }

    @Test
    fun `translate falls back to original value when register call fails`() =
        runBlocking {
            val translator =
                createTranslator(
                    responseContent = "{}",
                    responseStatus = HttpStatusCode.InternalServerError,
                )

            val translated = translator.translate(CodeList.SPATIAL_REPRESENTATIONS, "vector")

            assertEquals("vector", translated)
        }

    private fun createTranslator(
        responseContent: String,
        responseStatus: HttpStatusCode = HttpStatusCode.OK,
    ): CodeListTranslator {
        val engine =
            MockEngine {
                respond(
                    content = responseContent,
                    status = responseStatus,
                    headers = headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                )
            }
        val client = HttpClient(engine) { install(ContentNegotiation) { json() } }
        val registerClient = RegisterClient(client, registerBaseUrl)
        return CodeListTranslator(registerClient)
    }
}

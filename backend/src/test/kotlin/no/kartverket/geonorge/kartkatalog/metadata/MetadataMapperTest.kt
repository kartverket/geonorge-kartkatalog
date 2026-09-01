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
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.Contact
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.LegalConstraints
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.metadata.models.AccessState
import kotlin.test.Test
import kotlin.test.assertEquals

class MetadataMapperTest {
    private val registerBaseUrl = "https://test.example.com/register"
    private val staticNorgeskartUrl = "https://test.example.com/register"

    @Test
    fun `maps open data access state and access constraints`() =
        runBlocking {
            val mapper =
                MetadataMapper(createTranslator(responseContent = """{"containeditems": []}"""), staticNorgeskartUrl)
            val record =
                minimalRecord(
                    legalConstraints =
                        LegalConstraints(
                            accessConstraints = "fallback",
                            otherConstraintsAccess = "åpne data",
                        ),
                )

            val mapped = mapper.toProductMetadata(record)

            assertEquals(AccessState.OPEN, mapped.accessState)
            assertEquals("Åpne data", mapped.constraints?.accessConstraints)
        }

    @Test
    fun `maps use constraints through code list translator`() =
        runBlocking {
            val mapper =
                MetadataMapper(
                    createTranslator(
                        responseContent = """{"containeditems": [{"label": "Lisens", "codevalue": "license"}]}""",
                    ),
                    staticNorgeskartUrl = staticNorgeskartUrl,
                )
            val record =
                minimalRecord(
                    legalConstraints =
                        LegalConstraints(
                            useConstraints = "ignored",
                            otherConstraintsLink = "https://example.com/license",
                        ),
                )

            val mapped = mapper.toProductMetadata(record)

            assertEquals("Lisens", mapped.constraints?.useConstraints)
        }

    private fun minimalRecord(legalConstraints: LegalConstraints? = null): MetadataRecord =
        MetadataRecord(
            uuid = "c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689",
            language = "nor",
            hierarchyLevel = "dataset",
            dateStamp = "2024-01-01",
            metadataContact = Contact(role = "pointOfContact", organization = "Kartverket"),
            title = "Test dataset",
            legalConstraints = legalConstraints,
        )

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

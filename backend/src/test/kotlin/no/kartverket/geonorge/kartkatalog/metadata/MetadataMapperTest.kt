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
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.DistributionFormat
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.DistributionInfo
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.LegalConstraints
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.OnlineResource
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.metadata.models.AccessState
import kotlin.test.Test
import kotlin.test.assertContentEquals
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

    @Test
    fun `groups distribution resources by actual protocol without swallowing other protocols`() =
        runBlocking {
            val mapper =
                MetadataMapper(createTranslator(responseContent = """{"containeditems": []}"""), staticNorgeskartUrl)
            val record =
                minimalRecord(
                    distributionInfo =
                        DistributionInfo(
                            formats =
                                listOf(
                                    DistributionFormat(
                                        name = "GML",
                                        version = "3.2",
                                        onlineResources =
                                            listOf(
                                                OnlineResource(
                                                    url = "https://example.com/download",
                                                    protocol = "WWW:DOWNLOAD-1.0-http--download",
                                                    unitsOfDistribution = "Kommune",
                                                ),
                                                OnlineResource(
                                                    url = "https://example.com/wfs",
                                                    protocol = "OGC:WFS",
                                                    unitsOfDistribution = "Kommune",
                                                ),
                                            ),
                                    ),
                                    DistributionFormat(
                                        name = "GeoJSON",
                                        onlineResources =
                                            listOf(
                                                OnlineResource(
                                                    url = "https://example.com/download",
                                                    protocol = "WWW:DOWNLOAD-1.0-http--download",
                                                    unitsOfDistribution = "Kommune",
                                                ),
                                                OnlineResource(
                                                    url = "https://example.com/wfs",
                                                    protocol = "OGC:WFS",
                                                    unitsOfDistribution = "Kommune",
                                                ),
                                            ),
                                    ),
                                ),
                        ),
                )

            val mapped = mapper.toProductMetadata(record)

            assertEquals(2, mapped.distributionGroups.size)

            val downloadGroup = mapped.distributionGroups.first { it.protocol == "WWW:DOWNLOAD-1.0-http--download" }
            assertEquals(1, downloadGroup.entries.size)
            assertEquals("https://example.com/download", downloadGroup.entries[0].url)
            assertContentEquals(listOf("GML", "GeoJSON"), downloadGroup.entries[0].formatNames)
            assertEquals("Kommune", downloadGroup.unitsOfDistribution)

            val wfsGroup = mapped.distributionGroups.first { it.protocol == "OGC:WFS" }
            assertEquals(1, wfsGroup.entries.size)
            assertEquals("https://example.com/wfs", wfsGroup.entries[0].url)
            assertContentEquals(listOf("GML", "GeoJSON"), wfsGroup.entries[0].formatNames)
        }

    private fun minimalRecord(
        legalConstraints: LegalConstraints? = null,
        distributionInfo: DistributionInfo? = null,
    ): MetadataRecord =
        MetadataRecord(
            uuid = "c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689",
            language = "nor",
            hierarchyLevel = "dataset",
            dateStamp = "2024-01-01",
            metadataContact = Contact(role = "pointOfContact", organization = "Kartverket"),
            title = "Test dataset",
            legalConstraints = legalConstraints,
            distributionInfo = distributionInfo,
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

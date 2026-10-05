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
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.Keyword
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.KeywordGroup
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.LegalConstraints
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.OnlineResource
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrDocument
import no.kartverket.geonorge.kartkatalog.metadata.models.AccessState
import kotlin.test.Test
import kotlin.test.assertContentEquals
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

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
    fun `legacy mapping maps open-data constraints from no limitations access`() =
        runBlocking {
            val mapper =
                MetadataMapper(
                    createTranslator(
                        responseContent =
                            """{"containeditems": [{"label": "Lisens", "codevalue": "license"}]}""",
                    ),
                    staticNorgeskartUrl,
                )
            val record =
                minimalRecord(
                    legalConstraints =
                        LegalConstraints(
                            accessConstraints = "otherRestrictions",
                            accessConstraintsLink =
                                "https://inspire.example/LimitationsOnPublicAccess/noLimitations",
                            otherConstraintsAccess =
                                "https://inspire.example/LimitationsOnPublicAccess/noLimitations",
                            useConstraints = "otherRestrictions",
                            otherConstraintsLink = "https://creativecommons.org/licenses/by/4.0/",
                            otherConstraints = "Metadata-specific restriction text",
                            useLimitations = listOf("Ingen begrensninger på bruk er oppgitt."),
                        ),
                )

            val mapped = mapper.toLegacyMetadataViewModel(record)

            assertEquals("Åpne data", mapped.constraints?.accessConstraints)
            assertEquals("Åpne data", mapped.dataAccess)
            assertEquals("Metadata-specific restriction text", mapped.constraints?.otherConstraints)
            assertEquals("Lisens", mapped.constraints?.useConstraints)
            assertEquals("Ingen begrensninger på bruk er oppgitt.", mapped.constraints?.useLimitations)
            assertFalse(mapped.accessIsRestricted)
            assertFalse(mapped.accessIsProtected)
            assertTrue(mapped.accessIsOpendata)
        }

    @Test
    fun `legacy mapping maps Norway digital restricted constraints from article 13 access`() =
        runBlocking {
            val mapper = MetadataMapper(createTranslator("""{"containeditems": []}"""), staticNorgeskartUrl)
            val record =
                minimalRecord(
                    legalConstraints =
                        LegalConstraints(
                            accessConstraints = "otherRestrictions",
                            accessConstraintsLink =
                                "https://inspire.example/LimitationsOnPublicAccess/INSPIRE_Directive_Article13_1d",
                            otherConstraintsAccess =
                                "https://inspire.example/LimitationsOnPublicAccess/INSPIRE_Directive_Article13_1d",
                            otherConstraints = "ingen juridiske begrensninger",
                        ),
                )

            val mapped = mapper.toLegacyMetadataViewModel(record)

            assertEquals("Norge digitalt begrenset", mapped.constraints?.accessConstraints)
            assertEquals("Norge digitalt begrenset", mapped.dataAccess)
            assertEquals("ingen juridiske begrensninger", mapped.constraints?.otherConstraints)
            assertTrue(mapped.accessIsRestricted)
            assertFalse(mapped.accessIsOpendata)
        }

    @Test
    fun `legacy mapping emits empty strings for absent constraint text fields`() =
        runBlocking {
            val mapper = MetadataMapper(createTranslator("""{"containeditems": []}"""), staticNorgeskartUrl)
            val mapped =
                mapper.toLegacyMetadataViewModel(
                    minimalRecord(legalConstraints = LegalConstraints(accessConstraints = "otherRestrictions")),
                )

            assertEquals("", mapped.constraints?.otherConstraints)
            assertEquals("", mapped.constraints?.securityConstraintsNote)
        }

    @Test
    fun `legacy mapping preserves distribution protocol fields group details and service link`() =
        runBlocking {
            val mapper =
                MetadataMapper(
                    createTranslator(
                        """{"containeditems": [{"label": "Webside", "codevalue": "WWW:LINK-1.0-http--link"}]}""",
                    ),
                    staticNorgeskartUrl,
                )
            val record =
                minimalRecord(
                    distributionInfo =
                        DistributionInfo(
                            formats =
                                listOf(
                                    DistributionFormat(
                                        name = "HTML",
                                        onlineResources =
                                            listOf(
                                                OnlineResource(
                                                    url = "https://example.com/website",
                                                    protocol = "WWW:LINK-1.0-http--link",
                                                ),
                                            ),
                                    ),
                                ),
                        ),
                )

            val mapped =
                mapper.toLegacyMetadataViewModel(
                    record,
                    SolrDocument(
                        uuid = record.uuid,
                        serviceDistributionProtocolForDataset = "OGC:WMS",
                        serviceDistributionUrlForDataset = "https://example.com/wms?service=WMS",
                        serviceDistributionNameForDataset = "test-layer",
                    ),
                )
            val distribution = mapped.distributionsFormats!!.single()
            val group = mapped.distributionFormatsGrouped!!.single()

            assertEquals("WWW:LINK-1.0-http--link", distribution.protocol)
            assertEquals("Webside", distribution.protocolName)
            assertEquals("", group.organization)
            assertEquals("", group.unitsOfDistribution)
            assertEquals("", group.englishUnitsOfDistribution)
            assertEquals(
                "#!?zoom=3&lon=306722&lat=7197864&wms=https://example.com/wms&addLayers=test-layer",
                mapped.serviceLink,
            )
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

    @Test
    fun `translates multiple inspire theme keywords with a single register fetch`() =
        runBlocking {
            var requestCount = 0
            val mapper =
                MetadataMapper(
                    createTranslator(
                        responseContent =
                            """
                            {"containeditems": [
                              {"label": "Addresses", "codevalue": "addresses"},
                              {"label": "Transport networks", "codevalue": "transportnetworks"}
                            ]}
                            """.trimIndent(),
                        onRequest = { requestCount++ },
                    ),
                    staticNorgeskartUrl = staticNorgeskartUrl,
                )
            val record =
                minimalRecord(
                    keywordGroups =
                        listOf(
                            KeywordGroup(
                                type = "theme",
                                thesaurus = "INSPIRE themes",
                                keywords =
                                    listOf(
                                        Keyword(value = "addresses"),
                                        Keyword(value = "transportnetworks"),
                                    ),
                            ),
                        ),
                )

            val mapped = mapper.toProductMetadata(record)

            assertContentEquals(
                listOf("Addresses", "Transport networks"),
                mapped.keywordsTheme.map { it.keywordValue },
            )
            assertEquals(1, requestCount)
        }

    private fun minimalRecord(
        legalConstraints: LegalConstraints? = null,
        distributionInfo: DistributionInfo? = null,
        keywordGroups: List<KeywordGroup> = emptyList(),
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
            keywordGroups = keywordGroups,
        )

    private fun createTranslator(
        responseContent: String,
        responseStatus: HttpStatusCode = HttpStatusCode.OK,
        onRequest: () -> Unit = {},
    ): CodeListTranslator {
        val engine =
            MockEngine {
                onRequest()
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

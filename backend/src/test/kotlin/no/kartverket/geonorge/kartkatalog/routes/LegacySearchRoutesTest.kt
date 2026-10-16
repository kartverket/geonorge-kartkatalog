package no.kartverket.geonorge.kartkatalog.routes

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.request.forms.FormDataContent
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.headersOf
import io.ktor.server.routing.routing
import io.ktor.server.testing.testApplication
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import no.kartverket.geonorge.kartkatalog.config.configureSerialization
import no.kartverket.geonorge.kartkatalog.config.configureStatusPages
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.metadata.AreaResolver
import no.kartverket.geonorge.kartkatalog.metadata.HvdResolver
import no.kartverket.geonorge.kartkatalog.search.LegacySearchService
import no.kartverket.geonorge.kartkatalog.search.SearchEngine
import no.kartverket.geonorge.kartkatalog.search.SearchService
import no.kartverket.geonorge.kartkatalog.search.legacySearchRoutes
import no.kartverket.geonorge.kartkatalog.search.searchRoutes
import java.util.concurrent.CopyOnWriteArrayList
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

class LegacySearchRoutesTest {
    private val paths = CopyOnWriteArrayList<String>()
    private val searchForms = CopyOnWriteArrayList<String>()

    private val solrResponse =
        """
        {
          "responseHeader":{"status":0,"QTime":1},
          "response":{"numFound":1,"start":0,"docs":[{
            "uuid":"test-uuid","title":"Kart; \"test\"","type":"dataset","theme":"Natur",
            "organizationgroup":"Kartverket","organizations":["Kartverket"],
            "distribution_url":"https://example.test/metadata",
            "distribution_protocol":"WWW:DOWNLOAD","dataaccess":"Åpne data",
            "spatialscope":["Nasjonal"],"date_updated":"2026-07-01T22:00:00Z"
          }]},
          "facet_counts":{"facet_fields":{
            "type":["dataset",1],
            "area":["Norge",1,"0/03",1,"0/03/0301",1]
          }}
        }
        """.trimIndent()

    private fun upstream(
        solrError: Boolean = false,
        registerError: Boolean = false,
        solrBody: String = solrResponse,
    ): HttpClient =
        HttpClient(
            MockEngine { request ->
                val path = request.url.encodedPath
                paths += path
                val isSolr = path.startsWith("/solr/")
                if (isSolr) searchForms += (request.body as FormDataContent).formData.toString()
                val body =
                    when {
                        isSolr -> solrBody
                        path.endsWith(
                            "fylkesnummer",
                        ) -> """{"containeditems":[{"label":"Oslo","codevalue":"03","status":"Gyldig"}]}"""
                        path.endsWith(
                            "kommunenummer",
                        ) -> """{"containeditems":[{"label":"Oslo","codevalue":"0301","status":"Gyldig"}]}"""
                        else -> """{"containeditems":[]}"""
                    }
                val status =
                    when {
                        isSolr && solrError -> HttpStatusCode.InternalServerError
                        !isSolr && registerError -> HttpStatusCode.InternalServerError
                        else -> HttpStatusCode.OK
                    }
                respond(
                    body,
                    status,
                    headersOf(HttpHeaders.ContentType, ContentType.Application.Json.toString()),
                )
            },
        )

    @Test
    fun `returns PascalCase metadata and hierarchical area facets without changing modern search`() =
        testApplication {
            val upstream = upstream()
            application {
                configureSerialization()
                val solr = SolrClient(upstream, "https://solr.example.test")
                val engine = SearchEngine(solr)
                val register = RegisterClient(upstream, "https://register.example.test")
                routing {
                    legacySearchRoutes(LegacySearchService(engine, register, "https://kartkatalog.test/"))
                    searchRoutes(SearchService(engine, AreaResolver(register), HvdResolver(register)))
                }
            }

            val legacy = client.get("/search?text=Kart&limit=25&offset=2")
            val json = Json.parseToJsonElement(legacy.bodyAsText()).jsonObject
            assertEquals(HttpStatusCode.OK, legacy.status)
            assertEquals("no", legacy.headers[HttpHeaders.ContentLanguage])
            assertEquals("25", json.getValue("Limit").jsonPrimitive.content)
            assertEquals("2", json.getValue("Offset").jsonPrimitive.content)
            val result =
                json
                    .getValue("Results")
                    .jsonArray
                    .first()
                    .jsonObject
            assertEquals(
                "https://kartkatalog.test/metadata/uuid/test-uuid",
                result.getValue("ShowDetailsUrl").jsonPrimitive.content,
            )
            assertEquals("Kartverket", result.getValue("Organization").jsonPrimitive.content)
            assertEquals("Datasett", result.getValue("TypeTranslated").jsonPrimitive.content)
            assertTrue("Abstract" !in result)
            assertTrue("MapUrl" !in result)
            val area =
                json
                    .getValue("Facets")
                    .jsonArray
                    .first {
                        it.jsonObject["Name"]?.jsonPrimitive?.content == "area"
                    }.jsonObject
            val county =
                area
                    .getValue("FacetResults")
                    .jsonArray
                    .last()
                    .jsonObject
            assertEquals("Oslo", county.getValue("NameTranslated").jsonPrimitive.content)
            assertEquals(
                "0/03/0301",
                county
                    .getValue("FacetResults")
                    .jsonArray
                    .first()
                    .jsonObject
                    .getValue("Name")
                    .jsonPrimitive.content,
            )

            val modern = client.get("/api/search?text=Kart&limit=25&offset=2")
            assertEquals(HttpStatusCode.OK, modern.status)
            assertContains(modern.bodyAsText(), "\"numFound\":1")
            assertFalse(modern.bodyAsText().contains("\"NumFound\""))
            assertTrue(paths.contains("/solr/metadata_all/select"))
            assertEquals(2, searchForms.size)
            // Same engine and core, but modern and legacy retain their own query semantics.
            assertNotEquals(searchForms[0], searchForms[1])
            val legacyCsv = client.get("/search?text=Kart&limit=25&offset=2&mediatype=csv")
            val modernCsv = client.get("/api/search?text=Kart&limit=25&offset=2&mediatype=csv")
            assertEquals(HttpStatusCode.OK, modernCsv.status)
            assertContains(modernCsv.headers[HttpHeaders.ContentType].orEmpty(), "text/csv")
            assertEquals(
                legacyCsv.headers[HttpHeaders.ContentDisposition],
                modernCsv.headers[HttpHeaders.ContentDisposition],
            )
            assertEquals(legacyCsv.bodyAsText(), modernCsv.bodyAsText())
            upstream.close()
        }

    @Test
    fun `defaults to Norwegian when no language is provided`() =
        testApplication {
            val upstream = upstream()
            application {
                configureSerialization()
                val engine = SearchEngine(SolrClient(upstream, "https://solr.example.test"))
                val register = RegisterClient(upstream, "https://register.example.test")
                routing {
                    legacySearchRoutes(LegacySearchService(engine, register, "https://kartkatalog.test"))
                    searchRoutes(SearchService(engine, AreaResolver(register), HvdResolver(register)))
                }
            }

            val legacy = client.get("/search")
            assertEquals("no", legacy.headers[HttpHeaders.ContentLanguage])
            assertContains(legacy.headers[HttpHeaders.SetCookie].orEmpty(), "_culture=no")
            assertContains(legacy.bodyAsText(), "\"TypeTranslated\":\"Datasett\"")

            val modern = client.get("/api/search")
            assertContains(modern.bodyAsText(), "\"typeTranslated\":\"Datasett\"")

            val csv = client.get("/api/search?mediatype=csv")
            assertEquals("no", csv.headers[HttpHeaders.ContentLanguage])
            assertTrue(csv.bodyAsText().startsWith("Tittel;Type;Tema;Organisasjon;"))
            assertEquals(List(3) { "/solr/metadata_all/select" }, paths.filter { it.startsWith("/solr/") })
            upstream.close()
        }

    @Test
    fun `selects English core and localized labels and returns semicolon csv`() =
        testApplication {
            val upstream = upstream()
            application {
                configureSerialization()
                val engine = SearchEngine(SolrClient(upstream, "https://solr.example.test"))
                val register = RegisterClient(upstream, "https://register.example.test")
                routing {
                    legacySearchRoutes(LegacySearchService(engine, register, "https://kartkatalog.test"))
                    searchRoutes(SearchService(engine, AreaResolver(register), HvdResolver(register)))
                }
            }

            val english = client.get("/search?lang=en")
            assertEquals(HttpStatusCode.OK, english.status)
            assertEquals("en", english.headers[HttpHeaders.ContentLanguage])
            assertContains(english.bodyAsText(), "\"TypeTranslated\":\"Dataset\"")
            assertContains(english.bodyAsText(), "\"NameTranslated\":\"Area\"")
            assertTrue(paths.contains("/solr/metadata_all_en/select"))

            val csv = client.get("/search?mediatype=csv") { headers.append(HttpHeaders.AcceptLanguage, "en-US") }
            assertEquals(HttpStatusCode.OK, csv.status)
            assertContains(csv.headers[HttpHeaders.ContentType].orEmpty(), "text/csv")
            assertEquals("attachment; filename=kartkatalogen.csv", csv.headers[HttpHeaders.ContentDisposition])
            assertTrue(csv.bodyAsText().startsWith("Title;Type;Topic;Organization;Open data;DOK-data;Uuid;"))
            assertContains(csv.bodyAsText(), "\"Kart; \"\"test\"\"\";dataset;Natur;Kartverket;")
            val modernCsv =
                client.get("/api/search") {
                    headers.append(HttpHeaders.Accept, "text/csv")
                    headers.append(HttpHeaders.AcceptLanguage, "en-US")
                }
            assertEquals("en", modernCsv.headers[HttpHeaders.ContentLanguage])
            assertEquals(csv.bodyAsText(), modernCsv.bodyAsText())
            assertTrue(paths.contains("/solr/metadata_all_en/select"))

            val cookieCsv =
                client.get("/search") {
                    headers.append(HttpHeaders.Cookie, "_culture=en")
                    headers.append(HttpHeaders.Accept, "text/csv")
                }
            assertEquals(HttpStatusCode.OK, cookieCsv.status)
            assertEquals("en", cookieCsv.headers[HttpHeaders.ContentLanguage])
            assertContains(cookieCsv.bodyAsText(), "Title;Type;Topic;")
            assertTrue(cookieCsv.headers[HttpHeaders.SetCookie] == null)
            upstream.close()
        }

    @Test
    fun `negotiates weighted headers and explicit csv media types on both routes`() =
        testApplication {
            val upstream = upstream()
            application {
                configureSerialization()
                val engine = SearchEngine(SolrClient(upstream, "https://solr.example.test"))
                val register = RegisterClient(upstream, "https://register.example.test")
                routing {
                    legacySearchRoutes(LegacySearchService(engine, register, "https://kartkatalog.test"))
                    searchRoutes(SearchService(engine, AreaResolver(register), HvdResolver(register)))
                }
            }

            val legacyJson =
                client.get("/search") {
                    headers.append(HttpHeaders.Accept, "text/csv;q=0.2, application/json;q=0.9")
                    headers.append(HttpHeaders.AcceptLanguage, "nb-NO;q=0.2, en-GB;q=0.8")
                }
            assertEquals(HttpStatusCode.OK, legacyJson.status)
            assertContains(legacyJson.headers[HttpHeaders.ContentType].orEmpty(), "application/json")
            assertEquals("en", legacyJson.headers[HttpHeaders.ContentLanguage])
            assertContains(legacyJson.bodyAsText(), "\"TypeTranslated\":\"Dataset\"")
            assertContains(legacyJson.headers[HttpHeaders.SetCookie].orEmpty(), "_culture=en")
            assertContains(legacyJson.headers[HttpHeaders.Vary].orEmpty(), "Accept-Language")

            val legacyCsv =
                client.get("/search?mediatype=application/csv") {
                    headers.append(HttpHeaders.Accept, "application/json;q=1, application/csv;q=0")
                    headers.append(HttpHeaders.AcceptLanguage, "en-US;q=0.8, nb-NO;q=0.2")
                }
            assertEquals(HttpStatusCode.OK, legacyCsv.status)
            assertContains(legacyCsv.headers[HttpHeaders.ContentType].orEmpty(), "application/csv")
            assertEquals("en", legacyCsv.headers[HttpHeaders.ContentLanguage])
            assertTrue(legacyCsv.bodyAsText().startsWith("Title;Type;Topic;"))

            val modernCsv =
                client.get("/api/search") {
                    headers.append(HttpHeaders.Accept, "application/json;q=0.2, application/csv;q=0.8")
                    headers.append(HttpHeaders.AcceptLanguage, "nb-NO;q=1")
                    headers.append(HttpHeaders.Cookie, "_culture=en")
                }
            assertEquals(HttpStatusCode.OK, modernCsv.status)
            assertContains(modernCsv.headers[HttpHeaders.ContentType].orEmpty(), "application/csv")
            assertEquals("en", modernCsv.headers[HttpHeaders.ContentLanguage])
            assertTrue(modernCsv.bodyAsText().startsWith("Title;Type;Topic;"))

            val modernJson =
                client.get("/api/search") {
                    headers.append(HttpHeaders.Accept, "text/csv;q=0.2, application/json;q=0.9")
                    headers.append(HttpHeaders.AcceptLanguage, "en-US")
                }
            assertEquals(HttpStatusCode.OK, modernJson.status)
            assertContains(modernJson.headers[HttpHeaders.ContentType].orEmpty(), "application/json")
            assertContains(modernJson.bodyAsText(), "\"numFound\":1")
            assertTrue(modernJson.headers[HttpHeaders.ContentLanguage] == null)
            assertEquals(
                listOf(
                    "/solr/metadata_all_en/select",
                    "/solr/metadata_all_en/select",
                    "/solr/metadata_all_en/select",
                    "/solr/metadata_all/select",
                ),
                paths.filter { it.startsWith("/solr/") },
            )
            upstream.close()
        }

    @Test
    fun `csv skips area register lookup but json still needs it`() =
        testApplication {
            val upstream = upstream(registerError = true)
            application {
                configureSerialization()
                val engine = SearchEngine(SolrClient(upstream, "https://solr.example.test"))
                val register = RegisterClient(upstream, "https://register.example.test")
                routing {
                    legacySearchRoutes(LegacySearchService(engine, register, "https://kartkatalog.test"))
                }
            }

            val csv = client.get("/search?mediatype=csv")
            assertEquals(HttpStatusCode.OK, csv.status)
            assertTrue(csv.bodyAsText().startsWith("Tittel;Type;Tema;Organisasjon;"))
            val acceptCsv = client.get("/search") { headers.append(HttpHeaders.Accept, "text/csv") }
            assertEquals(HttpStatusCode.OK, acceptCsv.status)
            assertEquals(csv.bodyAsText(), acceptCsv.bodyAsText())
            assertEquals(2, paths.count { it.startsWith("/solr/") })
            assertTrue(paths.none { it.startsWith("/api/sosi-kodelister/") })

            val json = client.get("/search")
            assertEquals(HttpStatusCode.InternalServerError, json.status)
            assertTrue(paths.any { it.endsWith("/fylkesnummer") })
            upstream.close()
        }

    @Test
    fun `successful empty Solr search still requires Register for json`() =
        testApplication {
            val upstream =
                upstream(
                    registerError = true,
                    solrBody =
                        """
                        {
                          "responseHeader":{"status":0,"QTime":1},
                          "response":{"numFound":0,"start":0,"docs":[]},
                          "facet_counts":{"facet_fields":{}}
                        }
                        """.trimIndent(),
                )
            application {
                configureSerialization()
                val engine = SearchEngine(SolrClient(upstream, "https://solr.example.test"))
                val register = RegisterClient(upstream, "https://register.example.test")
                routing {
                    legacySearchRoutes(LegacySearchService(engine, register, "https://kartkatalog.test"))
                }
            }

            val json = client.get("/search?limit=25&offset=2")
            assertEquals(HttpStatusCode.InternalServerError, json.status)
            assertEquals(1, paths.count { it.endsWith("/fylkesnummer") })

            val csv = client.get("/search?mediatype=csv")
            assertEquals(HttpStatusCode.OK, csv.status)
            assertEquals("", csv.bodyAsText())
            assertEquals(1, paths.count { it.endsWith("/fylkesnummer") })
            assertEquals(2, paths.count { it.startsWith("/solr/") })
            upstream.close()
        }

    @Test
    fun `Solr failures return an empty successful legacy result`() =
        testApplication {
            val upstream = upstream(solrError = true, registerError = true)
            application {
                configureSerialization()
                configureStatusPages()
                val engine = SearchEngine(SolrClient(upstream, "https://solr.example.test"))
                val register = RegisterClient(upstream, "https://register.example.test")
                routing {
                    legacySearchRoutes(LegacySearchService(engine, register, "https://kartkatalog.test"))
                    searchRoutes(SearchService(engine, AreaResolver(register), HvdResolver(register)))
                }
            }
            val response = client.get("/search?offset=2")
            assertEquals(HttpStatusCode.OK, response.status)
            val json = Json.parseToJsonElement(response.bodyAsText()).jsonObject
            assertEquals("0", json.getValue("NumFound").jsonPrimitive.content)
            assertEquals("10", json.getValue("Limit").jsonPrimitive.content)
            assertEquals("2", json.getValue("Offset").jsonPrimitive.content)
            assertEquals(0, json.getValue("Results").jsonArray.size)
            assertEquals(0, json.getValue("Facets").jsonArray.size)
            assertTrue("Type" !in json)
            val csv = client.get("/search?mediatype=csv")
            assertEquals(HttpStatusCode.OK, csv.status)
            assertEquals("", csv.bodyAsText())
            val modern = client.get("/api/search?offset=2")
            assertEquals(HttpStatusCode.BadGateway, modern.status)
            val modernCsv = client.get("/api/search?mediatype=csv")
            assertEquals(HttpStatusCode.BadGateway, modernCsv.status)
            assertEquals(4, paths.count { it.startsWith("/solr/") })
            assertTrue(paths.all { it.startsWith("/solr/") })
            upstream.close()
        }
}

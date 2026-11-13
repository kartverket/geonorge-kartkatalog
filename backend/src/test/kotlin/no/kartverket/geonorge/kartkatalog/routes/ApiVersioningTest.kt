package no.kartverket.geonorge.kartkatalog.routes

import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.server.response.respondText
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import io.ktor.server.routing.routing
import io.ktor.server.testing.testApplication
import no.kartverket.geonorge.kartkatalog.API_V1
import no.kartverket.geonorge.kartkatalog.deprecatedAlias
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class ApiVersioningTest {
    private fun Route.thingRoutes() {
        get("/things/{id}") { call.respondText("thing ${call.parameters["id"]}") }
    }

    private fun versionedApp(block: suspend io.ktor.server.testing.ApplicationTestBuilder.() -> Unit) =
        testApplication {
            application {
                routing {
                    route(API_V1) { thingRoutes() }
                    deprecatedAlias("/api") { thingRoutes() }
                    deprecatedAlias("") { thingRoutes() }
                }
            }
            block()
        }

    @Test
    fun `versioned path is not marked deprecated`() =
        versionedApp {
            val response = client.get("/api/v1/things/42")

            assertEquals(HttpStatusCode.OK, response.status)
            assertEquals("thing 42", response.bodyAsText())
            assertNull(response.headers["Deprecation"])
            assertNull(response.headers[HttpHeaders.Link])
        }

    @Test
    fun `alias under old prefix serves same route and points to successor`() =
        versionedApp {
            val response = client.get("/api/things/42")

            assertEquals(HttpStatusCode.OK, response.status)
            assertEquals("thing 42", response.bodyAsText())
            assertEquals("@1793923200", response.headers["Deprecation"])
            assertEquals("</api/v1/things/42>; rel=\"successor-version\"", response.headers[HttpHeaders.Link])
        }

    @Test
    fun `successor link preserves the query string`() =
        versionedApp {
            val response = client.get("/api/things/42?url=a%26b&x=1")

            assertEquals(
                "</api/v1/things/42?url=a%26b&x=1>; rel=\"successor-version\"",
                response.headers[HttpHeaders.Link],
            )
        }

    @Test
    fun `alias at root points to successor under versioned prefix`() =
        versionedApp {
            val response = client.get("/things/42")

            assertEquals(HttpStatusCode.OK, response.status)
            assertEquals("</api/v1/things/42>; rel=\"successor-version\"", response.headers[HttpHeaders.Link])
        }
}

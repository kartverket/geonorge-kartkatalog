package no.kartverket.geonorge.kartkatalog.auth

import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticateWith
import io.ktor.server.auth.principal
import io.ktor.server.request.header
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import no.kartverket.geonorge.kartkatalog.config.GeoIdAuthentication

fun Route.authRoutes(authentication: GeoIdAuthentication) {
    authenticateWith(authentication.provider.session) {
        route("/api/me/geoid") {
            get {
                val info = call.principal.userInfo
                val name = info.name
                if (!name.isNullOrBlank()) {
                    call.respond(AuthInfoResponse(name = name))
                } else {
                    call.respond(HttpStatusCode.Unauthorized)
                }
            }
        }
    }

    // Ansattporten route, auth enforced by ztoperator
    route("/api/me") {
        get {
            val name = call.request.header(USER_FULL_NAME_HEADER)
            val organization =
                runCatching {
                    decodeAuthorizedOrganization(call.request.header(AUTH_DETAILS_HEADER))
                }.getOrNull()

            if (name.isNullOrBlank() || organization == null) {
                call.respond(HttpStatusCode.Unauthorized)
                return@get
            }

            call.respond(
                AuthInfoResponse(
                    name = name,
                    organizationName = organization.name,
                ),
            )
        }
    }
}

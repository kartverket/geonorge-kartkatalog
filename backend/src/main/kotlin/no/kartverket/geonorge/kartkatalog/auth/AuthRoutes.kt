package no.kartverket.geonorge.kartkatalog.auth

import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticateWith
import io.ktor.server.auth.principal
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import kotlinx.serialization.Serializable
import no.kartverket.geonorge.kartkatalog.config.GeoIdAuthentication

@Serializable
data class AuthInfoResponse(
    val name: String,
    val organizationName: String? = null,
)

fun Route.authRoutes(authentication: GeoIdAuthentication) {
    authenticateWith(authentication.provider.session) {
        route("/api/me/geoid") {
            /**
             * Returns the authenticated GeoID user's name.
             *
             * Cookie: GEOID_SESSION [String] Authenticated GeoID session cookie.
             * Response: 200 application/json [AuthInfoResponse] The current user.
             * Response: 401 The authenticated user has no available name.
             */
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
}

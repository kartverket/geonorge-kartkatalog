package no.kartverket.geonorge.kartkatalog.auth
import io.ktor.server.auth.mapPrincipal
import no.kartverket.geonorge.kartkatalog.config.GeoIdAuthentication
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.route
import io.ktor.http.HttpStatusCode
import io.ktor.server.auth.authenticateWith
import io.ktor.server.auth.principal
import io.ktor.server.auth.principalOrNull

fun Route.authRoutes(authentication: GeoIdAuthentication) {
    authenticateWith(authentication.provider.session) {
        route("/api/me/geoid") {
            get {
                val info = call.principal.userInfo
                if (info != null) {
                    call.respond(info)
                } else {
                    call.respond(HttpStatusCode.Unauthorized)
                }
            }
        }
    }
}
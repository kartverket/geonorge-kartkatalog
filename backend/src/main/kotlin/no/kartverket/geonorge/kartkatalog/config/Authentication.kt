package no.kartverket.geonorge.kartkatalog.config

import io.ktor.http.path
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.auth.oidc.Oidc
import io.ktor.server.auth.oidc.OidcProvider
import io.ktor.server.response.respondRedirect
import org.slf4j.LoggerFactory
import kotlin.time.Duration.Companion.seconds

data class GeoIdAuthentication(
    val provider: OidcProvider,
)

private val log = LoggerFactory.getLogger("Authentication")

suspend fun Application.configureAuthentication(appConfig: AppConfig): GeoIdAuthentication {
    val oidc =
        install(Oidc) {
            initialDiscoveryAttempts = 3
            initialDiscoveryRetryDelay = 5.seconds
        }

    val provider =
        oidc.identityProvider("geoid") {
            issuer = appConfig.geoIdIssuer

            oauth {
                clientId = appConfig.geoIdClientId
                clientSecret = appConfig.geoIdClientSecret

                scopes =
                    listOf(
                        "openid",
                        "profile",
                        "email",
                        "roles",
                        // TODO: Consider if necessary
                        // "offline_access",
                    )

                loginUri = {
                    path("auth", "geoid", "login")
                }

                redirectUri = {
                    path("auth", "geoid", "callback")
                }

                sessions {
                    name = "GEOID_SESSION"

                    csrfProtection {
                        allowOrigin(appConfig.publicBaseUrl)
                        allowOrigin("http://localhost:3000")
                    }
                    cookie {
                        cookie.path = "/"
                        cookie.httpOnly = true
                        cookie.extensions["SameSite"] = "lax"
                    }

                    // TODO: Consider if necessary
                    // tokenRefreshStrategy =
                    //     OidcTokenRefreshStrategy.Auto(
                    //         beforeExpiry = 30.seconds,
                    //     )
                }

                logout(
                    path = "/auth/geoid/logout",
                    postLogoutRedirectUri = {
                        path("/")
                    },
                )

                onAuthenticated {
                    call.respondRedirect("/")
                }

                onAuthenticationFailed { cause ->
                    log.warn("GeoID login failed: {}", cause)
                    call.respondRedirect("/?loginError=true")
                }
            }
        }

    return GeoIdAuthentication(provider)
}

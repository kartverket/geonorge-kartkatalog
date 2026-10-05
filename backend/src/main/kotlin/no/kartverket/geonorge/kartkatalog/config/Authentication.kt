package no.kartverket.geonorge.kartkatalog.config

import io.ktor.http.URLProtocol
import io.ktor.http.path
import io.ktor.http.takeFrom
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.auth.oidc.Oidc
import io.ktor.server.auth.oidc.OidcProvider
import io.ktor.server.response.respondRedirect
import org.slf4j.LoggerFactory
import java.net.URI
import kotlin.time.Duration.Companion.seconds

data class GeoIdAuthentication(
    val provider: OidcProvider,
)

private val log = LoggerFactory.getLogger("Authentication")

suspend fun Application.configureAuthentication(appConfig: AppConfig): GeoIdAuthentication {
    val publicBaseUri = URI(appConfig.publicBaseUrl)
    val publicOrigin =
        URI(
            publicBaseUri.scheme,
            null,
            publicBaseUri.host,
            publicBaseUri.port,
            null,
            null,
            null,
        ).toString()

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
                    protocol = if (publicBaseUri.scheme == "https") URLProtocol.HTTPS else URLProtocol.HTTP
                    path("auth", "geoid", "callback")
                    log.info("GeoID callback URL: {}", buildString())
                }

                sessions {
                    name = "GEOID_SESSION"

                    csrfProtection {
                        allowOrigin(publicOrigin)
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
                        takeFrom(appConfig.publicBaseUrl)
                    },
                )

                onAuthenticated {
                    call.respondRedirect(appConfig.publicBaseUrl)
                }

                onAuthenticationFailed { cause ->
                    log.warn("GeoID login failed: {}", cause)
                    val loginErrorUri =
                        URI(
                            publicBaseUri.scheme,
                            publicBaseUri.userInfo,
                            publicBaseUri.host,
                            publicBaseUri.port,
                            publicBaseUri.path.ifEmpty { "/" },
                            "loginError=true",
                            null,
                        )
                    call.respondRedirect(loginErrorUri.toString())
                }
            }
        }

    return GeoIdAuthentication(provider)
}

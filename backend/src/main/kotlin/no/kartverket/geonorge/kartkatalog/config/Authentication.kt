package no.kartverket.geonorge.kartkatalog.config

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
    // Paths the OIDC plugin registers itself, so they can't be marked with `undocumented`.
    val pluginRoutePaths: List<String> = emptyList(),
)

private const val LOGIN_PATH = "/auth/geoid/login"
private const val LOGOUT_PATH = "/auth/geoid/logout"
private const val CALLBACK_SUFFIX = "/bff/auth/geoid/callback"

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

    val callbackUrl = "${appConfig.publicBaseUrl}$CALLBACK_SUFFIX"

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
                    path(*LOGIN_PATH.trim('/').split('/').toTypedArray())
                }

                redirectUri = {
                    takeFrom(callbackUrl)
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
                    path = LOGOUT_PATH,
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

    return GeoIdAuthentication(
        provider,
        pluginRoutePaths = listOf(LOGIN_PATH, LOGOUT_PATH, URI(callbackUrl).path),
    )
}

package no.kartverket.geonorge.kartkatalog.routes

import io.ktor.http.takeFrom
import io.ktor.server.application.Application
import io.ktor.server.application.install
import io.ktor.server.auth.oidc.Oidc
import io.ktor.server.auth.oidc.OpenIdProviderMetadata
import io.ktor.server.auth.oidc.OpenIdTestKeys
import no.kartverket.geonorge.kartkatalog.config.GeoIdAuthentication

private const val TEST_ISSUER = "https://test.example.com/geoid"
private const val TEST_CLIENT_ID = "kartkatalog-test"

suspend fun Application.configureTestAuthentication(callbackUrl: String? = null): GeoIdAuthentication {
    val keys = OpenIdTestKeys.rsa(issuer = TEST_ISSUER, audience = TEST_CLIENT_ID)
    val oidc = install(Oidc)
    val provider =
        oidc.identityProvider("test-geoid") {
            issuer = TEST_ISSUER
            metadata =
                OpenIdProviderMetadata(
                    issuer = TEST_ISSUER,
                    authorizationEndpoint = "$TEST_ISSUER/authorize",
                    tokenEndpoint = "$TEST_ISSUER/token",
                    jwksUri = "$TEST_ISSUER/jwks",
                )
            jwt(keys)
            oauth {
                clientId = TEST_CLIENT_ID
                clientSecret = "test-secret"
                scopes = listOf("openid")
                callbackUrl?.let { url -> redirectUri = { takeFrom(url) } }
                sessions {
                    name = "TEST_GEOID_SESSION"
                    disableCsrfProtection()
                }
            }
        }

    return GeoIdAuthentication(provider)
}

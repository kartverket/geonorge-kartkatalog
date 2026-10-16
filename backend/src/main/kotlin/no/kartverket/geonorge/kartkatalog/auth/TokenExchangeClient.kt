package no.kartverket.geonorge.kartkatalog.auth

import io.ktor.client.HttpClient
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class ExchangeRequest(
    @SerialName("identity_provider")
    val identityProvider: String,
    @SerialName("user_token")
    val userToken: String,
    @SerialName("target")
    val target: String,
)

@Serializable
private data class ExchangeResponse(
    @SerialName("access_token")
    val accessToken: String,
    @SerialName("expires_in")
    val expiresIn: Int,
    @SerialName("token_type")
    val tokenType: String,
)

class TokenExchangeClient(
    private val httpClient: HttpClient,
    private val texasUrl: String,
) {
    private val json =
        Json {
            ignoreUnknownKeys = true
            encodeDefaults = true
        }

    suspend fun exchangeToken(
        userToken: String,
        target: String,
    ): String {
        val response =
            httpClient.post("${texasUrl.trimEnd('/')}/api/v1/token/exchange") {
                contentType(ContentType.Application.Json)
                setBody(
                    json.encodeToString(
                        ExchangeRequest.serializer(),
                        ExchangeRequest(
                            identityProvider = "tokenx",
                            userToken = userToken,
                            target = target,
                        ),
                    ),
                )
            }
        val exchangeResponse =
            json.decodeFromString(
                ExchangeResponse.serializer(),
                response.bodyAsText(),
            )
        return exchangeResponse.accessToken
    }
}

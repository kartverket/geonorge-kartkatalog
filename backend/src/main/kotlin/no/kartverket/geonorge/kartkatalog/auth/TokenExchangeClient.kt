package no.kartverket.geonorge.kartkatalog.auth

import io.ktor.client.HttpClient
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class ExchangeRequest(
    val identityProvider: String,
    val userToken: String,
    val target: String,
)

@Serializable
private data class ExchangeResponse(
    val accessToken: String,
    val expiresIn: Int,
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

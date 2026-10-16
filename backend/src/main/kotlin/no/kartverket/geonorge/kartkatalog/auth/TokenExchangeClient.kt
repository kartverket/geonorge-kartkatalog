package no.kartverket.geonorge.kartkatalog.auth

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import kotlinx.serialization.Serializable

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
    suspend fun exchangeToken(
        userToken: String,
        target: String,
    ): String {
        val response =
            httpClient.post("${texasUrl.trimEnd('/')}/api/v1/token/exchange") {
                contentType(ContentType.Application.Json)
                setBody(
                    ExchangeRequest(
                        identityProvider = "tokenx",
                        userToken = userToken,
                        target = target,
                    ),
                )
            }
        val exchangeResponse = response.body<ExchangeResponse>()
        return exchangeResponse.accessToken
    }
}

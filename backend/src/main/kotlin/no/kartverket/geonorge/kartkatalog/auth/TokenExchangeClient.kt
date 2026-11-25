package no.kartverket.geonorge.kartkatalog.auth

import io.ktor.client.HttpClient
import io.ktor.client.request.bearerAuth
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import no.kartverket.geonorge.kartkatalog.download.DownloadApiClient
import no.kartverket.geonorge.kartkatalog.download.DownloadApiException
import org.slf4j.LoggerFactory

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
    private val log = LoggerFactory.getLogger(TokenExchangeClient::class.java)

    suspend fun exchangeToken(
        userToken: String,
        target: String,
    ): String {

        val response = try{
            //For local texas, use the default token endpoint with form URL encoded body.
            // httpClient.post("${texasUrl.trimEnd('/')}/default/token")
            // {
            //     contentType(ContentType.Application.FormUrlEncoded)
            //     setBody(
            //         "grant_type=urn:ietf:params:oauth:grant-type:token-exchange&client_id=atkv3-dev:geonorge-ny-kartkatalog-dev:kartkatalog-backend&client_secret=x&subject_token=$userToken&subject_token_type=urn:ietf:params:oauth:token-type:jwt&audience=$target"
            //     )
            // }

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
        } catch (e: Exception) {
            log.error("Failed to exchange token: ${e.message}", e)
            throw DownloadApiException("Failed to exchange token: ${e.message}", e)
        }
        val exchangeResponse =
            try {
                json.decodeFromString(
                    ExchangeResponse.serializer(),
                    response.bodyAsText(),
                )
            } catch (e: SerializationException) {
                throw DownloadApiException("Uventet svar fra token exchange", e)
            }
            

        return exchangeResponse.accessToken
    }

}

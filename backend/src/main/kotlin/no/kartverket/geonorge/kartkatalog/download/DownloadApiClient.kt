package no.kartverket.geonorge.kartkatalog.download

import io.ktor.client.HttpClient
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory

class DownloadApiClient(
    private val httpClient: HttpClient,
) {
    private val json =
        Json {
            ignoreUnknownKeys = true
            encodeDefaults = true
        }
    private val log = LoggerFactory.getLogger(DownloadApiClient::class.java)

    suspend fun getCapabilities(
        capabilitiesUrl: String,
        uuid: String,
//        TODO: ta stilling til trimEnd
    ): DownloadApiCapabilities = fetchCapabilities("${capabilitiesUrl.trimEnd('/')}/$uuid")

    private suspend fun fetchCapabilities(url: String): DownloadApiCapabilities {
        val response = getResponse(url)

        if (!response.status.isSuccess()) {
            log.warn("Nedlasting request to {} failed with status: {}", url, response.status)
            throw DownloadApiException("Download API request to $url failed with status ${response.status}")
        }

        return try {
            json.decodeFromString(DownloadApiCapabilities.serializer(), response.bodyAsText())
        } catch (e: Exception) {
            log.error("Failed to parse download API capabilities response from {}", url, e)
            throw DownloadApiException("Failed to parse download API capabilities response from $url", e)
        }
    }

    suspend fun getAreas(url: String): List<DownloadApiAreaCodelistEntry> {
        val response = getResponse(url)

        if (!response.status.isSuccess()) {
            log.warn("Nedlasting request to {} failed with status: {}", url, response.status)
            throw DownloadApiException("Download API request to $url failed with status ${response.status}")
        }

        return try {
            json.decodeFromString(ListSerializer(DownloadApiAreaCodelistEntry.serializer()), response.bodyAsText())
        } catch (e: Exception) {
            throw DownloadApiException("Failed to parse download API area response from $url", e)
        }
    }

    private suspend fun getResponse(url: String): HttpResponse =
        try {
            httpClient.get(url)
        } catch (e: Exception) {
            throw DownloadApiException("Download API request to $url failed", e)
        }

    suspend fun order(
        orderUrl: String,
        request: DownloadApiOrderRequest,
    ): DownloadApiOrderResponse {
        val response =
            try {
                httpClient.post(orderUrl) {
                    contentType(ContentType.Application.Json)
                    setBody(json.encodeToString(DownloadApiOrderRequest.serializer(), request))
                }
            } catch (e: Exception) {
                throw DownloadApiException("Download API order request to $orderUrl failed", e)
            }

        if (!response.status.isSuccess()) {
            log.warn("Nedlasting order request to {} failed with status: {}", orderUrl, response.status)
            throw DownloadApiException("Download API order request to $orderUrl failed with status ${response.status}")
        }

        return try {
            json.decodeFromString(DownloadApiOrderResponse.serializer(), response.bodyAsText())
        } catch (e: Exception) {
            throw DownloadApiException("Failed to parse download API order response from $orderUrl", e)
        }
    }
}

class DownloadApiException(
    message: String,
    e: Throwable? = null,
) : RuntimeException(message, e)

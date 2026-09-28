package no.kartverket.geonorge.kartkatalog.integrations.nedlasting

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

class NedlastingClient(
    private val httpClient: HttpClient,
    private val baseUrl: String,
) {
    private val json =
        Json {
            ignoreUnknownKeys = true
            encodeDefaults = true
        }
    private val log = LoggerFactory.getLogger(NedlastingClient::class.java)

    suspend fun getCapabilities(uuid: String): NedlastingCapabilities =
        fetchCapabilities("$baseUrl/api/capabilities/$uuid")

    suspend fun getCapabilities(
        capabilitiesUrl: String,
        uuid: String,
    ): NedlastingCapabilities = fetchCapabilities("${capabilitiesUrl.trimEnd('/')}/$uuid")

    private suspend fun fetchCapabilities(url: String): NedlastingCapabilities {
        val response = getResponse(url)

        if (!response.status.isSuccess()) {
            log.warn("Nedlasting request to {} failed with status: {}", url, response.status)
            throw NedlastingException("Nedlasting request to $url failed with status ${response.status}")
        }

        return try {
            json.decodeFromString(NedlastingCapabilities.serializer(), response.bodyAsText())
        } catch (e: Exception) {
            log.error("Failed to parse Nedlasting capabilities response from {}", url, e)
            throw NedlastingException("Failed to parse Nedlasting capabilities response from $url", e)
        }
    }

    suspend fun getFormats(url: String): List<NedlastingFormatCodelistEntry> =
        try {
            val response = httpClient.get(url)
            json.decodeFromString(ListSerializer(NedlastingFormatCodelistEntry.serializer()), response.bodyAsText())
        } catch (e: Exception) {
            throw NedlastingException("Nedlasting request to $url failed", e)
        }

    suspend fun getAreas(url: String): List<NedlastingAreaCodelistEntry> =
        try {
            val response = httpClient.get(url)
            json.decodeFromString(ListSerializer(NedlastingAreaCodelistEntry.serializer()), response.bodyAsText())
        } catch (e: Exception) {
            throw NedlastingException("Nedlasting request to $url failed", e)
        }

    private suspend fun getResponse(url: String): HttpResponse =
        try {
            httpClient.get(url)
        } catch (e: Exception) {
            throw NedlastingException("Nedlasting request to $url failed", e)
        }

    suspend fun order(
        orderUrl: String,
        request: NedlastingOrderRequest,
    ): NedlastingOrderResponse {
        val response =
            try {
                httpClient.post(orderUrl) {
                    contentType(ContentType.Application.Json)
                    setBody(json.encodeToString(NedlastingOrderRequest.serializer(), request))
                }
            } catch (e: Exception) {
                throw NedlastingException("Nedlasting order request to $orderUrl failed", e)
            }

        if (!response.status.isSuccess()) {
            log.warn("Nedlasting order request to {} failed with status: {}", orderUrl, response.status)
            throw NedlastingException("Nedlasting order request to $orderUrl failed with status ${response.status}")
        }

        return try {
            json.decodeFromString(NedlastingOrderResponse.serializer(), response.bodyAsText())
        } catch (e: Exception) {
            throw NedlastingException("Failed to parse Nedlasting order response from $orderUrl", e)
        }
    }
}

class NedlastingException(
    message: String,
    e: Throwable? = null,
) : RuntimeException(message, e)

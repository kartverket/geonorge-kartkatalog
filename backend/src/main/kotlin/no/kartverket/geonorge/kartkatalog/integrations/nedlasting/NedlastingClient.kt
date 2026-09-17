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
import kotlinx.serialization.KSerializer
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

    suspend fun getCapabilities(uuid: String): NedlastingCapabilities {
        val path = "/api/capabilities/$uuid"
        val response = getResponse(path)

        if (!response.status.isSuccess()) {
            log.warn("Nedlasting request to {} failed with status: {}", path, response.status)
            throw NedlastingException("Nedlasting request to $path failed with status ${response.status}")
        }

        return try {
            json.decodeFromString(NedlastingCapabilities.serializer(), response.bodyAsText())
        } catch (e: Exception) {
            log.error("Failed to parse Nedlasting capabilities response from {}", path, e)
            throw NedlastingException("Failed to parse Nedlasting capabilities response from $path", e)
        }
    }

    suspend fun getFormats(uuid: String): List<NedlastingFormatCodelistEntry> =
        fetchList("/api/codelists/format/$uuid", NedlastingFormatCodelistEntry.serializer())

    suspend fun getAreas(uuid: String): List<NedlastingAreaCodelistEntry> =
        fetchList("/api/codelists/area/$uuid", NedlastingAreaCodelistEntry.serializer())

    private suspend fun <T> fetchList(
        path: String,
        serializer: KSerializer<T>,
    ): List<T> {
        val response = getResponse(path)

        if (!response.status.isSuccess()) {
            log.warn("Nedlasting request to {} failed with status: {}", path, response.status)
            throw NedlastingException("Nedlasting request to $path failed with status ${response.status}")
        }

        return try {
            json.decodeFromString(ListSerializer(serializer), response.bodyAsText())
        } catch (e: Exception) {
            log.error("Failed to parse Nedlasting response from {}", path, e)
            throw NedlastingException("Failed to parse Nedlasting response from $path", e)
        }
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

    private suspend fun getResponse(path: String): HttpResponse =
        try {
            httpClient.get("$baseUrl$path")
        } catch (e: Exception) {
            throw NedlastingException("Nedlasting request to $path failed", e)
        }
}

class NedlastingException(
    message: String,
    e: Throwable? = null,
) : RuntimeException(message, e)

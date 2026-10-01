package no.kartverket.geonorge.kartkatalog.download

import io.ktor.client.HttpClient
import io.ktor.client.request.bearerAuth
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.URLBuilder
import io.ktor.http.Url
import io.ktor.http.appendPathSegments
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory
import java.net.URI
import java.net.URISyntaxException
import java.util.UUID

class DownloadApiClient(
    private val httpClient: HttpClient,
    private val tokenAllowlist: DownloadTokenAllowlist = DownloadTokenAllowlist.fromCommaSeparated(null),
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
    ): DownloadApiCapabilities {
        val baseUrl = parseHttpUrl(capabilitiesUrl, "capabilities")
        if (hasQueryOrFragment(capabilitiesUrl)) {
            throw DownloadApiException("Capabilities URL must not contain query parameters or a fragment")
        }

        val capabilitiesUrlWithUuid =
            URLBuilder(baseUrl)
                .apply { appendPathSegments(validatedUuid(uuid)) }
                .buildString()

        return fetchCapabilities(capabilitiesUrlWithUuid)
    }

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
        val validatedUrl = parseHttpUrl(url, "area")
        val response = getResponse(validatedUrl.toString())

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
        geoIdAccessToken: String? = null,
    ): DownloadApiOrderResponse {
        val validatedOrderUrl = parseHttpUrl(orderUrl, "order")
        val requestUrl = validatedOrderUrl.toString()
        if (geoIdAccessToken != null && !tokenAllowlist.permits(requestUrl)) {
            throw DownloadTokenDestinationNotAllowedException()
        }

        val response =
            try {
                httpClient.post(requestUrl) {
                    geoIdAccessToken?.let { bearerAuth(it) }
                    contentType(ContentType.Application.Json)
                    setBody(json.encodeToString(DownloadApiOrderRequest.serializer(), request))
                }
            } catch (e: Exception) {
                throw DownloadApiException("Download API order request to $requestUrl failed", e)
            }

        if (!response.status.isSuccess()) {
            log.warn("Nedlasting order request to {} failed with status: {}", requestUrl, response.status)
            throw DownloadApiException(
                "Download API order request to $requestUrl failed with status ${response.status}",
            )
        }

        return try {
            json.decodeFromString(DownloadApiOrderResponse.serializer(), response.bodyAsText())
        } catch (e: Exception) {
            throw DownloadApiException("Failed to parse download API order response from $requestUrl", e)
        }
    }

    private fun parseHttpUrl(
        value: String,
        type: String,
    ): Url {
        val url =
            try {
                Url(value)
            } catch (e: IllegalArgumentException) {
                throw DownloadApiException("Invalid $type URL", e)
            }

        if (url.protocol.name !in setOf("http", "https") || url.host.isBlank() || url.fragment.isNotEmpty()) {
            throw DownloadApiException("Invalid $type URL")
        }

        return url
    }

    private fun validatedUuid(uuid: String): String =
        try {
            val parsedUuid = UUID.fromString(uuid)
            require(parsedUuid.toString().equals(uuid, ignoreCase = true))
            parsedUuid.toString()
        } catch (e: IllegalArgumentException) {
            throw DownloadApiException("Invalid dataset UUID", e)
        }

    private fun hasQueryOrFragment(url: String): Boolean =
        try {
            URI(url).let { it.rawQuery != null || it.rawFragment != null }
        } catch (e: URISyntaxException) {
            throw DownloadApiException("Invalid capabilities URL", e)
        }
}

open class DownloadApiException(
    message: String,
    e: Throwable? = null,
) : RuntimeException(message, e)

class DownloadTokenDestinationNotAllowedException :
    DownloadApiException("GeoID access token cannot be sent to a non-allowlisted download client")

package no.kartverket.geonorge.kartkatalog.download

import io.ktor.client.HttpClient
import io.ktor.client.request.bearerAuth
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.prepareGet
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.URLBuilder
import io.ktor.http.Url
import io.ktor.http.appendPathSegments
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withTimeout
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import no.kartverket.geonorge.kartkatalog.metrics.observeUpstream
import org.slf4j.LoggerFactory
import java.net.URI
import java.net.URISyntaxException
import java.util.UUID
import kotlin.coroutines.cancellation.CancellationException
import kotlin.time.Duration.Companion.seconds

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

    private suspend fun fetchCapabilities(url: String): DownloadApiCapabilities =
        observe("capabilities", "Download API request to $url failed") {
            val response = httpClient.get(url)

            if (!response.status.isSuccess()) {
                log.warn("Nedlasting request to {} failed with status: {}", url, response.status)
                throw DownloadApiException("Download API request to $url failed with status ${response.status}")
            }

            try {
                json.decodeFromString(DownloadApiCapabilities.serializer(), response.bodyAsText())
            } catch (e: Exception) {
                log.error("Failed to parse download API capabilities response from {}", url, e)
                throw DownloadApiException("Failed to parse download API capabilities response from $url", e)
            }
        }

    suspend fun getAreas(url: String): List<DownloadApiAreaCodelistEntry> {
        val validatedUrl = parseHttpUrl(url, "area")
        return observe("areas", "Download API request to $url failed") {
            val response = httpClient.get(validatedUrl.toString())

            if (!response.status.isSuccess()) {
                log.warn("Nedlasting request to {} failed with status: {}", url, response.status)
                throw DownloadApiException("Download API request to $url failed with status ${response.status}")
            }

            try {
                json.decodeFromString(ListSerializer(DownloadApiAreaCodelistEntry.serializer()), response.bodyAsText())
            } catch (e: Exception) {
                throw DownloadApiException("Failed to parse download API area response from $url", e)
            }
        }
    }

    // Times the request together with the status check and decoding, so every call that throws counts as an error.
    // Other exceptions (network failures, timeouts) are wrapped with [failureMessage]; cancellation is rethrown as is.
    private suspend fun <T> observe(
        operation: String,
        failureMessage: String,
        block: suspend () -> T,
    ): T =
        try {
            observeUpstream(UPSTREAM, operation, block = block)
        } catch (e: DownloadApiException) {
            throw e
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            throw DownloadApiException(failureMessage, e)
        }

    enum class DownloadAvailability {
        AVAILABLE,
        CONFIRMED_UNAVAILABLE,
        UNKNOWN,
    }

    suspend fun checkAvailability(url: String): DownloadAvailability =
        try {
            observeUpstream(UPSTREAM, "availability", failed = { it == DownloadAvailability.UNKNOWN }) {
                withTimeout(3.seconds) {
                    httpClient.prepareGet(url).execute { response ->
                        when {
                            response.status.isSuccess() -> DownloadAvailability.AVAILABLE
                            response.status == HttpStatusCode.NotFound ||
                                response.status == HttpStatusCode.Gone -> DownloadAvailability.CONFIRMED_UNAVAILABLE
                            else -> DownloadAvailability.UNKNOWN
                        }
                    }
                }
            }
        } catch (e: Exception) {
            // Our own 3s timeout leaves this coroutine active and yields UNKNOWN; a cancelled caller is rethrown here.
            currentCoroutineContext().ensureActive()
            log.warn("Nedlasting availability check failed for {}: {}", url, e.message)
            DownloadAvailability.UNKNOWN
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

        return observe("order", "Download API order request to $requestUrl failed") {
            val response =
                httpClient.post(requestUrl) {
                    geoIdAccessToken?.let { bearerAuth(it) }
                    contentType(ContentType.Application.Json)
                    setBody(json.encodeToString(DownloadApiOrderRequest.serializer(), request))
                }

            if (!response.status.isSuccess()) {
                val errorBody = runCatching { response.bodyAsText() }.getOrNull()
                log.warn(
                    "Nedlasting order request to {} failed with status: {}, body: {}",
                    requestUrl,
                    response.status,
                    errorBody,
                )
                if (errorBody?.contains(MISSING_ROLE_MESSAGE) == true) {
                    throw DownloadAccessDeniedException(errorBody)
                }
                throw DownloadApiException(
                    "Download API order request to $requestUrl failed with status ${response.status}" +
                        (errorBody?.takeIf { it.isNotBlank() }?.let { ": $it" } ?: ""),
                )
            }

            try {
                json.decodeFromString(DownloadApiOrderResponse.serializer(), response.bodyAsText())
            } catch (e: Exception) {
                throw DownloadApiException("Failed to parse download API order response from $requestUrl", e)
            }
        }
    }

    private companion object {
        const val UPSTREAM = "download_api"
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

// Nedlastings-API-et (v3) svarer med 500 og en tekst som inneholder dette
// når brukeren mangler rolle for et begrenset datasett
// TODO: sjekk med v4 at dette fortsatt er oppførsel
private const val MISSING_ROLE_MESSAGE = "does not have required role"

class DownloadAccessDeniedException(
    message: String,
) : DownloadApiException(message)

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
import io.ktor.http.appendPathSegments
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import org.slf4j.LoggerFactory

class DownloadApiV4Client(
    private val httpClient: HttpClient,
    private val baseUrl: String,
) {
    private val json =
        Json {
            ignoreUnknownKeys = true
            encodeDefaults = true
        }

    private val logger =
        LoggerFactory.getLogger(DownloadApiV4Client::class.java)

    suspend fun getCapabilities(metadataUuid: String): DownloadApiV4Capabilities =
        getJson(
            url("datasets", metadataUuid, "capabilities"),
            "capabilities",
        )

    suspend fun getProjections(metadataUuid: String): List<DownloadApiV4Projection> =
        getJson(
            url("datasets", metadataUuid, "codelists", "projection"),
            "projection codelist",
        )

    suspend fun getAreas(metadataUuid: String): List<DownloadApiV4Area> =
        getJson(
            url("datasets", metadataUuid, "codelists", "area"),
            "area codelist",
        )

    suspend fun getFormats(metadataUuid: String): List<DownloadApiV4Format> =
        getJson(
            url("datasets", metadataUuid, "codelists", "format"),
            "format codelist",
        )

    suspend fun order(
        request: DownloadApiV4Order,
        geoIdAccessToken: String? = null,
    ): DownloadApiV4OrderReceipt {
        val restricted = geoIdAccessToken != null
        val url =
            if (restricted) {
                url("orders", "restricted")
            } else {
                url("orders")
            }
        val response =
            execute(url, "order") {
                httpClient.post(url) {
                    geoIdAccessToken?.let { bearerAuth(it) }
                    contentType(ContentType.Application.Json)
                    setBody(json.encodeToString(DownloadApiV4Order.serializer(), request))
                }
            }

        return decodeResponse(response, url, "order")
    }

    suspend fun getOrder(
        orderUuid: String,
        geoIdAccessToken: String? = null,
    ): DownloadApiV4OrderReceipt {
        val restricted = geoIdAccessToken != null
        val url =
            if (restricted) {
                url("orders", "restricted", orderUuid)
            } else {
                url("orders", orderUuid)
            }
        val response =
            execute(url, "order") {
                httpClient.get(url) {
                    geoIdAccessToken?.let { bearerAuth(it) }
                }
            }

        return decodeResponse(response, url, "order")
    }

    suspend fun getFile(
        orderUuid: String,
        fileId: String,
        geoIdAccessToken: String? = null,
    ): HttpResponse {
        val segments =
            if (geoIdAccessToken != null) {
                arrayOf("orders", "restricted", orderUuid, fileId)
            } else {
                arrayOf("orders", orderUuid, fileId)
            }
        val url = url(*segments)
        val response =
            execute(url, "file") {
                httpClient.get(url) {
                    geoIdAccessToken?.let { bearerAuth(it) }
                }
            }

        if (!response.status.isSuccess() && response.status.value !in 300..399) {
            throw apiFailure(response, url, "file")
        }
        return response
    }

    private fun url(vararg pathSegments: String): String =
        URLBuilder(baseUrl)
            .appendPathSegments(*pathSegments)
            .buildString()

    private suspend fun execute(
        url: String,
        operation: String,
        request: suspend () -> HttpResponse,
    ): HttpResponse =
        try {
            request()
        } catch (e: Exception) {
            logger.warn("Download API v4 {} request to {} failed", operation, url, e)
            throw DownloadApiException("Download API v4 $operation request to $url failed", e)
        }

    private suspend inline fun <reified T> getJson(
        url: String,
        operation: String,
    ): T {
        val response =
            execute(url, operation) {
                httpClient.get(url)
            }
        return decodeResponse(response, url, operation)
    }

    private suspend inline fun <reified T> decodeResponse(
        response: HttpResponse,
        url: String,
        operation: String,
    ): T {
        if (!response.status.isSuccess()) {
            throw apiFailure(response, url, operation)
        }

        return try {
            json.decodeFromString<T>(response.bodyAsText())
        } catch (e: Exception) {
            logger.error("Failed to parse Download API v4 {} response from {}", operation, url, e)
            throw DownloadApiException("Failed to parse Download API v4 $operation response from $url", e)
        }
    }

    private suspend fun apiFailure(
        response: HttpResponse,
        url: String,
        operation: String,
    ): DownloadApiException {
        val errorBody =
            try {
                response.bodyAsText()
            } catch (e: Exception) {
                logger.warn("Failed to read Download API v4 error response from {}", url, e)
                null
            }
        logger.warn(
            "Download API v4 {} request to {} failed with status {}",
            operation,
            url,
            response.status,
        )
        return DownloadApiException(
            "Download API v4 $operation request to $url failed with status ${response.status}" +
                (errorBody?.takeIf { it.isNotBlank() }?.let { ": $it" } ?: ""),
        )
    }
}

@Serializable
data class DownloadApiV4Capabilities(
    val supportsProjectionSelection: Boolean = false,
    val supportsFormatSelection: Boolean = false,
    val supportsPolygonSelection: Boolean = false,
    val maxArea: Int? = null,
    val supportsAreaSelection: Boolean = false,
    val mapSelectionLayer: String? = null,
    val supportsDownloadBundling: Boolean = false,
    val distributedBy: String? = null,
    val accessConstraintRequiredRole: String? = null,
    val deliveryNotificationByEmail: Boolean = false,
    @SerialName("_links")
    val links: List<DownloadApiLink> = emptyList(),
)

@Serializable
data class DownloadApiV4Area(
    val type: String? = null,
    val name: String,
    val code: String,
    val projections: List<DownloadApiV4Projection> = emptyList(),
    val formats: List<DownloadApiV4Format> = emptyList(),
    @SerialName("_links")
    val links: List<DownloadApiLink> = emptyList(),
)

@Serializable
data class DownloadApiV4Projection(
    val code: String,
    val name: String,
    val codespace: String? = null,
    val formats: List<DownloadApiV4Format> = emptyList(),
    @SerialName("_links")
    val links: List<DownloadApiLink> = emptyList(),
)

@Serializable
data class DownloadApiV4Format(
    val name: String,
    val version: String? = null,
    val projections: List<DownloadApiV4Projection> = emptyList(),
    @SerialName("_links")
    val links: List<DownloadApiLink> = emptyList(),
)

@Serializable
data class DownloadApiV4Order(
    val downloadAsBundle: Boolean = false,
    val email: String? = null,
    val downloadBundleUrl: String? = null,
    val orderLines: List<DownloadApiV4OrderLine>,
    val usageGroup: String? = null,
    val softwareClient: String? = null,
    val softwareClientVersion: String? = null,
)

@Serializable
data class DownloadApiV4OrderLine(
    val areas: List<DownloadApiV4OrderArea> = emptyList(),
    val formats: List<DownloadApiV4Format> = emptyList(),
    val metadataUuid: String,
    val projections: List<DownloadApiV4Projection> = emptyList(),
    val coordinates: String? = null,
    @SerialName("coordinatesystem")
    val coordinateSystem: String? = null,
    val clipperFile: String? = null,
    val usagePurpose: List<String> = emptyList(),
)

@Serializable
data class DownloadApiV4OrderArea(
    val code: String,
    val name: String,
    val type: String? = null,
)

@Serializable
data class DownloadApiV4OrderReceipt(
    val referenceNumber: String? = null,
    val files: List<DownloadApiV4File> = emptyList(),
    val email: String? = null,
    val orderDate: String? = null,
    val downloadAsBundle: Boolean = false,
    val downloadBundleUrl: String? = null,
    @SerialName("_links")
    val links: List<DownloadApiLink> = emptyList(),
)

@Serializable
data class DownloadApiV4File(
    val downloadUrl: String? = null,
    val fileSize: String? = null,
    val name: String? = null,
    val fileId: String? = null,
    val metadataUuid: String? = null,
    val area: String? = null,
    val coordinates: String? = null,
    val projection: String? = null,
    val format: String? = null,
    val status: String? = null,
    val metadataName: String? = null,
    val areaName: String? = null,
    val projectionName: String? = null,
    @SerialName("_links")
    val links: List<DownloadApiLink> = emptyList(),
)

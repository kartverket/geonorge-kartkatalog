package no.kartverket.geonorge.kartkatalog.download

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

const val ORDER_REL = "http://rel.geonorge.no/download/order"
const val AREA_REL = "http://rel.geonorge.no/download/area"

@Serializable
data class DownloadApiCapabilities(
    val supportsProjectionSelection: Boolean = false,
    val supportsFormatSelection: Boolean = false,
    val supportsPolygonSelection: Boolean = false,
    val supportsAreaSelection: Boolean = false,
    val supportsDownloadBundling: Boolean = false,
    val distributedBy: String? = null,
    val deliveryNotificationByEmail: Boolean = false,
    val accessConstraintRequiredRole: String? = null,
    @SerialName("_links")
    val links: List<DownloadApiLink> = emptyList(),
) {
    fun linkFor(rel: String): String? = links.firstOrNull { it.rel == rel }?.href
}

@Serializable
data class DownloadApiLink(
    val href: String,
    val rel: String,
)

@Serializable
data class DownloadApiOrderRequest(
    val email: String = "",
    val usageGroup: String? = null,
    val softwareClient: String = "Kartkatalogen",
    val softwareClientVersion: String? = null,
    val orderLines: List<DownloadApiOrderLine>,
)

@Serializable
data class DownloadApiOrderLine(
    val metadataUuid: String,
    val areas: List<DownloadApiArea> = emptyList(),
    val projections: List<DownloadApiProjection> = emptyList(),
    val formats: List<DownloadApiFormat> = emptyList(),
    val usagePurpose: List<String> = emptyList(),
    val coordinates: String? = null,
    val clipperFile: String? = null,
)

@Serializable
data class DownloadApiArea(
    val code: String,
    val name: String,
    val type: String? = null,
)

@Serializable
data class DownloadApiProjection(
    val code: String,
    val name: String,
    val codespace: String? = null,
)

@Serializable
data class DownloadApiFormat(
    val code: String? = null,
    val name: String,
    val type: String? = null,
)

@Serializable
data class DownloadApiOrderResponse(
    val files: List<DownloadApiOrderFile> = emptyList(),
    @SerialName("_links")
    val links: List<DownloadApiLink> = emptyList(),
)

@Serializable
data class DownloadApiOrderFile(
    val status: String,
    val downloadUrl: String? = null,
    val name: String? = null,
    val areaName: String? = null,
    val projectionName: String? = null,
    val format: String? = null,
    val metadataUuid: String? = null,
    val metadataName: String? = null,
)

@Serializable
data class DownloadApiAreaCodelistEntry(
    val type: String? = null,
    val name: String,
    val code: String,
    val projections: List<DownloadApiProjectionOption> = emptyList(),
    val formats: List<DownloadApiFormatOption> = emptyList(),
)

@Serializable
data class DownloadApiProjectionOption(
    val code: String,
    val name: String,
    val codespace: String? = null,
    val formats: List<DownloadApiFormatOption>? = null,
)

@Serializable
data class DownloadApiFormatOption(
    val name: String,
)

@Serializable
data class DownloadInsightGroups(
    val formal: List<String> = emptyList(),
    val brukergrupper: List<String> = emptyList(),
)

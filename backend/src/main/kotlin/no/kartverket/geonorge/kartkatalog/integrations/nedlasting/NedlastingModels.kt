package no.kartverket.geonorge.kartkatalog.integrations.nedlasting

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class NedlastingCapabilities(
    val supportsProjectionSelection: Boolean = false,
    val supportsFormatSelection: Boolean = false,
    val supportsPolygonSelection: Boolean = false,
    val supportsAreaSelection: Boolean = false,
    val supportsDownloadBundling: Boolean = false,
    val distributedBy: String? = null,
    val deliveryNotificationByEmail: Boolean = false,
    val accessConstraintRequiredRole: String? = null,
    @SerialName("_links")
    val links: List<NedlastingLink> = emptyList(),
) {
    fun linkFor(rel: String): String? = links.firstOrNull { it.rel == rel }?.href
}

@Serializable
data class NedlastingLink(
    val href: String,
    val rel: String,
)

@Serializable
data class NedlastingOrderRequest(
    val email: String = "",
    val usageGroup: String? = null,
    val softwareClient: String = "Kartkatalogen",
    val softwareClientVersion: String? = null,
    val orderLines: List<NedlastingOrderLine>,
)

@Serializable
data class NedlastingOrderLine(
    val metadataUuid: String,
    val areas: List<NedlastingArea> = emptyList(),
    val projections: List<NedlastingProjection> = emptyList(),
    val formats: List<NedlastingFormat> = emptyList(),
    val usagePurpose: List<String> = emptyList(),
    val coordinates: String? = null,
    val clipperFile: String? = null,
)

@Serializable
data class NedlastingArea(
    val code: String,
    val name: String,
    val type: String? = null,
)

@Serializable
data class NedlastingProjection(
    val code: String,
    val name: String,
    val codespace: String? = null,
)

@Serializable
data class NedlastingFormat(
    val code: String? = null,
    val name: String,
    val type: String? = null,
)

@Serializable
data class NedlastingOrderResponse(
    val files: List<NedlastingOrderFile> = emptyList(),
    @SerialName("_links")
    val links: List<NedlastingLink> = emptyList(),
)

@Serializable
data class NedlastingOrderFile(
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
data class NedlastingFormatCodelistEntry(
    val name: String,
    val projections: List<NedlastingProjection> = emptyList(),
)

@Serializable
data class NedlastingAreaCodelistEntry(
    val type: String? = null,
    val name: String,
    val code: String,
)

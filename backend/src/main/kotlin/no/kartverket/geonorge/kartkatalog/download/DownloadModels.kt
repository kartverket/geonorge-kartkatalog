package no.kartverket.geonorge.kartkatalog.download

data class DownloadOrderItem(
    val uuid: String,
    val areas: List<DownloadOrderArea> = emptyList(),
    val projections: List<DownloadOrderProjection> = emptyList(),
    val formats: List<DownloadOrderFormat> = emptyList(),
    val usagePurpose: List<String> = emptyList(),
    val coordinates: String? = null,
    val clipperFile: String? = null,
)

data class DownloadOrderArea(
    val code: String,
    val name: String,
    val type: String? = null,
)

data class DownloadOrderProjection(
    val code: String,
    val name: String,
    val codespace: String? = null,
)

data class DownloadOrderFormat(
    val code: String? = null,
    val name: String,
    val type: String? = null,
)

data class DownloadOrderRequest(
    val email: String = "",
    val usageGroup: String? = null,
    val items: List<DownloadOrderItem>,
)

data class DownloadOrderResult(
    val responses: List<DownloadOrderResponse>,
)

data class DownloadOrderResponse(
    val files: List<DownloadOrderFile> = emptyList(),
    val links: List<DownloadOrderLink> = emptyList(),
)

data class DownloadOrderFile(
    val status: String,
    val downloadUrl: String? = null,
    val name: String? = null,
    val areaName: String? = null,
    val projectionName: String? = null,
    val format: String? = null,
    val metadataUuid: String? = null,
    val metadataName: String? = null,
)

data class DownloadOrderLink(
    val href: String,
    val rel: String,
)

data class DownloadOptions(
    val areas: List<DownloadAreaOption>,
)

data class DownloadAreaOption(
    val area: DownloadArea,
    val projections: List<DownloadProjectionOption>,
)

data class DownloadArea(
    val code: String,
    val name: String,
    val type: String? = null,
)

data class DownloadFormatOption(
    val name: String,
)

data class DownloadProjectionOption(
    val code: String,
    val name: String,
    val codespace: String? = null,
    val formats: List<DownloadFormatOption>,
)

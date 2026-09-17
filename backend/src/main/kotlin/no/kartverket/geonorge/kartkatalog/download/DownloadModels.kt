package no.kartverket.geonorge.kartkatalog.download

import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingArea
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingFormat
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingOrderResponse
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingProjection

data class DownloadOrderItem(
    val uuid: String,
    val areas: List<NedlastingArea> = emptyList(),
    val projections: List<NedlastingProjection> = emptyList(),
    val formats: List<NedlastingFormat> = emptyList(),
    val usagePurpose: List<String> = emptyList(),
    val coordinates: String? = null,
    val clipperFile: String? = null,
)

data class DownloadOrderRequest(
    val email: String = "",
    val usageGroup: String? = null,
    val items: List<DownloadOrderItem>,
)

data class DownloadOrderResult(
    val responses: List<NedlastingOrderResponse>,
)

data class DownloadOptions(
    val formats: List<String>,
    val defaultArea: NedlastingArea?,
    val defaultProjection: NedlastingProjection?,
)

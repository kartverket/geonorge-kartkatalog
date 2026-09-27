package no.kartverket.geonorge.kartkatalog.download

import kotlinx.serialization.Serializable
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

data class GeoIdUser(
    val username: String,
    val accessToken: String,
)

@Serializable
data class BaatOrganization(
    val name: String,
    val organizationNumber: String,
)

@Serializable
data class BaatUserInfo(
    val username: String,
    val name: String,
    val email: String,
    val authorizedFrom: Int,
    val authorizedUntil: Int,
    val organization: BaatOrganization,
    val services: Set<String>,
)

fun interface BaatAuthorizationService {
    suspend fun getUserInfo(user: GeoIdUser): BaatUserInfo
}

data class DownloadOptions(
    val areas: List<NedlastingArea>,
    val formats: List<DownloadFormatOption>,
)

@Serializable
data class DownloadFormatOption(
    val name: String,
    val projections: List<NedlastingProjection>,
)

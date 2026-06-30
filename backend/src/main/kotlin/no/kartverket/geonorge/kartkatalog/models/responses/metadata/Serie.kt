package no.kartverket.geonorge.kartkatalog.models.responses.metadata

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Serie(
    @SerialName("Uuid")
    val uuid: String? = null,
    @SerialName("Title")
    val title: String? = null,
    @SerialName("DistributionProtocol")
    val distributionProtocol: String? = null,
    @SerialName("GetCapabilitiesUrl")
    val getCapabilitiesUrl: String? = null,
    @SerialName("TypeName")
    val typeName: String? = null,
    @SerialName("Theme")
    val theme: String? = null,
    @SerialName("Organization")
    val organization: String? = null,
    @SerialName("DistributionUrl")
    val distributionUrl: String? = null,
    @SerialName("AccessIsRestricted")
    val accessIsRestricted: Boolean? = null,
    @SerialName("AccessIsOpendata")
    val accessIsOpendata: Boolean? = null,
)

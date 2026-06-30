package no.kartverket.geonorge.kartkatalog.models.responses.metadata

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class SimpleOperation(
    @SerialName("Name")
    val name: String? = null,
    @SerialName("Platform")
    val platform: String? = null,
    @SerialName("URL")
    val url: String? = null,
    @SerialName("Description")
    val description: String? = null,
)

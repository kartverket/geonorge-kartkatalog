package no.kartverket.geonorge.kartkatalog.models.responses.metadata

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Thumbnail(
    @SerialName("Type")
    val type: String? = null,
    @SerialName("URL")
    val url: String? = null,
)

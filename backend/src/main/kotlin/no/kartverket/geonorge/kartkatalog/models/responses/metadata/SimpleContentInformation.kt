package no.kartverket.geonorge.kartkatalog.models.responses.metadata

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class SimpleContentInformation(
    @SerialName("CloudCoverPercentage")
    val cloudCoverPercentage: Double = 0.0,
)

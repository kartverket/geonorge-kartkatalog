package no.kartverket.geonorge.kartkatalog.models.responses.metadata

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class QuantitativeResult(
    @SerialName("Availability")
    val availability: String? = null,
    @SerialName("Capacity")
    val capacity: String? = null,
    @SerialName("Performance")
    val performance: String? = null,
    @SerialName("FAIR")
    val fair: String? = null,
    @SerialName("Coverage")
    val coverage: String? = null,
)

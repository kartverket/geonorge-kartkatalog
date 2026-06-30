package no.kartverket.geonorge.kartkatalog.models.responses.metadata

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ReferenceSystem(
    @SerialName("CoordinateSystem")
    val coordinateSystem: String? = null,
    @SerialName("CoordinateSystemUrl")
    val coordinateSystemUrl: String? = null,
    @SerialName("Namespace")
    val namespace: String? = null,
)

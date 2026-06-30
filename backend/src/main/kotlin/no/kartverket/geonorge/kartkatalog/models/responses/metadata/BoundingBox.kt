package no.kartverket.geonorge.kartkatalog.models.responses.metadata

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class BoundingBox(
    @SerialName("NorthBoundLongitude")
    val northBoundLongitude: String? = null,
    @SerialName("SouthBoundLatitude")
    val southBoundLatitude: String? = null,
    @SerialName("EastBoundLatitude")
    val eastBoundLatitude: String? = null,
    @SerialName("WestBoundLongitude")
    val westBoundLongitude: String? = null,
)

package no.kartverket.geonorge.kartkatalog.models.responses.metadata

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class BoundingBox(
    @SerialName("NorthBoundLatitude")
    val northBoundLatitude: String? = null,
    @SerialName("SouthBoundLatitude")
    val southBoundLatitude: String? = null,
    @SerialName("EastBoundLongitude")
    val eastBoundLongitude: String? = null,
    @SerialName("WestBoundLongitude")
    val westBoundLongitude: String? = null,
)

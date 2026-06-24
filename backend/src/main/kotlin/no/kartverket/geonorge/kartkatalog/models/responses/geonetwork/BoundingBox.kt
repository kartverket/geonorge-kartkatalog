package no.kartverket.geonorge.kartkatalog.models.responses.geonetwork

import kotlinx.serialization.Serializable

@Serializable
data class BoundingBox(
    val westBoundLongitude: Double,
    val eastBoundLongitude: Double,
    val southBoundLatitude: Double,
    val northBoundLatitude: Double,
)

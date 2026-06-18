package no.kartverket.geonorge.kartkatalog.models

data class BoundingBox(
    val westBoundLongitude: Double,
    val eastBoundLongitude: Double,
    val southBoundLatitude: Double,
    val northBoundLatitude: Double,
)

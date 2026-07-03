package no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model

import kotlinx.serialization.Serializable

@Serializable
data class TemporalExtent(
    val begin: String? = null,
    val end: String? = null,
)

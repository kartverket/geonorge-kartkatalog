package no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model

import kotlinx.serialization.Serializable

@Serializable
data class OperatesOn(
    val uuidref: String,
    val href: String? = null,
)

@Serializable
data class ServiceOperation(
    val operationName: String? = null,
    val dcp: List<String> = emptyList(),
    val operationDescription: String? = null,
    val connectPoints: List<OnlineResource> = emptyList(),
)

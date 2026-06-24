package no.kartverket.geonorge.kartkatalog.models.responses.geonetwork

import kotlinx.serialization.Serializable

@Serializable
data class DistributionFormat(
    val name: String,
    val version: String? = null,
)

@Serializable
data class OnlineResource(
    val url: String,
    val protocol: String? = null,
    val name: String? = null,
    val description: String? = null,
    val unitsOfDistribution: String? = null,
    val applicationProfile: String? = null,
    val function: String? = null,
)

@Serializable
data class DistributionInfo(
    val formats: List<DistributionFormat> = emptyList(),
    val onlineResources: List<OnlineResource> = emptyList(),
)

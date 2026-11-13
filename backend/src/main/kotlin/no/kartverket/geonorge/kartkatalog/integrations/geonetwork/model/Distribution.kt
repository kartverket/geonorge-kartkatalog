package no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model

import kotlinx.serialization.Serializable

@Serializable
data class DistributionFormat(
    val name: String,
    val version: String? = null,
    val onlineResources: List<OnlineResource> = emptyList(),
    val distributorOrganization: String? = null,
    val distributorFirstResource: OnlineResource? = null,
    val distributorUnitsOfDistribution: String? = null,
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
    val transferOptions: List<OnlineResource> = emptyList(),
)

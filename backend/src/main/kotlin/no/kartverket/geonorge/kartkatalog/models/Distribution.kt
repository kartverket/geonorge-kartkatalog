package no.kartverket.geonorge.kartkatalog.models

data class DistributionFormat(
    val name: String,
    val version: String? = null,
)

data class OnlineResource(
    val url: String,
    val protocol: String? = null,
    val name: String? = null,
    val description: String? = null,
    val unitsOfDistribution: String? = null,
    val applicationProfile: String? = null,
    val function: String? = null,
)

data class DistributionInfo(
    val formats: List<DistributionFormat> = emptyList(),
    val onlineResources: List<OnlineResource> = emptyList(),
)

package no.kartverket.geonorge.kartkatalog.metadata.models

import kotlinx.serialization.Serializable

@Serializable
data class LinkedDistribution(
    val uuid: String,
    val title: String?,
    val organization: String?,
    val typeTranslated: String?,
    val thumbnailUrl: String?,
    val distributionUrl: String?,
    val distributionProtocol: String?,
    val getCapabilitiesUrl: String?,
    val showMapLink: Boolean,
    val mapCapabilitiesUrl: String?,
    val formats: List<String> = emptyList(),
    val protocolName: String? = null,
    val hierarchyLevel: String? = null,
)

@Serializable
data class LinkedDistributions(
    val applications: List<LinkedDistribution> = emptyList(),
    val viewServices: List<LinkedDistribution> = emptyList(),
    val downloadServices: List<LinkedDistribution> = emptyList(),
)

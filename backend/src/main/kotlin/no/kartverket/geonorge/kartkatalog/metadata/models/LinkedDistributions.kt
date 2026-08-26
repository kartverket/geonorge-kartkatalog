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
    val protocolNames: List<String> = emptyList(),
    val hierarchyLevel: String? = null,
    val accessState: AccessState? = null,
)

@Serializable
data class LinkedDistributions(
    val applications: List<LinkedDistribution> = emptyList(),
    val viewServices: List<LinkedDistribution> = emptyList(),
    val downloadServices: List<LinkedDistribution> = emptyList(),
    val seriesMembers: List<LinkedDistribution> = emptyList(),
    val parentSeries: List<LinkedDistribution> = emptyList(),
    val relatedDatasets: List<LinkedDistribution> = emptyList(),
    val serviceLayers: List<LinkedDistribution> = emptyList(),
    val parentService: List<LinkedDistribution> = emptyList(),
)

package no.kartverket.geonorge.kartkatalog.metadata.models

import kotlinx.serialization.Serializable

@Serializable
data class LinkedDistribution(
    val uuid: String,
    val title: String?,
    val url: String?,
    val formats: List<String> = emptyList(),
)

@Serializable
data class LinkedDistributions(
    val applications: List<LinkedDistribution> = emptyList(),
    val viewServices: List<LinkedDistribution> = emptyList(),
    val downloadServices: List<LinkedDistribution> = emptyList(),
)

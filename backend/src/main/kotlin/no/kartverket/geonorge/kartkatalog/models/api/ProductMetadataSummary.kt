package no.kartverket.geonorge.kartkatalog.models.api

import kotlinx.serialization.Serializable

@Serializable
data class ProductMetadataSummary(
    val title: String,
    val organization: String,
    val hierarchyLevel: String,
    val accessIsRestricted: Boolean,
    val accessIsOpenData: Boolean,
    val accessIsProtected: Boolean,
    val dateUpdated: String?,
    val maintenanceFrequency: String,
    val spatialRepresentation: String,
    val resolutionScale: String? = null,
    val keywordsTheme: List<Keyword>,
    val nationalKeywords: List<Keyword>,
    val distributionFormats: List<ProductDistributionFormat>,
)

@Serializable
data class ProductDistributionFormat(
    val name: String? = null,
    val version: String? = null,
)

@Serializable
data class Keyword(
    val keywordValue: String? = null,
    val type: String? = null,
)

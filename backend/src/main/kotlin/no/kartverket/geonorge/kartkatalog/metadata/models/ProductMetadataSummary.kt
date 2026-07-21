package no.kartverket.geonorge.kartkatalog.metadata.models

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
    val keywordsTheme: List<ProductKeyword>,
    val nationalKeywords: List<ProductKeyword>,
    val distributionFormats: List<ProductDistributionFormat>,
    val dataQualityMeasures: List<ProductDataQualityMeasure> = emptyList(),
)

@Serializable
data class ProductDistributionFormat(
    val name: String? = null,
    val version: String? = null,
)

@Serializable
data class ProductKeyword(
    val keywordValue: String? = null,
    val type: String? = null,
)

@Serializable
data class ProductDataQualityMeasure(
    val explanation: String? = null,
    val quantitativeResult: Int? = null,
    val quantitativeResultValueUnit: String? = null,
    val title: String? = null,
)

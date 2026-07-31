package no.kartverket.geonorge.kartkatalog.metadata.models

import kotlinx.serialization.Serializable
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.LegalConstraints

@Serializable
data class ProductMetadata(
    val title: String,
    val organization: String? = null,
    val hierarchyLevel: String,
    val accessIsRestricted: Boolean? = null,
    val accessIsOpenData: Boolean? = null,
    val accessIsProtected: Boolean? = null,
    val dateUpdated: String? = null,
    val maintenanceFrequency: String? = null,
    val spatialRepresentation: String? = null,
    val spatialScope: String? = null,
    val resolutionScale: String? = null,
    val keywordsTheme: List<ProductKeyword> = emptyList(),
    val nationalKeywords: List<ProductKeyword> = emptyList(),
    val distributionFormats: List<ProductDistributionFormat> = emptyList(),
    val thumbnailUrl: String? = null,
    val dataQualityMeasures: List<ProductDataQualityMeasure> = emptyList(),
    val fairStatusPercentFromMetadata: Int? = null,
    val abstractText: String? = null,
    val purpose: String? = null,
    val specificUsage: String? = null,
    val processHistory: String? = null,
    val constraints: LegalConstraints? = null,
    val securityClassification: String? = null,
    val contactMetadata: ProductMetadataContact? = null,
    val contactOwner: ProductMetadataContact? = null,
    val contactPublisher: ProductMetadataContact? = null,
    val coverageUrl: String? = null,
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

@Serializable
data class ProductMetadataContact(
    var email: String? = null,
    var name: String? = null,
    var organization: String? = null,
    var organizationEnglish: String? = null,
    var role: String? = null,
)

package no.kartverket.geonorge.kartkatalog.metadata.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ProductMetadata(
    val title: String,
    val organization: String? = null,
    val hierarchyLevel: String,
    val accessState: AccessState? = null,
    val dateUpdated: String? = null,
    val maintenanceFrequency: String? = null,
    val spatialRepresentation: String? = null,
    val spatialScope: String? = null,
    val resolutionScale: String? = null,
    val keywordsTheme: List<ProductKeyword> = emptyList(),
    val nationalKeywords: List<ProductKeyword> = emptyList(),
    val distributionFormats: List<ProductDistributionFormat> = emptyList(),
    val thumbnailUrl: String? = null,
    val fairStatusPercentFromMetadata: Int? = null,
    val abstractText: String? = null,
    val purpose: String? = null,
    val specificUsage: String? = null,
    val processHistory: String? = null,
    val constraints: ProductConstraints? = null,
    val securityClassification: String? = null,
    val contactMetadata: ProductMetadataContact? = null,
    val contactOwner: ProductMetadataContact? = null,
    val contactPublisher: ProductMetadataContact? = null,
    val referenceSystems: List<ProductReferenceSystem> = emptyList(),
    val distributionGroups: List<ProductDistributionGroup> = emptyList(),
    val coverageUrl: String? = null,
)

@Serializable
enum class AccessState {
    @SerialName("restricted")
    RESTRICTED,

    @SerialName("open")
    OPEN,

    @SerialName("protected")
    PROTECTED,
}

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
data class ProductMetadataContact(
    var email: String? = null,
    var name: String? = null,
    var organization: String? = null,
    var organizationEnglish: String? = null,
    var role: String? = null,
)

@Serializable
data class ProductReferenceSystem(
    val code: String? = null,
    val codeSpace: String? = null,
)

@Serializable
data class ProductDistributionGroup(
    val protocol: String? = null,
    val protocolName: String? = null,
    val protocolDescription: String? = null,
    val formats: List<ProductDistributionFormatEntry> = emptyList(),
    val unitsOfDistribution: String? = null,
)

@Serializable
data class ProductDistributionFormatEntry(
    val name: String,
    val urls: List<String> = emptyList(),
)

@Serializable
data class ProductConstraints(
    val accessConstraints: String? = null,
    val useConstraints: String? = null,
    val useLimitations: List<String> = emptyList(),
    val otherConstraintsLink: String? = null,
    val otherConstraintsLinkText: String? = null,
    val otherConstraintsAccess: String? = null,
)

package no.kartverket.geonorge.kartkatalog.models.responses.geonetwork

import kotlinx.serialization.Serializable

@Serializable
data class Thumbnail(
    val url: String,
    val type: String? = null,
)

@Serializable
data class ReferenceSystem(
    val code: String,
    val codeSpace: String? = null,
)

@Serializable
data class MetadataDate(
    val date: String,
    val type: String,
)

@Serializable
data class QualitySpecification(
    val title: String,
    val date: String? = null,
    val dateType: String? = null,
    val explanation: String? = null,
    val explanationEnglish: String? = null,
    val pass: Boolean? = null,
    val specificationHref: String? = null,
    val specificationIdentifier: String? = null,
)

@Serializable
data class MetadataRecord(
    // MD_Metadata level
    val uuid: String,
    val parentIdentifier: String? = null,
    val language: String,
    val characterSet: String? = null,
    val hierarchyLevel: String,
    val hierarchyLevelName: String? = null,
    val metadataStandard: String? = null,
    val metadataStandardVersion: String? = null,
    val dateStamp: String,
    val metadataContact: Contact,
    val referenceSystems: List<ReferenceSystem> = emptyList(),
    val extensionResources: List<ExtensionResource> = emptyList(),
    val applicationSchemaInfos: List<ApplicationSchemaInfo> = emptyList(),
    // Identification — common to dataset and service
    val title: String,
    val abstract: String? = null,
    val purpose: String? = null,
    val status: String? = null,
    val maintenanceFrequency: String? = null,
    val specificUsage: String? = null,
    val processHistory: String? = null,
    val contacts: List<Contact> = emptyList(),
    val dates: List<MetadataDate> = emptyList(),
    val thumbnails: List<Thumbnail> = emptyList(),
    val keywordGroups: List<KeywordGroup> = emptyList(),
    val legalConstraints: LegalConstraints? = null,
    val securityConstraints: SecurityConstraints? = null,
    val boundingBox: BoundingBox? = null,
    val temporalExtents: List<TemporalExtent> = emptyList(),
    // Identification — dataset specific
    val resourceLanguages: List<String> = emptyList(),
    val topicCategories: List<String> = emptyList(),
    val spatialRepresentationTypes: List<String> = emptyList(),
    // Distribution
    val distributionInfo: DistributionInfo? = null,
    // Data quality
    val qualitySpecifications: List<QualitySpecification> = emptyList(),
    // Service specific
    val serviceType: String? = null,
    val serviceTypeVersion: String? = null,
    val couplingType: String? = null,
    val orderingInstructions: String? = null,
    val serviceOperations: List<ServiceOperation> = emptyList(),
    val operatesOn: List<OperatesOn> = emptyList(),
)

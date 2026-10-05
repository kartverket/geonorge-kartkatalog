@file:Suppress("ktlint:standard:max-line-length", "ktlint:standard:no-consecutive-blank-lines")

package no.kartverket.geonorge.kartkatalog.metadata.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Wire model for the legacy GET /api/getdata/{uuid} endpoint. */
@Serializable
data class LegacyMetadataViewModel(
    @SerialName("MapOnlyWms") val mapOnlyWms: Boolean = false,
    @SerialName("Abstract") val abstractText: String? = null,
    @SerialName("BoundingBox") val boundingBox: LegacyBoundingBox? = null,
    @SerialName("Constraints") val constraints: LegacyConstraints? = null,
    @SerialName("ContactMetadata") val contactMetadata: LegacyContact? = null,
    @SerialName("ContactOwner") val contactOwner: LegacyContact? = null,
    @SerialName("Organization") val organization: String? = null,
    @SerialName("OrganizationEnglish") val organizationEnglish: String? = null,
    @SerialName("ContactOwners") val contactOwners: List<LegacyContact>? = null,
    @SerialName("ContactPublisher") val contactPublisher: LegacyContact? = null,
    @SerialName("DateCreated") val dateCreated: String? = null,
    @SerialName("DateMetadataUpdated") val dateMetadataUpdated: String? = null,
    @SerialName("DateMetadataValidFrom") val dateMetadataValidFrom: String? = null,
    @SerialName("DateMetadataValidTo") val dateMetadataValidTo: String? = null,
    @SerialName("DatePublished") val datePublished: String? = null,
    @SerialName("DateUpdated") val dateUpdated: String? = null,
    @SerialName("DistributionDetails") val distributionDetails: LegacyDistributionDetails? = null,
    @SerialName("DistributionProtocol") val distributionProtocol: String? = null,
    @SerialName("Protocol") val protocol: String? = null,
    @SerialName("DistributionFormat") val distributionFormat: LegacyDistributionFormat? = null,
    @SerialName("DistributionFormats") val distributionFormats: List<LegacyDistributionFormat>? = null,
    @SerialName("DistributionsFormats") val distributionsFormats: List<LegacyDistributionViewModel>? = null,
    @SerialName(
        "DistributionFormatsGrouped",
    ) val distributionFormatsGrouped: List<LegacyDistributionFormatGrouped>? = null,
    @SerialName("UnitsOfDistribution") val unitsOfDistribution: String? = null,
    @SerialName("Operations") val operations: List<LegacyOperation> = emptyList(),
    @SerialName("ReferenceSystems") val referenceSystems: List<LegacyReferenceSystem>? = null,
    @SerialName("EnglishAbstract") val englishAbstract: String? = null,
    @SerialName("EnglishTitle") val englishTitle: String? = null,
    @SerialName("NorwegianTitle") val norwegianTitle: String? = null,
    @SerialName("HierarchyLevel") val hierarchyLevel: String? = null,
    @SerialName("Type") val type: String? = null,
    @SerialName("TypeTranslated") val typeTranslated: String? = null,
    @SerialName("TypeName") val typeName: String? = null,
    @SerialName("Credits") val credits: List<String>? = null,
    @SerialName("Keywords") val keywords: List<LegacyKeyword>? = null,
    @SerialName("KeywordsPlace") val keywordsPlace: List<LegacyKeyword>? = null,
    @SerialName("KeywordsTheme") val keywordsTheme: List<LegacyKeyword>? = null,
    @SerialName("KeywordsInspire") val keywordsInspire: List<LegacyKeyword>? = null,
    @SerialName("KeywordsInspirePriorityDataset") val keywordsInspirePriorityDataset: List<LegacyKeyword>? = null,
    @SerialName(
        "KeywordsHighValueDatasetCategories",
    ) val keywordsHighValueDatasetCategories: List<LegacyKeyword>? = null,
    @SerialName("KeywordsNationalInitiative") val keywordsNationalInitiative: List<LegacyKeyword>? = null,
    @SerialName("KeywordsNationalTheme") val keywordsNationalTheme: List<LegacyKeyword>? = null,
    @SerialName("KeywordsOther") val keywordsOther: List<LegacyKeyword>? = null,
    @SerialName("KeywordsConcept") val keywordsConcept: List<LegacyKeyword>? = null,
    @SerialName("KeywordsAdministrativeUnits") val keywordsAdministrativeUnits: List<LegacyKeyword>? = null,
    @SerialName("SpatialScope") val spatialScope: String? = null,
    @SerialName("LegendDescriptionUrl") val legendDescriptionUrl: String? = null,
    @SerialName("MaintenanceFrequency") val maintenanceFrequency: String? = null,
    @SerialName("DatasetLanguage") val datasetLanguage: String? = null,
    @SerialName("MetadataLanguage") val metadataLanguage: String? = null,
    @SerialName("MetadataStandard") val metadataStandard: String? = null,
    @SerialName("MetadataStandardVersion") val metadataStandardVersion: String? = null,
    @SerialName("OperatesOn") val operatesOn: List<String>? = null,
    @SerialName("Related") val related: List<LegacyRelatedMetadata> = emptyList(),
    @SerialName("ProcessHistory") val processHistory: String? = null,
    @SerialName("Availability") val availability: String? = null,
    @SerialName("Capacity") val capacity: String? = null,
    @SerialName("Performance") val performance: String? = null,
    @SerialName("ProductPageUrl") val productPageUrl: String? = null,
    @SerialName("ProductSheetUrl") val productSheetUrl: String? = null,
    @SerialName("ProductSpecificationUrl") val productSpecificationUrl: String? = null,
    @SerialName("CoverageUrl") val coverageUrl: String? = null,
    @SerialName("CoverageGridUrl") val coverageGridUrl: String? = null,
    @SerialName("CoverageCellUrl") val coverageCellUrl: String? = null,
    @SerialName("SurveyAreaMapUrl") val surveyAreaMapUrl: String? = null,
    @SerialName("SurveyAreaMapUrlWms") val surveyAreaMapUrlWms: String? = null,
    @SerialName("DownloadUrl") val downloadUrl: String? = null,
    @SerialName("Purpose") val purpose: String? = null,
    @SerialName("QualitySpecifications") val qualitySpecifications: List<LegacyQualitySpecification>? = null,
    @SerialName("ReferenceSystem") val referenceSystem: LegacyReferenceSystem? = null,
    @SerialName("ResolutionScale") val resolutionScale: String? = null,
    @SerialName("ResolutionDistance") val resolutionDistance: Double? = null,
    @SerialName("SpatialRepresentation") val spatialRepresentation: String? = null,
    @SerialName("SpecificUsage") val specificUsage: String? = null,
    @SerialName("Status") val status: String? = null,
    @SerialName("OrderingInstructions") val orderingInstructions: String? = null,
    @SerialName("OrderingInstructionsLinkText") val orderingInstructionsLinkText: String? = null,
    @SerialName("SupplementalDescription") val supplementalDescription: String? = null,
    @SerialName("HelpUrl") val helpUrl: String? = null,
    @SerialName("Thumbnails") val thumbnails: List<LegacyThumbnail> = emptyList(),
    @SerialName("Title") val title: String? = null,
    @SerialName("TopicCategory") val topicCategory: String? = null,
    @SerialName("TopicCategories") val topicCategories: List<String>? = null,
    @SerialName("Uuid") val uuid: String? = null,
    @SerialName("ResourceReferenceCode") val resourceReferenceCode: String? = null,
    @SerialName("ResourceReferenceCodespace") val resourceReferenceCodespace: String? = null,
    @SerialName("MetadataXmlUrl") val metadataXmlUrl: String? = null,
    @SerialName("MetadataEditUrl") val metadataEditUrl: String? = null,
    @SerialName("OrganizationLogoUrl") val organizationLogoUrl: String? = null,
    @SerialName("ServiceDistributionNameForDataset") val serviceDistributionNameForDataset: String? = null,
    @SerialName("ServiceDistributionUrlForDataset") val serviceDistributionUrlForDataset: String? = null,
    @SerialName("ServiceDistributionProtocolForDataset") val serviceDistributionProtocolForDataset: String? = null,
    @SerialName("ServiceUuid") val serviceUuid: String? = null,
    @SerialName("ServiceWfsDistributionUrlForDataset") val serviceWfsDistributionUrlForDataset: String? = null,
    @SerialName("ServiceDistributionAccessConstraint") val serviceDistributionAccessConstraint: String? = null,
    @SerialName("ServiceWfsDistributionAccessConstraint") val serviceWfsDistributionAccessConstraint: String? = null,
    @SerialName("AccessIsOpendata") val accessIsOpendata: Boolean = false,
    @SerialName("AccessIsRestricted") val accessIsRestricted: Boolean = false,
    @SerialName("AccessIsProtected") val accessIsProtected: Boolean = false,
    @SerialName("DataAccess") val dataAccess: String? = null,
    @SerialName("CanShowMapUrl") val canShowMapUrl: Boolean = false,
    @SerialName("CanShowServiceMapUrl") val canShowServiceMapUrl: Boolean = false,
    @SerialName("CanShowDownloadService") val canShowDownloadService: Boolean = false,
    @SerialName("CanShowDownloadUrl") val canShowDownloadUrl: Boolean = false,
    @SerialName("CanShowWebsiteUrl") val canShowWebsiteUrl: Boolean = false,
    @SerialName("MapLink") val mapLink: String? = null,
    @SerialName("ServiceLink") val serviceLink: String? = null,
    @SerialName("DistributionUrl") val distributionUrl: String? = null,
    @SerialName("Distributions") val distributions: LegacyDistributions = LegacyDistributions(),
    @SerialName("ServiceType") val serviceType: String? = null,
    @SerialName("DatasetServicesWithShowMapLink") val datasetServicesWithShowMapLink: List<LegacyDatasetService> =
        emptyList(),
    @SerialName("SerieDatasets") val serieDatasets: List<LegacyDataset>? = null,
    @SerialName("Serie") val serie: LegacySerie? = null,
    @SerialName("QuantitativeResult") val quantitativeResult: LegacyQuantitativeResult? = null,
    @SerialName("ContentInformation") val contentInformation: LegacyContentInformation? = null,
    @SerialName("MetMetadata") val metMetadata: Boolean = false,
    @SerialName("ParentIdentifier") val parentIdentifier: String? = null,
)

@Serializable data class LegacyBoundingBox(
    @SerialName("EastBoundLongitude") val eastBoundLongitude: String? = null,
    @SerialName("NorthBoundLatitude") val northBoundLatitude: String? = null,
    @SerialName("SouthBoundLatitude") val southBoundLatitude: String? = null,
    @SerialName("WestBoundLongitude") val westBoundLongitude: String? = null,
)

@Serializable data class LegacyConstraints(
    @SerialName("AccessConstraints") val accessConstraints: String? = null,
    @SerialName("OtherConstraints") val otherConstraints: String? = null,
    @SerialName("OtherConstraintsLink") val otherConstraintsLink: String? = null,
    @SerialName("OtherConstraintsLinkText") val otherConstraintsLinkText: String? = null,
    @SerialName("SecurityConstraints") val securityConstraints: String? = null,
    @SerialName("SecurityConstraintsNote") val securityConstraintsNote: String? = null,
    @SerialName("UseConstraints") val useConstraints: String? = null,
    @SerialName("UseLimitations") val useLimitations: String? = null,
    @SerialName("OtherConstraintsAccess") val otherConstraintsAccess: String? = null,
)

@Serializable data class LegacyContact(
    @SerialName("Email") val email: String? = null,
    @SerialName("Name") val name: String? = null,
    @SerialName("Organization") val organization: String? = null,
    @SerialName("OrganizationEnglish") val organizationEnglish: String? = null,
    @SerialName("Role") val role: String? = null,
)

@Serializable data class LegacyDistributionDetails(
    @SerialName("Name") val name: String? = null,
    @SerialName("Protocol") val protocol: String? = null,
    @SerialName("ProtocolName") val protocolName: String? = null,
    @SerialName("URL") val url: String? = null,
)

@Serializable data class LegacyDistributionFormat(
    @SerialName("Name") val name: String? = null,
    @SerialName("Version") val version: String? = null,
)

@Serializable data class LegacyDistributionViewModel(
    @SerialName("FormatName") val formatName: String? = null,
    @SerialName("FormatVersion") val formatVersion: String? = null,
    @SerialName("URL") val url: String? = null,
    @SerialName("Protocol") val protocol: String? = null,
    @SerialName("ProtocolName") val protocolName: String? = null,
    @SerialName("Name") val name: String? = null,
    @SerialName("Organization") val organization: String? = null,
    @SerialName("UnitsOfDistribution") val unitsOfDistribution: String? = null,
    @SerialName("EnglishUnitsOfDistribution") val englishUnitsOfDistribution: String? = null,
)

@Serializable data class LegacyDistributionFormatGrouped(
    @SerialName("ProtocolName") val protocolName: String? = null,
    @SerialName("ProtocolDescription") val protocolDescription: String? = null,
    @SerialName("Protocol") val protocol: String? = null,
    @SerialName("Organization") val organization: String? = null,
    @SerialName("UnitsOfDistribution") val unitsOfDistribution: String? = null,
    @SerialName("EnglishUnitsOfDistribution") val englishUnitsOfDistribution: String? = null,
    @SerialName("Formats") val formats: List<LegacyDistributionFormatItem> = emptyList(),
    @SerialName("URL") val url: List<String> = emptyList(),
)

@Serializable data class LegacyDistributionFormatItem(
    @SerialName("FormatName") val formatName: String? = null,
    @SerialName("FormatVersion") val formatVersion: String? = null,
    @SerialName("URL") val url: String? = null,
)

@Serializable data class LegacyOperation(
    @SerialName("Name") val name: String? = null,
    @SerialName("Platform") val platform: String? = null,
    @SerialName("URL") val url: String? = null,
    @SerialName("Description") val description: String? = null,
)

@Serializable data class LegacyReferenceSystem(
    @SerialName("CoordinateSystem") val coordinateSystem: String? = null,
    @SerialName("CoordinateSystemUrl") val coordinateSystemUrl: String? = null,
    @SerialName("Namespace") val namespace: String? = null,
)

@Serializable data class LegacyKeyword(
    @SerialName("EnglishKeyword") val englishKeyword: String? = null,
    @SerialName("KeywordValue") val keywordValue: String? = null,
    @SerialName("Thesaurus") val thesaurus: String? = null,
    @SerialName("Type") val type: String? = null,
    @SerialName("KeywordLink") val keywordLink: String? = null,
)

@Serializable data class LegacyQualitySpecification(
    @SerialName("Date") val date: String? = null,
    @SerialName("DateType") val dateType: String? = null,
    @SerialName("Explanation") val explanation: String? = null,
    @SerialName("Result") val result: Boolean? = null,
    @SerialName("Title") val title: String? = null,
    @SerialName("SpecificationLink") val specificationLink: String? = null,
    @SerialName("QuantitativeResult") val quantitativeResult: String? = null,
)

@Serializable data class LegacyThumbnail(
    @SerialName("Type") val type: String? = null,
    @SerialName("URL") val url: String? = null,
)

@Serializable data class LegacyDatasetService(
    @SerialName("Uuid") val uuid: String? = null,
    @SerialName("Title") val title: String? = null,
    @SerialName("DistributionProtocol") val distributionProtocol: String? = null,
    @SerialName("GetCapabilitiesUrl") val getCapabilitiesUrl: String? = null,
)

@Serializable data class LegacyDataset(
    @SerialName("Uuid") val uuid: String? = null,
    @SerialName("Title") val title: String? = null,
    @SerialName("Type") val type: String? = null,
    @SerialName("DistributionProtocol") val distributionProtocol: String? = null,
    @SerialName("GetCapabilitiesUrl") val getCapabilitiesUrl: String? = null,
    @SerialName("Theme") val theme: String? = null,
    @SerialName("Organization") val organization: String? = null,
    @SerialName("DistributionUrl") val distributionUrl: String? = null,
    @SerialName("AccessIsOpendata") val accessIsOpendata: Boolean? = null,
    @SerialName("AccessIsRestricted") val accessIsRestricted: Boolean? = null,
)

@Serializable data class LegacySerie(
    @SerialName("Uuid") val uuid: String? = null,
    @SerialName("Title") val title: String? = null,
    @SerialName("DistributionProtocol") val distributionProtocol: String? = null,
    @SerialName("GetCapabilitiesUrl") val getCapabilitiesUrl: String? = null,
    @SerialName("TypeName") val typeName: String? = null,
    @SerialName("Theme") val theme: String? = null,
    @SerialName("Organization") val organization: String? = null,
    @SerialName("DistributionUrl") val distributionUrl: String? = null,
    @SerialName("AccessIsRestricted") val accessIsRestricted: Boolean? = null,
    @SerialName("AccessIsOpendata") val accessIsOpendata: Boolean? = null,
)

@Serializable data class LegacyQuantitativeResult(
    @SerialName("Availability") val availability: String? = null,
    @SerialName("Capacity") val capacity: String? = null,
    @SerialName("Performance") val performance: String? = null,
    @SerialName("FAIR") val fair: String? = null,
    @SerialName("Coverage") val coverage: String? = null,
)

@Serializable data class LegacyContentInformation(
    @SerialName("CloudCoverPercentage") val cloudCoverPercentage: String? = null,
)

@Serializable data class LegacyRelatedMetadata(
    @SerialName("Uuid") val uuid: String? = null,
)

@Serializable data class LegacyDistributions(
    @SerialName("SelfDistribution") val selfDistribution: List<LegacyDistribution> = emptyList(),
    @SerialName("RelatedDataset") val relatedDataset: List<LegacyDistribution> = emptyList(),
    @SerialName("RelatedSerieDatasets") val relatedSerieDatasets: List<LegacyDistribution> = emptyList(),
    @SerialName("RelatedDatasetSerie") val relatedDatasetSerie: List<LegacyDistribution> = emptyList(),
    @SerialName("RelatedApplications") val relatedApplications: List<LegacyDistribution> = emptyList(),
    @SerialName("RelatedServices") val relatedServices: List<LegacyDistribution> = emptyList(),
    @SerialName("RelatedServiceLayer") val relatedServiceLayer: List<LegacyDistribution> = emptyList(),
    @SerialName("RelatedViewServices") val relatedViewServices: List<LegacyDistribution> = emptyList(),
    @SerialName("RelatedDownloadServices") val relatedDownloadServices: List<LegacyDistribution> = emptyList(),
    @SerialName("ShowRelatedDataset") val showRelatedDataset: Boolean = false,
    @SerialName("ShowRelatedSerieDatasets") val showRelatedSerieDatasets: Boolean = false,
    @SerialName("ShowRelatedDatasetSerie") val showRelatedDatasetSerie: Boolean = false,
    @SerialName("ShowRelatedApplications") val showRelatedApplications: Boolean = false,
    @SerialName("ShowRelatedServices") val showRelatedServices: Boolean = false,
    @SerialName("ShowRelatedServiceLayer") val showRelatedServiceLayer: Boolean = false,
    @SerialName("ShowRelatedViewServices") val showRelatedViewServices: Boolean = false,
    @SerialName("ShowRelatedDownloadServices") val showRelatedDownloadServices: Boolean = false,
    @SerialName("ShowSelfDistributions") val showSelfDistributions: Boolean = true,
    @SerialName("TitleSelf") val titleSelf: String? = null,
    @SerialName("TitleRelatedDataset") val titleRelatedDataset: String? = null,
    @SerialName("TitleRelatedApplications") val titleRelatedApplications: String? = null,
    @SerialName("TitleRelatedServices") val titleRelatedServices: String? = null,
    @SerialName("TitleRelatedServiceLayer") val titleRelatedServiceLayer: String? = null,
    @SerialName("TitleRelatedViewServices") val titleRelatedViewServices: String? = null,
    @SerialName("TitleRelatedDownloadServices") val titleRelatedDownloadServices: String? = null,
)

@Serializable data class LegacyDistribution(
    @SerialName("Uuid") val uuid: String? = null,
    @SerialName("Title") val title: String? = null,
    @SerialName("Type") val type: String? = null,
    @SerialName("TypeTranslated") val typeTranslated: String? = null,
    @SerialName("TypeName") val typeName: String? = null,
    @SerialName("Organization") val organization: String? = null,
    @SerialName("Organizations") val organizations: List<String>? = null,
    @SerialName("ThumbnailUrl") val thumbnailUrl: String? = null,
    @SerialName("ShowDetailsUrl") val showDetailsUrl: String? = null,
    @SerialName("RemoveDetailsUrl") val removeDetailsUrl: Boolean = false,
    @SerialName("CanShowMapUrl") val canShowMapUrl: Boolean = false,
    @SerialName("CanShowServiceMapUrl") val canShowServiceMapUrl: Boolean = false,
    @SerialName("CanShowDownloadUrl") val canShowDownloadUrl: Boolean = false,
    @SerialName("CanShowDownloadService") val canShowDownloadService: Boolean = false,
    @SerialName("MapUrl") val mapUrl: String? = null,
    @SerialName("ServiceUrl") val serviceUrl: String? = null,
    @SerialName("ServiceUuid") val serviceUuid: String? = null,
    @SerialName("DownloadUrl") val downloadUrl: String? = null,
    @SerialName("AccessIsOpendata") val accessIsOpendata: Boolean = false,
    @SerialName("AccessIsRestricted") val accessIsRestricted: Boolean = false,
    @SerialName("AccessIsProtected") val accessIsProtected: Boolean = false,
    @SerialName("DataAccess") val dataAccess: String? = null,
    @SerialName("ServiceDistributionAccessConstraint") val serviceDistributionAccessConstraint: String? = null,
    @SerialName("GetCapabilitiesUrl") val getCapabilitiesUrl: String? = null,
    @SerialName("Protocol") val protocol: String? = null,
    @SerialName("DistributionFormats") val distributionFormats: List<LegacyDistributionFormat> = emptyList(),
    @SerialName("DistributionName") val distributionName: String? = null,
    @SerialName("DistributionUrl") val distributionUrl: String? = null,
    @SerialName(
        "DatasetServicesWithShowMapLink",
    ) val datasetServicesWithShowMapLink: List<LegacyDatasetService>? = null,
    @SerialName("SerieDatasets") val serieDatasets: List<LegacyDataset>? = null,
    @SerialName("Serie") val serie: LegacySerie? = null,
)





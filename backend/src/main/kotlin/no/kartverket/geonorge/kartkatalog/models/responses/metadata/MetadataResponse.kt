package no.kartverket.geonorge.kartkatalog.models.responses.metadata

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class MetadataResponse(
    // Runtime / computed server-side properties
    @SerialName("MapOnlyWms")
    val mapOnlyWms: Boolean = false,
    // Core identity
    @SerialName("Uuid")
    val uuid: String? = null,
    @SerialName("Title")
    val title: String? = null,
    @SerialName("NorwegianTitle")
    val norwegianTitle: String? = null,
    @SerialName("EnglishTitle")
    val englishTitle: String? = null,
    // Main textual content
    @SerialName("Abstract")
    val abstract: String? = null,
    @SerialName("EnglishAbstract")
    val englishAbstract: String? = null,
    @SerialName("Purpose")
    val purpose: String? = null,
    @SerialName("ProcessHistory")
    val processHistory: String? = null,
    @SerialName("SpecificUsage")
    val specificUsage: String? = null,
    @SerialName("SupplementalDescription")
    val supplementalDescription: String? = null,
    @SerialName("HelpUrl")
    val helpUrl: String? = null,
    // Organization / contacts
    @SerialName("ContactMetadata")
    val contactMetadata: Contact? = null,
    @SerialName("ContactOwner")
    val contactOwner: Contact? = null,
    @SerialName("ContactOwners")
    val contactOwners: List<Contact>? = null,
    @SerialName("ContactPublisher")
    val contactPublisher: Contact? = null,
    @SerialName("Organization")
    val organization: String? = null,
    @SerialName("OrganizationEnglish")
    val organizationEnglish: String? = null,
    @SerialName("OrganizationLogoUrl")
    val organizationLogoUrl: String? = null,
    // Dates / lifecycle / validity
    @SerialName("DateCreated")
    val dateCreated: String? = null,
    @SerialName("DateMetadataUpdated")
    val dateMetadataUpdated: String? = null,
    @SerialName("DateMetadataValidFrom")
    val dateMetadataValidFrom: String? = null,
    @SerialName("DateMetadataValidTo")
    val dateMetadataValidTo: String? = null,
    @SerialName("DatePublished")
    val datePublished: String? = null,
    @SerialName("DateUpdated")
    val dateUpdated: String? = null,
    // Resource typing / classification
    @SerialName("HierarchyLevel")
    val hierarchyLevel: String? = null,
    @SerialName("Type")
    val type: String? = null,
    @SerialName("TypeTranslated")
    val typeTranslated: String? = null,
    @SerialName("TypeName")
    val typeName: String? = null,
    @SerialName("TopicCategory")
    val topicCategory: String? = null,
    @SerialName("TopicCategories")
    val topicCategories: List<String>? = null,
    @SerialName("SpatialScope")
    val spatialScope: String? = null,
    @SerialName("Status")
    val status: String? = null,
    @SerialName("MaintenanceFrequency")
    val maintenanceFrequency: String? = null,
    @SerialName("SpatialRepresentation")
    val spatialRepresentation: String? = null,
    @SerialName("ServiceType")
    val serviceType: String? = null,
    // Languages / standards / metadata descriptors
    @SerialName("DatasetLanguage")
    val datasetLanguage: String? = null,
    @SerialName("MetadataLanguage")
    val metadataLanguage: String? = null,
    @SerialName("MetadataStandard")
    val metadataStandard: String? = null,
    @SerialName("MetadataStandardVersion")
    val metadataStandardVersion: String? = null,
    // Keywords / taxonomy / thematic grouping
    @SerialName("Credits")
    val credits: List<String>? = null,
    @SerialName("Keywords")
    val keywords: List<Keyword>? = null,
    @SerialName("KeywordsPlace")
    val keywordsPlace: List<Keyword>? = null,
    @SerialName("KeywordsTheme")
    val keywordsTheme: List<Keyword>? = null,
    @SerialName("KeywordsInspire")
    val keywordsInspire: List<Keyword>? = null,
    @SerialName("KeywordsInspirePriorityDataset")
    val keywordsInspirePriorityDataset: List<Keyword>? = null,
    @SerialName("KeywordsHighValueDatasetCategories")
    val keywordsHighValueDatasetCategories: List<Keyword>? = null,
    @SerialName("KeywordsNationalInitiative")
    val keywordsNationalInitiative: List<Keyword>? = null,
    @SerialName("KeywordsNationalTheme")
    val keywordsNationalTheme: List<Keyword>? = null,
    @SerialName("KeywordsOther")
    val keywordsOther: List<Keyword>? = null,
    @SerialName("KeywordsConcept")
    val keywordsConcept: List<Keyword>? = null,
    @SerialName("KeywordsAdministrativeUnits")
    val keywordsAdministrativeUnits: List<Keyword>? = null,
    // Constraints / access / authorization semantics
    @SerialName("Constraints")
    val constraints: Constraints? = null,
    @SerialName("AccessIsOpendata")
    val accessIsOpendata: Boolean = false,
    @SerialName("AccessIsRestricted")
    val accessIsRestricted: Boolean = false,
    @SerialName("AccessIsProtected")
    val accessIsProtected: Boolean = false,
    @SerialName("DataAccess")
    val dataAccess: String? = null,
    @SerialName("ServiceDistributionAccessConstraint")
    val serviceDistributionAccessConstraint: String? = null,
    @SerialName("ServiceWfsDistributionAccessConstraint")
    val serviceWfsDistributionAccessConstraint: String? = null,
    @SerialName("OrderingInstructions")
    val orderingInstructions: String? = null,
    @SerialName("OrderingInstructionsLinkText")
    val orderingInstructionsLinkText: String? = null,
    // Spatial / technical metadata
    @SerialName("BoundingBox")
    val boundingBox: BoundingBox? = null,
    @SerialName("ResolutionScale")
    val resolutionScale: String? = null,
    @SerialName("ResolutionDistance")
    val resolutionDistance: Double? = null,
    @SerialName("ReferenceSystem")
    val referenceSystem: ReferenceSystem? = null,
    @SerialName("ReferenceSystems")
    val referenceSystems: List<ReferenceSystem>? = null,
    @SerialName("QuantitativeResult")
    val quantitativeResult: QuantitativeResult? = null,
    @SerialName("QualitySpecifications")
    val qualitySpecifications: List<QualitySpecification>? = null,
    @SerialName("ContentInformation")
    val contentInformation: SimpleContentInformation? = null,
    // Distribution / formats / protocol information
    @SerialName("DistributionDetails")
    val distributionDetails: DistributionDetails? = null,
    @SerialName("DistributionProtocol")
    val distributionProtocol: String? = null,
    @SerialName("Protocol")
    val protocol: String? = null,
    @SerialName("DistributionFormat")
    val distributionFormat: DistributionFormat? = null,
    @SerialName("DistributionFormats")
    val distributionFormats: List<SimpleDistributionFormat>? = null,
    @SerialName("DistributionsFormats")
    val distributionsFormats: List<DistributionViewModel>? = null,
    @SerialName("DistributionFormatsGrouped")
    val distributionFormatsGrouped: List<DistributionFormatGrouped>? = null,
    @SerialName("UnitsOfDistribution")
    val unitsOfDistribution: String? = null,
    @SerialName("DistributionUrl")
    val distributionUrl: String? = null,
    @SerialName("DownloadUrl")
    val downloadUrl: String? = null,
    // Dataset-to-service linkage / derived service endpoints
    @SerialName("ServiceDistributionNameForDataset")
    val serviceDistributionNameForDataset: String? = null,
    @SerialName("ServiceDistributionUrlForDataset")
    val serviceDistributionUrlForDataset: String? = null,
    @SerialName("ServiceDistributionProtocolForDataset")
    val serviceDistributionProtocolForDataset: String? = null,
    @SerialName("ServiceUuid")
    val serviceUuid: String? = null,
    @SerialName("ServiceWfsDistributionUrlForDataset")
    val serviceWfsDistributionUrlForDataset: String? = null,
    @SerialName("ServiceLink")
    val serviceLink: String? = null,
    @SerialName("MapLink")
    val mapLink: String? = null,
    // Distribution visibility / UI capability flags
    @SerialName("CanShowMapUrl")
    val canShowMapUrl: Boolean = false,
    @SerialName("CanShowServiceMapUrl")
    val canShowServiceMapUrl: Boolean = false,
    @SerialName("CanShowDownloadService")
    val canShowDownloadService: Boolean = false,
    @SerialName("CanShowDownloadUrl")
    val canShowDownloadUrl: Boolean = false,
    @SerialName("CanShowWebsiteUrl")
    val canShowWebsiteUrl: Boolean = false,
    // Documentation / external URLs / product assets
    @SerialName("ProductPageUrl")
    val productPageUrl: String? = null,
    @SerialName("ProductSheetUrl")
    val productSheetUrl: String? = null,
    @SerialName("ProductSpecificationUrl")
    val productSpecificationUrl: String? = null,
    @SerialName("LegendDescriptionUrl")
    val legendDescriptionUrl: String? = null,
    @SerialName("MetadataXmlUrl")
    val metadataXmlUrl: String? = null,
    @SerialName("MetadataEditUrl")
    val metadataEditUrl: String? = null,
    // Coverage / extent-related URLs
    @SerialName("CoverageUrl")
    val coverageUrl: String? = null,
    @SerialName("CoverageGridUrl")
    val coverageGridUrl: String? = null,
    @SerialName("CoverageCellUrl")
    val coverageCellUrl: String? = null,
    @SerialName("SurveyAreaMapUrl")
    val surveyAreaMapUrl: String? = null,
    @SerialName("SurveyAreaMapUrlWms")
    val surveyAreaMapUrlWms: String? = null,
    // Resource references / identifiers / relationships
    @SerialName("ResourceReferenceCode")
    val resourceReferenceCode: String? = null,
    @SerialName("ResourceReferenceCodespace")
    val resourceReferenceCodespace: String? = null,
    @SerialName("ParentIdentifier")
    val parentIdentifier: String? = null,
    @SerialName("OperatesOn")
    val operatesOn: List<String>? = null,
    @SerialName("Related")
    val related: List<MetadataResponse>? = null,
    // Related objects / relation graph / grouped distributions
    @SerialName("Distributions")
    val distributions: Distributions? = null,
    @SerialName("DatasetServicesWithShowMapLink")
    val datasetServicesWithShowMapLink: List<DatasetService>? = null,
    @SerialName("SerieDatasets")
    val serieDatasets: List<Dataset>? = null,
    @SerialName("Serie")
    val serie: Serie? = null,
    // Thumbnails / auxiliary UI data / misc
    @SerialName("Thumbnails")
    val thumbnails: List<Thumbnail>? = null,
    @SerialName("Availability")
    val availability: String? = null,
    @SerialName("Capacity")
    val capacity: String? = null,
    @SerialName("Performance")
    val performance: String? = null,
    @SerialName("Operations")
    val operations: List<SimpleOperation>? = null,
    @SerialName("MetMetadata")
    val metMetadata: Boolean = false,
)

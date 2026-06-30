package no.kartverket.geonorge.kartkatalog.models.responses.metadata

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class DistributionDetails(
    @SerialName("Name")
    val name: String? = null,
    @SerialName("Protocol")
    val protocol: String? = null,
    @SerialName("ProtocolName")
    val protocolName: String? = null,
    @SerialName("URL")
    val url: String? = null,
)

@Serializable
data class DistributionFormat(
    @SerialName("Name")
    val name: String? = null,
    @SerialName("Version")
    val version: String? = null,
)

@Serializable
data class SimpleDistributionFormat(
    @SerialName("Name")
    val name: String? = null,
    @SerialName("Version")
    val version: String? = null,
)

@Serializable
data class DistributionViewModel(
    @SerialName("Organization")
    val organization: String? = null,
    @SerialName("Protocol")
    val protocol: String? = null,
    @SerialName("ProtocolName")
    val protocolName: String? = null,
    @SerialName("URL")
    val url: String? = null,
    @SerialName("Name")
    val name: String? = null,
    @SerialName("FormatName")
    val formatName: String? = null,
    @SerialName("FormatVersion")
    val formatVersion: String? = null,
    @SerialName("UnitsOfDistribution")
    val unitsOfDistribution: String? = null,
    @SerialName("EnglishUnitsOfDistribution")
    val englishUnitsOfDistribution: String? = null,
)

@Serializable
data class DistributionFormatGrouped(
    @SerialName("ProtocolName")
    val protocolName: String? = null,
    @SerialName("ProtocolDescription")
    val protocolDescription: String? = null,
    @SerialName("Protocol")
    val protocol: String? = null,
    @SerialName("Organization")
    val organization: String? = null,
    @SerialName("UnitsOfDistribution")
    val unitsOfDistribution: String? = null,
    @SerialName("EnglishUnitsOfDistribution")
    val englishUnitsOfDistribution: String? = null,
    @SerialName("Formats")
    val formats: List<DistributionFormatItem>? = null,
    @SerialName("URL")
    val url: List<String>? = null,
)

@Serializable
data class DistributionFormatItem(
    @SerialName("FormatName")
    val formatName: String? = null,
    @SerialName("FormatVersion")
    val formatVersion: String? = null,
)

@Serializable
data class Distributions(
    @SerialName("SelfDistribution")
    val selfDistribution: List<Distribution>? = null,
    @SerialName("RelatedDataset")
    val relatedDataset: List<Distribution>? = null,
    @SerialName("RelatedSerieDatasets")
    val relatedSerieDatasets: List<Distribution>? = null,
    @SerialName("RelatedDatasetSerie")
    val relatedDatasetSerie: List<Distribution>? = null,
    @SerialName("RelatedApplications")
    val relatedApplications: List<Distribution>? = null,
    @SerialName("RelatedServices")
    val relatedServices: List<Distribution>? = null,
    @SerialName("RelatedServiceLayer")
    val relatedServiceLayer: List<Distribution>? = null,
    @SerialName("RelatedViewServices")
    val relatedViewServices: List<Distribution>? = null,
    @SerialName("RelatedDownloadServices")
    val relatedDownloadServices: List<Distribution>? = null,
    @SerialName("ShowRelatedDataset")
    val showRelatedDataset: Boolean = false,
    @SerialName("ShowRelatedSerieDatasets")
    val showRelatedSerieDatasets: Boolean = false,
    @SerialName("ShowRelatedDatasetSerie")
    val showRelatedDatasetSerie: Boolean = false,
    @SerialName("ShowRelatedApplications")
    val showRelatedApplications: Boolean = false,
    @SerialName("ShowRelatedServices")
    val showRelatedServices: Boolean = false,
    @SerialName("ShowRelatedServiceLayer")
    val showRelatedServiceLayer: Boolean = false,
    @SerialName("ShowRelatedViewServices")
    val showRelatedViewServices: Boolean = false,
    @SerialName("ShowRelatedDownloadServices")
    val showRelatedDownloadServices: Boolean = false,
    @SerialName("ShowSelfDistributions")
    val showSelfDistributions: Boolean = true,
    @SerialName("TitleSelf")
    val titleSelf: String? = null,
    @SerialName("TitleRelatedDataset")
    val titleRelatedDataset: String? = null,
    @SerialName("TitleRelatedApplications")
    val titleRelatedApplications: String? = null,
    @SerialName("TitleRelatedServices")
    val titleRelatedServices: String? = null,
    @SerialName("TitleRelatedServiceLayer")
    val titleRelatedServiceLayer: String? = null,
    @SerialName("TitleRelatedViewServices")
    val titleRelatedViewServices: String? = null,
    @SerialName("TitleRelatedDownloadServices")
    val titleRelatedDownloadServices: String? = null,
)

@Serializable
data class Distribution(
    @SerialName("Uuid")
    val uuid: String? = null,
    @SerialName("Title")
    val title: String? = null,
    @SerialName("Type")
    val type: String? = null,
    @SerialName("TypeTranslated")
    val typeTranslated: String? = null,
    @SerialName("TypeName")
    val typeName: String? = null,
    @SerialName("Organization")
    val organization: String? = null,
    @SerialName("Organizations")
    val organizations: List<String>? = null,
    @SerialName("ThumbnailUrl")
    val thumbnailUrl: String? = null,
    @SerialName("ShowDetailsUrl")
    val showDetailsUrl: String? = null,
    @SerialName("RemoveDetailsUrl")
    val removeDetailsUrl: Boolean = false,
    @SerialName("CanShowMapUrl")
    val canShowMapUrl: Boolean = false,
    @SerialName("CanShowServiceMapUrl")
    val canShowServiceMapUrl: Boolean = false,
    @SerialName("CanShowDownloadUrl")
    val canShowDownloadUrl: Boolean = false,
    @SerialName("CanShowDownloadService")
    val canShowDownloadService: Boolean = false,
    @SerialName("MapUrl")
    val mapUrl: String? = null,
    @SerialName("ServiceUrl")
    val serviceUrl: String? = null,
    @SerialName("ServiceUuid")
    val serviceUuid: String? = null,
    @SerialName("DownloadUrl")
    val downloadUrl: String? = null,
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
    @SerialName("GetCapabilitiesUrl")
    val getCapabilitiesUrl: String? = null,
    @SerialName("Protocol")
    val protocol: String? = null,
    @SerialName("DistributionFormats")
    val distributionFormats: List<DistributionFormat>? = null,
    @SerialName("DistributionName")
    val distributionName: String? = null,
    @SerialName("DistributionUrl")
    val distributionUrl: String? = null,
    @SerialName("DatasetServicesWithShowMapLink")
    val datasetServicesWithShowMapLink: List<DatasetService>? = null,
    @SerialName("SerieDatasets")
    val serieDatasets: List<Dataset>? = null,
    @SerialName("Serie")
    val serie: Serie? = null,
)

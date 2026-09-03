package no.kartverket.geonorge.kartkatalog.search

import kotlinx.datetime.Instant
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

data class SearchRequest(
    val text: String? = null,
    val limit: Int = 10,
    val offset: Int = 1,
    val orderBy: String = "score",
    val listHidden: Boolean = false,
) {
    fun normalized(): SearchRequest =
        copy(
            text = text?.trim()?.takeIf { it.isNotEmpty() },
            limit = limit.coerceIn(1, 1000),
            offset = offset.coerceAtLeast(1),
            orderBy = orderBy.takeIf { it in validOrderBy } ?: "score",
        )

    companion object {
        val validOrderBy =
            setOf(
                "score",
                "title",
                "title_desc",
                "organization",
                "organization_desc",
                "newest",
                "updated",
                "popularMetadata",
            )
    }
}

@Serializable
data class SearchResponse(
    @SerialName("NumFound")
    val numFound: Int,
    @SerialName("Limit")
    val limit: Int,
    @SerialName("Offset")
    val offset: Int,
    @SerialName("Results")
    val results: List<SearchResultItem>,
    @SerialName("Type")
    val type: String = "search",
)

@Serializable
data class SearchResultItem(
    @SerialName("Uuid")
    val uuid: String,
    @SerialName("Title")
    val title: String,
    @SerialName("Abstract")
    val abstractText: String? = null,
    @SerialName("Type")
    val type: String? = null,
    @SerialName("TypeTranslated")
    val typeTranslated: String? = null,
    @SerialName("TypeName")
    val typeName: String? = null,
    @SerialName("Theme")
    val theme: String? = null,
    @SerialName("Organization")
    val organization: String? = null,
    @SerialName("Organizations")
    val organizations: List<String> = emptyList(),
    @SerialName("OrganizationLogo")
    val organizationLogo: String? = null,
    @SerialName("ThumbnailUrl")
    val thumbnailUrl: String? = null,
    @SerialName("DistributionUrl")
    val distributionUrl: String? = null,
    @SerialName("DistributionProtocol")
    val distributionProtocol: String? = null,
    @SerialName("DistributionName")
    val distributionName: String? = null,
    @SerialName("DatasetServicesWithShowMapLink")
    val datasetServicesWithShowMapLink: List<DatasetServiceLink> = emptyList(),
    @SerialName("ServiceDatasets")
    val serviceDatasets: List<String> = emptyList(),
    @SerialName("Distributions")
    val distributions: List<String> = emptyList(),
    @SerialName("AccessConstraint")
    val accessConstraint: String? = null,
    @SerialName("OtherConstraintsAccess")
    val otherConstraintsAccess: String? = null,
    @SerialName("DataAccess")
    val dataAccess: String? = null,
    @SerialName("AccessIsOpendata")
    val accessIsOpenData: Boolean? = null,
    @SerialName("AccessIsRestricted")
    val accessIsRestricted: Boolean = false,
    @SerialName("AccessIsProtected")
    val accessIsProtected: Boolean = false,
    @SerialName("ServiceDistributionUrlForDataset")
    val serviceDistributionUrlForDataset: String? = null,
    @SerialName("ServiceUuid")
    val serviceUuid: String? = null,
    @SerialName("ServiceWfsDistributionUrlForDataset")
    val serviceWfsDistributionUrlForDataset: String? = null,
    @SerialName("GetCapabilitiesUrl")
    val getCapabilitiesUrl: String? = null,
    @SerialName("Date")
    val date: Instant? = null,
    @SerialName("ShowMapLink")
    val showMapLink: Boolean = false,
    @SerialName("SpatialScope")
    val spatialScope: String? = null,
)

@Serializable
data class DatasetServiceLink(
    @SerialName("Uuid")
    val uuid: String,
    @SerialName("Title")
    val title: String,
    @SerialName("DistributionProtocol")
    val distributionProtocol: String? = null,
    @SerialName("GetCapabilitiesUrl")
    val getCapabilitiesUrl: String? = null,
)

internal data class DatasetServiceReference(
    val uuid: String,
    val title: String,
    val type: String? = null,
    val organization: String? = null,
    val distributionName: String? = null,
    val distributionProtocol: String? = null,
    val getCapabilitiesUrl: String? = null,
)


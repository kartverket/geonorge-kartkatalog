package no.kartverket.geonorge.kartkatalog.integrations.solr

import kotlinx.datetime.Instant
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class SolrResponse(
    val responseHeader: SolrResponseHeader,
    val response: SolrResponseBody,
)

@Serializable
data class SolrResponseHeader(
    val status: Int,
    @SerialName("QTime")
    val qTime: Int,
)

@Serializable
data class SolrResponseBody(
    val numFound: Int,
    val start: Int,
    val docs: List<SolrDocument>,
)

@Serializable
data class SolrDocument(
    val uuid: String,
    val title: String? = null,
    @SerialName("abstract")
    val abstractText: String? = null,
    val purpose: String? = null,
    val type: String? = null,
    val theme: String? = null,
    val organization: String? = null,
    val organizations: List<String>? = null,
    @SerialName("organization_seo_lowercase")
    val organizationSeoLowercase: String? = null,
    val placegroups: List<String>? = null,
    val organizationgroup: String? = null,
    @SerialName("topic_category")
    val topicCategory: String? = null,
    @SerialName("organization_logo_url")
    val organizationLogoUrl: String? = null,
    @SerialName("thumbnail_url")
    val thumbnailUrl: String? = null,
    @SerialName("distribution_url")
    val distributionUrl: String? = null,
    @SerialName("distribution_protocol")
    val distributionProtocol: String? = null,
    @SerialName("distribution_name")
    val distributionName: String? = null,
    @SerialName("product_page_url")
    val productPageUrl: String? = null,
    @SerialName("date_published")
    val datePublished: Instant? = null,
    @SerialName("date_updated")
    val dateUpdated: Instant? = null,
    val nationalinitiative: List<String>? = null,
    val score: Double? = null,
    @SerialName("ServiceDistributionProtocolForDataset")
    val serviceDistributionProtocolForDataset: String? = null,
    @SerialName("ServiceDistributionUrlForDataset")
    val serviceDistributionUrlForDataset: String? = null,
    @SerialName("ServiceDistributionNameForDataset")
    val serviceDistributionNameForDataset: String? = null,
    @SerialName("ServiceDistributionUuidForDataset")
    val serviceDistributionUuidForDataset: String? = null,
    @SerialName("ServiceDistributionAccessConstraint")
    val serviceDistributionAccessConstraint: String? = null,
    @SerialName("DistributionProtocols")
    val distributionProtocols: List<String>? = null,
    @SerialName("legend_description_url")
    val legendDescriptionUrl: String? = null,
    @SerialName("product_sheet_url")
    val productSheetUrl: String? = null,
    @SerialName("product_specification_url")
    val productSpecificationUrl: String? = null,
    val area: List<String>? = null,
    val datasetservice: List<String>? = null,
    val popularMetadata: Boolean? = null,
    val bundle: List<String>? = null,
    val servicelayers: List<String>? = null,
    val accessconstraint: String? = null,
    val servicedataset: List<String>? = null,
    val otherconstraintsaccess: String? = null,
    val dataaccess: String? = null,
    val parentidentifier: String? = null,
    val serie: String? = null,
    val seriedatasets: List<String>? = null,
    val distributions: List<String>? = null,
)

package no.kartverket.geonorge.kartkatalog.search

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonPrimitive
import no.kartverket.geonorge.kartkatalog.integrations.solr.RelatedServiceReference
import no.kartverket.geonorge.kartkatalog.integrations.solr.MetadataSolrQuery
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrDocument

internal data class SearchFacetCount(val name: String, val count: Int)

internal data class SearchHit(
    val uuid: String,
    val title: String?,
    val abstractText: String?,
    val type: String?,
    val typename: String?,
    val theme: String?,
    val organization: String?,
    val organizationgroup: String?,
    val organizations: List<String>?,
    val organizationLogoUrl: String?,
    val thumbnailUrl: String?,
    val distributionUrl: String?,
    val distributionProtocol: String?,
    val distributionName: String?,
    val nationalinitiative: List<String>?,
    val dataaccess: String?,
    val otherconstraintsaccess: String?,
    val accessconstraint: String?,
    val serviceDistributionUrlForDataset: String?,
    val serviceDistributionProtocolForDataset: String?,
    val serviceDistributionNameForDataset: String?,
    val serviceDistributionUuidForDataset: String?,
    val datasetservice: List<String>?,
    val servicedataset: List<String>?,
    val distributions: List<String>?,
    val bundle: List<String>?,
    val servicelayers: List<String>?,
    val serie: String?,
    val seriedatasets: List<String>?,
    val legendDescriptionUrl: String?,
    val productSheetUrl: String?,
    val productSpecificationUrl: String?,
    val dateUpdated: String?,
    val spatialscope: List<String>?,
)

internal data class SearchHits(
    val numFound: Int,
    val documents: List<SearchHit>,
    val facets: Map<String, List<SearchFacetCount>>,
) {
    companion object {
        val Empty = SearchHits(0, emptyList(), emptyMap())
    }
}

class SearchEngine(private val solrClient: SolrClient) {
    internal suspend fun search(query: MetadataSolrQuery, english: Boolean = false): SearchHits {
        val response = solrClient.searchMetadataAll(query, english)
        val facets = response.facetCounts?.facetFields.orEmpty().mapValues { (_, raw) -> raw.toCounts() }
        return SearchHits(response.response.numFound, response.response.docs.map { it.toSearchHit() }, facets)
    }

    fun parseDatasetServices(values: List<String>?): List<RelatedServiceReference> = solrClient.parseDatasetServices(values)
}

private fun JsonArray.toCounts(): List<SearchFacetCount> =
    chunked(2).mapNotNull { pair ->
        val name = pair.getOrNull(0)?.jsonPrimitive?.content ?: return@mapNotNull null
        val count = pair.getOrNull(1)?.jsonPrimitive?.intOrNull ?: return@mapNotNull null
        SearchFacetCount(name, count)
    }

private fun SolrDocument.toSearchHit(): SearchHit =
    SearchHit(
        uuid = uuid,
        title = title,
        abstractText = abstractText,
        type = type,
        typename = typename,
        theme = theme,
        organization = organization,
        organizationgroup = organizationgroup,
        organizations = organizations,
        organizationLogoUrl = organizationLogoUrl,
        thumbnailUrl = thumbnailUrl,
        distributionUrl = distributionUrl,
        distributionProtocol = distributionProtocol,
        distributionName = distributionName,
        nationalinitiative = nationalinitiative,
        dataaccess = dataaccess,
        otherconstraintsaccess = otherconstraintsaccess,
        accessconstraint = accessconstraint,
        serviceDistributionUrlForDataset = serviceDistributionUrlForDataset,
        serviceDistributionProtocolForDataset = serviceDistributionProtocolForDataset,
        serviceDistributionNameForDataset = serviceDistributionNameForDataset,
        serviceDistributionUuidForDataset = serviceDistributionUuidForDataset,
        datasetservice = datasetservice,
        servicedataset = servicedataset,
        distributions = distributions,
        bundle = bundle,
        servicelayers = servicelayers,
        serie = serie,
        seriedatasets = seriedatasets,
        legendDescriptionUrl = legendDescriptionUrl,
        productSheetUrl = productSheetUrl,
        productSpecificationUrl = productSpecificationUrl,
        dateUpdated = dateUpdated?.toString(),
        spatialscope = spatialscope,
    )





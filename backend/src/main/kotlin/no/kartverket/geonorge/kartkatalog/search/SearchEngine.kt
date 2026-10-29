package no.kartverket.geonorge.kartkatalog.search

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonPrimitive
import no.kartverket.geonorge.kartkatalog.distribution.MapCapabilityFields
import no.kartverket.geonorge.kartkatalog.integrations.solr.MetadataSolrQuery
import no.kartverket.geonorge.kartkatalog.integrations.solr.RelatedServiceReference
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrDocument
import no.kartverket.geonorge.kartkatalog.integrations.vertex.VertexAIClient

internal data class SearchFacetCount(
    val name: String,
    val count: Int,
)

internal data class SearchHit(
    val uuid: String,
    val title: String?,
    val abstractText: String?,
    override val type: String?,
    val typename: String?,
    val theme: String?,
    val organization: String?,
    val organizationgroup: String?,
    val organizations: List<String>?,
    val organizationLogoUrl: String?,
    val thumbnailUrl: String?,
    override val distributionUrl: String?,
    override val distributionProtocol: String?,
    val distributionName: String?,
    val nationalinitiative: List<String>?,
    val dataaccess: String?,
    val otherconstraintsaccess: String?,
    val accessconstraint: String?,
    override val serviceDistributionUrlForDataset: String?,
    val serviceDistributionProtocolForDataset: String?,
    val serviceDistributionNameForDataset: String?,
    val serviceDistributionUuidForDataset: String?,
    override val datasetservice: List<String>?,
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
) : MapCapabilityFields

internal data class SearchHits(
    val numFound: Int,
    val documents: List<SearchHit>,
    val facets: Map<String, List<SearchFacetCount>>,
) {
    companion object {
        val Empty = SearchHits(0, emptyList(), emptyMap())
    }
}

class SearchEngine(
    private val solrClient: SolrClient,
    private val embeddingClient: VertexAIClient? = null,
    private val hybridQueryBuilder: HybridSearchQueryBuilder? = null,
) {
    internal suspend fun search(
        query: MetadataSolrQuery,
        text: String? = null,
        english: Boolean = false,
    ): SearchHits {
        val text = text?.trim().orEmpty()
        val effectiveQuery =
            if (
                text.length > MINIMUM_VECTOR_SEARCH_LENGTH &&
                embeddingClient != null &&
                hybridQueryBuilder != null
            ) {
                embeddingClient
                    .embed(text)
                    ?.takeIf { it.isNotEmpty() }
                    ?.let { embedding ->
                        hybridQueryBuilder.build(
                            query = query,
                            text = text,
                            embedding = embedding,
                        )
                    }
                    ?: query
            } else {
                query
            }
        val response = solrClient.searchMetadataAll(effectiveQuery, english)
        val facets =
            response.facetCounts
                ?.facetFields
                .orEmpty()
                .mapValues { (_, raw) -> raw.toCounts() }
        return SearchHits(response.response.numFound, response.response.docs.map { it.toSearchHit() }, facets)
    }

    suspend fun getMetadataByUuids(uuids: List<String>): List<SolrDocument> = solrClient.getMetadataByUuids(uuids)

    fun parseDatasetServices(values: List<String>?): List<RelatedServiceReference> =
        solrClient.parseDatasetServices(values)

    private companion object {
        const val MINIMUM_VECTOR_SEARCH_LENGTH = 2
    }
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

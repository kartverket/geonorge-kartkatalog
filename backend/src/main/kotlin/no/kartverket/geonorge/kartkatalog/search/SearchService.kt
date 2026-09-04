package no.kartverket.geonorge.kartkatalog.search

import kotlinx.serialization.json.JsonPrimitive
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrDocument
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrFacetCounts
import no.kartverket.geonorge.kartkatalog.metadata.DistributionProtocols

class SearchService(
    private val solrClient: SolrClient,
) {
    suspend fun search(request: SearchRequest): SearchResponse {
        val normalized = request.normalized()
        val query = SearchQueryBuilder.build(normalized)
        val response = solrClient.searchMetadataAll(query)

        return SearchResponse(
            numFound = response.response.numFound,
            limit = normalized.limit,
            offset = normalized.offset,
            results = response.response.docs.map { it.toSearchResultItem() },
            facets = response.facetCounts.toSearchFacets(),
        )
    }
}

private fun SolrFacetCounts?.toSearchFacets(): List<SearchFacet> =
    this?.facetFields.orEmpty().map { (facetField, values) ->
        SearchFacet(
            facetField = facetField,
            values = values.toFacetValues(),
        )
    }

private fun List<JsonPrimitive>.pairs(): List<Pair<JsonPrimitive, JsonPrimitive>> =
    chunked(2).mapNotNull { chunk ->
        val name = chunk.getOrNull(0) ?: return@mapNotNull null
        val count = chunk.getOrNull(1) ?: return@mapNotNull null
        name to count
    }

private fun kotlinx.serialization.json.JsonArray.toFacetValues(): List<SearchFacetValue> =
    mapNotNull { it as? JsonPrimitive }
        .pairs()
        .mapNotNull { (name, count) ->
            val facetName = name.content
            val facetCount = count.content.toIntOrNull() ?: return@mapNotNull null
            SearchFacetValue(name = facetName, count = facetCount)
        }

private fun SolrDocument.toSearchResultItem(): SearchResultItem {
    val datasetServices = parseDatasetServices(datasetservice)
    val viewServices =
        datasetServices.filter {
            DistributionProtocols.isViewService(it.distributionProtocol) &&
                (it.type.equals("service", ignoreCase = true) || it.type.equals("servicelayer", ignoreCase = true))
        }
    val firstViewService =
        viewServices.firstOrNull {
            !it.getCapabilitiesUrl.isNullOrBlank()
        }
    val access = resolveAccess(dataaccess, otherconstraintsaccess, accessconstraint)
    val mapCapabilitiesUrl =
        when {
            !serviceDistributionUrlForDataset.isNullOrBlank() -> serviceDistributionUrlForDataset
            firstViewService != null -> firstViewService.getCapabilitiesUrl
            (type.equals("service", ignoreCase = true) || type.equals("servicelayer", ignoreCase = true)) &&
                DistributionProtocols.isViewService(distributionProtocol) -> distributionUrl
            else -> null
        }

    return SearchResultItem(
        uuid = uuid,
        title = title.orEmpty(),
        organization = organizationgroup ?: organization,
        typeTranslated = translateType(type),
        thumbnailUrl =
            thumbnailUrl?.takeUnless {
                it.equals("https://editor.geonorge.no/thumbnails/undefined", ignoreCase = true)
            },
        distributionUrl = distributionUrl,
        distributionProtocol = distributionProtocol,
        getCapabilitiesUrl = distributionUrl,
        showMapLink =
            canShowMap(
                type,
                distributionProtocol,
                distributionUrl,
                viewServices,
                serviceDistributionUrlForDataset,
            ),
        mapCapabilitiesUrl = mapCapabilitiesUrl,
        accessState = access.asAccessState(),
        hierarchyLevel = type,
    )
}

private fun parseDatasetServices(raw: List<String>?): List<DatasetServiceReference> =
    raw.orEmpty().mapNotNull { value ->
        val parts = value.split("|")
        val uuid = parts.getOrNull(0)?.takeIf { it.isNotBlank() } ?: return@mapNotNull null
        DatasetServiceReference(
            uuid = uuid,
            type = parts.getOrNull(3),
            distributionProtocol = parts.getOrNull(6),
            getCapabilitiesUrl = parts.getOrNull(7),
        )
    }

private fun canShowMap(
    type: String?,
    distributionProtocol: String?,
    distributionUrl: String?,
    viewServices: List<DatasetServiceReference>,
    serviceDistributionUrlForDataset: String?,
): Boolean {
    val hasMappedDatasetView = serviceDistributionUrlForDataset?.contains("service=wms", ignoreCase = true) == true
    val hasDatasetViewServices = viewServices.isNotEmpty()
    val isServiceView =
        !distributionUrl.isNullOrBlank() &&
            (type.equals("service", ignoreCase = true) || type.equals("servicelayer", ignoreCase = true)) &&
            DistributionProtocols.isViewService(distributionProtocol)

    return hasMappedDatasetView || hasDatasetViewServices || isServiceView
}

private data class AccessFlags(
    val isOpenData: Boolean,
    val isRestricted: Boolean,
    val isProtected: Boolean,
)

private fun AccessFlags.asAccessState(): String? =
    when {
        isRestricted -> "restricted"
        isProtected -> "protected"
        isOpenData -> "open"
        else -> null
    }

private fun resolveAccess(
    dataAccess: String?,
    otherConstraintsAccess: String?,
    accessConstraint: String?,
): AccessFlags {
    val normalized =
        listOfNotNull(dataAccess, otherConstraintsAccess, accessConstraint)
            .joinToString(" ")
            .lowercase()
    val isRestricted =
        containsAny(normalized, "norge digitalt", "norway digital restricted", "inspire_directive_article13_1d")
    val isProtected = !isRestricted && containsAny(normalized, "beskyttet", "inspire_directive_article13_1b")
    val isOpenData =
        !isRestricted &&
            !isProtected &&
            containsAny(
                normalized,
                "åpne data",
                "open data",
                "no restrictions",
                "nolimitations",
                "no limitations",
            )
    return AccessFlags(
        isOpenData = isOpenData,
        isRestricted = isRestricted,
        isProtected = isProtected,
    )
}

private fun containsAny(
    value: String,
    vararg searchTerms: String,
): Boolean = searchTerms.any { term -> value.contains(term.lowercase()) }

private fun translateType(type: String?): String? =
    when (type) {
        "dataset" -> "Datasett"
        "software" -> "Applikasjon"
        "service" -> "Tjeneste"
        "servicelayer" -> "Tjenestelag"
        "series" -> "Datasettserie"
        "dimensionGroup" -> "Datapakke"
        else -> type
    }

private data class DatasetServiceReference(
    val uuid: String,
    val type: String? = null,
    val distributionProtocol: String? = null,
    val getCapabilitiesUrl: String? = null,
)

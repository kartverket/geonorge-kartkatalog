package no.kartverket.geonorge.kartkatalog.search

import kotlinx.serialization.Serializable

data class SearchRequest(
    val text: String? = null,
    val limit: Int = 10,
    val offset: Int = 1,
    val orderBy: String = "score",
    val listHidden: Boolean = false,
    val facets: List<SearchFacetInput> = emptyList(),
) {
    fun normalized(): SearchRequest =
        copy(
            text = text?.trim()?.takeIf { it.isNotEmpty() },
            limit = limit.coerceIn(1, 1000),
            offset = offset.coerceAtLeast(1),
            orderBy = orderBy.takeIf { it in validOrderBy } ?: "score",
            facets =
                facets.mapNotNull { facet ->
                    val name = facet.name.trim().takeIf { it.isNotEmpty() } ?: return@mapNotNull null
                    val value = facet.value.trim().takeIf { it.isNotEmpty() } ?: return@mapNotNull null
                    canonicalFacetName(name)?.let { SearchFacetInput(it, value) }
                },
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
    val numFound: Int,
    val limit: Int,
    val offset: Int,
    val results: List<SearchResultItem>,
    val facets: List<SearchFacet> = emptyList(),
    val type: String = "search",
)

data class SearchFacetInput(
    val name: String,
    val value: String,
)

@Serializable
data class SearchFacet(
    val facetField: String,
    val values: List<SearchFacetValue>,
)

@Serializable
data class SearchFacetValue(
    val name: String,
    val count: Int,
)

@Serializable
data class SearchResultItem(
    val uuid: String,
    val title: String,
    val organization: String? = null,
    val typeTranslated: String? = null,
    val thumbnailUrl: String? = null,
    val distributionUrl: String? = null,
    val distributionProtocol: String? = null,
    val getCapabilitiesUrl: String? = null,
    val showMapLink: Boolean = false,
    val mapCapabilitiesUrl: String? = null,
    val accessState: String? = null,
    val hierarchyLevel: String? = null,
)

internal fun canonicalFacetName(name: String): String? =
    when (name.lowercase()) {
        "type" -> "type"
        "theme" -> "theme"
        "organization", "organizations" -> "organizations"
        "nationalinitiative" -> "nationalinitiative"
        "distributionprotocols" -> "DistributionProtocols"
        "area" -> "area"
        "dataaccess" -> "dataaccess"
        "spatialscope" -> "spatialscope"
        else -> null
    }

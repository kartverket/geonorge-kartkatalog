package no.kartverket.geonorge.kartkatalog.search

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
    val numFound: Int,
    val limit: Int,
    val offset: Int,
    val results: List<SearchResultItem>,
    val type: String = "search",
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

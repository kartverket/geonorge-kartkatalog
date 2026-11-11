package no.kartverket.geonorge.kartkatalog.search

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import no.kartverket.geonorge.kartkatalog.integrations.solr.RelatedServiceReference

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
    val label: String? = null,
    val values: List<SearchFacetValue>,
)

@Serializable
data class SearchFacetValue(
    val name: String,
    val label: String? = null,
    val category: String? = null,
    val count: Int,
)

val FACET_LABELS: Map<String, String> =
    linkedMapOf(
        "type" to "Type",
        "theme" to "Tema",
        "organizations" to "Utgiver",
        "area" to "Geografisk område",
        "dataaccess" to "Tilgang til data",
        "DistributionProtocols" to "Distribusjonsform",
        "nationalinitiative" to "Samarbeid og lover",
    )

val FACET_ORDER: Map<String, Int> =
    FACET_LABELS.keys.withIndex().associate { (i, field) -> field to i }

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
    val downloadableSeriesMembers: List<DownloadItem>? = null,
    val showMapLink: Boolean = false,
    val mapCapabilitiesUrl: String? = null,
    val accessState: String? = null,
    val hierarchyLevel: String? = null,
    val seriesType: String? = null,
)

@Serializable
enum class AccessType {
    @SerialName("restricted")
    RESTRICTED,

    @SerialName("open")
    OPEN,

    @SerialName("protected")
    PROTECTED,
}

@Serializable
data class DownloadItem(
    val accessType: AccessType,
    val distributionUrl: String? = null,
    val name: String? = null,
    val organizationName: String? = null,
    val uuid: String,
) {
    companion object {
        fun fromRelatedServiceReference(ref: RelatedServiceReference): DownloadItem =
            DownloadItem(
                accessType =
                    when {
                        ref.accessIsOpendata -> AccessType.OPEN
                        ref.accessIsRestricted -> AccessType.RESTRICTED
                        else -> AccessType.PROTECTED
                    },
                distributionUrl = ref.distributionUrl,
                name = ref.name,
                organizationName = ref.organizationName,
                uuid = ref.uuid,
            )

        // Solr-feltet "serie" på et medlem beskriver serien det hører til, som én tekst
        // delt med "|". Rekkefølgen kommer fra den gamle indekseringen (SolrIndexDocumentCreator.cs).
        // Medlemmer av en tematisk serie gir samme fil som serien selv, så da skal
        // nedlastingen gå til serien i stedet for medlemmet.
        fun fromThematicSeries(serie: String?): DownloadItem? {
            val parts = serie?.split("|") ?: return null
            if (parts.getOrNull(SERIE_TYPE_NAME) != "series_thematic") return null
            if (parts.getOrNull(SERIE_PROTOCOL) != "GEONORGE:DOWNLOAD") return null

            val uuid = parts.getOrNull(SERIE_UUID)?.takeIf { it.isNotBlank() } ?: return null
            val distributionUrl = parts.getOrNull(SERIE_URL)?.takeIf { it.isNotBlank() } ?: return null

            return DownloadItem(
                accessType =
                    when {
                        parts.getOrNull(SERIE_ACCESS_IS_OPENDATA).equals("true", ignoreCase = true) -> AccessType.OPEN
                        parts.getOrNull(SERIE_ACCESS_IS_RESTRICTED).equals("true", ignoreCase = true) ->
                            AccessType.RESTRICTED
                        else -> AccessType.PROTECTED
                    },
                distributionUrl = distributionUrl,
                name = parts.getOrNull(SERIE_TITLE),
                organizationName = parts.getOrNull(SERIE_ORGANIZATION),
                uuid = uuid,
            )
        }

        private const val SERIE_UUID = 0
        private const val SERIE_TITLE = 1
        private const val SERIE_ORGANIZATION = 4
        private const val SERIE_PROTOCOL = 6
        private const val SERIE_URL = 7
        private const val SERIE_TYPE_NAME = 11
        private const val SERIE_ACCESS_IS_OPENDATA = 12
        private const val SERIE_ACCESS_IS_RESTRICTED = 13
    }
}

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

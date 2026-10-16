package no.kartverket.geonorge.kartkatalog.search

import io.ktor.http.Parameters
import no.kartverket.geonorge.kartkatalog.integrations.solr.MetadataSolrQuery

internal data class LegacyFacetInput(
    val name: String,
    val value: String,
)

internal data class LegacySearchRequest(
    val text: String?,
    val limit: Int,
    val offset: Int,
    val orderBy: String,
    val listHidden: Boolean,
    val facets: List<LegacyFacetInput>,
) {
    companion object {
        private val validFacets =
            setOf(
                "type",
                "theme",
                "organization",
                "organizations",
                "nationalinitiative",
                "distributionprotocols",
                "area",
                "dataaccess",
                "spatialscope",
            )
        private val validSorts =
            setOf(
                "score",
                "title",
                "title_desc",
                "organization",
                "organization_desc",
                "newest",
                "updated",
                "popularmetadata",
            )

        fun fromQuery(params: Parameters): LegacySearchRequest {
            // The MVC binder accepts either a zero-based or a one-based contiguous array.
            val first =
                if (params["facets[0]name"].isNullOrEmpty() &&
                    !params["facets[1]name"].isNullOrEmpty()
                ) {
                    1
                } else {
                    0
                }
            val facets =
                buildList {
                    for (i in first..100) {
                        val name = params["facets[$i]name"]?.takeIf { it.isNotEmpty() } ?: break
                        val value = params["facets[$i]value"].orEmpty()
                        if (name.isNotBlank() && value.isNotBlank() && name.lowercase() in validFacets) {
                            add(LegacyFacetInput(name, value))
                        }
                    }
                }
            val order = params["orderby"]?.lowercase()?.takeIf { it in validSorts } ?: "score"
            return LegacySearchRequest(
                text = params["text"],
                limit = (params["limit"]?.toIntOrNull() ?: 10).coerceAtLeast(1),
                offset = (params["offset"]?.toIntOrNull() ?: 1).coerceAtLeast(1),
                orderBy = order,
                listHidden = params["listhidden"].equals("true", ignoreCase = true),
                facets = facets,
            )
        }
    }
}

internal object LegacySearchQuery {
    private val defaultFacets =
        listOf(
            "type",
            "theme",
            "organizations",
            "nationalinitiative",
            "DistributionProtocols",
            "area",
            "dataaccess",
            "spatialscope",
        )
    private val specialChars =
        charArrayOf('+', '-', '&', '|', '!', '(', ')', '{', '}', '[', ']', '^', '"', '~', '*', '?', ':', '\\', '/')

    fun build(request: LegacySearchRequest): MetadataSolrQuery {
        // AddDefaultFacetsIfMissing drops selections that do not match a default facet name.
        // In particular, the legacy "organization" alias is accepted by the binder but then discarded.
        val selected =
            defaultFacets.flatMap { field ->
                request.facets.filter { it.name.equals(field, ignoreCase = true) }
            }
        val hasFilters = selected.isNotEmpty()
        val fields =
            defaultFacets.map { field ->
                if (selected.any { it.name.equals(field, ignoreCase = true) }) "{!ex=$field}$field" else field
            }
        val filters =
            selected
                .groupBy { it.name }
                .map { (name, values) ->
                    val terms =
                        if (name == "area") {
                            areaTerms(values.map { it.value })
                        } else {
                            values.map { it.value }.filterIndexed { i, v -> i == 0 || v != "High value dataset" }
                        }
                    "{!tag=$name}" + terms.joinToString(" OR ") { "$name:\"${escape(it)}\"" }
                }.toMutableList()
        if (!request.listHidden) {
            filters += "-serie:*series_historic*"
            filters += "-serie:*series_time*"
        }
        return MetadataSolrQuery(
            q = textQuery(request.text),
            fl = FIELDS,
            rows = request.limit,
            start = request.offset - 1,
            sort = sort(request, hasFilters),
            fq = filters,
            facetFields = fields,
            facetSortIndex = true,
        )
    }

    private fun areaTerms(values: List<String>): List<String> =
        values.map { it.take(4) }.distinct().flatMap { county ->
            values.filter { it.length > 4 && it.startsWith(county) }.ifEmpty { listOf(county) }
        }

    private fun sort(
        request: LegacySearchRequest,
        hasFilters: Boolean,
    ): String =
        when (request.orderBy) {
            "title" -> "title asc"
            "title_desc" -> "title desc"
            "organization" -> "organization asc"
            "organization_desc" -> "organization desc"
            "newest" -> "date_published desc"
            "updated" -> "date_updated desc"
            // Legacy's OrderBy has no dedicated popularMetadata branch.
            else ->
                if (request.text.isNullOrBlank()) {
                    if (hasFilters) "title asc" else "popularMetadata desc"
                } else {
                    "score desc"
                }
        }

    internal fun textQuery(raw: String?): String {
        if (raw.isNullOrBlank()) return "*:*"
        val text = escape(raw.trim())
        val titleText = text.replace(" ", "*")
        val words = text.split(' ').filter { it.isNotEmpty() }
        val clauses =
            mutableListOf(
                "uuid:($text)^81",
                "(type:dataset AND titleText:$titleText)^79",
                "titleText:$titleText^78",
                "(type:dataset AND titleText:$titleText*)^77",
                "titleText:$titleText*^76",
                "(type:dataset AND title_lowercase:*$titleText*)^75",
                "titleText:$titleText*^74",
                "(type:dataset AND titleText:*$titleText*)^73",
                "titleText:*$titleText*^72",
                "(type:dataset AND allText:*$titleText*)^71",
                "allText:*$titleText*^70",
            )
        if (raw.trim().contains(' ')) {
            clauses += words.joinToString(" OR ") { "(type:dataset AND titleText:*$it*)^0.5 titleText:*$it*^0.4" }
        }
        clauses += "allText:(${words.joinToString(" ") { "$it~1" }})^1"
        clauses += "allText2:($text)"
        return clauses.filter { it.isNotBlank() }.joinToString(" OR ")
    }

    private fun escape(value: String): String =
        buildString {
            value.forEach { c ->
                if (c in specialChars) append('\\')
                append(c)
            }
        }

    private const val FIELDS =
        "uuid,title,abstract,type,theme,organization,organizations,organizationgroup," +
            "organization_logo_url,thumbnail_url," +
            "distribution_url,distribution_protocol,distribution_name,date_updated,nationalinitiative,score," +
            "ServiceDistributionProtocolForDataset,ServiceDistributionUrlForDataset," +
            "ServiceDistributionNameForDataset," +
            "ServiceDistributionUuidForDataset,legend_description_url,product_sheet_url,product_specification_url," +
            "datasetservice,distributions,servicedataset,bundle,servicelayers,seriedatasets,serie,accessconstraint," +
            "otherconstraintsaccess,dataaccess,spatialscope,typename"
}

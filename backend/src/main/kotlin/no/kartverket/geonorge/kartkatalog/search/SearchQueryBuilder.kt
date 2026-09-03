package no.kartverket.geonorge.kartkatalog.search

import no.kartverket.geonorge.kartkatalog.integrations.solr.MetadataSolrQuery

object SearchQueryBuilder {
    private val solrSpecialChars =
        charArrayOf('+', '-', '&', '|', '!', '(', ')', '{', '}', '[', ']', '^', '"', '~', '*', '?', ':', '\\', '/')

private val solrBooleanKeywords =
    Regex("""(?<!\S)(AND|OR|NOT)(?!\S)""")

    fun build(request: SearchRequest): MetadataSolrQuery {
        val normalized = request.normalized()
        return MetadataSolrQuery(
            q = buildQuery(normalized.text),
            fl = SEARCH_FL,
            rows = normalized.limit,
            start = normalized.offset - 1,
            sort = buildSort(normalized),
            fq = buildFilters(normalized),
            facetFields = buildFacetFields(normalized),
            wt = "json",
        )
    }

    internal fun buildQuery(text: String?): String {
        if (text.isNullOrBlank()) return "*:*"

        val escaped = escapeSolrQuery(text.trim())
        val titleText = escaped.replace(" ", "*")
        val textAll = escaped.replace(" ", "*")
        val words = escaped.split(Regex("\\s+")).filter { it.isNotBlank() }
        val fuzzyWords = words.joinToString(" ") { "$it~1" }

        val clauses =
            mutableListOf(
                "uuid:($escaped)^81",
                "(type:dataset AND titleText:$titleText)^79",
                "titleText:$titleText^78",
                "(type:dataset AND titleText:$titleText*)^77",
                "titleText:$titleText*^76",
                "(type:dataset AND title_lowercase:*$titleText*)^75",
                "titleText:*$titleText*^74",
                "(type:dataset AND allText:*$textAll*)^71",
                "allText:*$textAll*^70",
                "allText2:($escaped)",
            )

        if (words.size > 1) {
            clauses +=
                words.joinToString(" OR ") { word ->
                    "(type:dataset AND titleText:*$word*)^0.5 OR titleText:*$word*^0.4"
                }
        }

        if (fuzzyWords.isNotBlank()) {
            clauses += "allText:($fuzzyWords)^1"
        }

        return clauses.joinToString(" OR ")
    }

    internal fun buildSort(request: SearchRequest): String =
        when (request.orderBy) {
            "title" -> "title asc"
            "title_desc" -> "title desc"
            "organization" -> "organization asc"
            "organization_desc" -> "organization desc"
            "newest" -> "date_published desc"
            "updated" -> "date_updated desc"
            "popularMetadata" -> "popularMetadata desc"
            else -> if (request.text.isNullOrBlank()) "popularMetadata desc" else "score desc"
        }

    internal fun buildFilters(request: SearchRequest): List<String> {
        val filters = mutableListOf<String>()
        if (!request.listHidden) {
            filters +=
                listOf(
                    "-serie:*series_historic*",
                    "-serie:*series_time*",
                )
        }

        filters +=
            request.facets
                .groupBy { it.name }
                .map { (name, facets) ->
                    val values = facets.joinToString(" OR ") { "\"${escapeSolrQuery(it.value)}\"" }
                    "{!tag=$name}$name:($values)"
                }

        return filters
    }

    internal fun buildFacetFields(request: SearchRequest): List<String> {
        val defaultFields =
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

        return (defaultFields + request.facets.map { it.name })
            .distinct()
            .map { name -> if (request.facets.any { it.name == name }) "{!ex=$name}$name" else name }
    }

    private fun escapeSolrQuery(input: String): String {
        val sb = StringBuilder()
        input.forEach { char ->
            if (char in solrSpecialChars) sb.append('\\')
            sb.append(char)
        }
        return sb.toString()
    }
}

private val SEARCH_FL =
    listOf(
        "uuid",
        "title",
        "abstract",
        "purpose",
        "type",
        "theme",
        "organization",
        "organizations",
        "organization_seo_lowercase",
        "organization_shortname",
        "placegroups",
        "organizationgroup",
        "topic_category",
        "organization_logo_url",
        "thumbnail_url",
        "distribution_url",
        "distribution_protocol",
        "distribution_name",
        "product_page_url",
        "date_published",
        "date_updated",
        "nationalinitiative",
        "score",
        "ServiceDistributionProtocolForDataset",
        "ServiceDistributionUrlForDataset",
        "ServiceDistributionNameForDataset",
        "DistributionProtocols",
        "legend_description_url",
        "product_sheet_url",
        "product_specification_url",
        "area",
        "datasetservice",
        "popularMetadata",
        "bundle",
        "servicelayers",
        "accessconstraint",
        "servicedataset",
        "applicationdataset",
        "otherconstraintsaccess",
        "dataaccess",
        "ServiceDistributionUuidForDataset",
        "ServiceDistributionAccessConstraint",
        "parentidentifier",
        "serie",
        "seriedatasets",
        "distributions",
        "typename",
        "spatialscope",
    ).joinToString(",")

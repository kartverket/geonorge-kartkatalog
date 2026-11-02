package no.kartverket.geonorge.kartkatalog.search

import no.kartverket.geonorge.kartkatalog.config.VectorSearchConfig
import no.kartverket.geonorge.kartkatalog.integrations.solr.MetadataSolrQuery
import java.util.Locale

class HybridSearchQueryBuilder(
    private val config: VectorSearchConfig,
) {
    fun build(
        query: MetadataSolrQuery,
        text: String,
        embedding: FloatArray,
    ): MetadataSolrQuery {
        require(text.isNotBlank()) { "Search text must not be blank" }
        require(embedding.isNotEmpty()) { "Embedding must not be empty" }
        val escapedText = escapeSolrQuery(text)
        val textAll = escapedText.replace(" ", "*")
        val knnQuery = "{!knn f=vector topK=${config.topK}}${embedding.toSolrVector()}"
        val threshold = cosineToFrangeThreshold(config.cosineThreshold, config.similarityFunction).formatThreshold()
        val hybridFilter =
            "uuid:($escapedText) OR allText:*$textAll* OR " +
                "_query_:\"{!frange l=$threshold}query(\$knn_q)\""
        val parameters = mutableMapOf("knn_q" to knnQuery)
        if (query.sort == "score desc") {
            parameters["rq"] =
                "{!rerank reRankQuery=\$knn_q reRankDocs=${config.topK} reRankWeight=${config.rerankWeight}}"
        }

        return query.copy(
            fq = query.fq + hybridFilter,
            extraParams = query.extraParams + parameters,
        )
    }

    private fun cosineToFrangeThreshold(
        cosine: Double,
        similarityFunction: String,
    ): Double =
        when (similarityFunction.trim().lowercase()) {
            "euclidean" -> 1.0 / (1.0 + 2.0 * (1.0 - cosine))
            else -> (1.0 + cosine) / 2.0
        }

    private fun escapeSolrQuery(input: String): String =
        buildString {
            input.forEach { char ->
                if (char in solrSpecialChars) append('\\')
                append(char)
            }
        }

    private fun FloatArray.toSolrVector(): String =
        joinToString(
            separator = ",",
            prefix = "[",
            postfix = "]",
        ) { value ->
            String.format(Locale.ROOT, "%.8f", value)
        }

    private fun Double.formatThreshold(): String =
        String
            .format(Locale.ROOT, "%.4f", this)
            .trimEnd('0')
            .trimEnd('.')

    private companion object {
        val solrSpecialChars =
            charArrayOf('+', '-', '&', '|', '!', '(', ')', '{', '}', '[', ']', '^', '"', '~', '*', '?', ':', '\\', '/')
    }
}

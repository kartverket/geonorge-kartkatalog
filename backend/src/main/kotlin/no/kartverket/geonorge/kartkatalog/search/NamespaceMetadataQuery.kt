package no.kartverket.geonorge.kartkatalog.search

import no.kartverket.geonorge.kartkatalog.integrations.solr.MetadataSolrQuery
import no.kartverket.geonorge.kartkatalog.integrations.solr.escapeSolrSpecialChars

// Mirrors MetadataService.GetMetadataForNamespace in the legacy catalogue (api/datasets-namespace).
internal object NamespaceMetadataQuery {
    const val DEFAULT_LIMIT = 10

    // Legacy offsets are one-based in the API; 0 is treated as 1.
    fun normalizeOffset(offset: Int): Int = if (offset == 0) 1 else offset

    // Legacy escapes the namespace twice, which only matches tokenized fields; it is escaped once here.
    fun build(
        namespace: String,
        limit: Int,
        offset: Int,
    ): MetadataSolrQuery =
        MetadataSolrQuery(
            q = "resourceReferenceCodespace:${escapeSolrSpecialChars(namespace)}",
            fl = SimpleMetadataQuery.FIELDS,
            rows = limit,
            start = offset - 1,
        )
}

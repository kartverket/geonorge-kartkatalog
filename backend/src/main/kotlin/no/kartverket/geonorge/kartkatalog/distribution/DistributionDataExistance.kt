package no.kartverket.geonorge.kartkatalog.distribution

import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrDocument

internal fun SolrDocument.resolveSeriesHasDownloads(): Boolean {
    return this.type == "serie" && this.seriedatasets?.isNotEmpty() ?: false
}

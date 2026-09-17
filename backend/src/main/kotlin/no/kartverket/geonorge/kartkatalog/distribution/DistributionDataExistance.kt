package no.kartverket.geonorge.kartkatalog.distribution

import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrDocument

internal fun SolrDocument.resolveLinkedDatasetExistence(): Boolean {
    return true
}

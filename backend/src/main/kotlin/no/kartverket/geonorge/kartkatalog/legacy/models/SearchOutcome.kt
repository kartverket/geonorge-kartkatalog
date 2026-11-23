package no.kartverket.geonorge.kartkatalog.legacy.models

import no.kartverket.geonorge.kartkatalog.search.SearchHits

internal sealed interface SearchOutcome {
    val hits: SearchHits

    data class Success(
        override val hits: SearchHits,
    ) : SearchOutcome

    data object SolrFailure : SearchOutcome {
        override val hits = SearchHits.Empty
    }
}

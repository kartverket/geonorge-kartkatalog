package no.kartverket.geonorge.kartkatalog.search

import kotlin.test.Test
import kotlin.test.assertEquals

class SearchQueryBuilderTest {
    @Test
    fun `builds wildcard query and popular sort for empty search`() {
        val query = SearchQueryBuilder.build(SearchRequest())

        assertEquals("*:*", query.q)
        assertEquals("popularMetadata desc", query.sort)
        assertEquals(0, query.start)
        assertEquals(10, query.rows)
        assertEquals(listOf("-serie:*series_historic*", "-serie:*series_time*"), query.fq)
    }

    @Test
    fun `falls back to score sort for invalid order by when text is present`() {
        val query =
            SearchQueryBuilder.build(
                SearchRequest(
                    text = "matrikkel",
                    orderBy = "invalid",
                ),
            )

        assertEquals("score desc", query.sort)
    }

    @Test
    fun `omits hidden filters when listhidden is true`() {
        val query = SearchQueryBuilder.build(SearchRequest(text = "kart", listHidden = true))

        assertEquals(emptyList(), query.fq)
    }

    @Test
    fun `builds grouped facet filters and facet fields`() {
        val query =
            SearchQueryBuilder.build(
                SearchRequest(
                    text = "kart",
                    facets =
                        listOf(
                            SearchFacetInput(name = "type", value = "dataset"),
                            SearchFacetInput(name = "type", value = "series"),
                            SearchFacetInput(name = "organization", value = "Kartverket"),
                        ),
                ),
            )

        assertEquals(
            listOf(
                "-serie:*series_historic*",
                "-serie:*series_time*",
                "{!tag=type}type:(\"dataset\" OR \"series\")",
                "{!tag=organizations}organizations:(\"Kartverket\")",
            ),
            query.fq,
        )
        assertEquals(
            listOf(
                "{!ex=type}type",
                "theme",
                "{!ex=organizations}organizations",
                "nationalinitiative",
                "DistributionProtocols",
                "area",
                "dataaccess",
                "spatialscope",
            ),
            query.facetFields,
        )
    }
}

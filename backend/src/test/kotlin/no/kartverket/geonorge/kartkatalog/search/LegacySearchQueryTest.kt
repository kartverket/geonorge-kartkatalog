package no.kartverket.geonorge.kartkatalog.search

import io.ktor.http.Parameters
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class LegacySearchQueryTest {
    @Test
    fun `defaults to 1-based Solr start and eight facets`() {
        val query = LegacySearchQuery.build(LegacySearchRequest.fromQuery(Parameters.Empty))
        assertEquals(0, query.start)
        assertEquals(10, query.rows)
        assertEquals("popularMetadata desc", query.sort)
        assertEquals(8, query.facetFields.size)
        assertEquals("*:*", query.q)
        assertEquals(listOf("-serie:*series_historic*", "-serie:*series_time*"), query.fq)
        assertTrue(query.facetSortIndex)
    }

    @Test
    fun `accepts contiguous one-based facets but drops the organization alias like legacy`() {
        val params = Parameters.build {
            append("facets[1]name", "organization")
            append("facets[1]value", "Kartverket")
            append("facets[2]name", "type")
            append("facets[2]value", "dataset")
            append("facets[4]name", "theme")
            append("facets[4]value", "Natur")
        }
        val request = LegacySearchRequest.fromQuery(params)
        assertEquals(listOf("organization", "type"), request.facets.map { it.name })
        val query = LegacySearchQuery.build(request)
        assertTrue(query.fq.any { "type:" in it })
        assertFalse(query.fq.any { "organization:" in it })
        assertEquals("title asc", query.sort)
    }

    @Test
    fun `clamps invalid paging and falls back from unknown sorts without vector operations`() {
        val request = LegacySearchRequest.fromQuery(Parameters.build {
            append("text", "Norge")
            append("limit", "-10")
            append("offset", "0")
            append("orderby", "unknown")
            append("listhidden", "true")
        })
        val query = LegacySearchQuery.build(request)
        assertEquals(1, query.rows)
        assertEquals(0, query.start)
        assertEquals("score desc", query.sort)
        assertTrue(query.q.contains("uuid:(Norge)^81"))
        assertTrue(query.fq.isEmpty())
    }

    @Test
    fun `county filters prefer selected municipalities`() {
        val query = LegacySearchQuery.build(LegacySearchRequest.fromQuery(Parameters.build {
            append("facets[0]name", "area")
            append("facets[0]value", "0/03")
            append("facets[1]name", "area")
            append("facets[1]value", "0/03/0301")
        }))
        assertTrue(query.fq.any { "0\\/03\\/0301" in it })
        assertFalse(query.fq.any { "area:\"0\\/03\" OR" in it })
    }
}

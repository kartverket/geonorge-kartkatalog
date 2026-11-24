package no.kartverket.geonorge.kartkatalog.legacy

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class SimpleMetadataQueryTest {
    @Test
    fun `without organization uses fixed query, 1000 rows and default facets only`() {
        val query = SimpleMetadataQuery.build(null)
        assertEquals("metadata_standard:\"ISO19115\\:Norsk versjon\"", query.q)
        assertEquals(1000, query.rows)
        assertEquals(0, query.start)
        assertEquals(null, query.sort)
        assertTrue(query.fq.isEmpty())
        assertEquals(
            listOf(
                "type",
                "theme",
                "organizations",
                "nationalinitiative",
                "DistributionProtocols",
                "area",
                "dataaccess",
                "spatialscope",
            ),
            query.facetFields,
        )
        assertTrue("resourceReferenceCodeName" in query.fl.split(','))
        assertTrue("organizations" !in query.fl.split(','))
    }

    @Test
    fun `empty organization behaves like missing`() {
        assertTrue(SimpleMetadataQuery.build("").fq.isEmpty())
    }

    @Test
    fun `organization adds escaped tagged filter and excluded facet`() {
        val query = SimpleMetadataQuery.build("Kart \"og\" (verk)")
        assertEquals(listOf("{!tag=organization}organization:\"Kart \\\"og\\\" \\(verk\\)\""), query.fq)
        assertEquals("{!ex=organization}organization", query.facetFields.last())
        assertEquals(9, query.facetFields.size)
    }

    @Test
    fun `whitespace-only organization skips the filter but keeps the facet`() {
        val query = SimpleMetadataQuery.build("   ")
        assertTrue(query.fq.isEmpty())
        assertEquals("{!ex=organization}organization", query.facetFields.last())
    }
}

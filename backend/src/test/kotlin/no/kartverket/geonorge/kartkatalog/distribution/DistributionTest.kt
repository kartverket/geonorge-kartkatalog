package no.kartverket.geonorge.kartkatalog.distribution

import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrDocument
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertFalse

class DistributionTest {
    @Test
    fun `test dataset not series returns false`() {
        val solrDocument =
            SolrDocument(
                uuid = UUID.randomUUID().toString(),
                type = "dataset",
                datasetservice =
                    listOf(
                        listOf(
                            "123|",
                            "service|",
                            "WMS|",
                            "service|",
                            "http://example.com/wms|",
                            "view|",
                            "WMS|",
                            "http://example.com/wms?service=wms&request=getcapabilities",
                        ).joinToString(),
                    ),
            )
        val result = solrDocument.resolveLinkedDatasetExistence()
        assertFalse(result)
    }

    @Test
    fun `test dataset series without refs to datasets returns false`() {
        val solrDocument =
            SolrDocument(
                uuid = UUID.randomUUID().toString(),
                type = "dataset",
                datasetservice =
                    listOf(
                        listOf(
                            "123|",
                            "service|",
                            "WMS|",
                            "service|",
                            "http://example.com/wms|",
                            "view|",
                            "WMS|",
                            "http://example.com/wms?service=wms&request=getcapabilities",
                        ).joinToString(),
                    ),
                serie = "456",
                seriedatasets = emptyList(),
            )
        val result = solrDocument.resolveLinkedDatasetExistence()
        assertFalse(result)
    }

    @Test
    fun `test dataset series with refs to datasets returns true`() {
        val solrDocument =
            SolrDocument(
                uuid = UUID.randomUUID().toString(),
                type = "dataset",
                datasetservice =
                    listOf(
                        listOf(
                            "123|",
                            "service|",
                            "WMS|",
                            "service|",
                            "http://example.com/wms|",
                            "view|",
                            "WMS|",
                            "http://example.com/wms?service=wms&request=getcapabilities",
                        ).joinToString(),
                    ),
                serie = "456",
                seriedatasets = listOf("789"),
            )
        val result = solrDocument.resolveLinkedDatasetExistence()
        assertFalse(result)
    }
}

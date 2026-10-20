package no.kartverket.geonorge.kartkatalog.search

import kotlin.test.Test
import kotlin.test.assertEquals

class SearchCsvTest {
    private fun hit(
        title: String? = "Et dokument",
        organizationgroup: String? = "Kartverket",
    ): SearchHit =
        SearchHit(
            uuid = "uuid-1",
            title = title,
            abstractText = null,
            type = "dataset",
            typename = null,
            theme = null,
            organization = null,
            organizationgroup = organizationgroup,
            organizations = null,
            organizationLogoUrl = null,
            thumbnailUrl = null,
            distributionUrl = null,
            distributionProtocol = null,
            distributionName = null,
            nationalinitiative = null,
            dataaccess = null,
            otherconstraintsaccess = null,
            accessconstraint = null,
            serviceDistributionUrlForDataset = null,
            serviceDistributionProtocolForDataset = null,
            serviceDistributionNameForDataset = null,
            serviceDistributionUuidForDataset = null,
            datasetservice = null,
            servicedataset = null,
            distributions = null,
            bundle = null,
            servicelayers = null,
            serie = null,
            seriedatasets = null,
            legendDescriptionUrl = null,
            productSheetUrl = null,
            productSpecificationUrl = null,
            dateUpdated = null,
            spatialscope = null,
        )

    private fun hits(vararg documents: SearchHit): SearchHits =
        SearchHits(documents.size, documents.toList(), emptyMap())

    private fun firstDataRow(csv: String): String = csv.lineSequence().drop(1).first()

    @Test
    fun `quotes values containing semicolons and quotes, and collapses newlines`() {
        val csv = SearchCsv.render(hits(hit(title = "Kart; \"Norge\"\ni to deler")), "no")

        assertEquals("\"Kart; \"\"Norge\"\" i to deler\";dataset;;Kartverket;;;uuid-1;;;;;;", firstDataRow(csv))
    }

    @Test
    fun `prefixes a leading formula character so spreadsheets treat it as text`() {
        val csv = SearchCsv.render(hits(hit(title = "=1+1")), "no")

        assertEquals("'=1+1;dataset;;Kartverket;;;uuid-1;;;;;;", firstDataRow(csv))
    }

    @Test
    fun `neutralizes a formula preceded by whitespace`() {
        val csv = SearchCsv.render(hits(hit(title = "  =cmd|' /c calc'!A1")), "no")

        assertEquals(true, firstDataRow(csv).startsWith("'  =cmd"))
    }

    @Test
    fun `does not alter a plain value without a formula prefix`() {
        val csv = SearchCsv.render(hits(hit(title = "Matrikkelen - Bygningspunkt")), "no")

        assertEquals("Matrikkelen - Bygningspunkt;dataset;;Kartverket;;;uuid-1;;;;;;", firstDataRow(csv))
    }

    @Test
    fun `quotes a formula value that also needs escaping`() {
        val csv = SearchCsv.render(hits(hit(title = "=A1;\"B\"")), "no")

        assertEquals("\"'=A1;\"\"B\"\"\";dataset;;Kartverket;;;uuid-1;;;;;;", firstDataRow(csv))
    }
}

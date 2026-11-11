package no.kartverket.geonorge.kartkatalog.search

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class DownloadItemTest {
    private fun serie(
        typeName: String = "series_thematic",
        protocol: String = "GEONORGE:DOWNLOAD",
    ): String =
        listOf(
            "ee232937-578e-4e4b-b35c-c50c0473fc25",
            "SAT-SKOG",
            "",
            "series",
            "Norsk institutt for bioøkonomi",
            "",
            protocol,
            "https://kart8.nibio.no/api/capabilities/",
            "Landbruk",
            "",
            "",
            typeName,
            "True",
            "False",
        ).joinToString("|")

    @Test
    fun `creates download item for the series when member belongs to a thematic series`() {
        assertEquals(
            DownloadItem(
                accessType = AccessType.OPEN,
                distributionUrl = "https://kart8.nibio.no/api/capabilities/",
                name = "SAT-SKOG",
                organizationName = "Norsk institutt for bioøkonomi",
                uuid = "ee232937-578e-4e4b-b35c-c50c0473fc25",
            ),
            DownloadItem.fromThematicSeries(serie()),
        )
    }

    @Test
    fun `returns null for other series types`() {
        assertNull(DownloadItem.fromThematicSeries(serie(typeName = "series_collection")))
    }

    @Test
    fun `returns null when the series has no Geonorge download`() {
        assertNull(DownloadItem.fromThematicSeries(serie(protocol = "OGC:WMS")))
    }

    @Test
    fun `returns null without series`() {
        assertNull(DownloadItem.fromThematicSeries(null))
    }
}

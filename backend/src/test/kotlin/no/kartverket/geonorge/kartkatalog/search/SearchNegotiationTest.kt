package no.kartverket.geonorge.kartkatalog.search

import io.ktor.http.ContentType
import io.ktor.http.Parameters
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class SearchNegotiationTest {
    @Test
    fun `requires explicit acceptable csv media type`() {
        val params = Parameters.Empty
        assertNull(params.searchCsvContentType(null))
        assertNull(params.searchCsvContentType("*/*"))
        assertNull(params.searchCsvContentType("text/*"))
        assertNull(params.searchCsvContentType("text/csvish"))
        assertNull(params.searchCsvContentType("application/json, application/csv-extra"))
        assertNull(params.searchCsvContentType("text/csv;q=0, */*;q=1"))
        assertNull(params.searchCsvContentType("text/csv;q=bogus"))
        assertEquals(ContentType.parse("text/csv"), params.searchCsvContentType("text/csv; charset=utf-8"))
        assertEquals(ContentType.parse("application/csv"), params.searchCsvContentType("application/csv"))
    }

    @Test
    fun `uses quality and specificity for csv versus json`() {
        val params = Parameters.Empty
        assertNull(params.searchCsvContentType("text/csv;q=0.4, application/json;q=0.9"))
        assertEquals(
            ContentType.parse("text/csv"),
            params.searchCsvContentType("application/json;q=0.4, text/csv;q=0.9"),
        )
        assertEquals(
            ContentType.parse("application/csv"),
            params.searchCsvContentType("text/csv;q=0.2, application/csv;q=0.8"),
        )
        assertEquals(
            ContentType.parse("application/csv"),
            params.searchCsvContentType("text/*;q=0.9, application/csv;q=0.4, application/json;q=0.2"),
        )
        assertNull(params.searchCsvContentType("text/csv;q=0.4, */*;q=0.9"))
        assertEquals(ContentType.parse("text/csv"), params.searchCsvContentType("text/csv, application/json"))
    }

    @Test
    fun `explicit mediatype overrides Accept but empty mediatype does not`() {
        val csv = Parameters.build { append("mediatype", "CSV") }
        assertEquals(ContentType.parse("text/csv"), csv.searchCsvContentType("application/json;q=1, text/csv;q=0"))
        val applicationCsv = Parameters.build { append("mediatype", "application/csv") }
        assertEquals(ContentType.parse("application/csv"), applicationCsv.searchCsvContentType("application/json"))
        val json = Parameters.build { append("mediatype", "json") }
        assertNull(json.searchCsvContentType("text/csv"))
        val empty = Parameters.build { append("mediatype", "") }
        assertEquals(ContentType.parse("text/csv"), empty.searchCsvContentType("text/csv"))
    }

    @Test
    fun `language prefers query then cookie then weighted Accept-Language`() {
        assertEquals("no", searchLanguage(null, null, null))
        assertEquals("en", searchLanguage("EN-us", "no", "nb-NO;q=1"))
        assertEquals("no", searchLanguage(null, "no", "en-US;q=1"))
        assertEquals("en", searchLanguage(null, "en", "no;q=1"))
        assertEquals("en", searchLanguage(null, null, "nb-NO;q=0.4, en-US;q=0.8"))
        assertEquals("en", searchLanguage(null, null, "fr-FR;q=1, en-GB;q=0.5"))
        assertEquals("en", searchLanguage(null, null, "nb-NO;q=0, en-US;q=0.5"))
        assertEquals("no", searchLanguage(null, null, "nb-NO;q=0.8, en-US;q=0.5"))
        assertEquals("no", searchLanguage(null, null, "en-US;q=0, nn-NO;q=0.3"))
        assertEquals("no", searchLanguage(null, null, "en-US;q=bogus"))
        assertEquals("no", searchLanguage(null, null, "enough;q=1"))
        assertEquals("no", searchLanguage("invalid", "en", "en-US"))
    }
}

package no.kartverket.geonorge.kartkatalog.download

import kotlin.test.Test
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class DownloadTokenAllowlistTest {
    @Test
    fun `permits only configured origins`() {
        val allowlist =
            DownloadTokenAllowlist.fromCommaSeparated(
                "https://nedlasting.geonorge.no, https://nap.ft.dibk.no",
            )

        assertTrue(allowlist.permits("https://nedlasting.geonorge.no/api/order"))
        assertTrue(allowlist.permits("https://nap.ft.dibk.no/orders/123"))
        assertFalse(allowlist.permits("http://nedlasting.geonorge.no/api/order"))
        assertFalse(allowlist.permits("https://nedlasting.geonorge.no.attacker.example/api/order"))
    }

    @Test
    fun `normalizes standard ports`() {
        val allowlist = DownloadTokenAllowlist.fromCommaSeparated("https://nedlasting.geonorge.no")

        assertTrue(allowlist.permits("https://nedlasting.geonorge.no:443/api/order"))
    }

    @Test
    fun `rejects HTTP origins in configuration`() {
        assertFailsWith<IllegalArgumentException> {
            DownloadTokenAllowlist.fromCommaSeparated("http://nedlasting.geonorge.no")
        }
    }

    @Test
    fun `missing configuration denies all token destinations`() {
        val allowlist = DownloadTokenAllowlist.fromCommaSeparated(null)

        assertFalse(allowlist.permits("https://nedlasting.geonorge.no/api/order"))
    }
}

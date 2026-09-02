package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterTegnereglerItem
import no.kartverket.geonorge.kartkatalog.metadata.models.toTegnereglerItem
import kotlin.test.Test
import kotlin.test.assertEquals

class TegnereglerItemTest {
    @Test
    fun `maps static documentation and cartography file from register item`() {
        val mapped =
            RegisterTegnereglerItem(
                id = "https://register.geonorge.no/tegneregler/test-kart",
                label = "Test Kart",
                status = "Gyldig",
                owner = "Kartverket",
                dateSubmitted = "2025-01-01",
                documentreference = "https://example.com/tegneregler.pdf",
                cartographyFile = "https://example.com/digital-kartografi.zip",
            ).toTegnereglerItem()

        assertEquals("https://example.com/tegneregler.pdf", mapped.documentreference)
        assertEquals("https://example.com/digital-kartografi.zip", mapped.cartographyFile)
    }
}

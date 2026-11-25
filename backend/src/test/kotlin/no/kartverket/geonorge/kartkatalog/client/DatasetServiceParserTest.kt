package no.kartverket.geonorge.kartkatalog.client

import no.kartverket.geonorge.kartkatalog.integrations.solr.parseDatasetServices
import java.util.UUID
import kotlin.test.Test
import kotlin.test.assertEquals

class DatasetServiceParserTest {
    @Test
    fun `parse related service good`() {
        val rightUuid = UUID.randomUUID().toString()
        val serviceName = "Administrative enheter - historiske data 1997"
        val protocol = "GEONORGE:DOWNLOAD"
        val distUri = "https://nedlasting.geonorge.no/api/capabilities/"
        val isOpen = true
        val isClose = false

        val datasetSerivceString =
            "$rightUuid|" +
                "$serviceName|" +
                "${UUID.randomUUID()}|" +
                "dataset|" +
                "Kartverket||" +
                "$protocol|" + "" +
                "$distUri|" +
                "Basis geodata|" +
                "https://register.dev.geonorge.no/data/organizations/971040238_Kartverket_liten.png|" +
                "https://editor.geonorge.no/thumbnails/${UUID.randomUUID()}_medium_adm1het.png|" +
                "no restrictions|http://inspire.ec.europa.eu||$isOpen|$isClose"
        val parsedServiceDetails = parseDatasetServices(listOf(datasetSerivceString))

        assertEquals(1, parsedServiceDetails.size)
        val parsedService = parsedServiceDetails[0]
        assertEquals(rightUuid, parsedService.uuid)
        assertEquals(serviceName, parsedService.name)
        assertEquals(protocol, parsedService.protocol)
        assertEquals(distUri, parsedService.distributionUrl)
        assertEquals(isOpen, parsedService.accessIsOpendata)
        assertEquals(isClose, parsedService.accessIsRestricted)
    }
}

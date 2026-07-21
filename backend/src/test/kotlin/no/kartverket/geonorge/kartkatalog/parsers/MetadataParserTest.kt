package no.kartverket.geonorge.kartkatalog.parsers

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.MetadataParser
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class MetadataParserTest {
    private val record by lazy {
        val xml = javaClass.classLoader.getResourceAsStream("response.xml")!!
        MetadataParser.parse(xml)
    }
    private val recordWithQuantitativeResult by lazy {
        val xml = javaClass.classLoader.getResourceAsStream("response2.xml")!!
        MetadataParser.parse(xml)
    }

    @Test
    fun `print record`() {
        println(record)
    }

    @Test
    fun `parses basic identity fields`() {
        assertEquals("c750a3f5-1cb8-46aa-a5eb-e13ee0cb9689", record.uuid)
        assertNull(record.parentIdentifier)
        assertEquals("nor", record.language)
        assertEquals("service", record.hierarchyLevel)
        assertEquals("service", record.hierarchyLevelName)
        assertEquals("2024-09-16", record.dateStamp)
        assertEquals("ISO19115", record.metadataStandard)
        assertEquals("2003", record.metadataStandardVersion)
    }

    @Test
    fun `parses metadata contact`() {
        val contact = record.metadataContact
        assertEquals("Kundesenter", contact.name)
        assertEquals("Kartverket", contact.organization)
        assertEquals("Norwegian Mapping Authority", contact.organizationEnglish)
        assertEquals("kundesenter@kartverket.no", contact.email)
        assertEquals("pointOfContact", contact.role)
    }

    @Test
    fun `parses four reference systems`() {
        assertEquals(4, record.referenceSystems.size)
        assertEquals("EPSG:3035", record.referenceSystems[0].code)
        assertEquals("EPSG:3034", record.referenceSystems[1].code)
        assertEquals("EPSG:4258", record.referenceSystems[2].code)
        assertEquals("EPSG:25833", record.referenceSystems[3].code)
        assertTrue(record.referenceSystems[0].codeSpace!!.contains("3035"))
    }

    @Test
    fun `parses six extension resources`() {
        assertEquals(6, record.extensionResources.size)
        val profiles = record.extensionResources.map { it.applicationProfile }
        assertTrue(
            profiles.containsAll(
                listOf(
                    "produktspesifikasjon",
                    "tegnforklaring",
                    "produktark",
                    "produktside",
                    "dekningsoversikt",
                    "hjelp",
                ),
            ),
        )

        val prodSpec = record.extensionResources.first { it.applicationProfile == "produktspesifikasjon" }
        val prodSpecUrl =
            "https://register.geonorge.no/register/versjoner/" +
                "produktspesifikasjoner/kartverket/matrikkelen-bygningspunkt"
        assertEquals(prodSpecUrl, prodSpec.url)
        assertEquals("data product specification", prodSpec.nameEnglish)

        val legend = record.extensionResources.first { it.applicationProfile == "tegnforklaring" }
        assertEquals(
            "https://register.geonorge.no/register/versjoner/tegneregler/kartverket/matrikkelkart-wms",
            legend.url,
        )
        assertEquals("cartography", legend.nameEnglish)
    }

    @Test
    fun `parses application schema info`() {
        assertEquals(1, record.applicationSchemaInfos.size)
        val schema = record.applicationSchemaInfos[0]
        assertTrue(schema.name!!.startsWith("https://objektkatalog.geonorge.no/"))
        assertEquals("UML", schema.schemaLanguage)
        assertEquals("OCL", schema.constraintLanguage)
    }

    @Test
    fun `parses identification info`() {
        assertEquals("Matrikkelen - Bygningspunkt WFS", record.title)
        assertTrue(record.abstract!!.startsWith("Tjenesten leverer datasettet"))
        assertEquals("onGoing", record.status)
        assertEquals("continual", record.maintenanceFrequency)
        assertNotNull(record.specificUsage)
    }

    @Test
    fun `parses two resource contacts`() {
        assertEquals(2, record.contacts.size)
        assertEquals("publisher", record.contacts[0].role)
        assertEquals("owner", record.contacts[1].role)
        record.contacts.forEach { assertEquals("Kartverket", it.organization) }
    }

    @Test
    fun `parses three citation dates`() {
        assertEquals(3, record.dates.size)
        assertEquals("creation", record.dates[0].type)
        assertEquals("publication", record.dates[1].type)
        assertEquals("revision", record.dates[2].type)
        record.dates.forEach { assertEquals("2018-04-26", it.date) }
    }

    @Test
    fun `parses three thumbnails`() {
        assertEquals(3, record.thumbnails.size)
        assertEquals("original", record.thumbnails[0].type)
        assertEquals("miniatyrbilde", record.thumbnails[1].type)
        assertEquals("medium", record.thumbnails[2].type)
        assertTrue(record.thumbnails[0].url.startsWith("https://editor.geonorge.no/thumbnails/"))
    }

    @Test
    fun `parses six keyword groups`() {
        assertEquals(6, record.keywordGroups.size)

        val inspireGroup = record.keywordGroups[0]
        assertEquals("GEMET - INSPIRE themes, version 1.0", inspireGroup.thesaurus)
        assertNotNull(inspireGroup.thesaurusHref)
        assertEquals("Buildings", inspireGroup.keywords[0].value)
        assertEquals("Bygninger", inspireGroup.keywords[0].englishValue)

        val serviceCategoryGroup = record.keywordGroups[4]
        val keyword = serviceCategoryGroup.keywords[0]
        assertEquals("infoFeatureAccessService", keyword.value)
        assertTrue(keyword.href!!.contains("infoFeatureAccessService"))

        val spatialScopeGroup = record.keywordGroups[5]
        assertEquals("National", spatialScopeGroup.keywords[0].value)
        assertNotNull(spatialScopeGroup.keywords[0].href)
        assertEquals("Spatial scope", spatialScopeGroup.thesaurus)
        assertNotNull(spatialScopeGroup.thesaurusHref)
    }

    @Test
    fun `parses legal constraints`() {
        val lc = assertNotNull(record.legalConstraints)
        assertEquals("otherRestrictions", lc.accessConstraints)
        assertEquals("otherRestrictions", lc.useConstraints)
        assertEquals(1, lc.useLimitations.size)
        assertTrue(lc.useLimitations[0].startsWith("Ingen begrensninger"))
        assertTrue(lc.otherConstraintsAccess!!.contains("noLimitations"))
        assertEquals("https://creativecommons.org/licenses/by/4.0/", lc.otherConstraintsLink)
        assertEquals("Creative Commons BY 4.0 (CC BY 4.0)", lc.otherConstraintsLinkText)
    }

    @Test
    fun `parses security constraints`() {
        val sc = assertNotNull(record.securityConstraints)
        assertEquals("unclassified", sc.classification)
        assertTrue(sc.userNote!!.contains("Matrikkelloven"))
    }

    @Test
    fun `parses service type and ordering`() {
        assertEquals("download", record.serviceType)
        assertEquals(
            "https://register.geonorge.no/metadata-kodelister/norge-digitalt-tjenesteerklaering/A",
            record.orderingInstructions,
        )
        assertEquals("tight", record.couplingType)
    }

    @Test
    fun `parses bounding box`() {
        val bb = assertNotNull(record.boundingBox)
        assertEquals(2.0, bb.westBoundLongitude)
        assertEquals(33.0, bb.eastBoundLongitude)
        assertEquals(57.0, bb.southBoundLatitude)
        assertEquals(72.0, bb.northBoundLatitude)
        assertTrue(record.temporalExtents.isEmpty())
    }

    @Test
    fun `parses operates on`() {
        assertEquals(1, record.operatesOn.size)
        assertEquals("24d7e9d1-87f6-45a0-b38e-3447f8d7f9a1", record.operatesOn[0].uuidref)
        assertNotNull(record.operatesOn[0].href)
    }

    @Test
    fun `parses service operations`() {
        assertEquals(1, record.serviceOperations.size)
        val op = record.serviceOperations[0]
        assertNull(op.operationName)
        assertTrue(op.dcp.isEmpty())
        assertEquals(1, op.connectPoints.size)
    }

    @Test
    fun `parses distribution info`() {
        val dist = assertNotNull(record.distributionInfo)
        assertEquals(1, dist.formats.size)
        assertEquals("GML", dist.formats[0].name)
        assertEquals("3.2.1", dist.formats[0].version)
        assertEquals(1, dist.onlineResources.size)
        assertEquals("OGC:WFS", dist.onlineResources[0].protocol)
        assertTrue(dist.onlineResources[0].url.startsWith("https://wfs.geonorge.no/"))
        assertEquals("landsfiler", dist.onlineResources[0].unitsOfDistribution)
    }

    @Test
    fun `parses three quality specifications`() {
        assertEquals(3, record.qualitySpecifications.size)
        record.qualitySpecifications.forEach { assertNull(it.pass) }

        val spec1 = record.qualitySpecifications[0]
        assertTrue(spec1.title.startsWith("COMMISSION REGULATION (EU) No 1089/2010"))
        assertEquals("inspire", spec1.specificationIdentifier)
        assertNull(spec1.specificationHref)
        assertNotNull(spec1.explanationEnglish)

        val spec2 = record.qualitySpecifications[1]
        assertTrue(spec2.title.startsWith("SOSI produktspesifikasjon"))
        assertEquals("sosi", spec2.specificationIdentifier)

        val spec3 = record.qualitySpecifications[2]
        assertTrue(spec3.title.startsWith("COMMISSION REGULATION (EC) No 976/2009"))
        assertEquals("inspire-networkservice", spec3.specificationIdentifier)
        assertNotNull(spec3.specificationHref)
    }

    @Test
    fun `parses quantitation specifications`() {
        // assuming record variable is the parsed MetadataRecord already used in this test class
        assertTrue(recordWithQuantitativeResult.dataQualityMeasures.isNotEmpty())
        val measure =
            recordWithQuantitativeResult.dataQualityMeasures.find {
                it.nameOfMeasure?.contains("FAIR", ignoreCase = true) == true
            }
        assertNotNull(measure)
        assertEquals(87, measure!!.value)
        assertTrue(measure.valueUnit?.contains("percent") == true)
        assertTrue(measure.measureDescription!!.contains("FAIR", ignoreCase = true))
    }

    @Test
    fun `parses empty quantitation specifications`() {
        assertTrue(record.dataQualityMeasures.isEmpty())
        val measure = record.dataQualityMeasures.find { it.nameOfMeasure?.contains("FAIR", ignoreCase = true) == true }
        assertNull(measure)
    }
}

package no.kartverket.geonorge.kartkatalog.integrations.geonetwork

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord

fun interface MetadataRecordSource {
    /** Returns null when the record does not exist; throws [GeoNetworkException] when the upstream fails. */
    suspend fun getRecordByUuid(uuid: String): MetadataRecord?
}

const val MET_UUID_PREFIX = "no.met:"

/**
 * Some records shown in the catalog (harvested into Solr) live only in the Norwegian Meteorological
 * Institute's catalog. Identifiers starting with [MET_UUID_PREFIX] are looked up in our GeoNetwork first
 * and then at MET; all other identifiers either exist in our GeoNetwork or not at all.
 */
class MetFallbackMetadataRecordSource(
    private val primary: MetadataRecordSource,
    private val met: MetadataRecordSource,
) : MetadataRecordSource {
    override suspend fun getRecordByUuid(uuid: String): MetadataRecord? {
        val record =
            try {
                primary.getRecordByUuid(uuid)
            } catch (e: CswExceptionReportException) {
                if (!uuid.startsWith(MET_UUID_PREFIX)) throw e
                return met.getRecordByUuid(uuid)
            }
        if (record != null || !uuid.startsWith(MET_UUID_PREFIX)) return record
        return met.getRecordByUuid(uuid)
    }
}

/**
 * Same URL as legacy (GeoNorgeAPI appends "srv/nor/csw" to the configured endpoint). With the default
 * "https://data.csw.met.no/?" this becomes "https://data.csw.met.no/?srv/nor/csw", which pycsw ignores.
 */
fun metCswUrl(metUrl: String): String = "${metUrl}srv/nor/csw"

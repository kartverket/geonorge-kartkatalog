package no.kartverket.geonorge.kartkatalog.integrations.geonetwork

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import org.slf4j.LoggerFactory

fun interface MetadataRecordSource {
    /** Returns null when the record does not exist; throws [GeoNetworkException] when the upstream fails. */
    suspend fun getRecordByUuid(uuid: String): MetadataRecord?
}

const val MET_UUID_PREFIX = "no.met:"

/**
 * Some records shown in the catalog (harvested into Solr) live only in the Norwegian Meteorological
 * Institute's catalog. Identifiers starting with [MET_UUID_PREFIX] are looked up in our GeoNetwork first
 * and then at MET, both when GeoNetwork has no record and when it answers with a CSW ExceptionReport.
 * Other GeoNetwork failures (HTTP error, timeout, ...) are propagated. All other identifiers either exist
 * in our GeoNetwork or not at all.
 */
class MetFallbackMetadataRecordSource(
    private val primary: MetadataRecordSource,
    private val met: MetadataRecordSource,
) : MetadataRecordSource {
    private val log = LoggerFactory.getLogger(MetFallbackMetadataRecordSource::class.java)

    override suspend fun getRecordByUuid(uuid: String): MetadataRecord? {
        if (!uuid.startsWith(MET_UUID_PREFIX)) return primary.getRecordByUuid(uuid)

        val record =
            try {
                primary.getRecordByUuid(uuid)
            } catch (e: CswExceptionReportException) {
                log.warn("Primary lookup of {} returned an ExceptionReport, falling back to MET", uuid, e)
                null
            }
        if (record != null) return record
        log.info("No record for {} in primary source, trying MET", uuid)
        return met.getRecordByUuid(uuid)
    }
}

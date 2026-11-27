package no.kartverket.geonorge.kartkatalog.integrations.met

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.CswExceptionReportException
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.MetadataRecordSource
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import org.slf4j.LoggerFactory

/**
 * Some records shown in the catalog (harvested into Solr) live only in the Norwegian Meteorological
 * Institute's catalog. Identifiers accepted by [isMetIdentifier] are looked up in our GeoNetwork first
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
        if (!isMetIdentifier(uuid)) return primary.getRecordByUuid(uuid)

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

package no.kartverket.geonorge.kartkatalog.integrations.geonetwork

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord

fun interface MetadataRecordSource {
    /** Returns null when the record does not exist; throws [GeoNetworkException] when the upstream fails. */
    suspend fun getRecordByUuid(uuid: String): MetadataRecord?
}

package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.GeonetworkClient
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductMetadata
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

class MetadataService(
    private val geonetworkClient: GeonetworkClient,
    private val metadataMapper: MetadataMapper,
    ) {
    suspend fun getMetadata(uuid: String): ProductMetadata {
        val record =
            geonetworkClient.getRecordByUuid(uuid)
                ?: throw MetadataRecordNotFoundException(uuid)
        return metadataMapper.toProductMetadata(record)
    }
}

class MetadataRecordNotFoundException(
    uuid: String,
) : RuntimeException("Metadata record not found for UUID: $uuid")


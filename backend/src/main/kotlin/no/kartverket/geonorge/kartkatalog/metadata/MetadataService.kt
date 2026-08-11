package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.GeonetworkClient
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductMetadata
import no.kartverket.geonorge.kartkatalog.metadata.models.TegnereglerItem
import no.kartverket.geonorge.kartkatalog.metadata.models.toTegnereglerItem

class MetadataService(
    private val geonetworkClient: GeonetworkClient,
    private val metadataMapper: MetadataMapper,
    private val registerClient: RegisterClient,
) {
    suspend fun getMetadata(uuid: String): ProductMetadata {
        val record =
            geonetworkClient.getRecordByUuid(uuid)
                ?: throw MetadataRecordNotFoundException(uuid)
        return metadataMapper.toProductMetadata(record)
    }

    suspend fun getTegneregler(uuid: String): TegnereglerItem? {
        val record =
            geonetworkClient.getRecordByUuid(uuid)
                ?: throw MetadataRecordNotFoundException(uuid)
        val tegnereglerPath =
            record.extensionResources.firstOrNull {
                it.applicationProfile.trim().equals("tegnforklaring", ignoreCase = true)
            }?.url
        return tegnereglerPath?.let {
            val seoname = it.substringAfterLast("/tegneregler/")
            try {
                registerClient.getTegneregler(seoname).toTegnereglerItem()
            } catch (e: no.kartverket.geonorge.kartkatalog.integrations.register.RegisterException) {
                null
            }
        }
    }
}

class MetadataRecordNotFoundException(
    uuid: String,
) : RuntimeException("Metadata record not found for UUID: $uuid")

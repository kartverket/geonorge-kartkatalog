package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.GeonetworkClient
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductMetadata
import no.kartverket.geonorge.kartkatalog.metadata.models.ProduktarkItem
import no.kartverket.geonorge.kartkatalog.metadata.models.TegnereglerItem
import no.kartverket.geonorge.kartkatalog.metadata.models.toProduktarkItem
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
        val tegnereglerPath = getExtensionUrl(uuid, "tegneregler")
        return tegnereglerPath?.let {
            val seoname = it.substringAfterLast("/tegneregler/")
            registerClient.getTegneregler(seoname)?.toTegnereglerItem()
        }
    }

    suspend fun getProduktark(uuid: String): ProduktarkItem? {
        val produktarkPath = getExtensionUrl(uuid, "produktark")
        return produktarkPath?.let {
            val seoname = it.substringAfterLast("/produktark/")
            registerClient.getProduktark(seoname)?.toProduktarkItem()
        }
    }

    private suspend fun getExtensionUrl(
        uuid: String,
        type: String,
    ): String? {
        val record = geonetworkClient.getRecordByUuid(uuid) ?: throw MetadataRecordNotFoundException(uuid)
        return record.extensionResources.firstOrNull {
            it.applicationProfile.trim().equals(type, ignoreCase = true)
        }?.url
    }
}

class MetadataRecordNotFoundException(
    uuid: String,
) : RuntimeException("Metadata record not found for UUID: $uuid")

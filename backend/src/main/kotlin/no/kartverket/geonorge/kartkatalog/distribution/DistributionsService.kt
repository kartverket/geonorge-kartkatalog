package no.kartverket.geonorge.kartkatalog.distribution

import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.GeonetworkClient
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.integrations.register.CodeList
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrDocument
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrException
import no.kartverket.geonorge.kartkatalog.metadata.CodeListTranslator
import org.slf4j.LoggerFactory

@Serializable
data class Distribution(
    @SerialName("Uuid") val uuid: String,
    @SerialName("Protocol") val protocol: String?,
    @SerialName("Title") val title: String?,
)

class DistributionsService(
    private val solrClient: SolrClient,
    private val geonetworkClient: GeonetworkClient,
    private val codeListTranslator: CodeListTranslator,
) {
    private val log = LoggerFactory.getLogger(DistributionsService::class.java)

    suspend fun getDistributions(uuid: String): List<Distribution> =
        coroutineScope {
            val record =
                geonetworkClient.getRecordByUuid(uuid)
                    ?: throw IllegalStateException("Metadata not found: $uuid")
            val own = record.toDistributions()
            val solrDoc =
                try {
                    solrClient
                        .getMetadataByUuid(uuid)
                        .response.docs
                        .firstOrNull()
                } catch (e: SolrException) {
                    log.warn("Failed to fetch related distributions from Solr for {}", uuid, e)
                    null
                }
            val relatedUuids = relatedUuids(solrDoc, record.hierarchyLevel, uuid)
            val related =
                relatedUuids
                    .map { relatedUuid ->
                        async {
                            val relatedRecord =
                                geonetworkClient.getRecordByUuid(relatedUuid)
                                    ?: throw IllegalStateException("Related metadata not found: $relatedUuid")
                            relatedRecord.toDistributions()
                        }
                    }.awaitAll()
                    .flatten()

            val applications =
                if (record.hierarchyLevel == "dataset") {
                    val applicationDocs =
                        try {
                            solrClient.searchApplicationsForDataset(uuid)
                        } catch (e: SolrException) {
                            log.warn("Failed to fetch applications from Solr for {}", uuid, e)
                            emptyList()
                        }
                    applicationDocs.filter { it.uuid != uuid }.map {
                        Distribution(
                            uuid = it.uuid,
                            title = it.title,
                            protocol =
                                it.distributionProtocol?.let { protocol ->
                                    codeListTranslator.translate(CodeList.DISTRIBUTION_TYPES, protocol)
                                } ?: "",
                        )
                    }
                } else {
                    emptyList()
                }

            own + related + applications
        }

    private fun relatedUuids(
        solrDoc: SolrDocument?,
        hierarchyLevel: String,
        uuid: String,
    ): List<String> {
        fun refs(values: List<String>?) = solrClient.parseDatasetServices(values).map { it.uuid }
        return when {
            solrDoc == null -> emptyList()
            hierarchyLevel == "service" -> refs(solrDoc.servicedataset) + refs(solrDoc.servicelayers)
            hierarchyLevel == "software" -> refs(solrDoc.applicationdataset)
            else -> refs(solrDoc.datasetservice)
        }.filter { it != uuid }.distinct()
    }

    private suspend fun MetadataRecord.toDistributions(): List<Distribution> {
        val formats = distributionInfo?.formats.orEmpty()
        val transferOptions = distributionInfo?.transferOptions.orEmpty()
        val hasDistributionName = !transferOptions.firstOrNull()?.name.isNullOrEmpty()
        val firstTransferProtocol = transferOptions.firstOrNull()?.protocol
        val protocols =
            formats.map { format ->
                val formatProtocol = format.onlineResources.firstOrNull()?.protocol
                formatProtocol?.takeIf { it.isNotEmpty() } ?: firstTransferProtocol
            } + transferOptions.drop(1).map { it.protocol }
        return protocols
            .distinct()
            .map { protocol ->
                val translated = codeListTranslator.translate(CodeList.DISTRIBUTION_TYPES, protocol)
                val isServiceLayer =
                    hierarchyLevel == "service" && hasDistributionName && translated in WMS_PROTOCOL_NAMES
                Distribution(uuid = uuid, protocol = if (isServiceLayer) SERVICE_LAYER else translated, title = title)
            }
    }

    private companion object {
        const val SERVICE_LAYER = "Tjenestelag"
        val WMS_PROTOCOL_NAMES = setOf("WMS-tjeneste", "WMS service")
    }
}

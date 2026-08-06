package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.GeonetworkClient
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.metadata.models.LinkedDistribution
import no.kartverket.geonorge.kartkatalog.metadata.models.LinkedDistributions

class LinkedDistributionsService(
    private val solrClient: SolrClient,
    private val geonetworkClient: GeonetworkClient,
) {
    suspend fun getLinkedDistributions(uuid: String): LinkedDistributions {
        val solrDoc =
            solrClient.getMetadataByUuid(uuid)
                .response.docs.firstOrNull() ?: return LinkedDistributions()

        val relatedServices =
            solrClient.parseDatasetServices(solrDoc.datasetservice)
                .filter { it.uuid != uuid }

        val viewRefs =
            relatedServices.filter {
                DistributionProtocols.isViewService(it.protocol)
            }
        val downloadRefs =
            relatedServices.filter {
                DistributionProtocols.isDownloadService(it.protocol)
            }

        val applicationDocs =
            solrClient.searchApplicationsForDataset(uuid)
                .filter { it.uuid != uuid }

        return LinkedDistributions(
            applications =
                applicationDocs.mapNotNull {
                    fetchLinkedDistribution(it.uuid)
                },
            viewServices =
                viewRefs.mapNotNull {
                    fetchLinkedDistribution(it.uuid)
                },
            downloadServices =
                downloadRefs.mapNotNull {
                    fetchLinkedDistribution(it.uuid)
                },
        )
    }

    private suspend fun fetchLinkedDistribution(relatedUuid: String): LinkedDistribution? {
        val record = geonetworkClient.getRecordByUuid(relatedUuid) ?: return null
        return record.toLinkedDistribution(relatedUuid)
    }

    private fun MetadataRecord.toLinkedDistribution(uuid: String): LinkedDistribution {
        val allResources =
            distributionInfo?.formats.orEmpty().flatMap {
                it.onlineResources
            }
        return LinkedDistribution(
            uuid = uuid,
            title = title,
            url = allResources.firstOrNull()?.url,
            formats =
                distributionInfo?.formats.orEmpty().map {
                    it.name
                }.distinct(),
        )
    }
}

package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.GeonetworkClient
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.integrations.register.CodeList
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.metadata.models.LinkedDistribution
import no.kartverket.geonorge.kartkatalog.metadata.models.LinkedDistributions

class LinkedDistributionsService(
    private val solrClient: SolrClient,
    private val geonetworkClient: GeonetworkClient,
    private val codeListTranslator: CodeListTranslator,
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

        val seriesMemberRefs =
            solrClient.parseDatasetServices(solrDoc.seriedatasets)
                .filter { it.uuid != uuid }

        val parentSeriesRefs =
            solrClient.parseDatasetServices(listOfNotNull(solrDoc.serie))
                .filter { it.uuid != uuid }

        return LinkedDistributions(
            applications =
                applicationDocs.mapNotNull {
                    fetchLinkedDistribution(it.uuid, protocol = null)
                },
            viewServices =
                viewRefs.mapNotNull {
                    fetchLinkedDistribution(it.uuid, it.protocol)
                },
            downloadServices =
                downloadRefs.mapNotNull {
                    fetchLinkedDistribution(it.uuid, it.protocol)
                },
            seriesMembers =
                seriesMemberRefs.mapNotNull {
                    fetchLinkedDistribution(it.uuid, it.protocol)
                },
            parentSeries =
                parentSeriesRefs.mapNotNull {
                    fetchLinkedDistribution(it.uuid, it.protocol)
                },
        )
    }

    private suspend fun fetchLinkedDistribution(
        relatedUuid: String,
        protocol: String?,
    ): LinkedDistribution? {
        val record = geonetworkClient.getRecordByUuid(relatedUuid) ?: return null
        return record.toLinkedDistribution(relatedUuid, protocol)
    }

    private suspend fun MetadataRecord.toLinkedDistribution(
        uuid: String,
        protocol: String?,
    ): LinkedDistribution {
        val allResources =
            distributionInfo?.formats.orEmpty().flatMap {
                it.onlineResources
            }
        val url = allResources.firstOrNull()?.url
        val isViewService = DistributionProtocols.isViewService(protocol)

        return LinkedDistribution(
            uuid = uuid,
            title = title,
            organization = metadataContact.organization,
            typeTranslated = null,
            thumbnailUrl =
                thumbnails.firstOrNull {
                    it.type?.equals("medium", ignoreCase = true) == true
                }?.url
                    ?: thumbnails.firstOrNull()?.url,
            distributionUrl = url,
            distributionProtocol = protocol,
            getCapabilitiesUrl = if (protocol != null) url else null,
            showMapLink = isViewService,
            mapCapabilitiesUrl = if (isViewService) url else null,
            formats =
                distributionInfo?.formats.orEmpty().map {
                    it.name
                }.distinct(),
            protocolNames =
                distributionInfo?.formats.orEmpty()
                    .flatMap { it.onlineResources }
                    .mapNotNull { it.protocol }
                    .distinct()
                    .map { codeListTranslator.translate(CodeList.DISTRIBUTION_TYPES, it) ?: it },
            hierarchyLevel = hierarchyLevel,
        )
    }
}

package no.kartverket.geonorge.kartkatalog.metadata

import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
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
    suspend fun getLinkedDistributions(uuid: String): LinkedDistributions =
        coroutineScope {
            val solrDoc =
                solrClient.getMetadataByUuid(uuid)
                    .response.docs.firstOrNull() ?: return@coroutineScope LinkedDistributions()

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

            val applicationsDeferred =
                applicationDocs.map {
                    async {
                        fetchLinkedDistribution(it.uuid, protocol = null)
                    }
                }

            val viewServicesDeferred =
                viewRefs.map {
                    async {
                        fetchLinkedDistribution(it.uuid, it.protocol)
                    }
                }

            val downloadServicesDeferred =
                downloadRefs.map {
                    async {
                        fetchLinkedDistribution(it.uuid, it.protocol)
                    }
                }

            val seriesMembersDeferred =
                seriesMemberRefs.map {
                    async {
                        fetchLinkedDistribution(it.uuid, it.protocol)
                    }
                }

            val parentSeriesDeferred =
                parentSeriesRefs.map {
                    async {
                        fetchLinkedDistribution(it.uuid, it.protocol)
                    }
                }

            return@coroutineScope LinkedDistributions(
                applications = applicationsDeferred.awaitAll().filterNotNull(),
                viewServices = viewServicesDeferred.awaitAll().filterNotNull(),
                downloadServices = downloadServicesDeferred.awaitAll().filterNotNull(),
                seriesMembers = seriesMembersDeferred.awaitAll().filterNotNull(),
                parentSeries = parentSeriesDeferred.awaitAll().filterNotNull(),
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

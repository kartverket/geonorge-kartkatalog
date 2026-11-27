package no.kartverket.geonorge.kartkatalog.metadata

import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import no.kartverket.geonorge.kartkatalog.distribution.resolveMapCapability
import no.kartverket.geonorge.kartkatalog.download.DownloadItem
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.MET_WEATHER_STATION_SERIES_UUID
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.MetadataRecordSource
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.TimeSeriesMemberSource
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.OnlineResource
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrDocument
import no.kartverket.geonorge.kartkatalog.integrations.solr.parseDatasetServices
import no.kartverket.geonorge.kartkatalog.metadata.models.LinkedDistribution
import no.kartverket.geonorge.kartkatalog.metadata.models.LinkedDistributions
import org.slf4j.LoggerFactory
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter

class LinkedDistributionsService(
    private val solrClient: SolrClient,
    private val recordSource: MetadataRecordSource,
    private val timeSeriesMemberSource: TimeSeriesMemberSource,
) {
    private val log = LoggerFactory.getLogger(LinkedDistributionsService::class.java)

    suspend fun getLinkedDistributions(uuid: String): LinkedDistributions {
        val solrDoc = solrClient.getMetadataByUuid(uuid) ?: return LinkedDistributions()

        return when (solrDoc.type) {
            "service" -> getServiceLinkedDistributions(solrDoc, uuid)
            "servicelayer" -> getServiceLayerLinkedDistributions(solrDoc, uuid)
            "software" -> getApplicationLinkedDistributions(uuid)
            else -> getDatasetLinkedDistributions(solrDoc, uuid)
        }
    }

    private suspend fun getDatasetLinkedDistributions(
        solrDoc: SolrDocument,
        uuid: String,
    ): LinkedDistributions =
        coroutineScope {
            val relatedServices =
                parseDatasetServices(solrDoc.datasetservice)
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
                solrClient
                    .searchApplicationsForDataset(uuid)
                    .filter { it.uuid != uuid }

            val seriesMemberRefs =
                /** Timeseries som ligger hos met har også seriemedlemmer på met sin server
                 * seriedatasets er dermed tom, og vi kan droppe å parse noe */
                if (solrDoc.isMetTimeSeries) {
                    // TODO: eller kan det være at noen har seriedatasets på seg? I så fall burde vi her kjøre
//                    elsen, og heller håndtere isMetTimeSeries && seriesMemberRefs is empty i seriesMembersDeferred... snakk med dag olav
                    emptyList()
                } else {
                    parseDatasetServices(solrDoc.seriedatasets).filter { it.uuid != uuid }
                }

            val parentSeriesRefs =
                parseDatasetServices(listOfNotNull(solrDoc.serie))
                    .filter { it.uuid != uuid }

            val relatedUuids =
                buildList {
                    applicationDocs.mapTo(this) { it.uuid }
                    viewRefs.mapTo(this) { it.uuid }
                    downloadRefs.mapTo(this) { it.uuid }
                    seriesMemberRefs.mapTo(this) { it.uuid }
                    parentSeriesRefs.mapTo(this) { it.uuid }
                }
            val solrDocsByUuid = solrClient.getMetadataByUuids(relatedUuids).associateBy { it.uuid }

            val applicationsDeferred =
                applicationDocs.map {
                    async {
                        fetchLinkedDistribution(it.uuid, null, solrDocsByUuid)
                    }
                }

            val viewServicesDeferred =
                viewRefs.map {
                    async {
                        fetchLinkedDistribution(it.uuid, it.protocol, solrDocsByUuid)
                    }
                }

            val downloadServicesDeferred =
                downloadRefs.map {
                    async {
                        fetchLinkedDistribution(it.uuid, it.protocol, solrDocsByUuid)
                    }
                }

            val seriesMembersDeferred =
                async {
                    if (solrDoc.isMetTimeSeries) {
//                       for met-inst-timeseries kan vi hente seriemedlemmer hos met
                        fetchTimeSeriesMembers(uuid)
                    } else {
                        seriesMemberRefs
                            .map {
                                async {
                                    fetchLinkedDistribution(
                                        it.uuid,
                                        it.protocol,
                                        solrDocsByUuid,
                                        preferDownloadProtocol = true,
                                    )
                                }
                            }.awaitAll()
                            .filterNotNull()
                    }
                }

            val parentSeriesDeferred =
                parentSeriesRefs.map {
                    async {
                        fetchLinkedDistribution(it.uuid, it.protocol, solrDocsByUuid, preferDownloadProtocol = true)
                    }
                }

            LinkedDistributions(
                applications = applicationsDeferred.awaitAll().filterNotNull(),
                viewServices = viewServicesDeferred.awaitAll().filterNotNull(),
                downloadServices = downloadServicesDeferred.awaitAll().filterNotNull(),
                seriesMembers = seriesMembersDeferred.await(),
                parentSeries = parentSeriesDeferred.awaitAll().filterNotNull(),
            )
        }

    private suspend fun getServiceLinkedDistributions(
        solrDoc: SolrDocument,
        uuid: String,
    ): LinkedDistributions =
        coroutineScope {
            val datasetRefs = parseDatasetServices(solrDoc.servicedataset).filter { it.uuid != uuid }
            val layerRefs = parseDatasetServices(solrDoc.servicelayers).filter { it.uuid != uuid }

            val relatedUuids = datasetRefs.map { it.uuid } + layerRefs.map { it.uuid }
            val solrDocsByUuid = solrClient.getMetadataByUuids(relatedUuids).associateBy { it.uuid }

            val relatedDatasetsDeferred =
                datasetRefs.map { async { fetchLinkedDistribution(it.uuid, it.protocol, solrDocsByUuid) } }
            val serviceLayersDeferred =
                layerRefs.map { async { fetchLinkedDistribution(it.uuid, it.protocol, solrDocsByUuid) } }

            LinkedDistributions(
                relatedDatasets = relatedDatasetsDeferred.awaitAll().filterNotNull(),
                serviceLayers = serviceLayersDeferred.awaitAll().filterNotNull(),
            )
        }

    private suspend fun getServiceLayerLinkedDistributions(
        solrDoc: SolrDocument,
        uuid: String,
    ): LinkedDistributions =
        coroutineScope {
            val datasetRefs = parseDatasetServices(solrDoc.servicedataset).filter { it.uuid != uuid }
            val parentServiceRefs =
                parseDatasetServices(listOfNotNull(solrDoc.parentidentifier)).filter { it.uuid != uuid }

            val relatedUuids = datasetRefs.map { it.uuid } + parentServiceRefs.map { it.uuid }
            val solrDocsByUuid = solrClient.getMetadataByUuids(relatedUuids).associateBy { it.uuid }

            val relatedDatasetsDeferred =
                datasetRefs.map { async { fetchLinkedDistribution(it.uuid, it.protocol, solrDocsByUuid) } }
            val parentServiceDeferred =
                parentServiceRefs.map { async { fetchLinkedDistribution(it.uuid, it.protocol, solrDocsByUuid) } }

            LinkedDistributions(
                relatedDatasets = relatedDatasetsDeferred.awaitAll().filterNotNull(),
                parentService = parentServiceDeferred.awaitAll().filterNotNull(),
            )
        }

    // Related datasets were previously read from the Solr field `applicationdataset`, but that field only exists
    // in the `applications` core, and the lookup now goes through `metadata_all`. They are therefore read from
    // gmd:aggregationInfo/aggregateDataSetIdentifier in the GeoNetwork record instead.
    private suspend fun getApplicationLinkedDistributions(uuid: String): LinkedDistributions {
        val record = recordSource.getRecordByUuid(uuid) ?: return LinkedDistributions()

        return coroutineScope {
            val datasetUuids = record.aggregateDataSetIdentifiers.filter { it != uuid }
            val solrDocsByUuid = solrClient.getMetadataByUuids(datasetUuids).associateBy { it.uuid }

            // The protocol used to come from the `applicationdataset` entry; the dataset's own Solr document
            // carries the same distribution protocol, so the card URL is resolved the same way as before.
            val relatedDatasetsDeferred =
                datasetUuids.map {
                    async { fetchLinkedDistribution(it, solrDocsByUuid[it]?.distributionProtocol, solrDocsByUuid) }
                }

            LinkedDistributions(relatedDatasets = relatedDatasetsDeferred.awaitAll().filterNotNull())
        }
    }

    // Legacy swallows MET errors here; we log them so the rest of the page's linked distributions still load.
    private suspend fun fetchTimeSeriesMembers(seriesUuid: String): List<LinkedDistribution> =
        try {
            timeSeriesMemberSource.getTimeSeriesMembers(seriesUuid).map { it.toTimeSeriesMember(seriesUuid) }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            log.warn("Could not fetch time series members for {} from MET", seriesUuid, e)
            emptyList()
        }

    private suspend fun fetchLinkedDistribution(
        relatedUuid: String,
        protocol: String?,
        solrDocsByUuid: Map<String, SolrDocument>,
        preferDownloadProtocol: Boolean = false,
    ): LinkedDistribution? {
        val record = recordSource.getRecordByUuid(relatedUuid) ?: return null
        return record.toLinkedDistribution(protocol, solrDocsByUuid[relatedUuid], preferDownloadProtocol)
    }

    private fun MetadataRecord.toLinkedDistribution(
        protocol: String?,
        solrDoc: SolrDocument?,
        preferDownloadProtocol: Boolean = false,
    ): LinkedDistribution {
        val allResources =
            distributionInfo?.formats.orEmpty().flatMap {
                it.onlineResources
            }
        val downloadResource =
            if (preferDownloadProtocol) {
                allResources.firstOrNull { it.protocol.equals("GEONORGE:DOWNLOAD", ignoreCase = true) }
            } else {
                null
            }
        val effectiveProtocol = downloadResource?.protocol ?: protocol
        val url = downloadResource?.url ?: allResources.findUrlForProtocol(protocol)
        val ownViewServiceResource = allResources.firstOrNull { DistributionProtocols.isViewService(it.protocol) }
        val mapCapability = solrDoc?.resolveMapCapability()

        return LinkedDistribution(
            uuid = uuid,
            title = title,
            organization = metadataContact.organization,
            typeTranslated = null,
            seriesType = hierarchyLevelName,
            thumbnailUrl =
                thumbnails
                    .firstOrNull {
                        it.type?.equals("medium", ignoreCase = true) == true
                    }?.url
                    ?: thumbnails.firstOrNull()?.url,
            distributionUrl = url,
            distributionProtocol = effectiveProtocol,
            getCapabilitiesUrl = if (effectiveProtocol != null) url else null,
            showMapLink = (mapCapability?.showMapLink == true) || ownViewServiceResource != null,
            mapCapabilitiesUrl = mapCapability?.mapCapabilitiesUrl ?: ownViewServiceResource?.url,
            hierarchyLevel = hierarchyLevel,
            accessState = resolveAccessState(this),
            thematicSeriesDownloadItem = DownloadItem.fromThematicSeries(solrDoc?.serie),
        )
    }

    /** Same mapping as legacy MetadataService.GetTimeRelatedDistributions. */
    private fun MetadataRecord.toTimeSeriesMember(seriesUuid: String): LinkedDistribution {
        val distributionDetails = distributionInfo?.transferOptions?.firstOrNull()
        val wmsResource =
            distributionInfo
                ?.formats
                .orEmpty()
                .flatMap { it.onlineResources }
                .lastOrNull { it.protocol == "OGC:WMS" }
        val memberTitle =
            if (seriesUuid == MET_WEATHER_STATION_SERIES_UUID) {
                listOfNotNull(title, publicationDateTime()?.format(TIME_SERIES_DATE_FORMAT)).joinToString(" ")
            } else {
                title
            }
        val url =
            distributionDetails?.url?.takeIf { it.isNotEmpty() }?.let { if (it.endsWith(".nc")) "$it.html" else it }

        return LinkedDistribution(
            uuid = uuid,
            title = memberTitle,
            organization = contacts.firstOrNull { it.role == "owner" }?.organization,
            typeTranslated = null,
            seriesType = hierarchyLevelName,
            thumbnailUrl = null,
            distributionUrl = url,
            distributionProtocol = distributionDetails?.protocol,
            getCapabilitiesUrl = null,
            showMapLink = wmsResource != null,
            mapCapabilitiesUrl = wmsResource?.url,
            hierarchyLevel = hierarchyLevel,
            accessState = resolveAccessState(this),
        )
    }

    private fun MetadataRecord.publicationDateTime(): LocalDateTime? {
        val date = dates.firstOrNull { it.type == "publication" }?.date ?: return null
        return runCatching { OffsetDateTime.parse(date).toLocalDateTime() }
            .recoverCatching { LocalDateTime.parse(date) }
            .recoverCatching { LocalDate.parse(date).atStartOfDay() }
            .getOrNull()
    }

    private fun List<OnlineResource>.findUrlForProtocol(protocol: String?): String? =
        if (protocol.isNullOrBlank()) {
            singleOrNull()?.url
        } else {
            firstOrNull { it.protocol.equals(protocol, ignoreCase = true) }?.url
        }
}

private val TIME_SERIES_DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")

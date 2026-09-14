package no.kartverket.geonorge.kartkatalog.search

import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrDocument
import no.kartverket.geonorge.kartkatalog.metadata.DistributionProtocols

internal data class DatasetServiceReference(
    val uuid: String,
    val type: String? = null,
    val distributionProtocol: String? = null,
    val getCapabilitiesUrl: String? = null,
)

internal data class MapCapability(
    val showMapLink: Boolean,
    val mapCapabilitiesUrl: String?,
)

internal fun parseDatasetServices(raw: List<String>?): List<DatasetServiceReference> =
    raw.orEmpty().mapNotNull { value ->
        val parts = value.split("|")
        val uuid = parts.getOrNull(0)?.takeIf { it.isNotBlank() } ?: return@mapNotNull null
        DatasetServiceReference(
            uuid = uuid,
            type = parts.getOrNull(3),
            distributionProtocol = parts.getOrNull(6),
            getCapabilitiesUrl = parts.getOrNull(7),
        )
    }

internal fun canShowMap(
    type: String?,
    distributionProtocol: String?,
    distributionUrl: String?,
    viewServices: List<DatasetServiceReference>,
    serviceDistributionUrlForDataset: String?,
): Boolean {
    val hasMappedDatasetView = serviceDistributionUrlForDataset?.contains("service=wms", ignoreCase = true) == true
    val hasDatasetViewServices = viewServices.isNotEmpty()
    val isServiceView =
        !distributionUrl.isNullOrBlank() &&
            (type.equals("service", ignoreCase = true) || type.equals("servicelayer", ignoreCase = true)) &&
            DistributionProtocols.isViewService(distributionProtocol)

    return hasMappedDatasetView || hasDatasetViewServices || isServiceView
}

internal fun SolrDocument.resolveMapCapability(): MapCapability {
    val datasetServices = parseDatasetServices(datasetservice)
    val viewServices =
        datasetServices.filter {
            DistributionProtocols.isViewService(it.distributionProtocol) &&
                (it.type.equals("service", ignoreCase = true) || it.type.equals("servicelayer", ignoreCase = true))
        }
    val firstViewService = viewServices.firstOrNull { !it.getCapabilitiesUrl.isNullOrBlank() }
    val mapCapabilitiesUrl =
        when {
            !serviceDistributionUrlForDataset.isNullOrBlank() -> serviceDistributionUrlForDataset
            firstViewService != null -> firstViewService.getCapabilitiesUrl
            (type.equals("service", ignoreCase = true) || type.equals("servicelayer", ignoreCase = true)) &&
                DistributionProtocols.isViewService(distributionProtocol) -> distributionUrl
            else -> null
        }

    return MapCapability(
        showMapLink =
            canShowMap(
                type,
                distributionProtocol,
                distributionUrl,
                viewServices,
                serviceDistributionUrlForDataset,
            ),
        mapCapabilitiesUrl = mapCapabilitiesUrl,
    )
}

package no.kartverket.geonorge.kartkatalog.distribution

import no.kartverket.geonorge.kartkatalog.integrations.solr.RelatedServiceReference
import no.kartverket.geonorge.kartkatalog.integrations.solr.parseDatasetServices
import no.kartverket.geonorge.kartkatalog.metadata.DistributionProtocols

internal interface MapCapabilityFields {
    val type: String?
    val distributionProtocol: String?
    val distributionUrl: String?
    val datasetservice: List<String>?
    val serviceDistributionUrlForDataset: String?
}

internal data class MapCapability(
    val showMapLink: Boolean,
    val mapCapabilitiesUrl: String?,
)

internal fun canShowMap(
    type: String?,
    distributionProtocol: String?,
    distributionUrl: String?,
    viewServices: List<RelatedServiceReference>,
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

internal fun MapCapabilityFields.resolveMapCapability(): MapCapability {
    val datasetServices = parseDatasetServices(datasetservice)
    val viewServices =
        datasetServices.filter {
            DistributionProtocols.isViewService(it.protocol) &&
                (it.type.equals("service", ignoreCase = true) || it.type.equals("servicelayer", ignoreCase = true))
        }
    val firstViewService = viewServices.firstOrNull { !it.distributionUrl.isNullOrBlank() }
    val mapCapabilitiesUrl =
        when {
            !serviceDistributionUrlForDataset.isNullOrBlank() -> serviceDistributionUrlForDataset
            firstViewService != null -> firstViewService.distributionUrl
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

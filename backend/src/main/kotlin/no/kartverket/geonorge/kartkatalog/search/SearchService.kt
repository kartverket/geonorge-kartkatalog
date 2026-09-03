package no.kartverket.geonorge.kartkatalog.search

import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrDocument
import no.kartverket.geonorge.kartkatalog.metadata.DistributionProtocols

class SearchService(
    private val solrClient: SolrClient,
) {
    suspend fun search(request: SearchRequest): SearchResponse {
        val normalized = request.normalized()
        val query = SearchQueryBuilder.build(normalized)
        val response = solrClient.searchMetadataAll(query)

        return SearchResponse(
            numFound = response.response.numFound,
            limit = normalized.limit,
            offset = normalized.offset,
            results = response.response.docs.map { it.toSearchResultItem() },
        )
    }
}

private fun SolrDocument.toSearchResultItem(): SearchResultItem {
    val datasetServices = parseDatasetServices(datasetservice)
    val viewServices =
        datasetServices.filter {
            DistributionProtocols.isViewService(it.distributionProtocol) &&
                (it.type.equals("service", ignoreCase = true) || it.type.equals("servicelayer", ignoreCase = true))
        }
    val firstViewService =
        viewServices.firstOrNull {
            !it.getCapabilitiesUrl.isNullOrBlank()
        }
    val firstWfsService =
        datasetServices.firstOrNull {
            it.distributionProtocol.equals("OGC:WFS", ignoreCase = true)
        }

    val access = resolveAccess(dataaccess, otherconstraintsaccess, accessconstraint)

    return SearchResultItem(
        uuid = uuid,
        title = title.orEmpty(),
        abstractText = abstractText,
        type = type,
        typeTranslated = translateType(type),
        typeName = typename,
        theme = theme,
        organization = organizationgroup ?: organization,
        organizations = organizations.orEmpty(),
        organizationLogo = organizationLogoUrl,
        thumbnailUrl = thumbnailUrl?.takeUnless { it.equals("https://editor.geonorge.no/thumbnails/undefined", ignoreCase = true) },
        distributionUrl = distributionUrl,
        distributionProtocol = distributionProtocol,
        distributionName = distributionName,
        datasetServicesWithShowMapLink = viewServices.map { it.toDatasetServiceLink() },
        serviceDatasets = servicedataset.orEmpty(),
        distributions = distributions.orEmpty(),
        accessConstraint = accessconstraint,
        otherConstraintsAccess = otherconstraintsaccess,
        dataAccess = dataaccess,
        accessIsOpenData = access.isOpenData,
        accessIsRestricted = access.isRestricted,
        accessIsProtected = access.isProtected,
        serviceDistributionUrlForDataset = serviceDistributionUrlForDataset ?: firstViewService?.getCapabilitiesUrl,
        serviceUuid = serviceDistributionUuidForDataset ?: firstViewService?.uuid,
        serviceWfsDistributionUrlForDataset = firstWfsService?.getCapabilitiesUrl,
        getCapabilitiesUrl = distributionUrl,
        date = dateUpdated,
        showMapLink = canShowMap(type, distributionProtocol, distributionUrl, viewServices, serviceDistributionUrlForDataset),
        spatialScope = spatialscope?.firstOrNull(),
    )
}

private fun parseDatasetServices(raw: List<String>?): List<DatasetServiceReference> =
    raw.orEmpty().mapNotNull { value ->
        val parts = value.split("|")
        val uuid = parts.getOrNull(0)?.takeIf { it.isNotBlank() } ?: return@mapNotNull null
        DatasetServiceReference(
            uuid = uuid,
            title = parts.getOrNull(1).orEmpty(),
            type = parts.getOrNull(3),
            organization = parts.getOrNull(4),
            distributionName = parts.getOrNull(5),
            distributionProtocol = parts.getOrNull(6),
            getCapabilitiesUrl = parts.getOrNull(7),
        )
    }

private fun DatasetServiceReference.toDatasetServiceLink(): DatasetServiceLink =
    DatasetServiceLink(
        uuid = uuid,
        title = title,
        distributionProtocol = distributionProtocol,
        getCapabilitiesUrl = getCapabilitiesUrl,
    )

private fun canShowMap(
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

private data class AccessFlags(
    val isOpenData: Boolean,
    val isRestricted: Boolean,
    val isProtected: Boolean,
)

private fun resolveAccess(
    dataAccess: String?,
    otherConstraintsAccess: String?,
    accessConstraint: String?,
): AccessFlags {
    val normalized = listOfNotNull(dataAccess, otherConstraintsAccess, accessConstraint).joinToString(" ").lowercase()
    val isRestricted = containsAny(normalized, "norge digitalt", "norway digital restricted", "inspire_directive_article13_1d")
    val isProtected = !isRestricted && containsAny(normalized, "beskyttet", "inspire_directive_article13_1b")
    val isOpenData = !isRestricted && !isProtected && containsAny(normalized, "åpne data", "open data", "no restrictions", "nolimitations", "no limitations")
    return AccessFlags(
        isOpenData = isOpenData,
        isRestricted = isRestricted,
        isProtected = isProtected,
    )
}

private fun containsAny(
    value: String,
    vararg searchTerms: String,
): Boolean = searchTerms.any { term -> value.contains(term.lowercase()) }

private fun translateType(type: String?): String? =
    when (type) {
        "dataset" -> "Datasett"
        "software" -> "Applikasjon"
        "service" -> "Tjeneste"
        "servicelayer" -> "Tjenestelag"
        "series" -> "Datasettserie"
        "dimensionGroup" -> "Datapakke"
        else -> type
    }


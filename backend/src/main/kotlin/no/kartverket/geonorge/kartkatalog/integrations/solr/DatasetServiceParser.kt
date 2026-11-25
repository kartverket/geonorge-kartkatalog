package no.kartverket.geonorge.kartkatalog.integrations.solr

/**
 * Parses the services linked to a dataset in the Solr index (the `datasetservice` field).
 * Each entry is a pipe-separated string (`uuid|name|...|protocol|url|...`). The same format is also
 * used by other reference fields such as `servicedataset`, `servicelayers`, `serie` and `seriedatasets`.
 * Entries without uuid are skipped.
 */
internal fun parseDatasetServices(datasetService: List<String>?): List<RelatedServiceReference> =
    datasetService.orEmpty().mapNotNull { entry ->
        val parts = entry.split("|")
        val uuid =
            parts.getOrNull(DatasetServiceProperties.UUID.index)?.takeIf { it.isNotBlank() }
                ?: return@mapNotNull null
        RelatedServiceReference(
            uuid = uuid,
            name = parts.getOrNull(DatasetServiceProperties.NAME.index),
            organizationName = parts.getOrNull(DatasetServiceProperties.ORGANIZATION_NAME.index),
            protocol = parts.getOrNull(DatasetServiceProperties.PROTOCOL.index),
            distributionUrl = parts.getOrNull(DatasetServiceProperties.DISTRIBUTION_URL.index),
            accessIsOpendata = parts.booleanAt(DatasetServiceProperties.ACCESS_IS_OPENDATA),
            accessIsRestricted = parts.booleanAt(DatasetServiceProperties.ACCESS_IS_RESTRICTED),
        )
    }

private fun List<String>.booleanAt(property: DatasetServiceProperties): Boolean =
    getOrNull(property.index)?.lowercase()?.toBooleanStrictOrNull() ?: false

private enum class DatasetServiceProperties(
    val index: Int,
) {
    UUID(0),
    NAME(1),
    ORGANIZATION_NAME(4),
    PROTOCOL(6),
    DISTRIBUTION_URL(7),
    ACCESS_IS_OPENDATA(14),
    ACCESS_IS_RESTRICTED(15),
}

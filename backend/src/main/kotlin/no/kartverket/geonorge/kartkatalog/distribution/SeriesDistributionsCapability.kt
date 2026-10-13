package no.kartverket.geonorge.kartkatalog.distribution

import no.kartverket.geonorge.kartkatalog.metadata.models.LinkedDistribution
import no.kartverket.geonorge.kartkatalog.metadata.models.LinkedDistributions

internal fun LinkedDistributions.seriesHasDownloads(): Boolean = this.seriesMembers.any { it.isGeoNorgeDownload() }

private fun LinkedDistribution.isGeoNorgeDownload(): Boolean =
    this.distributionProtocol?.equals("GEONORGE:DOWNLOAD", ignoreCase = true) == true

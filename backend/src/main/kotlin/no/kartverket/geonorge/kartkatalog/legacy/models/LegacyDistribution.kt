package no.kartverket.geonorge.kartkatalog.legacy.models

import kotlinx.serialization.json.buildJsonObject
import no.kartverket.geonorge.kartkatalog.legacy.putText

internal data class DistributionRow(
    val protocol: String?,
    val protocolName: String?,
    val formatName: String?,
    val formatVersion: String?,
    val url: String?,
    val organization: String?,
    val unitsOfDistribution: String?,
) {
    fun toJson() =
        buildJsonObject {
            putText("ProtocolName", protocolName)
            putText("FormatName", formatName)
            putText("FormatVersion", formatVersion)
            putText("URL", url)
            putText("Protocol", protocol)
            putText("Organization", organization)
            putText("UnitsOfDistribution", unitsOfDistribution)
        }
}

internal data class DistributionDetails(
    val protocol: String?,
    val protocolName: String?,
    val url: String?,
    val unitsOfDistribution: String?,
) {
    fun toJson() =
        buildJsonObject {
            putText("Protocol", protocol)
            putText("ProtocolName", protocolName)
            putText("URL", url)
        }
}

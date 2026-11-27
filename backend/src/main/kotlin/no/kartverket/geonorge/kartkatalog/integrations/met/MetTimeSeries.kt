package no.kartverket.geonorge.kartkatalog.integrations.met

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.escapeXml
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.OnlineResource
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter

// Legacy Kartkatalog in production returns 100 members when no limit is given.
internal const val TIME_SERIES_MEMBER_LIMIT = 100

// Legacy skips the end-date filter and adds the publication date to member titles for this series, because its
// members have an indeterminate end position and share the same title.
private const val WEATHER_STATION_SERIES_UUID = "no.met:9fbe6a04-279c-46b8-a582-bb08f4b11794"

private val MEMBER_DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")

/**
 * Members of a time series ("series_time"). Time series members only exist at MET; they are neither in our
 * GeoNetwork nor in Solr's seriedatasets.
 */
fun interface TimeSeriesMemberSource {
    suspend fun getTimeSeriesMembers(seriesUuid: String): List<TimeSeriesMember>
}

/** A time series member with the MET-specific rules from legacy MetadataService.GetTimeRelatedDistributions applied. */
data class TimeSeriesMember(
    val uuid: String,
    val title: String,
    val organization: String?,
    val seriesType: String?,
    val distributionUrl: String?,
    val distributionProtocol: String?,
    val wmsUrl: String?,
    val hierarchyLevel: String,
    val record: MetadataRecord,
)

/** Same query as legacy: records whose parent is [seriesUuid] with a temporal extent within the last 120 years. */
internal fun timeSeriesMembersFilter(
    seriesUuid: String,
    today: LocalDate,
): String {
    val endFilter =
        if (seriesUuid == WEATHER_STATION_SERIES_UUID) {
            ""
        } else {
            "<ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>apiso:TempExtent_end</ogc:PropertyName>" +
                "<ogc:Literal>$today</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo>"
        }
    return "<ogc:And>" +
        """<ogc:PropertyIsLike escapeChar="\" singleChar="_" wildCard="%">""" +
        "<ogc:PropertyName>apiso:ParentIdentifier</ogc:PropertyName>" +
        "<ogc:Literal>${seriesUuid.escapeXml()}</ogc:Literal></ogc:PropertyIsLike>" +
        "<ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>apiso:TempExtent_begin</ogc:PropertyName>" +
        "<ogc:Literal>${today.minusYears(120)}</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo>" +
        endFilter +
        "</ogc:And>"
}

internal fun MetadataRecord.toTimeSeriesMember(seriesUuid: String): TimeSeriesMember {
    val transferOption = distributionInfo?.transferOptions?.firstOrNull()
    val wmsResource =
        distributionInfo
            ?.formats
            .orEmpty()
            .flatMap { it.onlineResources }
            .lastOrNull { it.protocol == "OGC:WMS" }
    val memberTitle =
        if (seriesUuid == WEATHER_STATION_SERIES_UUID) {
            listOfNotNull(title, publicationDateTime()?.format(MEMBER_DATE_FORMAT)).joinToString(" ")
        } else {
            title
        }
    return TimeSeriesMember(
        uuid = uuid,
        title = memberTitle,
        organization = contacts.firstOrNull { it.role == "owner" }?.organization,
        seriesType = hierarchyLevelName,
        distributionUrl = transferOption?.let { memberUrl(it) },
        distributionProtocol = transferOption?.protocol,
        wmsUrl = wmsResource?.url,
        hierarchyLevel = hierarchyLevel,
        record = this,
    )
}

// Legacy appends ".html" to every ".nc" URL to link to the OPeNDAP form. We only do it for OPeNDAP, because a
// direct download URL (THREDDS fileServer) would break.
private fun memberUrl(resource: OnlineResource): String? {
    val url = resource.url.takeIf { it.isNotEmpty() } ?: return null
    return if (resource.protocol == "OPENDAP:OPENDAP" && url.endsWith(".nc")) "$url.html" else url
}

private fun MetadataRecord.publicationDateTime(): LocalDateTime? {
    val date = dates.firstOrNull { it.type == "publication" }?.date ?: return null
    return runCatching { OffsetDateTime.parse(date).toLocalDateTime() }
        .recoverCatching { LocalDateTime.parse(date) }
        .recoverCatching { LocalDate.parse(date).atStartOfDay() }
        .getOrNull()
}

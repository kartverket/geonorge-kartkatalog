package no.kartverket.geonorge.kartkatalog.integrations.geonetwork

import io.ktor.client.HttpClient
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import java.time.LocalDate

// Same timeout as legacy GeoNorgeAPI (HttpWebRequest.Timeout = 60000).
private const val MET_REQUEST_TIMEOUT_MILLIS = 60_000L

// Legacy Kartkatalog in production returns 100 members when no limit is given.
private const val TIME_SERIES_MEMBER_LIMIT = 100

// Legacy skips the end-date filter for this series because its members have an indeterminate end position.
const val MET_WEATHER_STATION_SERIES_UUID = "no.met:9fbe6a04-279c-46b8-a582-bb08f4b11794"

/** Members of a time series ("series_time"), which are not indexed in Solr's seriedatasets. */
fun interface TimeSeriesMemberSource {
    suspend fun getTimeSeriesMembers(seriesUuid: String): List<MetadataRecord>
}

/**
 * Client for the Norwegian Meteorological Institute's CSW (pycsw). Uses the same URL as legacy: GeoNorgeAPI
 * appends "srv/nor/csw" to the configured endpoint, so "https://data.csw.met.no/?" becomes
 * "https://data.csw.met.no/?srv/nor/csw", which pycsw ignores. pycsw rejects "csw:IsoRecord", so the
 * ISO 19139 namespace is requested instead, as legacy does for met.no.
 */
class MetClient private constructor(
    private val csw: CswRecordClient,
    private val today: () -> LocalDate,
) : MetadataRecordSource by csw,
    TimeSeriesMemberSource {
    constructor(httpClient: HttpClient, metUrl: String, today: () -> LocalDate = LocalDate::now) : this(
        CswRecordClient(
            httpClient = httpClient,
            cswUrl = "${metUrl}srv/nor/csw",
            outputSchema = ISO_19139_OUTPUT_SCHEMA,
            upstreamName = "met_csw",
            requestTimeoutMillis = MET_REQUEST_TIMEOUT_MILLIS,
        ),
        today,
    )

    /**
     * Same query as legacy MetadataService.GetTimeRelatedDistributions: records whose parent is [seriesUuid] with a
     * temporal extent within the last 120 years, newest first.
     */
    override suspend fun getTimeSeriesMembers(seriesUuid: String): List<MetadataRecord> {
        val dateTo = today()
        val dateFrom = dateTo.minusYears(120)
        val endFilter =
            if (seriesUuid == MET_WEATHER_STATION_SERIES_UUID) {
                ""
            } else {
                "<ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>apiso:TempExtent_end</ogc:PropertyName>" +
                    "<ogc:Literal>$dateTo</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo>"
            }
        val filter =
            "<ogc:And>" +
                """<ogc:PropertyIsLike escapeChar="\" singleChar="_" wildCard="%">""" +
                "<ogc:PropertyName>apiso:ParentIdentifier</ogc:PropertyName>" +
                "<ogc:Literal>${seriesUuid.escapeXml()}</ogc:Literal></ogc:PropertyIsLike>" +
                "<ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>apiso:TempExtent_begin</ogc:PropertyName>" +
                "<ogc:Literal>$dateFrom</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo>" +
                endFilter +
                "</ogc:And>"
        return csw.getRecords(
            filterXml = filter,
            startPosition = 1,
            maxRecords = TIME_SERIES_MEMBER_LIMIT,
            sortByDateDescending = true,
        )
    }
}

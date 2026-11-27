package no.kartverket.geonorge.kartkatalog.integrations.met

import io.ktor.client.HttpClient
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.CswRecordClient
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.ISO_19139_OUTPUT_SCHEMA
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.MetadataRecordSource
import java.time.LocalDate

// Legacy GeoNorgeAPI waits 60 s.
private const val MET_REQUEST_TIMEOUT_MILLIS = 20_000L

private const val MET_UUID_PREFIX = "no.met:"

/** Records at MET have identifiers with this prefix; all other identifiers exist in our GeoNetwork or not at all. */
fun isMetIdentifier(uuid: String): Boolean = uuid.startsWith(MET_UUID_PREFIX)

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

    override suspend fun getTimeSeriesMembers(seriesUuid: String): List<TimeSeriesMember> =
        csw
            .getRecords(
                filterXml = timeSeriesMembersFilter(seriesUuid, today()),
                startPosition = 1,
                maxRecords = TIME_SERIES_MEMBER_LIMIT,
                sortByDateDescending = true,
            ).map { it.toTimeSeriesMember(seriesUuid) }
}

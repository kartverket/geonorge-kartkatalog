package no.kartverket.geonorge.kartkatalog.integrations.geonetwork

import io.ktor.client.HttpClient

// Same timeout as legacy GeoNorgeAPI (HttpWebRequest.Timeout = 60000).
private const val MET_REQUEST_TIMEOUT_MILLIS = 60_000L

/**
 * Client for the Norwegian Meteorological Institute's CSW (pycsw). Uses the same URL as legacy: GeoNorgeAPI
 * appends "srv/nor/csw" to the configured endpoint, so "https://data.csw.met.no/?" becomes
 * "https://data.csw.met.no/?srv/nor/csw", which pycsw ignores. pycsw rejects "csw:IsoRecord", so the
 * ISO 19139 namespace is requested instead, as legacy does for met.no.
 */
class MetClient(
    httpClient: HttpClient,
    metUrl: String,
) : MetadataRecordSource by CswRecordClient(
        httpClient = httpClient,
        cswUrl = "${metUrl}srv/nor/csw",
        outputSchema = ISO_19139_OUTPUT_SCHEMA,
        upstreamName = "met_csw",
        requestTimeoutMillis = MET_REQUEST_TIMEOUT_MILLIS,
    )

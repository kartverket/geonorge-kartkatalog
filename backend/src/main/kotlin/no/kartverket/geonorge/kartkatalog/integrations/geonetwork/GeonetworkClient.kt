package no.kartverket.geonorge.kartkatalog.integrations.geonetwork

import io.ktor.client.HttpClient

/** Client for Geonorge's own GeoNetwork CSW endpoint. */
class GeonetworkClient(
    httpClient: HttpClient,
    baseUrl: String,
) : MetadataRecordSource by CswRecordClient(
        httpClient = httpClient,
        cswUrl = "$baseUrl/srv/nor/csw",
        outputSchema = GEONETWORK_OUTPUT_SCHEMA,
        upstreamName = "geonetwork",
    )

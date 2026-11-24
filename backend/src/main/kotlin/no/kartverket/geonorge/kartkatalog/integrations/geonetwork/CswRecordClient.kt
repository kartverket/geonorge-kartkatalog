package no.kartverket.geonorge.kartkatalog.integrations.geonetwork

import io.ktor.client.HttpClient
import io.ktor.client.plugins.HttpRequestTimeoutException
import io.ktor.client.request.accept
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.metrics.observeUpstream

const val GEONETWORK_OUTPUT_SCHEMA = "csw:IsoRecord"
const val ISO_19139_OUTPUT_SCHEMA = "http://www.isotc211.org/2005/gmd"

/** Fetches ISO 19139 records with a CSW 2.0.2 GetRecordById POST from any CSW endpoint (GeoNetwork, pycsw, ...). */
class CswRecordClient(
    private val httpClient: HttpClient,
    private val cswUrl: String,
    private val outputSchema: String,
    private val upstreamName: String,
) : MetadataRecordSource {
    override suspend fun getRecordByUuid(uuid: String): MetadataRecord? =
        observeUpstream(upstreamName, "get_record_by_id") { fetchRecord(uuid) }

    private suspend fun fetchRecord(uuid: String): MetadataRecord? {
        val response =
            try {
                httpClient.post(cswUrl) {
                    accept(ContentType.Application.Xml)
                    contentType(ContentType.Application.Xml)
                    setBody(buildGetRecordByIdRequest(uuid))
                }
            } catch (e: HttpRequestTimeoutException) {
                throw GeoNetworkException("CSW request to $upstreamName timed out", e)
            }

        // CSW answers a missing record with 200 and an empty response, so a non-success status is a real failure.
        if (!response.status.isSuccess()) {
            throw GeoNetworkException("CSW request to $upstreamName failed with status ${response.status}")
        }

        val responseXml = response.bodyAsText()

        if (responseXml.contains("ExceptionReport")) {
            throw CswExceptionReportException(
                "CSW service $upstreamName returned an ExceptionReport: $responseXml",
            )
        }

        if (!responseXml.contains("<gmd:MD_Metadata") &&
            !responseXml.contains("<MD_Metadata")
        ) {
            return null
        }

        return MetadataParser.parse(responseXml.byteInputStream())
    }

    private fun buildGetRecordByIdRequest(uuid: String): String =
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <csw:GetRecordById
            xmlns:csw="http://www.opengis.net/cat/csw/2.0.2"
            xmlns:gmd="http://www.isotc211.org/2005/gmd"
            service="CSW"
            version="2.0.2"
            outputSchema="${outputSchema.escapeXml()}">
            <csw:Id>${uuid.escapeXml()}</csw:Id>
            <csw:ElementSetName>full</csw:ElementSetName>
        </csw:GetRecordById>
        """.trimIndent()
}

private fun String.escapeXml(): String =
    buildString(length) {
        for (c in this@escapeXml) {
            when (c) {
                '&' -> append("&amp;")
                '<' -> append("&lt;")
                '>' -> append("&gt;")
                '"' -> append("&quot;")
                '\'' -> append("&apos;")
                else -> append(c)
            }
        }
    }

open class GeoNetworkException(
    message: String,
    cause: Throwable? = null,
) : RuntimeException(message, cause)

class CswExceptionReportException(message: String) : GeoNetworkException(message)

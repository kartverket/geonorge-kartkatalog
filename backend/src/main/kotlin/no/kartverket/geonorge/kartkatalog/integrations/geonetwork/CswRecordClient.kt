package no.kartverket.geonorge.kartkatalog.integrations.geonetwork

import io.ktor.client.HttpClient
import io.ktor.client.plugins.HttpRequestTimeoutException
import io.ktor.client.plugins.timeout
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

/**
 * Fetches ISO 19139 records with CSW 2.0.2 GetRecordById/GetRecords POSTs from any CSW endpoint (GeoNetwork, pycsw, ...).
 * A [requestTimeoutMillis] requires the HttpTimeout plugin on [httpClient]; null keeps the client's default.
 */
class CswRecordClient(
    private val httpClient: HttpClient,
    private val cswUrl: String,
    private val outputSchema: String,
    private val upstreamName: String,
    private val requestTimeoutMillis: Long? = null,
) : MetadataRecordSource {
    override suspend fun getRecordByUuid(uuid: String): MetadataRecord? =
        observeUpstream(upstreamName, "get_record_by_id") {
            val responseXml = post(buildGetRecordByIdRequest(uuid))
            // CSW answers a missing record with 200 and an empty response.
            if (!responseXml.contains("<gmd:MD_Metadata") && !responseXml.contains("<MD_Metadata")) {
                null
            } else {
                MetadataParser.parse(responseXml.byteInputStream())
            }
        }

    /**
     * CSW 2.0.2 GetRecords with an OGC filter, as built by legacy GeoNorgeAPI's GetRecordsWithFilter.
     * [filterXml] is the content of ogc:Filter and must already be XML-escaped.
     */
    suspend fun getRecords(
        filterXml: String,
        startPosition: Int,
        maxRecords: Int,
        sortByDateDescending: Boolean = false,
    ): List<MetadataRecord> =
        observeUpstream(upstreamName, "get_records") {
            val responseXml = post(buildGetRecordsRequest(filterXml, startPosition, maxRecords, sortByDateDescending))
            MetadataParser.parseAll(responseXml.byteInputStream())
        }

    private suspend fun post(requestXml: String): String {
        val response =
            try {
                httpClient.post(cswUrl) {
                    accept(ContentType.Application.Xml)
                    contentType(ContentType.Application.Xml)
                    setBody(requestXml)
                    this@CswRecordClient.requestTimeoutMillis?.let { timeoutMillis ->
                        timeout { requestTimeoutMillis = timeoutMillis }
                    }
                }
            } catch (e: HttpRequestTimeoutException) {
                throw GeoNetworkException("CSW request to $upstreamName timed out", e)
            }

        if (!response.status.isSuccess()) {
            throw GeoNetworkException("CSW request to $upstreamName failed with status ${response.status}")
        }

        val responseXml = response.bodyAsText()
        if (responseXml.contains("ExceptionReport")) {
            throw CswExceptionReportException(
                "CSW service $upstreamName returned an ExceptionReport: $responseXml",
            )
        }
        return responseXml
    }

    private fun buildGetRecordsRequest(
        filterXml: String,
        startPosition: Int,
        maxRecords: Int,
        sortByDateDescending: Boolean,
    ): String {
        val sortBy =
            if (sortByDateDescending) {
                "<ogc:SortBy><ogc:SortProperty><ogc:PropertyName>dc:date</ogc:PropertyName>" +
                    "<ogc:SortOrder>DESC</ogc:SortOrder></ogc:SortProperty></ogc:SortBy>"
            } else {
                ""
            }
        return """
            <?xml version="1.0" encoding="UTF-8"?>
            <csw:GetRecords
                xmlns:csw="http://www.opengis.net/cat/csw/2.0.2"
                xmlns:ogc="http://www.opengis.net/ogc"
                service="CSW"
                version="2.0.2"
                resultType="results"
                startPosition="$startPosition"
                maxRecords="$maxRecords"
                outputSchema="${outputSchema.escapeXml()}">
                <csw:Query typeNames="csw:Record">
                    <csw:ElementSetName>full</csw:ElementSetName>
                    <csw:Constraint version="1.1.0">
                        <ogc:Filter>$filterXml</ogc:Filter>
                    </csw:Constraint>
                    $sortBy
                </csw:Query>
            </csw:GetRecords>
            """.trimIndent()
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

internal fun String.escapeXml(): String =
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

class CswExceptionReportException(
    message: String,
) : GeoNetworkException(message)

package no.kartverket.geonorge.kartkatalog.integrations.geonetwork

import io.ktor.client.HttpClient
import io.ktor.client.request.accept
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.contentType
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import java.util.UUID

class GeonetworkClient(
    private val httpClient: HttpClient,
) {
    private val baseUrl = "https://www.geonorge.no/geonetworktest/".trimEnd('/')
    private val cswUrl: String = "$baseUrl/srv/nor/csw"

    suspend fun getRecordByUuid(uuid: UUID): MetadataRecord? {
        val requestXml = buildGetRecordByIdRequest(uuid)

        val responseXml =
            httpClient
                .post(cswUrl) {
                    accept(ContentType.Application.Xml)
                    contentType(ContentType.Application.Xml)
                    setBody(requestXml)
                }.bodyAsText()

        if (responseXml.contains("ExceptionReport")) {
            throw GeoNetworkException("CSW service returned an ExceptionReport: $responseXml")
        }

        if (!responseXml.contains("<gmd:MD_Metadata") &&
            !responseXml.contains("<MD_Metadata")
        ) {
            return null
        }

        return MetadataParser.parse(responseXml.byteInputStream())
    }

    private fun buildGetRecordByIdRequest(uuid: UUID): String =
        """
        <?xml version="1.0" encoding="UTF-8"?>
        <csw:GetRecordById
            xmlns:csw="http://www.opengis.net/cat/csw/2.0.2"
            xmlns:gmd="http://www.isotc211.org/2005/gmd"
            service="CSW"
            version="2.0.2"
            outputSchema="csw:IsoRecord">
            <csw:Id>$uuid</csw:Id>
            <csw:ElementSetName>full</csw:ElementSetName>
        </csw:GetRecordById>
        """.trimIndent()
}

class GeoNetworkException(
    message: String,
) : RuntimeException(message)

package no.kartverket.geonorge.kartkatalog.legacy

import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrDocument
import java.net.URI

// Mirrors SearchResultItemViewModel in the legacy catalogue (api/metadata/{uuid}). A missing document gives
// an item without Uuid, as in legacy.
internal class LegacyMetadataItem(
    language: String,
    private val norgeskartUrl: String,
) {
    private val english = language == "en"

    fun build(doc: SolrDocument?): JsonObject {
        val type = doc?.type
        val protocol = doc?.distributionProtocol
        val distributionUrl = doc?.distributionUrl
        val organization = doc?.organizationgroup
        val title = doc?.title

        val serviceUrl = serviceUrl(doc)
        val downloadUrl = downloadUrl(doc)
        val downloadLink = downloadLink(protocol, type, downloadUrl)
        val showMapLink =
            protocol != null &&
                listOf("OGC:WMS", "OGC:WFS", "OGC:WCS").any { it in protocol } &&
                type in SERVICE_TYPES &&
                !downloadUrl.isNullOrBlank()
        val showServiceMapLink = !showMapLink && !serviceUrl.isNullOrBlank()
        val mapUrl =
            when {
                showMapLink -> norgeskartUrl + downloadUrl
                showServiceMapLink -> norgeskartUrl + serviceUrl
                else -> ""
            }
        val otherConstraints = doc?.otherconstraintsaccess?.lowercase()
        val restrictedService =
            doc?.serviceDistributionAccessConstraint in setOf("Beskyttet", "restricted", "norway digital restricted")
        val seoOrganization = seoFriendly(organization)

        val serviceUuid =
            when {
                type == "dataset" -> doc.serviceDistributionUuidForDataset
                type == "servicelayer" && !doc.parentidentifier.isNullOrEmpty() -> doc.parentidentifier
                else -> doc?.uuid
            }

        return buildJsonObject {
            putNullable("Uuid", doc?.uuid)
            putNullable("Title", title)
            putNullable("Abstract", doc?.abstractText)
            putNullable("Type", type)
            putNullable("Theme", doc?.theme)
            putNullable("Organization", organization)
            putNullable("OrganizationShortName", organization)
            putNullable("OrganizationLogoUrl", relativeUrl(doc?.organizationLogoUrl))
            putNullable("ThumbnailUrl", doc?.thumbnailUrl)
            putNullable("DownloadUrl", downloadUrl)
            putNullable("ServiceUrl", serviceUrl)
            putNullable("DistributionProtocol", protocol)
            put("IsOpendata", otherConstraints == "no restrictions")
            put("IsRestricted", otherConstraints == "norway digital restricted")
            put("IsOffline", doc?.accessconstraint == "restricted")
            putNullable("LegendDescriptionUrl", doc?.legendDescriptionUrl)
            putNullable("ProductSheetUrl", doc?.productSheetUrl)
            putNullable("ProductSpecificationUrl", doc?.productSpecificationUrl)
            putNullable("ServiceUuid", serviceUuid)
            putNullable("ServiceDistributionAccessConstraint", doc?.serviceDistributionAccessConstraint)
            putNullable("DistributionUrl", distributionUrl)
            putNullable("GetCapabilitiesUrl", distributionUrl)
            put("TypeCssClass", typeCssClass(type))
            putNullable("TypeTranslated", translatedType(type))
            put(
                "MetadataLinkRouteValueDictionary",
                buildJsonObject {
                    put("uuid", doc?.uuid)
                    put("organization", seoOrganization)
                    put("title", seoFriendly(title))
                },
            )
            put("OrganizationSeoName", seoOrganization)
            put("TitleSeo", seoFriendly(title))
            put(
                "MapTitleTag",
                if (restrictedService) "Tjenesten krever spesiell tilgang for å kunne vises - kontakt dataeier" else "",
            )
            put("ShowDownloadService", protocol?.contains("GEONORGE:DOWNLOAD") == true)
            put("ShowDownloadLink", downloadLink)
            // TODO: AddToCartUrl needs the download service sign-in URLs, which new has no configuration for.
            put("AddToCartUrl", "")
            put("MapUrl", mapUrl)
            put("ShowMapLink", showMapLink)
            put("ShowServiceMapLink", showServiceMapLink)
        }
    }

    private fun serviceUrl(doc: SolrDocument?): String? {
        if (doc?.type != "dataset") return null
        val protocol = doc.serviceDistributionProtocolForDataset
        if (protocol.isNullOrBlank()) return null
        val common = commonNorgeskartPart(protocol)
        val url = doc.serviceDistributionUrlForDataset
        val name = doc.serviceDistributionNameForDataset
        return when {
            "OGC:WMS" in protocol ->
                if (url.isNullOrBlank()) {
                    null
                } else {
                    common + url.removeQueryString() + addLayers(name)
                }
            "OGC:WFS" in protocol ->
                when {
                    !name.isNullOrBlank() && !url.isNullOrBlank() -> "$common${url.removeQueryString()}&addLayers=$name"
                    !doc.distributionUrl.isNullOrBlank() -> common + doc.distributionUrl.removeQueryString()
                    else -> null
                }
            else -> null
        }
    }

    private fun downloadUrl(doc: SolrDocument?): String? {
        val protocol = doc?.distributionProtocol
        val url = doc?.distributionUrl
        if (doc?.type in SERVICE_TYPES) {
            if (protocol.isNullOrBlank() || url.isNullOrBlank()) return null
            if ("OGC:WMS" !in protocol && "OGC:WFS" !in protocol) return null
            return commonNorgeskartPart(protocol) + url.removeQueryString() + addLayers(doc.distributionName)
        }
        return if (downloadLink(protocol, doc?.type, url)) url else relativeUrl(url)
    }

    private fun downloadLink(
        protocol: String?,
        type: String?,
        url: String?,
    ): Boolean =
        protocol != null &&
            ("WWW:DOWNLOAD" in protocol || "GEONORGE:FILEDOWNLOAD" in protocol) &&
            (type == "dataset" || type == "series") &&
            !url.isNullOrBlank()

    private fun addLayers(name: String?): String = if (name.isNullOrBlank()) "" else "&addLayers=$name"

    private fun commonNorgeskartPart(protocol: String): String {
        val name =
            when {
                "OGC:WMS" in protocol -> "wms"
                "OGC:WFS" in protocol -> "wfs"
                "OGC:WCS" in protocol -> "wcs"
                else -> return ""
            }
        return "#!?zoom=$ZOOM&lon=$LONGITUDE&lat=$LATITUDE&$name="
    }

    // Mirrors "//" + Uri.Host + Uri.PathAndQuery (the port is dropped, as in legacy).
    private fun relativeUrl(url: String?): String? {
        if (url.isNullOrBlank()) return null
        val uri = runCatching { URI(url) }.getOrNull() ?: return null
        val host = uri.host
        if (!uri.isAbsolute || host == null) return null
        val path = uri.rawPath?.ifEmpty { "/" } ?: "/"
        return "//$host$path" + (uri.rawQuery?.let { "?$it" } ?: "")
    }

    private fun typeCssClass(type: String?): String =
        when (type) {
            "dataset", "dimensionGroup" -> "label-datasett"
            "software" -> "label-applikasjon"
            "service" -> "label-tjeneste"
            "servicelayer" -> "label-tjenestelag"
            "series" -> "label-datasettserie"
            else -> "label-default"
        }

    private fun translatedType(type: String?): String? =
        when (type) {
            "dataset" -> if (english) "Dataset" else "Datasett"
            "software" -> if (english) "Application" else "Applikasjon"
            "service" -> if (english) "Service" else "Tjeneste"
            "servicelayer" -> if (english) "Service layer" else "Tjenestelag"
            "series" -> if (english) "Dataset series" else "Datasettserie"
            "dimensionGroup" -> if (english) "Data package" else "Datapakke"
            else -> type
        }

    private fun seoFriendly(input: String?): String =
        (input ?: "")
            .lowercase()
            .replace(Regex("&+"), "and")
            .replace("'", "")
            .replace("å", "a")
            .replace("æ", "ae")
            .replace("ø", "o")
            .replace(Regex("[^a-z0-9]"), "-")
            .replace(Regex("-+"), "-")
            .trim('-')

    private fun String?.removeQueryString(): String = this?.substringBefore('?').orEmpty()

    private companion object {
        val SERVICE_TYPES = setOf("service", "servicelayer")
        const val ZOOM = "3"
        const val LONGITUDE = "306722"
        const val LATITUDE = "7197864"
    }
}

package no.kartverket.geonorge.kartkatalog.search

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonObjectBuilder
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

internal class LegacySearchResponse(
    language: String,
    private val siteUrl: String,
    private val areas: Map<String, String>,
) {
    private val english = language == "en"

    fun build(
        request: LegacySearchRequest,
        hits: SearchHits,
    ): JsonObject {
        val rows = hits.documents.map(::metadata)
        return buildJsonObject {
            put("NumFound", hits.numFound)
            put("Limit", request.limit)
            put("Offset", request.offset)
            put("Results", JsonArray(rows))
            put("Facets", JsonArray(hits.facets.map { (field, counts) -> facet(field, counts) }))
            if (rows.isNotEmpty()) put("Type", "search")
        }
    }

    private fun metadata(doc: SearchHit): JsonObject {
        val type = doc.type
        val serviceParts = doc.datasetservice.orEmpty().map { it.split('|') }
        val wmsServices =
            serviceParts.filter {
                it.getOrNull(6) == "OGC:WMS" &&
                    it.getOrNull(3) in listOf("service", "servicelayer") &&
                    it.getOrNull(5) != null
            }
        val wfsUrl =
            serviceParts
                .filter { it.getOrNull(6) == "OGC:WFS" && it.size > 7 }
                .lastOrNull()
                ?.get(7)
                .orEmpty()
        val wmsServiceUrl = doc.serviceDistributionUrlForDataset
        val access = doc.dataaccess
        val openText = if (english) "Open data" else "Åpne data"
        val translatedAccess = if (access == "Åpne data" && english) "Open data" else access
        val isOpen =
            doc.nationalinitiative.orEmpty().contains(openText) ||
                (
                    translatedAccess != null &&
                        (
                            translatedAccess == openText ||
                                translatedAccess.contains("ingen begrensninger") ||
                                translatedAccess.contains("no limitations")
                        )
                )
        val isRestricted =
            doc.otherconstraintsaccess?.let {
                it.lowercase() in setOf("norway digital restricted", "restricted") ||
                    it.contains("INSPIRE_Directive_Article13_1d")
            } ?: false
        val isProtected =
            doc.accessconstraint in setOf("Beskyttet", "restricted", "Personvern begrenset", "Privacy restricted")
        val serviceUrl =
            if (type in listOf("dataset", "series")) {
                val protocol = doc.serviceDistributionProtocolForDataset.orEmpty()
                val source = doc.serviceDistributionUrlForDataset
                when {
                    "OGC:WMS" in protocol && !source.isNullOrBlank() -> source
                    "OGC:WFS" in protocol &&
                        !source.isNullOrBlank() &&
                        !doc.serviceDistributionNameForDataset.isNullOrBlank() ->
                        source
                    "OGC:WFS" in protocol && !doc.distributionUrl.isNullOrBlank() -> doc.distributionUrl
                    else -> null
                }
            } else {
                null
            }
        val showMapLink =
            (
                type in listOf("service", "servicelayer") &&
                    doc.distributionProtocol?.contains("OGC:WMS") == true &&
                    !doc.distributionUrl.isNullOrBlank()
            ) ||
                wmsServices.isNotEmpty() ||
                wmsServiceUrl?.lowercase()?.endsWith("service=wms") == true ||
                !serviceUrl.isNullOrBlank()

        return buildJsonObject {
            put("Uuid", doc.uuid)
            putNullable("Title", doc.title)
            putNullable("Abstract", doc.abstractText)
            putNullable("Type", type)
            putNullable("TypeName", doc.typename)
            putNullable("TypeTranslated", translatedType(type))
            putNullable("Theme", doc.theme)
            putNullable("Organization", doc.organizationgroup)
            putStrings("Organizations", doc.organizations)
            putNullable("OrganizationLogo", doc.organizationLogoUrl)
            putNullable("ThumbnailUrl", doc.thumbnailUrl)
            putNullable("DistributionUrl", doc.distributionUrl)
            putNullable("DistributionProtocol", doc.distributionProtocol)
            putNullable("DistributionName", doc.distributionName)
            put("ShowDetailsUrl", "${siteUrl.trimEnd('/')}/metadata/uuid/${doc.uuid}")
            put("OrganizationUrl", "${siteUrl.trimEnd('/')}/?organizations=${doc.organizationgroup.orEmpty()}")
            put("IsOpenData", isOpen)
            put("AccessIsOpendata", isOpen)
            put("AccessIsRestricted", isRestricted)
            put("AccessIsProtected", isProtected)
            put("IsDokData", doc.nationalinitiative.orEmpty().contains("Det offentlige kartgrunnlaget"))
            putNullable("LegendDescriptionUrl", doc.legendDescriptionUrl)
            putNullable("ProductSheetUrl", doc.productSheetUrl)
            putNullable("ProductSpecificationUrl", doc.productSpecificationUrl)
            putStrings("DatasetServices", doc.datasetservice)
            put(
                "DatasetServicesWithShowMapLink",
                JsonArray(
                    wmsServices.map { parts ->
                        buildJsonObject {
                            putNullable("Uuid", parts.getOrNull(0))
                            putNullable("DistributionProtocol", parts.getOrNull(6))
                            putNullable("GetCapabilitiesUrl", parts.getOrNull(7))
                            putNullable("Title", parts.getOrNull(1))
                        }
                    },
                ),
            )
            putStrings("ServiceDatasets", doc.servicedataset)
            putStrings("Distributions", doc.distributions)
            putStrings("Bundles", doc.bundle)
            putStrings("ServiceLayers", doc.servicelayers)
            putNullable("AccessConstraint", doc.accessconstraint)
            putNullable("OtherConstraintsAccess", doc.otherconstraintsaccess)
            putNullable("DataAccess", translatedAccess)
            putNullable("ServiceDistributionUrlForDataset", doc.serviceDistributionUrlForDataset)
            putNullable(
                "ServiceUuid",
                doc.serviceDistributionUuidForDataset
                    ?: if (type in listOf("service", "servicelayer") &&
                        doc.distributionName.isNullOrBlank()
                    ) {
                        doc.uuid
                    } else {
                        null
                    },
            )
            put("ServiceWfsDistributionUrlForDataset", wfsUrl)
            putNullable("DistributionType", null)
            putNullable("GetCapabilitiesUrl", doc.distributionUrl)
            putNullable("Date", doc.dateUpdated)
            put("ShowMapLink", showMapLink)
            putNullable("SpatialScope", doc.spatialscope?.firstOrNull())
            if (type in listOf("dataset", "series") && doc.serie != null) put("Serie", linked(doc.serie, false))
            if (type == "series" && !doc.seriedatasets.isNullOrEmpty()) {
                put(
                    "SerieDatasets",
                    JsonArray(doc.seriedatasets.filter { it.split('|').size > 15 }.map { linked(it, true) }),
                )
            }
        }
    }

    private fun linked(
        value: String,
        dataset: Boolean,
    ): JsonObject {
        val parts = value.split('|')
        return buildJsonObject {
            putNullable("Uuid", parts.getOrNull(0))
            putNullable("Title", parts.getOrNull(1))
            if (dataset) put("Type", "dataset") else putNullable("TypeName", parts.getOrNull(11))
            putNullable("Theme", parts.getOrNull(8))
            putNullable("Organization", parts.getOrNull(4))
            putNullable("DistributionProtocol", parts.getOrNull(6))
            putNullable("DistributionUrl", parts.getOrNull(7))
            putNullable("GetCapabilitiesUrl", parts.getOrNull(7))
            val open = parts.getOrNull(if (dataset) 14 else 12)?.toBooleanStrictOrNull()
            val restricted = parts.getOrNull(if (dataset) 15 else 13)?.toBooleanStrictOrNull()
            if (open != null) put("AccessIsOpendata", open)
            if (restricted != null) put("AccessIsRestricted", restricted)
        }
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

    private fun facet(
        field: String,
        counts: List<SearchFacetCount>,
    ): JsonObject {
        val pairs = counts.map { it.name to it.count }
        val values =
            when (field) {
                "area" -> areaValues(pairs)
                "nationalinitiative" -> nationalInitiativeValues(pairs)
                else -> pairs.map { (name, count) -> facetValue(name, count) }
            }
        return buildJsonObject {
            put("FacetField", field)
            put("Name", field)
            put("FacetResults", JsonArray(values))
            putNullable("NameTranslated", facetLabel(field))
        }
    }

    private fun areaValues(pairs: List<Pair<String, Int>>): List<JsonObject> {
        val places = pairs.filter { '/' !in it.first }.distinctBy { it.first }.sortedBy { it.first }
        val counties =
            pairs
                .filter {
                    it.first.length == 4 && it.first !in setOf("0/21", "0/22")
                }.distinctBy { it.first }
                .sortedBy { it.first }
        return places.map { facetValue(it.first, it.second) } +
            counties.map { (name, count) ->
                val municipalities =
                    pairs
                        .filter {
                            it.first.length > 4 &&
                                it.first.startsWith(
                                    name,
                                )
                        }.sortedBy { it.first }
                facetValue(
                    name,
                    count,
                    municipalities.map { (child, n) ->
                        facetValue(child, n, area = true)
                    },
                    area = true,
                )
            }
    }

    private fun nationalInitiativeValues(pairs: List<Pair<String, Int>>): List<JsonObject> {
        val categories =
            listOf(
                "Geodata",
                "Jordobservasjon og miljø",
                "Meteorologi",
                "Mobilitet",
                "Selskaps- og eierskapsdata",
                "Statistikk",
                "Geospatial",
                "Earth observation and environment",
                "Meteorological",
                "Mobility",
                "Companies and company ownership",
                "Statistics",
            )
        // Legacy iterates every category for every value, so a categorized value is also
        // included in the general list when another category does not match it.
        val general = pairs.filter { (name, _) -> name != "High value dataset" }
        val grouped =
            categories.mapNotNull { category ->
                val count = pairs.filter { category in it.first }.distinctBy { it.first }.sumOf { it.second }
                if (count > 0) facetValue(category, count, area = true) else null
            }
        val hvd = pairs.find { it.first == "High value dataset" }
        return general.map { (name, count) -> facetValue(name, count) } +
            if (grouped.isNotEmpty() && hvd != null) listOf(facetValue(hvd.first, hvd.second, grouped)) else emptyList()
    }

    private fun facetValue(
        name: String,
        count: Int,
        children: List<JsonObject>? = null,
        area: Boolean = false,
    ): JsonObject =
        buildJsonObject {
            put("Name", name)
            put("Count", count)
            val translated = if (area) areas[name] ?: name else facetValueLabel(name)
            put("NameTranslated", translated)
            if (children != null) put("FacetResults", JsonArray(children))
        }

    private fun facetValueLabel(name: String): String {
        val translated =
            if (name == "GEONORGE:OFFLINE") {
                if (english) "No online access" else "Ingen online tilgang"
            } else {
                when (name) {
                    "servicelayer" -> if (english) "Servicelayer" else "Tjenestelag"
                    "datasetserie" ->
                        if (english) {
                            "The dataset is included in the dataset series"
                        } else {
                            "Datasettet inngår i datasettserien"
                        }
                    "seriedatasets" ->
                        if (english) {
                            "Datasets included in the dataset series"
                        } else {
                            "Datasett som inngår i datasettserien"
                        }
                    else -> translatedType(name) ?: name
                }
            }
        return if (name != "GEONORGE:OFFLINE" && translated.length > 50) translated.take(50) + "..." else translated
    }

    private fun facetLabel(field: String): String? =
        when (field) {
            "type" -> "Type"
            "theme" -> if (english) "Topic" else "Tema"
            "organizations" -> if (english) "Organizations" else "Organisasjon"
            "organization" -> if (english) "Organization" else "Organisasjon"
            "nationalinitiative" -> if (english) "Cooperation and laws" else "Samarbeid og lover"
            "DistributionProtocols" -> if (english) "Distribution form" else "Distribusjonsform"
            "area" -> if (english) "Area" else "Geografisk område"
            "dataaccess" -> if (english) "Access to data" else "Tilgang til data"
            "spatialscope" -> if (english) "Spatial scope" else "Dekningsområde"
            else -> null
        }
}

private fun JsonObjectBuilder.putNullable(
    key: String,
    value: String?,
) {
    if (value != null) put(key, value)
}

private fun JsonObjectBuilder.putStrings(
    key: String,
    value: List<String>?,
) {
    if (value != null) put(key, buildJsonArray { value.forEach { add(JsonPrimitive(it)) } })
}

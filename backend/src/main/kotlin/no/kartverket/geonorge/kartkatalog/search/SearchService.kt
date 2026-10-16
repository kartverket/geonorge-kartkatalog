package no.kartverket.geonorge.kartkatalog.search

import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import no.kartverket.geonorge.kartkatalog.distribution.resolveMapCapability
import no.kartverket.geonorge.kartkatalog.integrations.solr.RelatedServiceReference
import no.kartverket.geonorge.kartkatalog.metadata.AreaResolver
import no.kartverket.geonorge.kartkatalog.metadata.HvdResolver
import java.text.Collator
import java.util.Locale

class SearchService(
    private val engine: SearchEngine,
    private val areaResolver: AreaResolver,
    private val hvdResolver: HvdResolver,
) {
    internal suspend fun searchHits(
        request: SearchRequest,
        english: Boolean = false,
    ): SearchHits = engine.search(SearchQueryBuilder.build(request), english)

    suspend fun search(request: SearchRequest): SearchResponse =
        coroutineScope {
            val normalized = request.normalized()
            val hits = searchHits(normalized)
            val fylkeNamesDeferred = async { areaResolver.getFylkeNames().orEmpty() }
            val hvdCategoriesDeferred = async { hvdResolver.getCategories().orEmpty() }
            val fylkeNames = fylkeNamesDeferred.await()
            val hvdCategories = hvdCategoriesDeferred.await()

            SearchResponse(
                numFound = hits.numFound,
                limit = normalized.limit,
                offset = normalized.offset,
                results =
                    hits.documents.map { doc ->
                        doc.toSearchResultItem()
                    },
                facets = hits.facets.toSearchFacets(fylkeNames, hvdCategories),
            )
        }

    private fun getSeriesMemberDetails(doc: SearchHit): List<RelatedServiceReference> {
        val seriesMemberRefs =
            engine.parseDatasetServices(doc.seriedatasets)
        return seriesMemberRefs.filter { it.protocol == "GEONORGE:DOWNLOAD" }
    }

    private fun Map<String, List<SearchFacetCount>>.toSearchFacets(
        fylkeNames: Map<String, String>,
        hvdCategories: Set<String>,
    ): List<SearchFacet> =
        this
            .map { (facetField, values) ->
                SearchFacet(
                    facetField = facetField,
                    label = FACET_LABELS[facetField],
                    values = values.toFacetValues(facetField, fylkeNames, hvdCategories),
                )
            }.sortedWith(compareBy(nullsLast()) { FACET_ORDER[it.facetField] })

    private fun List<SearchFacetCount>.toFacetValues(
        facetField: String,
        fylkeNames: Map<String, String>,
        hvdCategories: Set<String>,
    ): List<SearchFacetValue> {
        val values =
            mapNotNull { (facetName, facetCount) ->
                if (isJunkFacetValue(facetField, facetName)) return@mapNotNull null
                SearchFacetValue(
                    name = facetName,
                    label =
                        when (facetField) {
                            "type" -> translateType(facetName)
                            "area" -> fylkeNames[facetName]
                            "nationalinitiative" -> nationalInitiativeLabels[facetName]
                            else -> null
                        },
                    category =
                        if (facetField == "nationalinitiative" && facetName in hvdCategories) {
                            "High value dataset"
                        } else {
                            null
                        },
                    count = facetCount,
                )
            }

        return when (facetField) {
            "area" -> values.sortedWith(compareBy(norwegianCollator) { it.label ?: it.name })
            else -> {
                val order = facetValueOrder[facetField]
                if (order != null) values.sortedBy { order[it.name] ?: Int.MAX_VALUE } else values
            }
        }
    }

    private val norwegianCollator: Comparator<String> =
        Collator.getInstance(Locale.forLanguageTag("nb")).let { c -> Comparator { a, b -> c.compare(a, b) } }

    private fun orderOf(vararg codes: String): Map<String, Int> = codes.withIndex().associate { (i, code) -> code to i }

    private val nationalInitiativeLabels: Map<String, String> =
        linkedMapOf(
            "Det offentlige kartgrunnlaget" to "Det offentlige kartgrunnlaget",
            "Geodata" to "Geografiske data",
            "High value dataset" to "High value dataset",
            "Jordobservasjon og miljø" to "Jordobservasjon og miljø",
            "Norge digitalt" to "Norge digitalt",
            "Norsk klimaservicesenter" to "Norsk klimaservicesenter",
            "arealplanerPBL" to "Arealplaner underlagt PBL",
            "Nautisk informasjon" to "Nautisk informasjon",
            "MarineGrunnkart" to "Marine grunnkart",
            "arcticSDI" to "Arctic SDI",
            "beredskapsbase" to "Beredskapsbase",
            "Inspire" to "Inspire",
            "dataNorgeNo" to "Data.norge.no",
            "geodataloven" to "Geodataloven",
            "Mareano" to "Mareano",
            "modellbaserteVegprosjekter" to "Modellbaserte vegprosjekter",
            "ØkologiskGrunnkart" to "Økologisk grunnkart",
        )

    private val facetValueOrder: Map<String, Map<String, Int>> =
        mapOf(
            "type" to orderOf("dataset", "service", "series", "servicelayer", "software"),
            "theme" to
                orderOf(
                    "Basis geodata",
                    "Natur",
                    "Flyfoto",
                    "Høydedata",
                    "Eiendom",
                    "Landskap",
                    "Samferdsel",
                    "Plan",
                    "Geologi",
                    "Friluftsliv",
                    "Befolkning",
                    "Landbruk",
                    "Annen",
                    "Samfunnssikkerhet",
                    "Kyst og fiskeri",
                    "Vær og klima",
                    "Kulturminner",
                    "Energi",
                    "Forurensning",
                ),
            "dataaccess" to orderOf("Åpne data", "Norge digitalt begrenset", "Skjermede data"),
            "DistributionProtocols" to
                orderOf(
                    "WMS-tjeneste",
                    "WFS-tjeneste",
                    "Geonorge nedlastning",
                    "OGC API-Features",
                    "REST-API",
                    "Egen nedlastningsside",
                    "WMTS-tjeneste",
                    "OGC:OAPIF",
                    "Geonorge filnedlastning",
                    "WCS-tjeneste",
                    "Webside",
                    "OGC Catalogue Service for the Web",
                    "OPeNDAP",
                    "OGC API-Coverages",
                    "Webservice",
                    "Atom Feed",
                    "Ingen online tilgang",
                ),
            "nationalinitiative" to orderOf(*nationalInitiativeLabels.keys.toTypedArray()),
        )

    private fun isJunkFacetValue(
        facetField: String,
        value: String,
    ): Boolean =
        when (facetField) {
            "theme" -> value.startsWith("http")
            "area" -> value != "Norge" && value != "Havområder" && !value.matches(Regex("^0/\\d+$"))
            "DistributionProtocols" -> value !in facetValueOrder.getValue("DistributionProtocols")
            else -> false
        }

    private fun SearchHit.toSearchResultItem(): SearchResultItem {
        val access = resolveAccess(dataaccess, otherconstraintsaccess, accessconstraint)

        val mapCapability = resolveMapCapability()

        return SearchResultItem(
            uuid = uuid,
            title = title.orEmpty(),
            organization = organizationgroup ?: organization,
            typeTranslated = translateType(type),
            thumbnailUrl =
                thumbnailUrl?.takeUnless {
                    it.equals("https://editor.geonorge.no/thumbnails/undefined", ignoreCase = true)
                },
            downloadableSeriesMembers =
                getSeriesMemberDetails(
                    this,
                ).map { DownloadItem.fromRelatedServiceReference(it) },
            distributionUrl = distributionUrl,
            distributionProtocol = distributionProtocol,
            getCapabilitiesUrl = distributionUrl,
            showMapLink = mapCapability.showMapLink,
            mapCapabilitiesUrl = mapCapability.mapCapabilitiesUrl,
            accessState = access.asAccessState(),
            hierarchyLevel = type,
        )
    }

    private data class AccessFlags(
        val isOpenData: Boolean,
        val isRestricted: Boolean,
        val isProtected: Boolean,
    )

    private fun AccessFlags.asAccessState(): String? =
        when {
            isRestricted -> "restricted"
            isProtected -> "protected"
            isOpenData -> "open"
            else -> null
        }

    private fun resolveAccess(
        dataAccess: String?,
        otherConstraintsAccess: String?,
        accessConstraint: String?,
    ): AccessFlags {
        val normalized =
            listOfNotNull(dataAccess, otherConstraintsAccess, accessConstraint)
                .joinToString(" ")
                .lowercase()
        val isRestricted =
            containsAny(normalized, "norge digitalt", "norway digital restricted", "inspire_directive_article13_1d")
        val isProtected = !isRestricted && containsAny(normalized, "beskyttet", "inspire_directive_article13_1b")
        val isOpenData =
            !isRestricted &&
                !isProtected &&
                containsAny(
                    normalized,
                    "åpne data",
                    "open data",
                    "no restrictions",
                    "nolimitations",
                    "no limitations",
                )
        return AccessFlags(
            isOpenData = isOpenData,
            isRestricted = isRestricted,
            isProtected = isProtected,
        )
    }

    private fun containsAny(
        value: String,
        vararg searchTerms: String,
    ): Boolean = searchTerms.any { term -> value.contains(term.lowercase()) }

    private fun translateType(type: String?): String? =
        when (type) {
            "dataset" -> "Datasett"
            "software" -> "Applikasjon"
            "service" -> "Tjeneste"
            "servicelayer" -> "Tjenestelag"
            "series" -> "Datasettserie"
            "dimensionGroup" -> "Datapakke"
            else -> type
        }
}

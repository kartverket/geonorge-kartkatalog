package no.kartverket.geonorge.kartkatalog.legacy

import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.MetadataRecordSource
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.Contact
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.DistributionFormat
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.KeywordGroup
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.OnlineResource
import no.kartverket.geonorge.kartkatalog.integrations.register.CodeList
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterException
import no.kartverket.geonorge.kartkatalog.integrations.solr.MetadataSolrQuery
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrDocument
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrException
import no.kartverket.geonorge.kartkatalog.integrations.solr.escapeSolrSpecialChars
import no.kartverket.geonorge.kartkatalog.integrations.solr.parseDatasetServices
import no.kartverket.geonorge.kartkatalog.legacy.models.DistributionDetails
import no.kartverket.geonorge.kartkatalog.legacy.models.DistributionRow
import no.kartverket.geonorge.kartkatalog.legacy.models.SearchOutcome
import no.kartverket.geonorge.kartkatalog.metadata.CodeListTranslator
import no.kartverket.geonorge.kartkatalog.metadata.DistributionProtocols
import no.kartverket.geonorge.kartkatalog.metadata.TimedCache
import no.kartverket.geonorge.kartkatalog.metadata.findExtensionUrl
import no.kartverket.geonorge.kartkatalog.metadata.getCoverageLink
import no.kartverket.geonorge.kartkatalog.search.SearchEngine
import no.kartverket.geonorge.kartkatalog.search.SearchHits
import org.slf4j.LoggerFactory

private const val NATIONAL_THEME_THESAURUS = "Nasjonal tematisk inndeling (DOK-kategori)"
private const val NATIONAL_INITIATIVE_THESAURUS = "Nasjonal inndeling i geografiske initiativ og SDI-er"
private val DOWNLOAD_PROTOCOLS =
    listOf("GEONORGE:DOWNLOAD", "WWW:DOWNLOAD-1.0-http--download", "GEONORGE:FILEDOWNLOAD")
private const val NIVA = "Norsk institutt for vannforskning"
private const val FALLBACK_FORMAT_NAME = "Nedlasting"
internal const val DEFAULT_NAMESPACE_LIMIT = 10

/**
 * Legacy-compatible `api/getdata/{uuid}`. Builds the subset of the legacy MetadataViewModel that the
 * legacy consumers (Register, ApiServices, Produktark, Rapportgenerator, Kartografi, MetadataEditor and
 * the download client) read. Null values are omitted and property names are PascalCase, like the legacy JSON.
 */
class LegacyService(
    private val engine: SearchEngine,
    private val registerClient: RegisterClient,
    private val recordSource: MetadataRecordSource,
    private val solrClient: SolrClient,
    private val codeListTranslator: CodeListTranslator,
    private val kartkatalogUrl: String,
    private val norgeskartUrl: String = "",
) {
    private val log = LoggerFactory.getLogger(LegacyService::class.java)

    private val accessConstraintsTranslator = LegacyAccessConstraintsTranslator(registerClient)
    private val areasCache =
        TimedCache<String, Map<String, String>>(
            "legacy_areas",
            12 * 60 * 60 * 1000L,
        )

    internal suspend fun validDatasetName(
        datasetName: String?,
        uuid: String?,
    ): JsonObject {
        if (uuid.isNullOrBlank()) return validationResult(false)
        if (datasetName.isNullOrBlank()) return validationResult(true)
        return try {
            val otherUuid = engine.findUuidByDatasetName(datasetName, uuid)
            validationResult(otherUuid == null, otherUuid)
        } catch (e: CancellationException) {
            throw e
        } catch (e: SolrException) {
            // Legacy returns 200 with IsValid=false and the exception message; the message is not exposed here.
            log.warn("Legacy-compatible dataset name validation failed", e)
            validationResult(false, "Validation failed")
        }
    }

    private fun validationResult(
        isValid: Boolean,
        result: String? = null,
    ): JsonObject =
        buildJsonObject {
            put("IsValid", isValid)
            result?.let { put("Result", it) }
        }

    internal suspend fun searchHits(
        request: LegacySearchRequest,
        language: String,
    ): SearchHits = searchOutcome(request, language).hits

    private suspend fun searchOutcome(
        request: LegacySearchRequest,
        language: String,
    ): SearchOutcome =
        try {
            SearchOutcome.Success(engine.search(LegacySearchQuery.build(request), request.text, language == "en"))
        } catch (e: CancellationException) {
            throw e
        } catch (e: SolrException) {
            // SearchServiceAll returns an empty result (HTTP 200) for Solr failures.
            log.warn("Legacy-compatible Solr search failed", e)
            SearchOutcome.SolrFailure
        }

    internal suspend fun search(
        request: LegacySearchRequest,
        language: String,
    ): JsonObject {
        val outcome = searchOutcome(request, language)
        if (outcome is SearchOutcome.SolrFailure) {
            return LegacySearchResponseMapper(language, kartkatalogUrl, emptyMap()).build(request, outcome.hits)
        }

        val areas = loadAreas()
        return LegacySearchResponseMapper(language, kartkatalogUrl, areas).build(request, outcome.hits)
    }

    internal suspend fun simpleSearch(
        organization: String?,
        language: String,
    ): JsonObject {
        val hits = engine.searchGivenSolrCore(SimpleMetadataQuery.build(organization), "solr/metadata_all/select")
        return LegacySearchResponseMapper(language, kartkatalogUrl, loadAreas())
            .build(SimpleMetadataQuery.LIMIT, SimpleMetadataQuery.OFFSET, hits)
    }

    internal suspend fun metadataItem(
        uuid: String,
        language: String,
    ): JsonObject {
        // Legacy swallows Solr errors, so a failure looks the same as an unknown uuid.
        val doc =
            try {
                solrClient.getMetadataByUuid(uuid)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                log.warn("Could not look up metadata $uuid in metadata_all", e)
                null
            }
        return LegacyMetadataItemMapper(language, norgeskartUrl).build(doc)
    }

    private suspend fun loadAreas(): Map<String, String> =
        try {
            areasCache
                .getOrFetch("areas") {
                    listOf("fylkesnummer", "kommunenummer")
                        .flatMap { list ->
                            registerClient
                                .getSosiCodeList(
                                    "inndelinger/inndelingsbase/$list",
                                ).containedItems
                                .mapNotNull { item ->
                                    val code =
                                        item.codeValue?.takeIf { it.isNotBlank() && item.status == "Gyldig" }
                                            ?: return@mapNotNull null
                                    val key = if (list == "fylkesnummer") "0/$code" else "0/${code.take(2)}/$code"
                                    key to (item.description ?: item.label).substringBefore(" – ").trim()
                                }
                        }.toMap()
                }.orEmpty()
        } catch (e: RegisterException) {
            val cause = e.cause
            if (cause is CancellationException) throw cause
            // Keep Solr results and retry Register next time rather than caching the fallback.
            log.warn("Failed to fetch legacy area names; using raw facet codes", e)
            emptyMap()
        }

    /** Returns null when the record does not exist. */
    suspend fun getData(
        uuid: String,
        language: String,
    ): JsonObject? {
        val record = recordSource.getRecordByUuid(uuid) ?: return null
        val english = language == "en"
        val isService = record.hierarchyLevel == "service"
        val isDatasetLike = record.hierarchyLevel == "dataset" || record.hierarchyLevel == "series"
        val solrDoc = if (isDatasetLike) fetchSolrDoc(uuid) else null

        val formats = record.distributionInfo?.formats.orEmpty()
        val realFormats = formats.filterNot(::isFallbackFormat)
        val distributionRows = distributionRows(record, formats)
        val details = distributionDetails(record, distributionRows)
        val distributionUrl = distributionUrl(record, details, distributionRows)
        val owner = record.contacts.firstOrNull { it.role == "owner" }

        return buildJsonObject {
            put("Uuid", JsonPrimitive(record.uuid))
            put("Title", JsonPrimitive(translated(record.title, record.englishTitle, english)))
            putText("EnglishTitle", record.englishTitle)
            putText("Abstract", translated(record.abstract, record.englishAbstract, english)?.let(::fixMarkDown))
            putText("EnglishAbstract", record.englishAbstract)
            putText("SpecificUsage", translated(record.specificUsage, record.englishSpecificUsage, english))
            putText("LegendDescriptionUrl", extensionUrl(record, "tegnforklaring"))
            putText("ProductSheetUrl", extensionUrl(record, "produktark"))
            putText("ProductSpecificationUrl", extensionUrl(record, "produktspesifikasjon"))
            putArray("Thumbnails", thumbnails(record))
            putText("ServiceDistributionUrlForDataset", solrDoc?.serviceDistributionUrlForDataset)
            putText("DistributionUrl", distributionUrl)
            putText(
                "CoverageUrl",
                getCoverageLink(record.extensionResources, staticNorgeskartUrl = norgeskartUrl),
            )
            owner?.let { put("ContactOwner", contact(it)) }
            put("ContactMetadata", contact(record.metadataContact))
            putArray("KeywordsNationalTheme", keywords(record) { it.thesaurus == NATIONAL_THEME_THESAURUS })
            putArray("KeywordsInspire", inspireKeywords(record))
            putArray("KeywordsNationalInitiative", keywords(record) { it.thesaurus == NATIONAL_INITIATIVE_THESAURUS })
            putArray("KeywordsTheme", keywords(record) { it.type == "theme" })
            putText("ServiceUuid", serviceUuid(record, solrDoc, isService))
            if (isService) putText("ServiceType", record.serviceType)
            relatedViewServices(solrDoc, uuid).takeIf { it.isNotEmpty() }?.let { viewServices ->
                put("Distributions", buildJsonObject { putArray("RelatedViewServices", viewServices) })
            }
            details?.let { put("DistributionDetails", it.toJson()) }
            putArray("DistributionFormats", realFormats.distinctBy { it.name to it.version }.map(::formatJson))
            putArray("DistributionsFormats", distributionRows.map { it.toJson() })
            putText("UnitsOfDistribution", details?.unitsOfDistribution)
            put("Constraints", buildJsonObject { putText("AccessConstraints", accessConstraints(record, language)) })
            putText("SpatialRepresentation", spatialRepresentation(record))
            putArray(
                "QualitySpecifications",
                record.qualitySpecifications.map { q ->
                    buildJsonObject {
                        putText("Title", q.title)
                        putText("Explanation", translated(q.explanation, q.explanationEnglish, english))
                        q.pass?.let { put("Result", JsonPrimitive(it)) }
                    }
                },
            )
        }
    }

    private suspend fun fetchSolrDoc(uuid: String): SolrDocument? =
        try {
            solrClient
                .getMetadataByUuid(uuid)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            log.warn("Solr lookup failed for {}", uuid, e)
            null
        }

    private fun isFallbackFormat(format: DistributionFormat) =
        format.name == FALLBACK_FORMAT_NAME && format.version == null

    private suspend fun distributionRows(
        record: MetadataRecord,
        formats: List<DistributionFormat>,
    ): List<DistributionRow> {
        val owner = record.contacts.firstOrNull { it.role == "owner" }?.organization
        val shared = record.distributionInfo?.transferOptions.orEmpty()

        suspend fun row(
            format: DistributionFormat?,
            resource: OnlineResource?,
            organization: String? = owner,
            units: String? = resource?.unitsOfDistribution,
        ) = DistributionRow(
            protocol = resource?.protocol,
            protocolName = protocolName(resource?.protocol),
            formatName = format?.name,
            formatVersion = format?.version,
            url = resource?.let(::fixUrl),
            organization = organization,
            unitsOfDistribution = units,
        )

        val realFormats = formats.filterNot(::isFallbackFormat)
        if (realFormats.isEmpty()) return shared.map { row(null, it) }
        // Mirrors legacy SimpleMetadata.DistributionsFormats: own link wins, else first shared link,
        // then one extra row per remaining shared link.
        return realFormats.flatMap { format ->
            val own = format.distributorFirstResource?.takeIf { !it.protocol.isNullOrEmpty() }
            val first =
                when {
                    own != null -> {
                        row(format, own, format.distributorOrganization)
                    }

                    shared.isNotEmpty() -> {
                        row(format, shared.first())
                    }

                    else -> {
                        row(
                            format,
                            null,
                            format.distributorOrganization,
                            format.distributorUnitsOfDistribution,
                        )
                    }
                }
            listOf(first) + shared.drop(1).map { row(format, it) }
        }
    }

    private fun fixUrl(resource: OnlineResource): String? =
        if (resource.protocol == "OPENDAP:OPENDAP" &&
            !resource.url.endsWith(".html")
        ) {
            "${resource.url}.html"
        } else {
            resource.url
        }

    private suspend fun distributionDetails(
        record: MetadataRecord,
        rows: List<DistributionRow>,
    ): DistributionDetails? {
        val first = record.distributionInfo?.transferOptions?.firstOrNull()
        val download = rows.firstOrNull { it.protocol in DOWNLOAD_PROTOCOLS }
        if (first == null && download == null) return null
        return if (download != null) {
            DistributionDetails(
                download.protocol,
                download.protocolName,
                download.url,
                download.unitsOfDistribution ?: first?.unitsOfDistribution,
            )
        } else {
            DistributionDetails(first?.protocol, protocolName(first?.protocol), first?.url, first?.unitsOfDistribution)
        }
    }

    private fun distributionUrl(
        record: MetadataRecord,
        details: DistributionDetails?,
        rows: List<DistributionRow>,
    ): String? {
        val url = rows.firstOrNull { it.protocol == "GEONORGE:DOWNLOAD" }?.url ?: details?.url
        if (record.contacts.firstOrNull { it.role == "owner" }?.organization == NIVA) {
            rows.firstOrNull { it.protocol == "WWW:LINK-1.0-http--link" }?.url?.let { return it }
        }
        return url
    }

    private suspend fun protocolName(protocol: String?): String? =
        protocol?.let { codeListTranslator.translate(CodeList.DISTRIBUTION_TYPES, it) }

    private fun formatJson(format: DistributionFormat) =
        buildJsonObject {
            putText("Name", format.name)
            putText("Version", format.version)
        }

    private suspend fun relatedViewServices(
        solrDoc: SolrDocument?,
        uuid: String,
    ): List<JsonObject> {
        solrDoc ?: return emptyList()
        val refs =
            parseDatasetServices(solrDoc.datasetservice)
                .filter { it.uuid != uuid && DistributionProtocols.isViewService(it.protocol) }
        return coroutineScope {
            refs
                .map { ref ->
                    async {
                        try {
                            viewService(ref.uuid)
                        } catch (e: CancellationException) {
                            throw e
                        } catch (e: Exception) {
                            log.warn("Unable to fetch related view service {}", ref.uuid, e)
                            null
                        }
                    }
                }.awaitAll()
                .filterNotNull()
        }
    }

    private suspend fun viewService(uuid: String): JsonObject? {
        val record = recordSource.getRecordByUuid(uuid) ?: return null
        val viewFormats =
            record.distributionInfo
                ?.formats
                .orEmpty()
                .filter { f -> f.onlineResources.any { DistributionProtocols.isViewService(it.protocol) } }
        val resource =
            viewFormats.flatMap { it.onlineResources }.firstOrNull { DistributionProtocols.isViewService(it.protocol) }
                ?: return null
        return buildJsonObject {
            put("Uuid", JsonPrimitive(record.uuid))
            put("Title", JsonPrimitive(record.title))
            putText("Protocol", protocolName(resource.protocol))
            putText("DistributionUrl", resource.url)
            putArray("DistributionFormats", viewFormats.distinctBy { it.name to it.version }.map(::formatJson))
        }
    }

    private fun serviceUuid(
        record: MetadataRecord,
        solrDoc: SolrDocument?,
        isService: Boolean,
    ): String? =
        if (isService) {
            record.parentIdentifier?.takeIf { it.isNotBlank() } ?: record.uuid
        } else {
            solrDoc?.serviceDistributionUuidForDataset?.takeIf { it.isNotBlank() }
        }

    private fun contact(contact: Contact) =
        buildJsonObject {
            putText("Organization", contact.organization)
            putText("OrganizationEnglish", contact.organizationEnglish)
        }

    private fun keywords(
        record: MetadataRecord,
        filter: (KeywordGroup) -> Boolean,
    ): List<JsonObject> =
        record.keywordGroups.filter(filter).flatMap { group ->
            group.keywords.map { k ->
                buildJsonObject {
                    putText("KeywordValue", k.value)
                    putText("EnglishKeyword", k.englishValue)
                }
            }
        }

    private suspend fun inspireKeywords(record: MetadataRecord): List<JsonObject> =
        record.keywordGroups
            .filter { it.thesaurus?.contains("INSPIRE themes", ignoreCase = true) == true }
            .flatMap { it.keywords }
            .map { k ->
                buildJsonObject {
                    putText("KeywordValue", codeListTranslator.translate(CodeList.INSPIRE, k.value) ?: k.value)
                    putText("EnglishKeyword", k.englishValue)
                }
            }

    private fun thumbnails(record: MetadataRecord): List<JsonObject> =
        record.thumbnails.map { t ->
            buildJsonObject {
                putText("Type", t.type)
                putText("URL", t.url)
            }
        }

    private fun extensionUrl(
        record: MetadataRecord,
        profile: String,
    ): String? =
        record.findExtensionUrl(profile)
            ?: record.takeIf { profile == "produktspesifikasjon" }?.findExtensionUrl("annen produktspesifikasjon")

    private suspend fun accessConstraints(
        record: MetadataRecord,
        language: String,
    ): String? =
        record.legalConstraints?.let { lc ->
            // Legacy GeoNorgeAPI: the INSPIRE access link is mapped to a code (FixConstraints), otherwise a
            // "no restrictions"/"norway digital restricted" string, then the anchor text, then the raw code.
            val href = lc.otherConstraintsAccess.orEmpty()
            val code = lc.otherConstraintsAccessCode
            val linkCode =
                when {
                    "noLimitations" in href -> "no restrictions"
                    "INSPIRE_Directive_Article13_1d" in href -> "norway digital restricted"
                    "INSPIRE_Directive_Article13_1b" in href -> "restricted"
                    else -> null
                }
            accessConstraintsTranslator.translate(
                linkCode ?: code ?: lc.otherConstraintsAccessText ?: lc.accessConstraints,
                code ?: lc.otherConstraintsAccess,
                language,
            )
        }

    private suspend fun spatialRepresentation(record: MetadataRecord): String? =
        codeListTranslator.translate(CodeList.SPATIAL_REPRESENTATIONS, record.spatialRepresentationTypes.firstOrNull())

    private fun translated(
        norwegian: String?,
        english: String?,
        useEnglish: Boolean,
    ): String? = if (useEnglish && !english.isNullOrBlank()) english else norwegian

    private fun fixMarkDown(text: String) = text.replace(Regex("###(?=[^#\\s])"), "### ")

    internal suspend fun namespaceDatasets(
        namespace: String,
        limit: Int,
        offset: Int,
    ): JsonObject {
        // Legacy offsets are one-based in the API; 0 is treated as 1.
        val start = (if (offset == 0) 1 else offset) - 1
        // Legacy escapes the namespace twice, which only matches tokenized fields; it is escaped once here.
        val query =
            MetadataSolrQuery(
                q = "resourceReferenceCodespace:${escapeSolrSpecialChars(namespace)}",
                fl = SimpleMetadataQuery.FIELDS,
                rows = limit,
                start = start,
            )
        val results =
            engine.searchGivenSolrCore(query, "solr/metadata/select").documents.map { doc ->
                buildJsonObject {
                    put("Uuid", doc.uuid)
                    putNullable("Title", doc.title)
                    putNullable("Organization", doc.organizationgroup ?: doc.organization)
                    putNullable("DatasetName", doc.datasetName)
                }
            }
        return buildJsonObject { put("Results", JsonArray(results)) }
    }
}

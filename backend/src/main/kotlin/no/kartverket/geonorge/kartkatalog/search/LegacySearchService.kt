package no.kartverket.geonorge.kartkatalog.search

import kotlinx.coroutines.CancellationException
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterException
import no.kartverket.geonorge.kartkatalog.integrations.solr.MetadataSolrQuery
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrException
import no.kartverket.geonorge.kartkatalog.integrations.solr.escapeSolrSpecialChars
import no.kartverket.geonorge.kartkatalog.metadata.TimedCache
import org.slf4j.LoggerFactory

internal const val DEFAULT_NAMESPACE_LIMIT = 10

class LegacySearchService(
    private val engine: SearchEngine,
    private val registerClient: RegisterClient,
    private val kartkatalogUrl: String,
    private val norgeskartUrl: String = "",
) {
    private sealed interface SearchOutcome {
        val hits: SearchHits

        data class Success(
            override val hits: SearchHits,
        ) : SearchOutcome

        data object SolrFailure : SearchOutcome {
            override val hits = SearchHits.Empty
        }
    }

    private val log = LoggerFactory.getLogger(LegacySearchService::class.java)
    private val areasCache = TimedCache<String, Map<String, String>>(12 * 60 * 60 * 1000L)

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
            return LegacySearchResponse(language, kartkatalogUrl, emptyMap()).build(request, outcome.hits)
        }

        val areas = loadAreas()
        return LegacySearchResponse(language, kartkatalogUrl, areas).build(request, outcome.hits)
    }

    internal suspend fun simpleSearch(
        organization: String?,
        language: String,
    ): JsonObject {
        val hits = engine.searchMetadataCore(SimpleMetadataQuery.build(organization))
        return LegacySearchResponse(language, kartkatalogUrl, loadAreas())
            .build(SimpleMetadataQuery.LIMIT, SimpleMetadataQuery.OFFSET, hits)
    }

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
            engine.searchMetadataCore(query).documents.map { doc ->
                buildJsonObject {
                    put("Uuid", doc.uuid)
                    putNullable("Title", doc.title)
                    putNullable("Organization", doc.organizationgroup ?: doc.organization)
                    putNullable("DatasetName", doc.datasetName)
                }
            }
        return buildJsonObject { put("Results", JsonArray(results)) }
    }

    internal suspend fun metadataItem(
        uuid: String,
        language: String,
    ): JsonObject {
        // Legacy swallows Solr errors, so a failure looks the same as an unknown uuid.
        val doc =
            try {
                engine.getMetadataAllByUuid(uuid)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                log.warn("Could not look up metadata $uuid in metadata_all", e)
                null
            }
        return LegacyMetadataItem(language, norgeskartUrl).build(doc)
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
}

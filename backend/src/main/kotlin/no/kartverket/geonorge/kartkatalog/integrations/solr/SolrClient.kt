package no.kartverket.geonorge.kartkatalog.integrations.solr

import io.ktor.client.HttpClient
import io.ktor.client.request.forms.FormDataContent
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.Parameters
import io.ktor.http.isSuccess
import kotlinx.coroutines.CancellationException
import kotlinx.serialization.json.Json
import no.kartverket.geonorge.kartkatalog.metrics.observeUpstream

class SolrClient(
    private val httpClient: HttpClient,
    private val baseUrl: String,
) {
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun getMetadataByUuid(uuid: String): SolrDocument? =
        search(SolrCore.METADATA_ALL, SolrQueries.metadataByUuid(uuid)).response.docs.firstOrNull()

    suspend fun getMetadataByUuids(uuids: List<String>): List<SolrDocument> {
        val distinctUuids = uuids.distinct()
        if (distinctUuids.isEmpty()) return emptyList()

        return search(SolrCore.METADATA_ALL, SolrQueries.metadataByUuids(distinctUuids)).response.docs
    }

    /** Applikasjoner som peker på datasettet [datasetUuid]. Bruker [SolrCore.APPLICATIONS], se [SolrQueries.applicationsForDataset]. */
    suspend fun searchApplicationsForDataset(datasetUuid: String): List<SolrDocument> =
        search(SolrCore.APPLICATIONS, SolrQueries.applicationsForDataset(datasetUuid)).response.docs

    /** Kjører [query] mot [core]. Faste spørringer finnes i [SolrQueries]. */
    suspend fun search(
        core: SolrCore,
        query: MetadataSolrQuery,
    ): SolrResponse = observeUpstream("solr", core.coreName) { executeQuery(core.path, query) }

    private suspend fun executeQuery(
        path: String,
        query: MetadataSolrQuery,
    ): SolrResponse {
        val response =
            try {
                httpClient.post("$baseUrl/$path") {
                    setBody(FormDataContent(query.toParameters()))
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                throw SolrException("Solr request to $path failed (q=${query.q})", e)
            }

        if (!response.status.isSuccess()) {
            throw SolrException("Solr request to $path failed with status ${response.status} (q=${query.q})")
        }

        return try {
            json.decodeFromString(response.bodyAsText())
        } catch (e: Exception) {
            throw SolrException("Failed to parse Solr response from $path (q=${query.q})", e)
        }
    }
}

data class MetadataSolrQuery(
    val q: String,
    val fl: String,
    val rows: Int = 1,
    val start: Int? = null,
    val sort: String? = null,
    val fq: List<String> = emptyList(),
    val facetFields: List<String> = emptyList(),
    val facetSortIndex: Boolean = false,
    val extraParams: Map<String, String> = emptyMap(),
    val wt: String = "json",
) {
    fun toParameters(): Parameters =
        Parameters.build {
            append("q", q)
            append("fl", fl)
            append("rows", rows.toString())
            start?.let { append("start", it.toString()) }
            sort?.takeIf { it.isNotBlank() }?.let { append("sort", it) }
            fq.filter { it.isNotBlank() }.forEach { append("fq", it) }
            if (facetFields.isNotEmpty()) {
                append("facet", "true")
                append("facet.limit", "550")
                append("facet.mincount", "0")
                if (facetSortIndex) append("facet.sort", "index")
                facetFields.forEach { append("facet.field", it) }
            }
            extraParams.forEach { (name, value) -> append(name, value) }
            append("wt", wt)
        }
}

class SolrException(
    message: String,
    e: Throwable? = null,
) : RuntimeException(message, e)

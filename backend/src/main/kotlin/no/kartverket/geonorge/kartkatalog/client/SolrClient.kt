package no.kartverket.geonorge.kartkatalog.client

import io.ktor.client.HttpClient
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.Parameters
import io.ktor.http.contentType
import io.ktor.http.formUrlEncode

class SolrClient (private val httpClient: HttpClient) {
    private val baseUrl = "geonorge-kartkatalog-solr-dev.atkv3-dev.kartverket-intern.cloud/".trimEnd('/')
    // norsk versjon
    private val fullUrl = "$baseUrl/solr/metadata/select"


    suspend fun getMetadataByUUid(uuid: String): String? {
        val solrQuery = buildMetadataSolrQuery(uuid)

        return httpClient.post(fullUrl) {
                contentType(ContentType.Application.FormUrlEncoded)
                setBody(Parameters.build {
                    solrQuery.toFormMap().forEach { (k, v) -> append(k, v) }
                }.formUrlEncode())
            }.bodyAsText()


    }

    private val METADATA_FL_FIELDS = listOf(
        "uuid", "title", "abstract", "purpose", "type", "theme", "organization", "organizations",
        "organization_seo_lowercase", "placegroups", "organizationgroup", "topic_category",
        "organization_logo_url", "thumbnail_url", "distribution_url", "distribution_protocol",
        "distribution_name", "product_page_url", "date_published", "date_updated",
        "nationalinitiative", "score", "ServiceDistributionProtocolForDataset",
        "ServiceDistributionUrlForDataset", "ServiceDistributionNameForDataset",
        "DistributionProtocols", "legend_description_url", "product_sheet_url",
        "product_specification_url", "area", "datasetservice", "popularMetadata", "bundle",
        "servicelayers", "accessconstraint", "servicedataset", "otherconstraintsaccess",
        "dataaccess", "ServiceDistributionUuidForDataset", "ServiceDistributionAccessConstraint",
        "parentidentifier", "serie", "seriedatasets", "distributions"
    )

    fun buildMetadataSolrQuery(uuid: String): MetadataSolrQuery {
        return MetadataSolrQuery(
            q = "uuid:$uuid",
            fl = METADATA_FL_FIELDS.joinToString(","),
            rows = 1,
            wt = "json"
        )
    }


}

data class MetadataSolrQuery(
    val q: String,
    val fl: String,
    val rows: Int = 1,
    val wt: String = "json"
) {
    fun toFormMap(): Map<String, String> = mapOf(
        "q" to q,
        "fl" to fl,
        "rows" to rows.toString(),
        "wt" to wt
    )
}


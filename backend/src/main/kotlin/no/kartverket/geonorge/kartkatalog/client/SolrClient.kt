package no.kartverket.geonorge.kartkatalog.client

import io.ktor.client.HttpClient
import io.ktor.client.request.forms.FormDataContent
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.Parameters
import io.ktor.http.isSuccess
import java.util.UUID

class SolrClient(private val httpClient: HttpClient) {
    private val baseUrl = "https://geonorge-kartkatalog-solr-dev.atkv3-dev.kartverket-intern.cloud/"

    // norsk versjon
    private val norskPath = "solr/metadata/select"

    suspend fun getMetadataByUUid(uuid: UUID): String {
        val solrQuery = buildMetadataSolrQuery(uuid)

        val response =
            httpClient.post(baseUrl + norskPath) {
                setBody(FormDataContent(solrQuery.toParameters()))
            }

        if (!response.status.isSuccess()) {
            throw SolrException("Solr request failed with status ${response.status}")
        } else {
            return response.bodyAsText()
        }
    }

    private fun buildMetadataSolrQuery(uuid: UUID): MetadataSolrQuery {
        return MetadataSolrQuery(
            q = "uuid:$uuid",
            fl = METADATA_FL,
            rows = 1,
            wt = "json",
        )
    }
}

data class MetadataSolrQuery(
    val q: String,
    val fl: String,
    val rows: Int = 1,
    val wt: String = "json",
) {
    fun toParameters(): Parameters =
        Parameters.build {
            append("q", q)
            append("fl", fl)
            append("rows", rows.toString())
            append("wt", wt)
        }
}

private val METADATA_FL =
    "uuid,title,abstract,purpose,type,theme,organization,organizations,organization_seo_lowercase,placegroups," +
        "organizationgroup,topic_category,organization_logo_url,thumbnail_url,distribution_url," +
        "distribution_protocol,distribution_name,product_page_url,date_published,date_updated,nationalinitiative," +
        "score,ServiceDistributionProtocolForDataset,ServiceDistributionUrlForDataset," +
        "ServiceDistributionNameForDataset,DistributionProtocols,legend_description_url,product_sheet_url," +
        "product_specification_url,area,datasetservice,popularMetadata,bundle,servicelayers,accessconstraint," +
        "servicedataset,otherconstraintsaccess,dataaccess,ServiceDistributionUuidForDataset," +
        "ServiceDistributionAccessConstraint,parentidentifier,serie,seriedatasets,distributions"

class SolrException(message: String) : RuntimeException(message)

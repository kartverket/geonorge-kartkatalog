package no.kartverket.geonorge.kartkatalog.search

import no.kartverket.geonorge.kartkatalog.integrations.solr.MetadataSolrQuery

// Mirrors MetadataService.GetSimpleMetadata in the legacy catalogue (api/datasets-simple).
internal object SimpleMetadataQuery {
    const val LIMIT = 1000
    const val OFFSET = 1

    private const val QUERY = "metadata_standard:\"ISO19115\\:Norsk versjon\""
    private val defaultFacets =
        listOf(
            "type",
            "theme",
            "organizations",
            "nationalinitiative",
            "DistributionProtocols",
            "area",
            "dataaccess",
            "spatialscope",
        )

    fun build(organization: String?): MetadataSolrQuery {
        // Legacy adds the facet for any non-empty value but skips whitespace-only filter values.
        val withFacet = !organization.isNullOrEmpty()
        val filterByOrganization = !organization.isNullOrBlank()
        return MetadataSolrQuery(
            q = QUERY,
            fl = FIELDS,
            rows = LIMIT,
            start = OFFSET - 1,
            fq =
                if (filterByOrganization) {
                    listOf("{!tag=organization}organization:\"${LegacySearchQuery.escape(organization.orEmpty())}\"")
                } else {
                    emptyList()
                },
            // The organization facet only exists when a filter is given, as in legacy.
            facetFields =
                defaultFacets + if (withFacet) listOf("{!ex=organization}organization") else emptyList(),
            facetSortIndex = true,
        )
    }

    internal const val FIELDS =
        "uuid,title,abstract,purpose,type,theme,organization,organization_seo_lowercase,placegroups," +
            "organizationgroup,topic_category,organization_logo_url,thumbnail_url,distribution_url," +
            "distribution_protocol,distribution_name,product_page_url,date_published,date_updated," +
            "nationalinitiative,score,ServiceDistributionProtocolForDataset,ServiceDistributionUrlForDataset," +
            "ServiceDistributionNameForDataset,DistributionProtocols,legend_description_url,product_sheet_url," +
            "product_specification_url,area,datasetservice,popularMetadata,bundle,servicelayers," +
            "accessconstraint,servicedataset,otherconstraintsaccess,dataaccess," +
            "ServiceDistributionUuidForDataset,ServiceDistributionAccessConstraint,parentidentifier," +
            "resourceReferenceCodeName"
}

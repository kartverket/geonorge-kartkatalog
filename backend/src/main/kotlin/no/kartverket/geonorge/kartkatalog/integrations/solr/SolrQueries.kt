package no.kartverket.geonorge.kartkatalog.integrations.solr

/**
 * Faste Solr-spørringer. Kjøres med [SolrClient.search] mot kjernen som er angitt per spørring.
 */
object SolrQueries {
    fun metadataByUuid(uuid: String): MetadataSolrQuery =
        MetadataSolrQuery(
            q = "uuid:\"${escapeSolrSpecialChars(uuid)}\"",
            fl = METADATA_FL,
            rows = 1,
        )

    fun metadataByUuids(uuids: List<String>): MetadataSolrQuery =
        MetadataSolrQuery(
            q = "uuid:(${uuids.joinToString(" OR ") { escapeSolrSpecialChars(it) }})",
            fl = METADATA_FL,
            rows = uuids.size,
        )

    /** Applikasjoner som peker på datasettet. Kjøres mot [SolrCore.APPLICATIONS], da det kun er den som gir riktig verdi
     * for applicationdataset. */
    fun applicationsForDataset(datasetUuid: String): MetadataSolrQuery =
        MetadataSolrQuery(
            q = "applicationdataset:${escapeSolrSpecialChars(datasetUuid)}*",
            fl = "uuid,title,distribution_protocol",
            rows = 100,
        )

    /** Et annet metadataelement med samme datasettnavn. Kjøres mot [SolrCore.METADATA], da det kun er den som gir
     * riktig verdi for resourceReferenceCodeName. */
    fun otherMetadataWithDatasetName(
        datasetName: String,
        excludeUuid: String,
    ): MetadataSolrQuery =
        MetadataSolrQuery(
            q =
                "resourceReferenceCodeName:\"${escapeSolrSpecialChars(datasetName)}\"" +
                    " AND -uuid:\"${escapeSolrSpecialChars(excludeUuid)}\"",
            fl = "uuid",
            rows = 1,
        )
}

private const val METADATA_FL =
    "uuid,title,abstract,purpose,type,theme,organization,organizations,organization_seo_lowercase,placegroups," +
        "organizationgroup,topic_category,organization_logo_url,thumbnail_url,distribution_url," +
        "distribution_protocol,distribution_name,product_page_url,date_published,date_updated,nationalinitiative," +
        "score,ServiceDistributionProtocolForDataset,ServiceDistributionUrlForDataset," +
        "ServiceDistributionNameForDataset,DistributionProtocols,legend_description_url,product_sheet_url," +
        "product_specification_url,area,datasetservice,popularMetadata,bundle,servicelayers,accessconstraint," +
        "servicedataset,otherconstraintsaccess,dataaccess,ServiceDistributionUuidForDataset," +
        "ServiceDistributionAccessConstraint,parentidentifier,serie,seriedatasets,distributions"

package no.kartverket.geonorge.kartkatalog.integrations.solr

/**
 * Solr-kjernene Kartkatalog leser fra. Målet er å kun bruke [METADATA_ALL] og [METADATA_ALL_EN].
 */
enum class SolrCore(
    val coreName: String,
) {
    /**
     * Holder alle metadata unntatt service, servicelayer og software. Brukes foreløpig av legacy-endepunktene
     * /api/datasets-namespace og /api/valid-dataset-name fordi feltene resourceReferenceCodespace og
     * resourceReferenceCodeName aldri settes i metadata_all.
     */
    METADATA("metadata"),
    METADATA_ALL("metadata_all"),
    METADATA_ALL_EN("metadata_all_en"),

    /**
     * Feltet applicationdataset settes aldri i metadata_all (det finnes, men er alltid null), så oppslag av applikasjoner
     * knyttet til et datasett må foreløpig bruke denne kjernen.
     */
    APPLICATIONS("applications"),
    ;

    val path: String get() = "solr/$coreName/select"

    companion object {
        fun metadataAll(english: Boolean): SolrCore = if (english) METADATA_ALL_EN else METADATA_ALL
    }
}

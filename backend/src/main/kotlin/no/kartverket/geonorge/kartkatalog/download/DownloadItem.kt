package no.kartverket.geonorge.kartkatalog.download

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import no.kartverket.geonorge.kartkatalog.integrations.solr.RelatedServiceReference

@Serializable
enum class AccessType {
    @SerialName("restricted")
    RESTRICTED,

    @SerialName("open")
    OPEN,

    @SerialName("protected")
    PROTECTED,
}

@Serializable
data class DownloadItem(
    val accessType: AccessType,
    val distributionUrl: String? = null,
    val name: String? = null,
    val organizationName: String? = null,
    val uuid: String,
) {
    companion object {
        fun fromRelatedServiceReference(ref: RelatedServiceReference): DownloadItem =
            DownloadItem(
                accessType =
                    when {
                        ref.accessIsOpendata -> AccessType.OPEN
                        ref.accessIsRestricted -> AccessType.RESTRICTED
                        else -> AccessType.PROTECTED
                    },
                distributionUrl = ref.distributionUrl,
                name = ref.name,
                organizationName = ref.organizationName,
                uuid = ref.uuid,
            )

        // Solr-feltet "serie" på et medlem beskriver serien det hører til, som én tekst
        // delt med "|". Rekkefølgen kommer fra den gamle indekseringen (SolrIndexDocumentCreator.cs).
        // Medlemmer av en tematisk serie gir samme fil som serien selv, så da skal
        // nedlastingen gå til serien i stedet for medlemmet.
        fun fromThematicSeries(serie: String?): DownloadItem? {
            val parts = serie?.split("|") ?: return null
            if (parts.getOrNull(SERIE_TYPE_NAME) != "series_thematic") return null
            if (parts.getOrNull(SERIE_PROTOCOL) != "GEONORGE:DOWNLOAD") return null

            val uuid = parts.getOrNull(SERIE_UUID)?.takeIf { it.isNotBlank() } ?: return null
            val distributionUrl = parts.getOrNull(SERIE_URL)?.takeIf { it.isNotBlank() } ?: return null

            return DownloadItem(
                accessType =
                    when {
                        parts.getOrNull(SERIE_ACCESS_IS_OPENDATA).equals("true", ignoreCase = true) -> AccessType.OPEN
                        parts.getOrNull(SERIE_ACCESS_IS_RESTRICTED).equals("true", ignoreCase = true) ->
                            AccessType.RESTRICTED
                        else -> AccessType.PROTECTED
                    },
                distributionUrl = distributionUrl,
                name = parts.getOrNull(SERIE_TITLE),
                organizationName = parts.getOrNull(SERIE_ORGANIZATION),
                uuid = uuid,
            )
        }

        private const val SERIE_UUID = 0
        private const val SERIE_TITLE = 1
        private const val SERIE_ORGANIZATION = 4
        private const val SERIE_PROTOCOL = 6
        private const val SERIE_URL = 7
        private const val SERIE_TYPE_NAME = 11
        private const val SERIE_ACCESS_IS_OPENDATA = 12
        private const val SERIE_ACCESS_IS_RESTRICTED = 13
    }
}

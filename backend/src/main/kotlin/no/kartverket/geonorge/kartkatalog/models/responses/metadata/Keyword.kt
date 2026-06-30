package no.kartverket.geonorge.kartkatalog.models.responses.metadata

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Keyword(
    @SerialName("EnglishKeyword")
    val englishKeyword: String? = null,
    @SerialName("KeywordValue")
    val keywordValue: String? = null,
    @SerialName("Thesaurus")
    val thesaurus: String? = null,
    @SerialName("Type")
    val type: String? = null,
    @SerialName("KeywordLink")
    val keywordLink: String? = null,
)

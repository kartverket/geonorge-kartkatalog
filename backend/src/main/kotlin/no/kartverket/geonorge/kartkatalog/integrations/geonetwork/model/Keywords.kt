package no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model

import kotlinx.serialization.Serializable

@Serializable
data class Keyword(
    val value: String,
    val englishValue: String? = null,
    val href: String? = null,
)

@Serializable
data class KeywordGroup(
    val type: String? = null,
    val thesaurus: String? = null,
    val thesaurusHref: String? = null,
    val keywords: List<Keyword> = emptyList(),
)

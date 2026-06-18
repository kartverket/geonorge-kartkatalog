package no.kartverket.geonorge.kartkatalog.models

data class Keyword(
    val value: String,
    val englishValue: String? = null,
    val href: String? = null,
)

data class KeywordGroup(
    val type: String? = null,
    val thesaurus: String? = null,
    val thesaurusHref: String? = null,
    val keywords: List<Keyword> = emptyList(),
)

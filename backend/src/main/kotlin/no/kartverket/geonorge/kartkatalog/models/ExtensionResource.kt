package no.kartverket.geonorge.kartkatalog.models

data class ExtensionResource(
    val applicationProfile: String,
    val url: String? = null,
    val name: String? = null,
    val nameEnglish: String? = null,
    val protocol: String? = null,
)

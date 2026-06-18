package no.kartverket.geonorge.kartkatalog.models

data class Contact(
    val name: String? = null,
    val organization: String? = null,
    val organizationEnglish: String? = null,
    val positionName: String? = null,
    val email: String? = null,
    val role: String,
)

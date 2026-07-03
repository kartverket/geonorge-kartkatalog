package no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model

import kotlinx.serialization.Serializable

@Serializable
data class Contact(
    val name: String? = null,
    val organization: String? = null,
    val organizationEnglish: String? = null,
    val positionName: String? = null,
    val email: String? = null,
    val role: String,
)

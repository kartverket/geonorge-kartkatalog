package no.kartverket.geonorge.kartkatalog.models.responses.metadata

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Contact(
    @SerialName("Name")
    val name: String? = null,
    @SerialName("Email")
    val email: String? = null,
    @SerialName("Organization")
    val organization: String? = null,
    @SerialName("OrganizationEnglish")
    val organizationEnglish: String? = null,
    @SerialName("Role")
    val role: String? = null,
)

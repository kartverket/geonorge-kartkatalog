package no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model

import kotlinx.serialization.Serializable

@Serializable
data class LegalConstraints(
    val accessConstraints: String? = null,
    val accessConstraintsLink: String? = null,
    val accessConstraintsLinkText: String? = null,
    val useConstraints: String? = null,
    val useLimitations: List<String> = emptyList(),
    val otherConstraintsLink: String? = null,
    val otherConstraintsLinkText: String? = null,
    val otherConstraintsAccess: String? = null,
    val otherConstraints: String? = null,
    val useConstraintsLicenseLink: String? = null,
    val useConstraintsLicenseLinkText: String? = null,
)

@Serializable
data class SecurityConstraints(
    val classification: String? = null,
    val userNote: String? = null,
)

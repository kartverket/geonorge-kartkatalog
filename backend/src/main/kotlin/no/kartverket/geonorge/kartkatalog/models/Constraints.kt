package no.kartverket.geonorge.kartkatalog.models

data class LegalConstraints(
    val accessConstraints: String? = null,
    val useConstraints: String? = null,
    val useLimitations: List<String> = emptyList(),
    val otherConstraintsLink: String? = null,
    val otherConstraintsLinkText: String? = null,
    val otherConstraintsAccess: String? = null,
)

data class SecurityConstraints(
    val classification: String? = null,
    val userNote: String? = null,
)

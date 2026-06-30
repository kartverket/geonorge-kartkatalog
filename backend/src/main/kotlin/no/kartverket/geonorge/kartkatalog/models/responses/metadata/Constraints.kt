package no.kartverket.geonorge.kartkatalog.models.responses.metadata

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Constraints(
    @SerialName("AccessConstraints")
    val accessConstraints: String? = null,
    @SerialName("OtherConstraintsAccess")
    val otherConstraintsAccess: String? = null,
    @SerialName("OtherConstraints")
    val otherConstraints: String? = null,
    @SerialName("OtherConstraintsLink")
    val otherConstraintsLink: String? = null,
    @SerialName("OtherConstraintsLinkText")
    val otherConstraintsLinkText: String? = null,
    @SerialName("SecurityConstraints")
    val securityConstraints: String? = null,
    @SerialName("SecurityConstraintsNote")
    val securityConstraintsNote: String? = null,
    @SerialName("UseConstraints")
    val useConstraints: String? = null,
    @SerialName("UseLimitations")
    val useLimitations: String? = null,
)

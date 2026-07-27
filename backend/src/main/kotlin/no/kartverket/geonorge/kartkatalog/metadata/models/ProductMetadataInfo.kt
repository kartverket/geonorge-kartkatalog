package no.kartverket.geonorge.kartkatalog.metadata.models

import kotlinx.serialization.Serializable
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.LegalConstraints

@Serializable
class ProductMetadataInfo(
    val abstractText: String?,
    val purpose: String?,
    val specificUsage: String?,
    val processHistory: String?,
    val constraints: LegalConstraints?,
    val securityClassification: String?,
    val contactMetadata: ProductMetadataContact?,
    val contactOwner: ProductMetadataContact?,
    val contactPublisher: ProductMetadataContact?,
)

@Serializable
data class ProductMetadataContact(
    var email: String? = null,
    var name: String? = null,
    var organization: String? = null,
    var organizationEnglish: String? = null,
    var role: String? = null,
)

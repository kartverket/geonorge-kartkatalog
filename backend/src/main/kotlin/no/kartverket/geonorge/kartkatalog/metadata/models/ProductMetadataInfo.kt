package no.kartverket.geonorge.kartkatalog.metadata.models

import kotlinx.serialization.Serializable
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.LegalConstraints

@Serializable
class ProductMetadataInfo(
    val abstractText: String? = null,
    val purpose: String? = null,
    val specificUsage: String? = null,
    val processHistory: String? = null,
    val constraints: LegalConstraints? = null,
    val securityClassification: String? = null,
    val contactMetadata: ProductMetadataContact? = null,
    val contactOwner: ProductMetadataContact? = null,
    val contactPublisher: ProductMetadataContact? = null,
)

@Serializable
data class ProductMetadataContact(
    var email: String? = null,
    var name: String? = null,
    var organization: String? = null,
    var organizationEnglish: String? = null,
    var role: String? = null,
)

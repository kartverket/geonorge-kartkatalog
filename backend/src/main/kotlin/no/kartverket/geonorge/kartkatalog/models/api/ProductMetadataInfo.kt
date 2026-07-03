package no.kartverket.geonorge.kartkatalog.models.api

import kotlinx.serialization.Serializable
import no.kartverket.geonorge.kartkatalog.models.responses.geonetwork.LegalConstraints

@Serializable
class ProductMetadataInfo(
    val abstractText: String?,
    val specificUsage: String?,
    val constraints: LegalConstraints?,
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

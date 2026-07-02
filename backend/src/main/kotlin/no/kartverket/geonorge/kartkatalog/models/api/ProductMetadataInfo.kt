package no.kartverket.geonorge.kartkatalog.models.api

import kotlinx.serialization.Serializable

@Serializable
class ProductMetadataInfo(
    val abstractText: String?,
    val specificUsage: String?,
    val constraints: String,
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

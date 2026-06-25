package no.kartverket.geonorge.kartkatalog.models.responses.register

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class RegisterCodeListResponse(
    @SerialName("containeditems")
    val containedItems: List<RegisterCodeListItem> = emptyList(),
)

@Serializable
data class RegisterCodeListItem(
    val label: String,
    @SerialName("codevalue")
    val codeValue: String? = null,
) {
    val effectiveCodeValue: String get() = codeValue?.takeIf { it.isNotBlank() } ?: label
}

@Serializable
data class RegisterOrganizationsResponse(
    @SerialName("containeditems")
    val containedItems: List<RegisterOrganizationItem> = emptyList(),
)

@Serializable
data class RegisterOrganizationItem(
    val label: String,
    @SerialName("ShortName")
    val shortName: String? = null,
)

@Serializable
data class RegisterSubRegisterResponse(
    @SerialName("containeditems")
    val containedItems: List<RegisterSubRegisterItem> = emptyList(),
)

@Serializable
data class RegisterSubRegisterItem(
    val label: String,
    val id: String? = null,
)

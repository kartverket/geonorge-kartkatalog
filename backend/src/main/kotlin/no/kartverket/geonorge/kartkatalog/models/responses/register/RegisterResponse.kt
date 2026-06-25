package no.kartverket.geonorge.kartkatalog.models.responses.register

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class RegisterCodeListResponse(
    val containeditems: List<RegisterCodeListItem> = emptyList(),
)

@Serializable
data class RegisterCodeListItem(
    val label: String,
    val codevalue: String? = null,
) {
    val effectiveCodeValue: String get() = codevalue?.takeIf { it.isNotBlank() } ?: label
}

@Serializable
data class RegisterOrganizationsResponse(
    val containeditems: List<RegisterOrganizationItem> = emptyList(),
)

@Serializable
data class RegisterOrganizationItem(
    val label: String,
    @SerialName("ShortName")
    val shortName: String? = null,
)

@Serializable
data class RegisterSubRegisterResponse(
    val containeditems: List<RegisterSubRegisterItem> = emptyList(),
)

@Serializable
data class RegisterSubRegisterItem(
    val label: String,
    val id: String? = null,
)

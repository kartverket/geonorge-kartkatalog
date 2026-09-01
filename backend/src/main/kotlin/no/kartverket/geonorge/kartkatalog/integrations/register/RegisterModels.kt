package no.kartverket.geonorge.kartkatalog.integrations.register

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
    val description: String? = null,
) {
    val effectiveCodeValue: String get() =
        codeValue?.takeIf {
            it.isNotBlank()
        } ?: label
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

@Serializable
data class RegisterTegnereglerItem(
    val id: String? = null,
    val label: String? = null,
    val lang: String? = null,
    @SerialName("itemclass")
    val itemClass: String? = null,
    val uuid: String? = null,
    val status: String? = null,
    val description: String? = null,
    val seoname: String? = null,
    val owner: String? = null,
    val versionNumber: Int? = null,
    val lastUpdated: String? = null,
    val dateSubmitted: String? = null,
    val dateAccepted: String? = null,
    @SerialName("CartographyFile")
    val cartographyFile: String? = null,
    val draftDate: String? = null,
    val documentreference: String? = null,
    @SerialName("FAIRStatusPerCent")
    val fairStatusPerCent: Double? = null,
)

@Serializable
data class RegisterProduktarkItem(
    val id: String? = null,
    val label: String? = null,
    val lang: String? = null,
    @SerialName("itemclass")
    val itemClass: String? = null,
    val uuid: String? = null,
    val status: String? = null,
    val description: String? = null,
    val seoname: String? = null,
    val owner: String? = null,
    val versionNumber: Int? = null,
    val lastUpdated: String? = null,
    val dateSubmitted: String? = null,
    val dateAccepted: String? = null,
    val draftDate: String? = null,
    val thumbnail: String? = null,
    val documentreference: String? = null,
    @SerialName("FAIRStatusPerCent")
    val fairStatusPerCent: Double? = null,
)

@Serializable
data class RegisterProduktspesifikasjonItem(
    val id: String? = null,
    val label: String? = null,
    val lang: String? = null,
    @SerialName("itemclass")
    val itemClass: String? = null,
    val uuid: String? = null,
    val status: String? = null,
    val description: String? = null,
    val seoname: String? = null,
    val owner: String? = null,
    val versionNumber: Int? = null,
    val lastUpdated: String? = null,
    val dateSubmitted: String? = null,
    val dateAccepted: String? = null,
    val draftDate: String? = null,
    @SerialName("GMLApplicationSchema")
    val gmlApplicationSchema: String? = null,
    @SerialName("ApplicationSchema")
    val applicationSchema: String? = null,
    val documentreference: String? = null,
    @SerialName("FAIRStatusPerCent")
    val fairStatusPerCent: Double? = null,
)


package no.kartverket.geonorge.kartkatalog.metadata.models

import kotlinx.serialization.Serializable
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterTegnerеglerItem

@Serializable
data class TegnerеglerItem(
    val id: String? = null,
    val label: String? = null,
    val lang: String? = null,
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
    val cartographyFile: String? = null,
    val draftDate: String? = null,
    val thumbnail: String? = null,
    val documentreference: String? = null,
    val fairStatusPerCent: Double? = null,
)

fun RegisterTegnerеglerItem.toTegnereglerItem() =
    TegnerеglerItem(
        id = this.id,
        label = this.label,
        lang = this.lang,
        itemClass = this.itemClass,
        uuid = this.uuid,
        status = this.status,
        description = this.description,
        seoname = this.seoname,
        owner = this.owner,
        versionNumber = this.versionNumber,
        lastUpdated = this.lastUpdated,
        dateSubmitted = this.dateSubmitted,
        dateAccepted = this.dateAccepted,
        cartographyFile = this.cartographyFile,
        draftDate = this.draftDate,
        thumbnail = this.thumbnail,
        documentreference = this.documentreference,
        fairStatusPerCent = this.fairStatusPerCent
    )


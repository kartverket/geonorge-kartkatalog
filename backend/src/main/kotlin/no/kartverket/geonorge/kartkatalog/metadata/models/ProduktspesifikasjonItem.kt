package no.kartverket.geonorge.kartkatalog.metadata.models

import kotlinx.serialization.Serializable
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterProduktspesifikasjonItem

@Serializable
data class ProduktspesifikasjonItem(
    val id: String? = null,
    val label: String? = null,
    val status: String? = null,
    val owner: String? = null,
    val dateSubmitted: String? = null,
    val gmlApplicationSchema: String? = null,
    val applicationSchema: String? = null,
    val documentreference: String? = null,
)

fun RegisterProduktspesifikasjonItem.toProduktspesifikasjonItem() =
    ProduktspesifikasjonItem(
        id = this.id,
        label = this.label,
        status = this.status,
        owner = this.owner,
        dateSubmitted = this.dateSubmitted,
        gmlApplicationSchema = this.gmlApplicationSchema,
        applicationSchema = this.applicationSchema,
        documentreference = this.documentreference,
    )

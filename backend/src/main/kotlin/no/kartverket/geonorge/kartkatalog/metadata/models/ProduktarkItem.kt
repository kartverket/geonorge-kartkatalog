package no.kartverket.geonorge.kartkatalog.metadata.models

import kotlinx.serialization.Serializable
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterProduktarkItem


@Serializable
data class ProduktarkItem(
val id: String? = null,
val label: String? = null,
val status: String? = null,
val owner: String? = null,
val dateSubmitted: String? = null,
val documentreference: String? = null,
)

fun RegisterProduktarkItem.toProduktarkItem() =
    ProduktarkItem(
        id = this.id,
        label = this.label,
        status = this.status,
        owner = this.owner,
        dateSubmitted = this.dateSubmitted,
        documentreference = this.documentreference,
    )

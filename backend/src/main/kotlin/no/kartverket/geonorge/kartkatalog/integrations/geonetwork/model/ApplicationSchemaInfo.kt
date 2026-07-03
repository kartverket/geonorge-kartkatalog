package no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model

import kotlinx.serialization.Serializable

@Serializable
data class ApplicationSchemaInfo(
    val name: String? = null,
    val schemaLanguage: String? = null,
    val constraintLanguage: String? = null,
)

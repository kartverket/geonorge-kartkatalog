package no.kartverket.geonorge.kartkatalog.models.responses.metadata

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class QualitySpecification(
    @SerialName("Date")
    val date: String? = null,
    @SerialName("DateType")
    val dateType: String? = null,
    @SerialName("Explanation")
    val explanation: String? = null,
    @SerialName("Result")
    val result: Boolean? = null,
    @SerialName("Title")
    val title: String? = null,
    @SerialName("SpecificationLink")
    val specificationLink: String? = null,
    @SerialName("QuantitativeResult")
    val quantitativeResult: String? = null,
)

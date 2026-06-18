package no.kartverket.geonorge.kartkatalog.models

data class OperatesOn(
    val uuidref: String,
    val href: String? = null,
)

data class ServiceOperation(
    val operationName: String? = null,
    val dcp: List<String> = emptyList(),
    val operationDescription: String? = null,
    val connectPoints: List<OnlineResource> = emptyList(),
)

package no.kartverket.geonorge.kartkatalog.legacy

import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObjectBuilder
import kotlinx.serialization.json.JsonPrimitive

internal fun JsonObjectBuilder.putText(
    key: String,
    value: String?,
) {
    if (value != null) put(key, JsonPrimitive(value))
}

internal fun JsonObjectBuilder.putArray(
    key: String,
    items: List<JsonElement>,
) {
    put(key, JsonArray(items))
}

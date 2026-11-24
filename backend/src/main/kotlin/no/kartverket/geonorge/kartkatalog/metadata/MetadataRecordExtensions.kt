package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord

fun MetadataRecord.findExtensionUrl(applicationProfile: String): String? =
    extensionResources
        .firstOrNull {
            it.applicationProfile.trim().equals(applicationProfile, ignoreCase = true) && !it.url.isNullOrBlank()
        }?.url

private val urlScheme = Regex("^[a-z][a-z0-9+.-]*://", RegexOption.IGNORE_CASE)

// Dataeiere skriver av og til lenker uten protokoll, f.eks. "www.nibio.no/...".
// Uten protokoll blir lenken relativ til vår side. Gammel kartkatalog la da til https://.
fun withHttpsScheme(url: String): String {
    val trimmed = url.trim()
    return if (urlScheme.containsMatchIn(trimmed)) trimmed else "https://${trimmed.removePrefix("://")}"
}

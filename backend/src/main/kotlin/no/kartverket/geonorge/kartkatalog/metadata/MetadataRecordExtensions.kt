package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord

fun MetadataRecord.findExtensionUrl(applicationProfile: String): String? =
    extensionResources
        .firstOrNull {
            it.applicationProfile.trim().equals(applicationProfile, ignoreCase = true) && !it.url.isNullOrBlank()
        }?.url

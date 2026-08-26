package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.metadata.models.AccessState

fun resolveAccessState(record: MetadataRecord): AccessState? =
    when {
        isRestricted(record) -> AccessState.RESTRICTED
        isProtected(record) -> AccessState.PROTECTED
        isOpenData(record) -> AccessState.OPEN
        else -> null
    }

private fun isOpenData(record: MetadataRecord): Boolean {
    val accessText = listOfNotNull(record.legalConstraints?.otherConstraintsAccess).joinToString(" ")
    return containsAny(
        accessText,
        "no restrictions",
        "noLimitations",
        "no limitations",
        "åpne data",
    )
}

private fun isRestricted(record: MetadataRecord): Boolean {
    val accessText = listOfNotNull(record.legalConstraints?.otherConstraintsAccess).joinToString(" ")
    return containsAny(
        accessText,
        "norway digital restricted",
        "INSPIRE_Directive_Article13_1d",
    )
}

private fun isProtected(record: MetadataRecord): Boolean {
    val accessConstraint = listOfNotNull(record.legalConstraints?.otherConstraintsAccess).joinToString(" ")
    return containsAny(accessConstraint, "Beskyttet", "restricted", "INSPIRE_Directive_Article13_1b") ||
        record.securityConstraints?.classification.equals("restricted", ignoreCase = true)
}

private fun containsAny(
    value: String,
    vararg searchTerms: String,
): Boolean {
    val normalized = value.lowercase()
    return searchTerms.any { term -> normalized.contains(term.lowercase()) }
}

package no.kartverket.geonorge.kartkatalog.auth

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import java.nio.ByteBuffer
import java.nio.charset.CodingErrorAction
import java.nio.charset.StandardCharsets
import java.util.Base64

const val AUTH_DETAILS_HEADER = "X-Auth-Details"
const val USER_FULL_NAME_HEADER = "X-User-Full-Name"

private val organizationIdPattern = Regex("^[^:]+:(\\d{9})$")

@Serializable
data class AuthInfoResponse(
    val name: String,
    val organizationName: String? = null,
)

data class AuthorizedOrganization(
    val organizationNumber: String,
    val name: String,
)

class InvalidAuthDetailsException : IllegalArgumentException()

fun decodeAuthorizedOrganization(rawHeader: String?): AuthorizedOrganization {
    if (rawHeader.isNullOrBlank()) throw InvalidAuthDetailsException()

    val authorizationDetails =
        parseJsonArray(rawHeader)
            ?: decodeBase64(rawHeader.trim())?.let(::parseJsonArray)
            ?: throw InvalidAuthDetailsException()

    return authorizationDetails
        .asSequence()
        .flatMap { detail ->
            detail.jsonObject["authorized_parties"]
                ?.jsonArray
                ?.asSequence()
                .orEmpty()
        }.mapNotNull { party ->
            val partyObject = party.jsonObject
            val organizationId =
                partyObject["orgno"]
                    ?.jsonObject
                    ?.get("ID")
                    ?.jsonPrimitive
                    ?.contentOrNull
            val organizationNumber =
                organizationId
                    ?.let(organizationIdPattern::matchEntire)
                    ?.groupValues
                    ?.get(1)
            val name = partyObject["name"]?.jsonPrimitive?.contentOrNull

            if (organizationNumber != null && !name.isNullOrBlank()) {
                AuthorizedOrganization(organizationNumber, name)
            } else {
                null
            }
        }.firstOrNull()
        ?: throw InvalidAuthDetailsException()
}

private fun parseJsonArray(value: String): JsonArray? =
    runCatching { Json.parseToJsonElement(value) as? JsonArray }.getOrNull()

private fun decodeBase64(value: String): String? {
    val padded = value + "=".repeat((4 - value.length % 4) % 4)
    val bytes =
        sequenceOf(Base64.getUrlDecoder(), Base64.getDecoder())
            .mapNotNull { decoder -> runCatching { decoder.decode(padded) }.getOrNull() }
            .firstOrNull()
            ?: return null

    return runCatching {
        StandardCharsets.UTF_8
            .newDecoder()
            .onMalformedInput(CodingErrorAction.REPORT)
            .onUnmappableCharacter(CodingErrorAction.REPORT)
            .decode(ByteBuffer.wrap(bytes))
            .toString()
    }.getOrNull()
}

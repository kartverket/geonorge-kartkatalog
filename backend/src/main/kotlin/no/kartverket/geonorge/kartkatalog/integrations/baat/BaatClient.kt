package no.kartverket.geonorge.kartkatalog.integrations.baat

import io.ktor.client.HttpClient
import io.ktor.client.request.accept
import io.ktor.client.request.bearerAuth
import io.ktor.client.request.get
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.encodeURLPathPart
import io.ktor.http.isSuccess
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonPrimitive
import no.kartverket.geonorge.kartkatalog.download.BaatAuthorizationService
import no.kartverket.geonorge.kartkatalog.download.BaatOrganization
import no.kartverket.geonorge.kartkatalog.download.BaatUserInfo
import no.kartverket.geonorge.kartkatalog.download.GeoIdUser

@Serializable
private data class BaatOrganizationResponse(
    val name: String = "",
    val orgnr: JsonElement = JsonPrimitive(""),
)

@Serializable
private data class BaatInfo(
    val user: String,
    @SerialName("baat_email") val email: String = "",
    @SerialName("baat_name") val name: String = "",
    @SerialName("baat_authorized_from") val authorizedFrom: Int = 0,
    @SerialName("baat_authorized_until") val authorizedUntil: Int = 0,
    @SerialName("baat_organization")
    val organization: BaatOrganizationResponse = BaatOrganizationResponse(),
    @SerialName("baat_services") val services: List<String> = emptyList(),
)

class BaatException(
    message: String,
) : RuntimeException(message)

class BaatClient(
    private val httpClient: HttpClient,
    private val baseUrl: String,
) : BaatAuthorizationService {
    private val json = Json { ignoreUnknownKeys = true }

    override suspend fun getUserInfo(user: GeoIdUser): BaatUserInfo {
        val path = "/info/${user.username.encodeURLPathPart()}"
        val response =
            httpClient.get("$baseUrl$path") {
                bearerAuth(user.accessToken)
                accept(ContentType.Application.Json)
            }
        if (!response.status.isSuccess()) {
            throw BaatException("BAAT request to $path failed with status ${response.status}")
        }
        val info =
            try {
                json.decodeFromString(BaatInfo.serializer(), response.bodyAsText())
            } catch (cause: Exception) {
                throw BaatException("Failed to parse BAAT response from $path")
            }

        return BaatUserInfo(
            username = info.user,
            name = info.name,
            email = info.email,
            authorizedFrom = info.authorizedFrom,
            authorizedUntil = info.authorizedUntil,
            organization =
                BaatOrganization(
                    name = info.organization.name,
                    organizationNumber = info.organization.orgnr.jsonPrimitive.content,
                ),
            services = info.services.map { it.trim() }.filter { it.isNotEmpty() }.toSet(),
        )
    }
}

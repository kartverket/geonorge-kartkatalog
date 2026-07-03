package no.kartverket.geonorge.kartkatalog.integrations.register

import io.ktor.client.HttpClient
import io.ktor.client.request.get
import io.ktor.client.request.headers
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpHeaders
import io.ktor.http.isSuccess
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.json.Json

enum class CodeList(
    val systemId: String,
) {
    DISTRIBUTION_TYPES("94B5A165-7176-4F43-B6EC-1063F7ADE9EA"),
    TOPIC_CATEGORIES("9A46038D-16EE-4562-96D2-8F6304AAB100"),
    STATUS("9A46038D-16EE-4562-96D2-8F6304AAB137"),
    MAINTENANCE_FREQUENCY("9A46038D-16EE-4562-96D2-8F6304AAB124"),
    SPATIAL_REPRESENTATIONS("4C54EB31-714E-4457-AF6A-44FE6DBE76C1"),
    CLASSIFICATION("9A46038D-16EE-4562-96D2-8F6304AAB145"),
    RESTRICTIONS("D23E9F2F-66AB-427D-8AE4-5B6FD3556B57"),
    COORDINATE_SYSTEMS("37B9DC41-D868-4CBC-84F9-39557041FB2C"),
    INSPIRE("E7E48BC6-47C6-4E37-BE12-08FB9B2FEDE6"),
}

class RegisterClient(
    private val httpClient: HttpClient,
) {
    private val baseUrl = "https://register.geonorge.no/"
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun getCodeList(codeList: CodeList): RegisterCodeListResponse =
        fetch("api/kodelister/${codeList.systemId}", RegisterCodeListResponse.serializer())

    suspend fun getCodeListByName(name: String): RegisterCodeListResponse =
        fetch("api/metadata-kodelister/$name", RegisterCodeListResponse.serializer())

    suspend fun getSubRegister(registerName: String): RegisterSubRegisterResponse =
        fetch("api/subregister/$registerName", RegisterSubRegisterResponse.serializer())

    suspend fun getOrganizations(): RegisterOrganizationsResponse =
        fetch("api/register/organisasjoner", RegisterOrganizationsResponse.serializer())

    private suspend fun <T> fetch(
        path: String,
        deserializer: DeserializationStrategy<T>,
    ): T {
        val response =
            httpClient.get("$baseUrl$path") {
                headers { append(HttpHeaders.AcceptLanguage, "no") }
            }

        if (!response.status.isSuccess()) {
            throw RegisterException("Register request to $path failed with status ${response.status}")
        }

        return try {
            json.decodeFromString(deserializer, response.bodyAsText())
        } catch (e: Exception) {
            throw RegisterException("Failed to parse Register response from $path", e)
        }
    }
}

class RegisterException(
    message: String,
    e: Throwable? = null,
) : RuntimeException(message, e)

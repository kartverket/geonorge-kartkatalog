package no.kartverket.geonorge.kartkatalog.integrations.register

import io.ktor.client.HttpClient
import io.ktor.client.request.get
import io.ktor.client.request.headers
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.isSuccess
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.json.Json
import no.kartverket.geonorge.kartkatalog.metrics.observeUpstream
import org.slf4j.LoggerFactory
import java.net.URLEncoder.encode
import kotlin.coroutines.cancellation.CancellationException
import kotlin.text.Charsets.UTF_8

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
    private val baseUrl: String,
) {
    private val json = Json { ignoreUnknownKeys = true }
    private val log = LoggerFactory.getLogger(RegisterClient::class.java)

    suspend fun getCodeList(
        codeList: CodeList,
        language: String = "no",
    ): RegisterCodeListResponse =
        fetch(
            "code_list",
            "/api/kodelister/${codeList.systemId}${langQuery(language)}",
            RegisterCodeListResponse.serializer(),
        )

    suspend fun getCodeListByName(
        name: String,
        language: String = "no",
    ): RegisterCodeListResponse =
        fetch(
            "metadata_code_list",
            "/api/metadata-kodelister/$name${langQuery(language)}",
            RegisterCodeListResponse.serializer(),
        )

    private fun langQuery(language: String) = if (language == "no") "" else "?lang=$language"

    suspend fun getSosiCodeList(path: String): RegisterCodeListResponse =
        fetch("sosi_code_list", "/api/sosi-kodelister/$path", RegisterCodeListResponse.serializer())

    suspend fun getSubRegister(registerName: String): RegisterSubRegisterResponse =
        fetch("sub_register", "/api/subregister/$registerName", RegisterSubRegisterResponse.serializer())

    suspend fun getOrganizations(): RegisterOrganizationsResponse =
        fetch("organizations", "/api/register/organisasjoner", RegisterOrganizationsResponse.serializer())

    suspend fun getTegneregler(seoname: String): RegisterTegnereglerItem? {
        val path = "/api/tegneregler/${encode(seoname, UTF_8)}"
        return observe("tegneregler", path) {
            val response = get(path)
            when {
                response.status == HttpStatusCode.NotFound -> {
                    log.debug("Tegneregler not found for seoname: {}", seoname)
                    null
                }
                !response.status.isSuccess() -> {
                    log.warn("Tegneregler request failed for seoname: {} with status: {}", seoname, response.status)
                    throw RegisterException("Register request to $path failed with status ${response.status}")
                }
                else ->
                    try {
                        json.decodeFromString(RegisterTegnereglerItem.serializer(), response.bodyAsText())
                    } catch (e: Exception) {
                        log.error("Failed to parse Tegneregler response for seoname: {}", seoname, e)
                        throw RegisterException("Failed to parse Register response from $path", e)
                    }
            }
        }
    }

    suspend fun getProduktark(seoname: String): RegisterProduktarkItem? {
        val path = "/api/produktark/${encode(seoname, UTF_8)}"
        return observe("produktark", path) {
            val response = get(path)
            when {
                response.status == HttpStatusCode.NotFound -> {
                    log.debug("Produktark not found for seoname: {}", seoname)
                    null
                }
                !response.status.isSuccess() -> {
                    log.warn("Produktark request failed for seoname: {} with status: {}", seoname, response.status)
                    throw RegisterException("Register request failed with status ${response.status}")
                }
                else ->
                    try {
                        json.decodeFromString(RegisterProduktarkItem.serializer(), response.bodyAsText())
                    } catch (e: Exception) {
                        log.error("Failed to parse Produktark response for seoname: {}", seoname, e)
                        throw RegisterException("Failed to parse Register response from $path", e)
                    }
            }
        }
    }

    suspend fun getProduktspesifikasjon(seoname: String): RegisterProduktspesifikasjonItem? {
        val path = "/api/produktspesifikasjoner/${encode(seoname, UTF_8)}"
        return observe("produktspesifikasjon", path) {
            val response = get(path)
            when {
                response.status == HttpStatusCode.NotFound -> {
                    log.debug("Produktspesifikasjon not found for seoname: {}", seoname)
                    null
                }
                !response.status.isSuccess() -> {
                    log.warn(
                        "Produktspesifikasjon request failed for seoname: {} with status: {}",
                        seoname,
                        response.status,
                    )
                    throw RegisterException("Register request failed with status ${response.status}")
                }
                else ->
                    try {
                        json.decodeFromString(RegisterProduktspesifikasjonItem.serializer(), response.bodyAsText())
                    } catch (e: Exception) {
                        log.error("Failed to parse Produktspesifikasjon response for seoname: {}", seoname, e)
                        throw RegisterException("Failed to parse Register response from $path", e)
                    }
            }
        }
    }

    private suspend fun <T> fetch(
        operation: String,
        path: String,
        deserializer: DeserializationStrategy<T>,
    ): T =
        observe(operation, path) {
            val response = get(path)

            if (!response.status.isSuccess()) {
                log.warn("Register request to {} failed with status: {}", path, response.status)
                throw RegisterException("Register request to $path failed with status ${response.status}")
            }

            try {
                json.decodeFromString(deserializer, response.bodyAsText())
            } catch (e: Exception) {
                log.error("Failed to parse Register response from {}", path, e)
                throw RegisterException("Failed to parse Register response from $path", e)
            }
        }

    // Times the request together with the status check and decoding, so every call that throws counts as an error.
    // A 404 from the nullable item lookups returns null and therefore counts as success.
    private suspend fun <T> observe(
        operation: String,
        path: String,
        block: suspend () -> T,
    ): T =
        try {
            observeUpstream("register", operation, block = block)
        } catch (e: RegisterException) {
            throw e
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            throw RegisterException("Register request to $path failed", e)
        }

    private suspend fun get(path: String): HttpResponse =
        httpClient.get("$baseUrl$path") {
            headers { append(HttpHeaders.AcceptLanguage, "no") }
        }
}

class RegisterException(
    message: String,
    e: Throwable? = null,
) : RuntimeException(message, e)

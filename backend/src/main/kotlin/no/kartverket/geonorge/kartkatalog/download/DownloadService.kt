package no.kartverket.geonorge.kartkatalog.download

import io.ktor.client.HttpClient
import io.ktor.client.request.get
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.isSuccess
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.serialization.json.Json
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingArea
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingCapabilities
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingClient
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingException
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingInsightGroups
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingOrderLine
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingOrderRequest
import org.slf4j.LoggerFactory

private const val ORDER_REL = "http://rel.geonorge.no/download/order"

class DownloadException(
    message: String,
) : RuntimeException(message)

private data class ResolvedOrderLine(
    val orderUrl: String,
    val supportsBundling: Boolean,
    val line: NedlastingOrderLine,
)

class DownloadService(
    private val httpClient: HttpClient,
    private val nedlastingClient: NedlastingClient,
    private val downloadInsightGroupsResolver: DownloadInsightGroupsResolver,
) {
    private val log = LoggerFactory.getLogger(DownloadService::class.java)

    private val json =
        Json {
            ignoreUnknownKeys = true
            encodeDefaults = true
        }

    suspend fun order(request: DownloadOrderRequest): DownloadOrderResult =
        coroutineScope {
            val resolved =
                request.items
                    .map { item -> async { resolveOrderLine(item) } }
                    .awaitAll()

            val (bundlable, individual) = resolved.partition { it.supportsBundling }
            val groups = bundlable.groupBy { it.orderUrl }.values + individual.map { listOf(it) }

            val responses =
                groups.map { group ->
                    async {
                        nedlastingClient.order(
                            group.first().orderUrl,
                            NedlastingOrderRequest(
                                email = request.email,
                                usageGroup = request.usageGroup,
                                orderLines = group.map { it.line },
                            ),
                        )
                    }
                }.awaitAll()

            DownloadOrderResult(responses)
        }

    suspend fun getOptions(uuid: String, capabilitiesURL: String): DownloadOptions =
        coroutineScope {
            val capabilities = getCapabilities(capabilitiesURL, uuid)
            val formatsUrl = capabilities.linkFor("http://rel.geonorge.no/download/format")
                ?: throw DownloadException("Fant ingen codelist/format-URL for datasett $uuid")
            val areasUrl = capabilities.linkFor("http://rel.geonorge.no/download/area")
                ?: throw DownloadException("Fant ingen codelist/area-URL for datasett $uuid")
            val formatsDeferred = async { nedlastingClient.getFormats(formatsUrl) }
            val areasDeferred = async { nedlastingClient.getAreas(areasUrl) }

            val formats = formatsDeferred.await()
            val areas = areasDeferred.await()

            DownloadOptions(
                areas = areas.map { NedlastingArea(code = it.code, name = it.name, type = it.type) },
                formats = formats.map { DownloadFormatOption(name = it.name, projections = it.projections) },
            )
        }

    private suspend fun resolveOrderLine(item: DownloadOrderItem): ResolvedOrderLine {
        val capabilities = nedlastingClient.getCapabilities(item.uuid)
        val orderUrl =
            capabilities.linkFor(ORDER_REL)
                ?: throw DownloadException("Fant ingen bestillings-URL for datasett ${item.uuid}")

        return ResolvedOrderLine(
            orderUrl = orderUrl,
            supportsBundling = capabilities.supportsDownloadBundling,
            line =
                NedlastingOrderLine(
                    metadataUuid = item.uuid,
                    areas = item.areas,
                    projections = item.projections,
                    formats = item.formats,
                    usagePurpose = item.usagePurpose,
                    coordinates = item.coordinates,
                    clipperFile = item.clipperFile,
                ),
        )
    }

    suspend fun getInsightGroups(): NedlastingInsightGroups {
        val formal = downloadInsightGroupsResolver.getValues("formal")
        val brukergrupper = downloadInsightGroupsResolver.getValues("brukergrupper")

        return NedlastingInsightGroups(
            formal = formal?.toList() ?: emptyList(),
            brukergrupper = brukergrupper?.toList() ?: emptyList(),
        )
    }
    suspend fun getCapabilities(capabilitiesURL: String, uuid: String): NedlastingCapabilities {
        val path = "${capabilitiesURL.trimEnd('/')}/$uuid"
        val response = getResponse(path)

        if (!response.status.isSuccess()) {
            log.warn("Request to {} failed with status: {}", path, response.status)
            throw NedlastingException("Request to $path failed with status ${response.status}")
        }

        return try {
            json.decodeFromString(NedlastingCapabilities.serializer(), response.bodyAsText())
        } catch (e: Exception) {
            log.error("Failed to parse capabilities response from {}", path, e)
            throw NedlastingException("Failed to parse capabilities response from $path", e)
        }
    }

    private suspend fun getResponse(path: String): HttpResponse =
        try {
            httpClient.get(path)
        } catch (e: Exception) {
            throw Exception("Response request to $path failed", e)
        }

}


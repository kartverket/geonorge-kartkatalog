package no.kartverket.geonorge.kartkatalog.download

import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingArea
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingClient
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingInsightGroups
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingOrderLine
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingOrderRequest

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
    private val nedlastingClient: NedlastingClient,
    private val downloadInsightGroupsResolver: DownloadInsightGroupsResolver,
) {
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

    suspend fun getOptions(uuid: String): DownloadOptions =
        coroutineScope {
            val formatsDeferred = async { nedlastingClient.getFormats(uuid) }
            val areasDeferred = async { nedlastingClient.getAreas(uuid) }

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
}

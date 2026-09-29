package no.kartverket.geonorge.kartkatalog.download

import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.AREA_REL
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingClient
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingInsightGroups
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingOrderLine
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingOrderRequest
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.ORDER_REL
import org.slf4j.LoggerFactory

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
    private val log = LoggerFactory.getLogger(DownloadService::class.java)

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

    suspend fun getOptions(
        uuid: String,
        capabilitiesUrl: String,
    ): DownloadOptions {
        val capabilities = nedlastingClient.getCapabilities(capabilitiesUrl, uuid)
        val areasUrl = capabilities.linkFor(AREA_REL)

        if (areasUrl == null) {
            log.warn("No area codelist URL found for dataset {}, returning no areas", uuid)
            return DownloadOptions(areas = emptyList())
        }

        return DownloadOptions(
            areas =
                nedlastingClient.getAreas(areasUrl).map { area ->
                    DownloadAreaOption(
                        code = area.code,
                        name = area.name,
                        type = area.type,
                        projections = area.projections,
                        formats =
                            area.formats.map { format ->
                                DownloadFormatOption(name = format.name, projections = format.projections)
                            },
                    )
                },
        )
    }

    private suspend fun resolveOrderLine(item: DownloadOrderItem): ResolvedOrderLine {
        val capabilities = nedlastingClient.getCapabilities(item.uuid)
        val orderUrl =
            capabilities.linkFor(ORDER_REL)
                ?: throw DownloadException("No order URL found for dataset ${item.uuid}")

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

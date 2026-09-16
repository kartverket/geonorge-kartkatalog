package no.kartverket.geonorge.kartkatalog.download

import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingClient
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingOrderLine
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingOrderRequest

private const val ORDER_REL = "http://rel.geonorge.no/download/order"

class DownloadException(
    message: String,
) : RuntimeException(message)

class DownloadService(
    private val nedlastingClient: NedlastingClient,
) {
    suspend fun order(request: DownloadOrderRequest): DownloadOrderResult =
        coroutineScope {
            val orderLinesByUrl =
                request.items
                    .map { item -> async { resolveOrderLine(item) } }
                    .awaitAll()
                    .groupBy({ (orderUrl, _) -> orderUrl }, { (_, line) -> line })

            val responses =
                orderLinesByUrl.map { (orderUrl, lines) ->
                    async {
                        nedlastingClient.order(
                            orderUrl,
                            NedlastingOrderRequest(
                                email = request.email,
                                usageGroup = request.usageGroup,
                                orderLines = lines,
                            ),
                        )
                    }
                }.awaitAll()

            DownloadOrderResult(responses)
        }

    private suspend fun resolveOrderLine(item: DownloadOrderItem): Pair<String, NedlastingOrderLine> {
        val capabilities = nedlastingClient.getCapabilities(item.uuid)
        val orderUrl =
            capabilities.linkFor(ORDER_REL)
                ?: throw DownloadException("Fant ingen bestillings-URL for datasett ${item.uuid}")

        return orderUrl to
            NedlastingOrderLine(
                metadataUuid = item.uuid,
                areas = item.areas,
                projections = item.projections,
                formats = item.formats,
                usagePurpose = item.usagePurpose,
                coordinates = item.coordinates,
                clipperFile = item.clipperFile,
            )
    }
}

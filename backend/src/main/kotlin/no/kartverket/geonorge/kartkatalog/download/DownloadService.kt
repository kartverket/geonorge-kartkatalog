package no.kartverket.geonorge.kartkatalog.download

import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.AREA_REL
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingArea
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingClient
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingException
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingFormat
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingInsightGroups
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingOrderLine
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingOrderRequest
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingProjection
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

            val results =
                groups
                    .map { group -> async { orderGroup(request, group) } }
                    .awaitAll()

            DownloadOrderResult(results)
        }

    private suspend fun orderGroup(
        request: DownloadOrderRequest,
        group: List<ResolvedOrderLine>,
    ): DownloadOrderGroupResult {
        val metadataUuids = group.map { it.line.metadataUuid }

        return try {
            val response =
                nedlastingClient.order(
                    group.first().orderUrl,
                    NedlastingOrderRequest(
                        email = request.email,
                        usageGroup = request.usageGroup,
                        orderLines = group.map { it.line },
                    ),
                )

            DownloadOrderGroupResult.Success(
                DownloadOrderResponse(
                    files =
                        response.files.map { file ->
                            DownloadOrderFile(
                                status = file.status,
                                downloadUrl = file.downloadUrl,
                                name = file.name,
                                areaName = file.areaName,
                                projectionName = file.projectionName,
                                format = file.format,
                                metadataUuid = file.metadataUuid,
                                metadataName = file.metadataName,
                            )
                        },
                    links =
                        response.links.map { link ->
                            DownloadOrderLink(
                                href = link.href,
                                rel = link.rel,
                            )
                        },
                ),
            )
        } catch (e: NedlastingException) {
            log.warn("Order failed for group with url {}", group.first().orderUrl, e)
            DownloadOrderGroupResult.Failure(
                metadataUuids = metadataUuids,
                message = e.message ?: "Bestillingen feilet",
            )
        }
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
                        area =
                            DownloadArea(
                                code = area.code,
                                name = area.name,
                                type = area.type,
                            ),
                        projections =
                            area.projections.map { projection ->
                                DownloadProjectionOption(
                                    code = projection.code,
                                    name = projection.name,
                                    codespace = projection.codespace,
                                    formats =
                                        (projection.formats?.takeIf { it.isNotEmpty() } ?: area.formats).map { format ->
                                            DownloadFormatOption(name = format.name)
                                        },
                                )
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
                    areas =
                        item.areas.map { area ->
                            NedlastingArea(
                                code = area.code,
                                name = area.name,
                                type = area.type,
                            )
                        },
                    projections =
                        item.projections.map { projection ->
                            NedlastingProjection(
                                code = projection.code,
                                name = projection.name,
                                codespace = projection.codespace,
                            )
                        },
                    formats =
                        item.formats.map { format ->
                            NedlastingFormat(
                                code = format.code,
                                name = format.name,
                                type = format.type,
                            )
                        },
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

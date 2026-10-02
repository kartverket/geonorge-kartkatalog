package no.kartverket.geonorge.kartkatalog.download

import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import org.slf4j.LoggerFactory

class DownloadException(
    message: String,
) : RuntimeException(message)

class DownloadAuthenticationRequiredException : RuntimeException("Authentication is required for restricted downloads")

private data class ResolvedOrderLine(
    val orderUrl: String,
    val supportsBundling: Boolean,
    val restricted: Boolean,
    val line: DownloadApiOrderLine,
)

class DownloadService(
    private val downloadApiClient: DownloadApiClient,
    private val downloadInsightGroupsResolver: DownloadInsightGroupsResolver,
) {
    private val log = LoggerFactory.getLogger(DownloadService::class.java)

    suspend fun order(
        request: DownloadOrderRequest,
        geoIdAccessToken: String? = null,
    ): DownloadOrderResult =
        coroutineScope {
            val resolved =
                request.items
                    .map { item -> async { resolveOrderLine(item) } }
                    .awaitAll()
            val restricted = resolved.any { it.restricted }
            if (restricted && geoIdAccessToken == null) {
                throw DownloadAuthenticationRequiredException()
            }

            val (bundlable, individual) = resolved.partition { it.supportsBundling }
            val groups = bundlable.groupBy { it.orderUrl to it.restricted }.values + individual.map { listOf(it) }

            val results =
                groups
                    .map { group -> async { orderGroup(request, group, geoIdAccessToken) } }
                    .awaitAll()

            DownloadOrderResult(results)
        }

    private suspend fun orderGroup(
        request: DownloadOrderRequest,
        group: List<ResolvedOrderLine>,
        geoIdAccessToken: String?,
    ): DownloadOrderGroupResult {
        val metadataUuids = group.map { it.line.metadataUuid }
        val groupIsRestricted = group.any { it.restricted }

        return try {
            val response =
                downloadApiClient.order(
                    group.first().orderUrl,
                    DownloadApiOrderRequest(
                        email = request.email,
                        usageGroup = request.usageGroup,
                        orderLines = group.map { it.line },
                    ),
                    if (groupIsRestricted) geoIdAccessToken else null,
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
        } catch (e: DownloadException) {
            log.warn("Order failed for group with url {}", group.first().orderUrl, e)
            DownloadOrderGroupResult.Failure(
                metadataUuids = metadataUuids,
                message = e.message ?: "Bestillingen feilet",
            )
        } catch (e: DownloadApiException) {
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
        val capabilities = downloadApiClient.getCapabilities(capabilitiesUrl, uuid)
        val areasUrl = capabilities.linkFor(AREA_REL)

        if (areasUrl == null) {
            log.warn("No area codelist URL found for dataset {}, returning no areas", uuid)
            return DownloadOptions(areas = emptyList())
        }

        return DownloadOptions(
            areas =
                downloadApiClient.getAreas(areasUrl).map { area ->
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
        val capabilities = downloadApiClient.getCapabilities(item.capabilitiesUrl, item.uuid)
        val orderUrl =
            capabilities.linkFor(ORDER_REL)
                ?: throw DownloadException("No order URL found for dataset ${item.uuid}")

        return ResolvedOrderLine(
            orderUrl = orderUrl,
            supportsBundling = capabilities.supportsDownloadBundling,
            restricted = !capabilities.accessConstraintRequiredRole.isNullOrBlank(),
            line =
                DownloadApiOrderLine(
                    metadataUuid = item.uuid,
                    areas =
                        item.areas.map { area ->
                            DownloadApiArea(
                                code = area.code,
                                name = area.name,
                                type = area.type,
                            )
                        },
                    projections =
                        item.projections.map { projection ->
                            DownloadApiProjection(
                                code = projection.code,
                                name = projection.name,
                                codespace = projection.codespace,
                            )
                        },
                    formats =
                        item.formats.map { format ->
                            DownloadApiFormat(
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

    suspend fun getInsightGroups(): DownloadInsightGroups {
        val formal = downloadInsightGroupsResolver.getValues("formal")
        val brukergrupper = downloadInsightGroupsResolver.getValues("brukergrupper")

        return DownloadInsightGroups(
            formal = formal?.toList() ?: emptyList(),
            brukergrupper = brukergrupper?.toList() ?: emptyList(),
        )
    }
}

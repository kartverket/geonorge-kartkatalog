package no.kartverket.geonorge.kartkatalog.download

import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import no.kartverket.geonorge.kartkatalog.metrics.countEvent
import org.slf4j.LoggerFactory

class DownloadException(
    message: String,
) : RuntimeException(message)

class DownloadAuthenticationRequiredException : RuntimeException("Authentication is required for restricted downloads")

private const val GENERIC_ORDER_FAILURE_MESSAGE =
    "Bestillingen feilet. Prøv igjen, eller kontakt oss hvis problemet vedvarer."

private data class ResolvedOrderLine(
    val orderUrl: String,
    val supportsBundling: Boolean,
    val restricted: Boolean,
    val line: DownloadApiOrderLine,
)

class DownloadService(
    private val downloadApiClient: DownloadApiClient,
    private val downloadApiV4Client: DownloadApiV4Client,
    private val downloadInsightGroupsResolver: DownloadInsightGroupsResolver,
) {
    private val log = LoggerFactory.getLogger(DownloadService::class.java)

    suspend fun order(
        request: DownloadOrderRequest,
        accessToken: String? = null,
        downloadApiVersion: String = "v3"
    ): DownloadOrderResult =
        coroutineScope {
            val resolved =
                request.items
                    .map { item -> async { resolveOrderLine(item) } }
                    .awaitAll()
            val restricted = resolved.any { it.restricted }
            if (restricted && accessToken == null) {
                countEvent("download.orders.auth_required", "Restricted download orders rejected for missing login")
                throw DownloadAuthenticationRequiredException()
            }

            val (bundlable, individual) = resolved.partition { it.supportsBundling }
            val groups = bundlable.groupBy { it.orderUrl to it.restricted }.values + individual.map { listOf(it) }

            val results =
                groups
                    .map { group -> async { orderGroup(request, group, accessToken, downloadApiVersion) } }
                    .awaitAll()

            DownloadOrderResult(results)
        }

    private suspend fun orderGroup(
        request: DownloadOrderRequest,
        group: List<ResolvedOrderLine>,
        accessToken: String?,
        downloadApiVersion: String,
    ): DownloadOrderGroupResult {
        val metadataUuids = group.map { it.line.metadataUuid }
        val groupIsRestricted = group.any { it.restricted }

        fun failure(
            message: String,
            outcome: String = "failure",
        ): DownloadOrderGroupResult.Failure {
            recordGroupOutcome(outcome, groupIsRestricted)
            return DownloadOrderGroupResult.Failure(metadataUuids = metadataUuids, message = message)
        }

        return try {
            val response =
                if (downloadApiVersion == "v4") {
                    downloadApiV4Client.order(
                        DownloadApiV4Order(
                            email = request.email,
                            usageGroup = request.usageGroup,
                            orderLines = group.map { it.line.toV4() },
                        ),
                        accessToken //Different because v4 wants to know who made the order anyway
                    ).let {
                        DownloadApiOrderResponse(
                            files = it.files.map { file ->
                                DownloadApiOrderFile(
                                    status = file.status ?: "Unknown", //TODO: sjekk om det gir mening
                                    downloadUrl = file.downloadUrl,
                                    name = file.name,
                                    areaName = file.areaName,
                                    projectionName = file.projectionName,
                                    format = file.format,
                                    metadataUuid = file.metadataUuid,
                                    metadataName = file.metadataName,
                                )
                            },
                            links = it.links.map { link ->
                                DownloadApiLink(
                                    href = link.href,
                                    rel = link.rel,
                                )
                            },
                        )
                    }
                } else {
                downloadApiClient.order(
                    group.first().orderUrl,
                    DownloadApiOrderRequest(
                        email = request.email,
                        usageGroup = request.usageGroup,
                        orderLines = group.map { it.line },
                    ),
                    if (groupIsRestricted) accessToken else null,
                )
            }

            val verifiedFiles =
                coroutineScope {
                    response.files
                        .map { file ->
                            async {
                                if (file.status == "ReadyForDownload" && file.downloadUrl != null) {
                                    val availability = downloadApiClient.checkAvailability(file.downloadUrl)
                                    if (availability == DownloadApiClient.DownloadAvailability.CONFIRMED_UNAVAILABLE) {
                                        file.copy(status = "Failed", downloadUrl = null)
                                    } else {
                                        file
                                    }
                                } else if (file.status == "ReadyForDownload") {
                                    // Oppstrøms tjeneste har noen ganger meldt filen klar uten å oppgi url
                                    file.copy(status = "Failed", downloadUrl = null)
                                } else {
                                    file
                                }
                            }
                        }.awaitAll()
                }

            recordGroupOutcome("success", groupIsRestricted)
            DownloadOrderGroupResult.Success(
                DownloadOrderResponse(
                    files =
                        verifiedFiles.map { file ->
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
        } catch (e: DownloadAccessDeniedException) {
            log.info("Order denied for group with url {}: {}", group.first().orderUrl, e.message)
            failure("Du mangler tilgang til ett eller flere av disse datasettene.", outcome = "denied")
        } catch (e: DownloadException) {
            log.warn("Order failed for group with url {}", group.first().orderUrl, e)
            failure(GENERIC_ORDER_FAILURE_MESSAGE)
        } catch (e: DownloadApiException) {
            log.warn("Order failed for group with url {}", group.first().orderUrl, e)
            failure(GENERIC_ORDER_FAILURE_MESSAGE)
        }
    }

    private fun recordGroupOutcome(
        outcome: String,
        restricted: Boolean,
    ) = countEvent(
        "download.orders",
        "Download order groups sent to the download API",
        "outcome" to outcome,
        "restricted" to restricted.toString(),
    )

    suspend fun getOptions(
        uuid: String,
        capabilitiesUrl: String,
        downloadApiVersion: String = "v3",
    ): DownloadOptions {
        val capabilities = if(downloadApiVersion == "v4") {
            downloadApiV4Client.getCapabilities( uuid).let {
                DownloadApiCapabilities(
                    supportsPolygonSelection = it.supportsPolygonSelection,
                    deliveryNotificationByEmail = it.deliveryNotificationByEmail,
                    mapSelectionLayer = it.mapSelectionLayer,
                    supportsDownloadBundling = it.supportsDownloadBundling,
                    accessConstraintRequiredRole = it.accessConstraintRequiredRole,
                    links = it.links.map { link ->
                        DownloadApiLink(
                            href = link.href,
                            rel = link.rel,
                        )
                    },
                )
            }
        } else {
            downloadApiClient.getCapabilities(capabilitiesUrl, uuid)
        }
        val areasUrl = capabilities.linkFor(AREA_REL)

        if (areasUrl == null) {
            log.warn("No area codelist URL found for dataset {}, returning no areas", uuid)
            return DownloadOptions(
                areas = emptyList(),
                supportsPolygonSelection = capabilities.supportsPolygonSelection,
                deliveryNotificationByEmail = capabilities.deliveryNotificationByEmail,
                gridSelectionLayer = capabilities.mapSelectionLayer?.takeIf { it.isNotBlank() },
                maxAreaKm2 = capabilities.maxArea,
            )
        }

        return DownloadOptions(
            areas =
                downloadApiClient.getAreas(areasUrl).map { area -> //TODO: v4 client
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
            supportsPolygonSelection = capabilities.supportsPolygonSelection,
            deliveryNotificationByEmail = capabilities.deliveryNotificationByEmail,
            gridSelectionLayer = capabilities.mapSelectionLayer?.takeIf { it.isNotBlank() },
            maxAreaKm2 = capabilities.maxArea,
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

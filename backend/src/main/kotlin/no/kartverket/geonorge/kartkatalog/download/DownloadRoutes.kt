package no.kartverket.geonorge.kartkatalog.download

import io.ktor.http.HttpStatusCode
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class DownloadOrderAreaDto(
    val code: String,
    val name: String,
    val type: String? = null,
)

@Serializable
data class DownloadOrderProjectionDto(
    val code: String,
    val name: String,
    val codespace: String? = null,
)

@Serializable
data class DownloadOrderFormatDto(
    val code: String? = null,
    val name: String,
    val type: String? = null,
)

@Serializable
data class DownloadOrderItemDto(
    val uuid: String,
    val areas: List<DownloadOrderAreaDto> = emptyList(),
    val projections: List<DownloadOrderProjectionDto> = emptyList(),
    val formats: List<DownloadOrderFormatDto> = emptyList(),
    val usagePurpose: List<String> = emptyList(),
    val coordinates: String? = null,
    val clipperFile: String? = null,
)

@Serializable
data class DownloadOrderRequestDto(
    val email: String = "",
    val usageGroup: String? = null,
    val items: List<DownloadOrderItemDto>,
)

@Serializable
data class DownloadOrderResponseDto(
    val orders: List<DownloadOrderGroupResultDto>,
)

@Serializable
data class DownloadOrderGroupResultDto(
    val status: String,
    val files: List<DownloadOrderFileDto> = emptyList(),
    @SerialName("_links")
    val links: List<DownloadOrderLinkDto> = emptyList(),
    val metadataUuids: List<String> = emptyList(),
    val message: String? = null,
)

@Serializable
data class DownloadOrderFileDto(
    val status: String,
    val downloadUrl: String? = null,
    val name: String? = null,
    val areaName: String? = null,
    val projectionName: String? = null,
    val format: String? = null,
    val metadataUuid: String? = null,
    val metadataName: String? = null,
)

@Serializable
data class DownloadOrderLinkDto(
    val href: String,
    val rel: String,
)

@Serializable
data class DownloadOptionsDto(
    val areas: List<DownloadAreaOptionDto>,
)

@Serializable
data class DownloadAreaOptionDto(
    val area: DownloadAreaDto,
    val projections: List<DownloadProjectionOptionDto>,
)

@Serializable
data class DownloadAreaDto(
    val code: String,
    val name: String,
    val type: String? = null,
)

@Serializable
data class DownloadProjectionOptionDto(
    val code: String,
    val name: String,
    val codespace: String? = null,
    val formats: List<DownloadFormatOptionDto>,
)

@Serializable
data class DownloadFormatOptionDto(
    val name: String,
)

private fun DownloadOrderRequestDto.toDomain() =
    DownloadOrderRequest(
        email = email,
        usageGroup = usageGroup,
        items =
            items.map { item ->
                DownloadOrderItem(
                    uuid = item.uuid,
                    areas =
                        item.areas.map { area ->
                            DownloadOrderArea(
                                code = area.code,
                                name = area.name,
                                type = area.type,
                            )
                        },
                    projections =
                        item.projections.map { projection ->
                            DownloadOrderProjection(
                                code = projection.code,
                                name = projection.name,
                                codespace = projection.codespace,
                            )
                        },
                    formats =
                        item.formats.map { format ->
                            DownloadOrderFormat(
                                code = format.code,
                                name = format.name,
                                type = format.type,
                            )
                        },
                    usagePurpose = item.usagePurpose,
                    coordinates = item.coordinates,
                    clipperFile = item.clipperFile,
                )
            },
    )

private fun DownloadOrderResult.toDto() =
    DownloadOrderResponseDto(
        orders = results.map { it.toDto() },
    )

private fun DownloadOrderGroupResult.toDto(): DownloadOrderGroupResultDto =
    when (this) {
        is DownloadOrderGroupResult.Success ->
            DownloadOrderGroupResultDto(
                status = "ordered",
                files =
                    response.files.map { file ->
                        DownloadOrderFileDto(
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
                        DownloadOrderLinkDto(
                            href = link.href,
                            rel = link.rel,
                        )
                    },
            )

        is DownloadOrderGroupResult.Failure ->
            DownloadOrderGroupResultDto(
                status = "failed",
                metadataUuids = metadataUuids,
                message = message,
            )
    }

private fun DownloadOptions.toDto() =
    DownloadOptionsDto(
        areas =
            areas.map { option ->
                DownloadAreaOptionDto(
                    area =
                        DownloadAreaDto(
                            code = option.area.code,
                            name = option.area.name,
                            type = option.area.type,
                        ),
                    projections =
                        option.projections.map { projection ->
                            DownloadProjectionOptionDto(
                                code = projection.code,
                                name = projection.name,
                                codespace = projection.codespace,
                                formats =
                                    projection.formats.map { format ->
                                        DownloadFormatOptionDto(name = format.name)
                                    },
                            )
                        },
                )
            },
    )

fun Route.downloadRoutes(downloadService: DownloadService) {
    route("/api/download") {
        post("/order") {
            val body = call.receive<DownloadOrderRequestDto>()
            val result = downloadService.order(body.toDomain())
            call.respond(result.toDto())
        }

        get("/options/{uuid}") {
            val uuid =
                call.parameters["uuid"]?.takeIf { it.isNotBlank() }
                    ?: return@get call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Missing id"))

            val capabilitiesUrl =
                call.request.queryParameters["capabilitiesUrl"]?.takeIf { it.isNotBlank() }
                    ?: return@get call.respond(
                        HttpStatusCode.BadRequest,
                        mapOf("error" to "Missing capabilitiesUrl"),
                    )

            val options = downloadService.getOptions(uuid, capabilitiesUrl)
            call.respond(options.toDto())
        }
        get("/insight-groups") {
            call.respond(downloadService.getInsightGroups())
        }
    }
}

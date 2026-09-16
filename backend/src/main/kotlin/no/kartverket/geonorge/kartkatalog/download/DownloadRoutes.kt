package no.kartverket.geonorge.kartkatalog.download

import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.routing.Route
import io.ktor.server.routing.post
import io.ktor.server.routing.route
import kotlinx.serialization.Serializable
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingArea
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingFormat
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingOrderResponse
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingProjection

@Serializable
data class DownloadOrderItemDto(
    val uuid: String,
    val areas: List<NedlastingArea> = emptyList(),
    val projections: List<NedlastingProjection> = emptyList(),
    val formats: List<NedlastingFormat> = emptyList(),
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
    val orders: List<NedlastingOrderResponse>,
)

fun Route.downloadRoutes(downloadService: DownloadService) {
    route("/api/download") {
        post("/order") {
            val body = call.receive<DownloadOrderRequestDto>()

            val request =
                DownloadOrderRequest(
                    email = body.email,
                    usageGroup = body.usageGroup,
                    items =
                        body.items.map { item ->
                            DownloadOrderItem(
                                uuid = item.uuid,
                                areas = item.areas,
                                projections = item.projections,
                                formats = item.formats,
                                usagePurpose = item.usagePurpose,
                                coordinates = item.coordinates,
                                clipperFile = item.clipperFile,
                            )
                        },
                )

            val result = downloadService.order(request)
            call.respond(DownloadOrderResponseDto(result.responses))
        }
    }
}

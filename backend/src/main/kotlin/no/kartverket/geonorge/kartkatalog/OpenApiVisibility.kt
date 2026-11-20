package no.kartverket.geonorge.kartkatalog

import io.ktor.server.routing.Route
import io.ktor.server.routing.RouteSelector
import io.ktor.server.routing.RouteSelectorEvaluation
import io.ktor.server.routing.RoutingResolveContext
import io.ktor.server.routing.route

private object UndocumentedSelector : RouteSelector() {
    override suspend fun evaluate(
        context: RoutingResolveContext,
        segmentIndex: Int,
    ): RouteSelectorEvaluation = RouteSelectorEvaluation.Transparent

    override fun toString(): String = "(undocumented)"
}

/**
 * Registers the routes in [build] but leaves them, and everything nested below, out of the OpenAPI/Swagger docs.
 * The routes behave exactly as if they were registered directly on the receiver.
 */
fun Route.undocumented(build: Route.() -> Unit) {
    createChild(UndocumentedSelector).build()
}

/** Shorthand for `undocumented { route(path, build) }`. */
fun Route.undocumentedRoute(
    path: String,
    build: Route.() -> Unit,
) = undocumented { route(path, build) }

/** True if this route, or any of its ancestors, was registered through [undocumented]. */
val Route.isUndocumented: Boolean
    get() = generateSequence(this) { it.parent }.any { it.selector is UndocumentedSelector }

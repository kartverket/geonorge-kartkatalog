package no.kartverket.geonorge.kartkatalog

import io.ktor.http.HttpHeaders
import io.ktor.server.application.createRouteScopedPlugin
import io.ktor.server.request.path
import io.ktor.server.routing.Route
import io.ktor.server.routing.RouteSelector
import io.ktor.server.routing.RouteSelectorEvaluation
import io.ktor.server.routing.RoutingResolveContext
import io.ktor.server.routing.route
import kotlin.time.Instant

const val API_V1 = "/api/v1"

// When the unversioned public paths were superseded by API_V1.
private val UNVERSIONED_DEPRECATED_AT = Instant.parse("2026-11-06T00:00:00Z")

private class DeprecatedAliasConfig {
    var oldPrefix: String = ""
}

// Marks responses per RFC 9745 (Deprecation) and RFC 8288 (Link rel="successor-version").
private val DeprecatedAlias =
    createRouteScopedPlugin("DeprecatedAlias", ::DeprecatedAliasConfig) {
        val oldPrefix = pluginConfig.oldPrefix
        onCall { call ->
            val successor = API_V1 + call.request.path().removePrefix(oldPrefix)
            call.response.headers.append("Deprecation", "@${UNVERSIONED_DEPRECATED_AT.epochSeconds}")
            call.response.headers.append(HttpHeaders.Link, "<$successor>; rel=\"successor-version\"")
        }
    }

private data class DeprecatedAliasSelector(
    val oldPrefix: String,
) : RouteSelector() {
    override suspend fun evaluate(
        context: RoutingResolveContext,
        segmentIndex: Int,
    ): RouteSelectorEvaluation = RouteSelectorEvaluation.Transparent

    override fun toString(): String = "(deprecated alias of $API_V1)"
}

/**
 * Serves the routes in [build] at their pre-versioning location under [oldPrefix],
 * flagging every response as deprecated and pointing to the equivalent [API_V1] path.
 */
fun Route.deprecatedAlias(
    oldPrefix: String,
    build: Route.() -> Unit,
) {
    val alias = createChild(DeprecatedAliasSelector(oldPrefix))
    alias.install(DeprecatedAlias) { this.oldPrefix = oldPrefix }
    if (oldPrefix.isEmpty()) alias.build() else alias.route(oldPrefix, build)
}

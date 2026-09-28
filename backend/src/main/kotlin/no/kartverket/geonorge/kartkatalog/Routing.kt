package no.kartverket.geonorge.kartkatalog

import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.http.HttpHeaders
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationStopping
import io.ktor.server.response.respond
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import no.kartverket.geonorge.kartkatalog.config.AppConfig
import no.kartverket.geonorge.kartkatalog.download.DownloadAuthenticationRequiredException
import no.kartverket.geonorge.kartkatalog.download.DownloadInsightGroupsResolver
import no.kartverket.geonorge.kartkatalog.download.DownloadService
import no.kartverket.geonorge.kartkatalog.download.GeoIdUser
import no.kartverket.geonorge.kartkatalog.download.downloadRoutes
import no.kartverket.geonorge.kartkatalog.integrations.baat.BaatClient
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.GeonetworkClient
import no.kartverket.geonorge.kartkatalog.integrations.nedlasting.NedlastingClient
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.metadata.AreaResolver
import no.kartverket.geonorge.kartkatalog.metadata.CodeListTranslator
import no.kartverket.geonorge.kartkatalog.metadata.HvdResolver
import no.kartverket.geonorge.kartkatalog.metadata.LinkedDistributionsService
import no.kartverket.geonorge.kartkatalog.metadata.MetadataMapper
import no.kartverket.geonorge.kartkatalog.metadata.MetadataService
import no.kartverket.geonorge.kartkatalog.metadata.metadataRoutes
import no.kartverket.geonorge.kartkatalog.search.SearchService
import no.kartverket.geonorge.kartkatalog.search.searchRoutes

fun Application.configureRouting(appConfig: AppConfig) {
    val httpClient = HttpClient(CIO)
    val geonetworkClient = GeonetworkClient(httpClient, appConfig.geonetworkBaseUrl)
    val registerClient = RegisterClient(httpClient, appConfig.registerBaseUrl)
    val codeListTranslator = CodeListTranslator(registerClient)
    val areaResolver = AreaResolver(registerClient)
    val hvdResolver = HvdResolver(registerClient)
    val metadataMapper = MetadataMapper(codeListTranslator, appConfig.staticNorgeskartUrl)
    val metadataService = MetadataService(geonetworkClient, metadataMapper, registerClient)
    val solrClient = SolrClient(httpClient, appConfig.solrBaseUrl)
    val linkedDistributionsService = LinkedDistributionsService(solrClient, geonetworkClient)
    val searchService = SearchService(solrClient, areaResolver, hvdResolver)
    val nedlastingClient = NedlastingClient(httpClient, appConfig.nedlastingBaseUrl)
    val baatClient = BaatClient(httpClient, appConfig.baatBaseUrl)
    val downloadInsightGroupsResolver = DownloadInsightGroupsResolver(registerClient)
    val downloadService = DownloadService(nedlastingClient, downloadInsightGroupsResolver)

    monitor.subscribe(ApplicationStopping) { httpClient.close() }

    routing {
        get("/") {
            call.respondText("Hello, World!")
        }
        searchRoutes(searchService)
        metadataRoutes(metadataService, linkedDistributionsService)
        downloadRoutes(downloadService) { geoIdUserFromHeaders() }
        get("/api/geoid/me") {
            val geoIdUser = call.geoIdUserFromHeaders() ?: throw DownloadAuthenticationRequiredException()
            call.respond(baatClient.getUserInfo(geoIdUser))
        }
    }
}

private fun io.ktor.server.application.ApplicationCall.geoIdUserFromHeaders(): GeoIdUser? {
    val username = request.headers["X-GeoID-Username"]?.takeIf { it.isNotBlank() } ?: return null
    val authorization = request.headers[HttpHeaders.Authorization] ?: return null
    val accessToken =
        authorization.removePrefix("Bearer ").takeIf { it != authorization && it.isNotBlank() } ?: return null
    return GeoIdUser(username, accessToken)
}

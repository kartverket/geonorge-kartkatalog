package no.kartverket.geonorge.kartkatalog

import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.server.application.Application
import io.ktor.server.application.ApplicationStopping
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import no.kartverket.geonorge.kartkatalog.config.AppConfig
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.GeonetworkClient
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrClient
import no.kartverket.geonorge.kartkatalog.metadata.CodeListTranslator
import no.kartverket.geonorge.kartkatalog.metadata.LinkedDistributionsService
import no.kartverket.geonorge.kartkatalog.metadata.MetadataMapper
import no.kartverket.geonorge.kartkatalog.metadata.MetadataService
import no.kartverket.geonorge.kartkatalog.metadata.metadataRoutes

fun Application.configureRouting(appConfig: AppConfig) {
    val httpClient = HttpClient(CIO)
    val geonetworkClient = GeonetworkClient(httpClient, appConfig.geonetworkBaseUrl)
    val registerClient = RegisterClient(httpClient, appConfig.registerBaseUrl)
    val codeListTranslator = CodeListTranslator(registerClient)
    val metadataMapper = MetadataMapper(codeListTranslator, appConfig.staticNorgeskartUrl)
    val metadataService = MetadataService(geonetworkClient, metadataMapper, registerClient)
    val solrClient = SolrClient(httpClient, appConfig.solrBaseUrl)
    val linkedDistributionsService = LinkedDistributionsService(solrClient, geonetworkClient, codeListTranslator)

    monitor.subscribe(ApplicationStopping) { httpClient.close() }

    routing {
        get("/") {
            call.respondText("Hello, World!")
        }
        metadataRoutes(metadataService, linkedDistributionsService)
    }
}

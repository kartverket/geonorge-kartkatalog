package no.kartverket.geonorge.kartkatalog

import io.ktor.server.application.install
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.forwardedheaders.XForwardedHeaders
import no.kartverket.geonorge.kartkatalog.config.AppConfig
import no.kartverket.geonorge.kartkatalog.config.configureAuthentication
import no.kartverket.geonorge.kartkatalog.config.configureHttp
import no.kartverket.geonorge.kartkatalog.config.configureSerialization
import no.kartverket.geonorge.kartkatalog.config.configureStatusPages

fun main() {
    val config = AppConfig()

    embeddedServer(Netty, port = 8080) {
        install(XForwardedHeaders)
        configureHttp()
        configureSerialization()
        configureStatusPages()

        val authentication = configureAuthentication(config)
        configureRouting(config, authentication)
    }.start(wait = true)
}

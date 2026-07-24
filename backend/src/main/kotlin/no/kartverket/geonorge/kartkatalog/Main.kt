package no.kartverket.geonorge.kartkatalog

import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import no.kartverket.geonorge.kartkatalog.config.AppConfig
import no.kartverket.geonorge.kartkatalog.config.configureHttp
import no.kartverket.geonorge.kartkatalog.config.configureSerialization
import no.kartverket.geonorge.kartkatalog.config.configureStatusPages

fun main() {
    val config = AppConfig()

    embeddedServer(Netty, port = 8080) {
        configureHttp()
        configureSerialization()
        configureStatusPages()
        configureRouting(config)
    }.start(wait = true)
}

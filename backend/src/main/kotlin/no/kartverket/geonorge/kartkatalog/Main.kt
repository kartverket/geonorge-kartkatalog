package no.kartverket.geonorge.kartkatalog

import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import no.kartverket.geonorge.kartkatalog.config.configureHttp
import no.kartverket.geonorge.kartkatalog.config.configureSerialization
import no.kartverket.geonorge.kartkatalog.config.configureStatusPages
import no.kartverket.geonorge.kartkatalog.routes.configureRouting

fun main() {
    embeddedServer(Netty, port = 8080) {
        configureHttp()
        configureSerialization()
        configureStatusPages()
        configureRouting()
    }.start(wait = true)
}

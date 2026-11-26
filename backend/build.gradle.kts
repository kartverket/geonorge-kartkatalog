plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ktlint)
    alias(ktorLibs.plugins.ktor)
}

group = "no.kartverket.geonorge.kartkatalog"
version = "1.0.0-SNAPSHOT"

application {
    mainClass = "no.kartverket.geonorge.kartkatalog.MainKt"
}

kotlin {
    jvmToolchain(25)

    compilerOptions {
        freeCompilerArgs.add("-Xcontext-parameters")
        optIn.add("io.ktor.util.ExperimentalKtorApi")
    }
}

ktor {
    fatJar {
        archiveFileName.set("application.jar")
    }
    openApi {
        enabled = true
        // Inference duplicates parameters that are also documented in comments, so routes are documented explicitly.
        codeInferenceEnabled = false
    }
}

tasks.test {
    testLogging {
        events("passed", "skipped", "failed")
    }
}

dependencies {
    implementation(ktorLibs.server.auth.oidc)
    implementation(ktorLibs.server.callLogging)
    implementation(ktorLibs.server.callId)
    implementation(ktorLibs.server.contentNegotiation)
    implementation(ktorLibs.server.core)
    implementation(ktorLibs.server.cors)
    implementation(ktorLibs.server.forwardedHeader)
    implementation(ktorLibs.server.metrics.micrometer)
    implementation(ktorLibs.server.netty)
    implementation(ktorLibs.server.statusPages)
    implementation(ktorLibs.server.routingOpenapi)
    implementation(ktorLibs.server.swagger)
    implementation(libs.kotlinx.datetime)
    implementation(libs.logback.classic)
    implementation(libs.micrometer.registry.prometheus)
    implementation(libs.logstash.logback.encoder)
    implementation(ktorLibs.utils)

    implementation(ktorLibs.client.core)
    implementation(ktorLibs.client.cio)
    implementation(ktorLibs.client.contentNegotiation)
    implementation(ktorLibs.serialization.kotlinx.json)

    implementation("io.github.cdimascio:dotenv-kotlin:6.5.1")
    implementation("com.google.genai:google-genai:2.6.0")

    testImplementation(kotlin("test"))
    testImplementation(ktorLibs.server.testHost)
    testImplementation(ktorLibs.client.mock)

    // INFO: Tvinger opp Jackson for å tette CVE-er i versjonene avhengighetene drar inn.
    // Jackson 2 kommer fra auth.oidc, Jackson 3 fra logstash-logback-encoder.
    // Fjern linjene når avhengighetene selv bruker trygge versjoner.
    implementation(platform("com.fasterxml.jackson:jackson-bom:2.23.0"))
    implementation(platform("tools.jackson:jackson-bom:3.3.0"))
}

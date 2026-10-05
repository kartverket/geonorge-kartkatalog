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
    jvmToolchain(21)

    compilerOptions {
        freeCompilerArgs.add("-Xcontext-parameters")
        optIn.add("io.ktor.util.ExperimentalKtorApi")
    }
}

ktor {
    fatJar {
        archiveFileName.set("application.jar")
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
    implementation(ktorLibs.server.contentNegotiation)
    implementation(ktorLibs.server.core)
    implementation(ktorLibs.server.cors)
    implementation(ktorLibs.server.netty)
    implementation(ktorLibs.server.statusPages)
    implementation(libs.kotlinx.datetime)
    implementation(libs.logback.classic)
    implementation(ktorLibs.utils)

    implementation(ktorLibs.client.core)
    implementation(ktorLibs.client.cio)
    implementation(ktorLibs.client.contentNegotiation)
    implementation(ktorLibs.serialization.kotlinx.json)

    implementation("io.github.cdimascio:dotenv-kotlin:6.5.1")

    testImplementation(kotlin("test"))
    testImplementation(ktorLibs.server.testHost)
    testImplementation(ktorLibs.client.mock)

    // INFO: Guide gradle to use jackson 2.22.3 (up from 2.22.0 in our case) to mitigate CVE's
    // Jackson 2.22.0 was imported by auth.oidc. This line should be removed if auth.oidc updates to a secure version of jackson.
    implementation(platform("com.fasterxml.jackson:jackson-bom:2.22.3"))
}

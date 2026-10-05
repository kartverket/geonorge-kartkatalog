package no.kartverket.geonorge.kartkatalog.config

import io.github.cdimascio.dotenv.dotenv
import no.kartverket.geonorge.kartkatalog.download.DownloadTokenAllowlist

class AppConfig(
    private val overrides: Map<String, String> = emptyMap(),
) {
    private val dotenv =
        dotenv {
            ignoreIfMissing = true
        }

    val geonetworkBaseUrl: String = env("GEONETWORK_BASE_URL")
    val registerBaseUrl: String = env("REGISTER_BASE_URL")
    val solrBaseUrl: String = env("SOLR_BASE_URL")
    val staticNorgeskartUrl: String = env("NORGESKART_BASE_URL")

    val geoIdIssuer: String = env("GEOID_ISSUER")
    val geoIdClientId: String = env("GEOID_CLIENT_ID")
    val geoIdClientSecret: String = env("GEOID_CLIENT_SECRET")
    val publicBaseUrl: String = env("PUBLIC_BASE_URL")
    val authPublicBaseUrl: String = env("AUTH_PUBLIC_BASE_URL")
    val allowedDownloadClients: DownloadTokenAllowlist =
        DownloadTokenAllowlist.fromCommaSeparated(optionalEnv("ALLOWED_DOWNLOAD_CLIENTS"))

    private fun env(key: String): String =
        optionalEnv(key)
            ?: throw IllegalStateException(
                "Missing required environment variable: $key. Set it in .env or as an environment variable.",
            )

    private fun optionalEnv(key: String): String? = overrides[key] ?: dotenv[key]
}

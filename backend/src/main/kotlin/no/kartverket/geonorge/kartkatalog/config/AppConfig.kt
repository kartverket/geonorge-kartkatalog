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
    val metUrl: String = "https://data.csw.met.no/?"
    val registerBaseUrl: String = env("REGISTER_BASE_URL")
    val solrBaseUrl: String = env("SOLR_BASE_URL")
    val staticNorgeskartUrl: String = env("NORGESKART_BASE_URL")

    val geoIdIssuer: String = env("GEOID_ISSUER")
    val geoIdClientId: String = env("GEOID_CLIENT_ID")
    val geoIdClientSecret: String = env("GEOID_CLIENT_SECRET")
    val publicBaseUrl: String = env("PUBLIC_BASE_URL")
    val allowedDownloadClients: DownloadTokenAllowlist =
        DownloadTokenAllowlist.fromCommaSeparated(optionalEnv("ALLOWED_DOWNLOAD_CLIENTS"))

    val tokenExchangeUrl: String = env("TOKEN_EXCHANGE_URL")

    val vectorSearchConfig =
        VectorSearchConfig(
            enabled =
                optionalEnv("VECTOR_SEARCH_ENABLED")
                    ?.toBooleanStrictOrNull() ?: false,
            similarityFunction = "dot_product",
            cosineThreshold = 0.56,
            rerankWeight = 80,
            topK = 200,
        )

    val vertexAIConfig: VertexAIConfig? =
        if (vectorSearchConfig.enabled) {
            VertexAIConfig(
                projectId = env("VERTEX_AI_PROJECT_ID"),
                location = "europe-north1",
                model = "text-multilingual-embedding-002",
                timeoutMillis = 30_000,
            )
        } else {
            null
        }

    private fun env(key: String): String =
        optionalEnv(key)
            ?: throw IllegalStateException(
                "Missing required environment variable: $key. Set it in .env or as an environment variable.",
            )

    private fun optionalEnv(key: String): String? = overrides[key] ?: dotenv[key]
}

data class VertexAIConfig(
    val projectId: String,
    val location: String,
    val model: String,
    val timeoutMillis: Int,
)

data class VectorSearchConfig(
    val enabled: Boolean,
    val similarityFunction: String,
    val cosineThreshold: Double,
    val rerankWeight: Int,
    val topK: Int,
)

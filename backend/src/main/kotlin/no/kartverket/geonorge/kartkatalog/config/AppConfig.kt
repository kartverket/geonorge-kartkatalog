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
    val allowedDownloadClients: DownloadTokenAllowlist =
        DownloadTokenAllowlist.fromCommaSeparated(optionalEnv("ALLOWED_DOWNLOAD_CLIENTS"))

    val tokenExchangeUrl: String = env("TOKEN_EXCHANGE_URL")

    val vectorSearchConfig =
        VectorSearchConfig(
            enabled =
                optionalEnv("VECTOR_SEARCH_ENABLED")
                    ?.toBooleanStrictOrNull() ?: true,
            similarityFunction =
                optionalEnv("VECTOR_SIMILARITY_FUNCTION")
                    ?: "dot_product",
            cosineThreshold =
                optionalEnv("VECTOR_COSINE_THRESHOLD")
                    ?.toDoubleOrNull() ?: 0.56,
            rerankWeight =
                optionalEnv("VECTOR_RERANK_WEIGHT")
                    ?.toIntOrNull() ?: 80,
            topK =
                optionalEnv("VECTOR_TOP_K")
                    ?.toIntOrNull() ?: 200,
        )

    val vertexAIConfig: VertexAIConfig? =
        if (vectorSearchConfig.enabled) {
            VertexAIConfig(
                projectId = env("VERTEX_AI_PROJECT_ID"),
                location = optionalEnv("VERTEX_AI_LOCATION") ?: "global",
                model =
                    optionalEnv("VERTEX_AI_EMBEDDING_MODEL")
                        ?: "text-multilingual-embedding-002",
                timeoutMillis =
                    optionalEnv("VERTEX_AI_TIMEOUT_MS")
                        ?.toIntOrNull() ?: 30_000,
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
    val location: String = "global",
    val model: String = "text-multilingual-embedding-002",
    val timeoutMillis: Int = 30_000,
)

data class VectorSearchConfig(
    val enabled: Boolean = false,
    val similarityFunction: String = "dot_product",
    val cosineThreshold: Double = 0.56,
    val rerankWeight: Int = 80,
    val topK: Int = 200,
)

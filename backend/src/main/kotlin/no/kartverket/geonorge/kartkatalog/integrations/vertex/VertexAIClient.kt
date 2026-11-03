package no.kartverket.geonorge.kartkatalog.integrations.vertex

import com.google.genai.Client
import com.google.genai.errors.ApiException
import com.google.genai.types.EmbedContentConfig
import com.google.genai.types.HttpOptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import no.kartverket.geonorge.kartkatalog.config.VertexAIConfig
import org.slf4j.LoggerFactory
import kotlin.coroutines.cancellation.CancellationException

class VertexAIClient(
    private val vertexConfig: VertexAIConfig,
) : AutoCloseable {
    private val log = LoggerFactory.getLogger(VertexAIClient::class.java)

    private val client =
        Client
            .builder()
            .vertexAI(true)
            .project(vertexConfig.projectId)
            .location(vertexConfig.location)
            .httpOptions(
                HttpOptions
                    .builder()
                    .apiVersion("v1")
                    .timeout(vertexConfig.timeoutMillis)
                    .build(),
            ).build()

    suspend fun embed(text: String): FloatArray? {
        if (text.isBlank()) return null
        return try {
            withContext(Dispatchers.IO) {
                val conf =
                    EmbedContentConfig
                        .builder()
                        .build()

                val response =
                    client.models.embedContent(
                        vertexConfig.model,
                        text,
                        conf,
                    )

                val values =
                    response
                        .embeddings()
                        .orElse(null)
                        ?.firstOrNull()
                        ?.values()
                        ?.orElse(null)

                if (values.isNullOrEmpty()) {
                    log.warn(
                        "Vertex AI embedding response contained no values",
                    )
                    null
                } else {
                    values.toFloatArray()
                }
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: ApiException) {
            log.warn(
                "Vertex AI embedding request failed with status {}",
                e.code(),
                e,
            )
            null
        } catch (e: Exception) {
            log.warn("Vertex AI embedding request failed", e)
            null
        }
    }

    override fun close() {
        client.close()
    }
}

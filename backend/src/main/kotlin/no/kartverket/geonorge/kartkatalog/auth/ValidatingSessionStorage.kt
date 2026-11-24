package no.kartverket.geonorge.kartkatalog.auth

import io.ktor.server.auth.oidc.OidcToken
import io.ktor.server.sessions.SessionStorage
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json

class InvalidGeoIdSessionException(
    message: String,
    cause: Throwable,
) : RuntimeException(message, cause)

class ValidatingSessionStorage(
    private val delegate: SessionStorage,
    private val json: Json = Json { ignoreUnknownKeys = true },
) : SessionStorage {
    override suspend fun write(
        id: String,
        value: String,
    ) = delegate.write(id, value)

    override suspend fun invalidate(id: String) = delegate.invalidate(id)

    override suspend fun read(id: String): String {
        val value = delegate.read(id)
        try {
            json.decodeFromString(OidcToken.Id.serializer(), value)
        } catch (e: SerializationException) {
            throw InvalidGeoIdSessionException("Ugyldig eller utdatert GeoID-sesjon", e)
        }
        return value
    }
}

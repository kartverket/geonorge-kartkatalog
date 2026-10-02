package no.kartverket.geonorge.kartkatalog.download

import java.net.URI

class DownloadTokenAllowlist private constructor(
    private val allowedOrigins: Set<Origin>,
) {
    fun permits(url: String): Boolean = Origin.fromUrl(url) in allowedOrigins

    companion object {
        fun fromCommaSeparated(origins: String?): DownloadTokenAllowlist =
            DownloadTokenAllowlist(
                origins
                    ?.split(',')
                    ?.map(String::trim)
                    ?.filter(String::isNotEmpty)
                    ?.map(Origin::fromConfiguration)
                    ?.toSet()
                    ?: emptySet(),
            )
    }

    private data class Origin(
        val scheme: String,
        val host: String,
        val port: Int,
    ) {
        companion object {
            fun fromConfiguration(value: String): Origin {
                val uri = parse(value)
                require(
                    (uri.path.isNullOrEmpty() || uri.path == "/") &&
                        uri.query == null &&
                        uri.fragment == null &&
                        uri.userInfo == null,
                ) {
                    "Allowed download client must be an origin without path, query, fragment, or user info: $value"
                }
                return fromUri(uri, value)
            }

            fun fromUrl(value: String): Origin? = runCatching { fromUri(parse(value), value) }.getOrNull()

            private fun parse(value: String): URI =
                try {
                    URI(value)
                } catch (e: Exception) {
                    throw IllegalArgumentException("Invalid download client URL: $value", e)
                }

            private fun fromUri(
                uri: URI,
                value: String,
            ): Origin {
                require(uri.scheme.equals("https", ignoreCase = true)) {
                    "Download client URL must use HTTPS: $value"
                }
                require(!uri.host.isNullOrBlank()) { "Download client URL must include a host: $value" }

                return Origin(
                    scheme = uri.scheme.lowercase(),
                    host = uri.host.lowercase(),
                    port = if (uri.port == -1) 443 else uri.port,
                )
            }
        }
    }
}

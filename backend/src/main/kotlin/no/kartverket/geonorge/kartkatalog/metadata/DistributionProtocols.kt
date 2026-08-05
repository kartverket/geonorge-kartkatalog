package no.kartverket.geonorge.kartkatalog.metadata

object DistributionProtocols {
    // usikker på disse, hentet fra gamle repoet
    private val VIEW_SERVICES =
        setOf(
            "OGC:WMS",
            "OGC:WMTS",
            "WMS-C",
        )
    private val DOWNLOAD_SERVICES =
        setOf(
            "OGC:WFS",
            "OGC:WCS",
            "W3C:REST",
            "W3C:WS",
            "W3C:AtomFeed",
        )

    fun isViewService(protocol: String?): Boolean = protocol != null && protocol in VIEW_SERVICES

    fun isDownloadService(protocol: String?): Boolean =
        protocol != null && (
            protocol in DOWNLOAD_SERVICES ||
                protocol.startsWith("OGC:API")
        )
}

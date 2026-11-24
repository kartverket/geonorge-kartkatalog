package no.kartverket.geonorge.kartkatalog.metadata

/**
 * Nasjonale initiativ (samarbeid og lover). Rekkefølgen styrer rekkefølgen på søkefilteret.
 */
object NationalInitiatives {
    data class Initiative(
        /** Verdien slik den kommer fra søkeindeksen, f.eks. "arealplanerPBL". */
        val facetValue: String,
        val label: String,
        /** Vises som kategori-tag øverst på produktsiden. */
        val showAsProductTag: Boolean = false,
    )

    val all: List<Initiative> =
        listOf(
            Initiative("Det offentlige kartgrunnlaget", "Det offentlige kartgrunnlaget"),
            Initiative("Geodata", "Geografiske data"),
            Initiative("High value dataset", "High value dataset"),
            Initiative("Jordobservasjon og miljø", "Jordobservasjon og miljø"),
            Initiative("Norge digitalt", "Norge digitalt"),
            Initiative("Norsk klimaservicesenter", "Norsk klimaservicesenter"),
            Initiative("arealplanerPBL", "Arealplaner underlagt PBL"),
            Initiative("Nautisk informasjon", "Nautisk informasjon"),
            Initiative("MarineGrunnkart", "Marine grunnkart", showAsProductTag = true),
            Initiative("arcticSDI", "Arctic SDI"),
            Initiative("beredskapsbase", "Beredskapsbase"),
            Initiative("Inspire", "Inspire"),
            Initiative("dataNorgeNo", "Data.norge.no"),
            Initiative("geodataloven", "Geodataloven"),
            Initiative("Mareano", "Mareano", showAsProductTag = true),
            Initiative("modellbaserteVegprosjekter", "Modellbaserte vegprosjekter"),
            Initiative("ØkologiskGrunnkart", "Økologisk grunnkart", showAsProductTag = true),
        )

    private val byNormalizedValue = all.associateBy { it.facetValue.normalized() }

    /** Slår opp uavhengig av mellomrom og store/små bokstaver, siden nøkkelord i metadata varierer. */
    fun find(value: String): Initiative? = byNormalizedValue[value.normalized()]

    private fun String.normalized(): String = replace(" ", "").lowercase()
}

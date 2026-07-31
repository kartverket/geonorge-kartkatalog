package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.register.CodeList
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import kotlin.coroutines.cancellation.CancellationException

class CodeListTranslator(
    private val registerClient: RegisterClient,
) {
    suspend fun translate(
        codeList: CodeList,
        value: String?,
    ): String? {
        val codeValue = value?.takeIf { it.isNotBlank() } ?: return null

        val codeListItems =
            try {
                registerClient.getCodeList(codeList).containedItems
            } catch (e: CancellationException) {
                throw e
            } catch (_: Exception) {
                null
            }

        return codeListItems
            ?.firstOrNull { item ->
                item.effectiveCodeValue.equals(codeValue, ignoreCase = true) ||
                    item.label.equals(codeValue, ignoreCase = true)
            }?.label
            ?: codeValue
    }
}


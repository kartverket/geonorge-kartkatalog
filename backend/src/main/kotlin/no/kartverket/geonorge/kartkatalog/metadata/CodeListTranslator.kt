package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.register.CodeList
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterClient
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterCodeListItem
import org.slf4j.LoggerFactory
import kotlin.coroutines.cancellation.CancellationException

class CodeListTranslator(
    private val registerClient: RegisterClient,
) {
    private val log = LoggerFactory.getLogger(CodeListTranslator::class.java)
    private val codeListCache = TimedCache<CodeList, List<RegisterCodeListItem>>(ttlMillis = 24 * 60 * 60 * 1000)

    suspend fun translate(
        codeList: CodeList,
        value: String?,
    ): String? {
        val codeValue = value?.takeIf { it.isNotBlank() } ?: return null
        return translate(getCodeListItems(codeList), codeValue)
    }

    fun translate(
        codeListItems: List<RegisterCodeListItem>?,
        value: String?,
    ): String? {
        val codeValue = value?.takeIf { it.isNotBlank() } ?: return null
        return findItem(codeListItems, codeValue)?.label ?: codeValue
    }

    suspend fun findItem(
        codeList: CodeList,
        value: String?,
    ): RegisterCodeListItem? {
        val codeValue = value?.takeIf { it.isNotBlank() } ?: return null
        return findItem(getCodeListItems(codeList), codeValue)
    }

    fun findItem(
        codeListItems: List<RegisterCodeListItem>?,
        value: String?,
    ): RegisterCodeListItem? {
        val codeValue =
            value?.takeIf { it.isNotBlank() }
                ?: return null

        return codeListItems?.firstOrNull { item ->
            item.effectiveCodeValue.equals(
                codeValue,
                ignoreCase = true,
            ) ||
                item.label.equals(codeValue, ignoreCase = true)
        }
    }

    suspend fun getCodeListItems(codeList: CodeList): List<RegisterCodeListItem>? =
        codeListCache.getOrFetch(codeList) {
            try {
                registerClient.getCodeList(codeList).containedItems
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                log.warn("Failed to fetch code list {}", codeList, e)
                null
            }
        }
}

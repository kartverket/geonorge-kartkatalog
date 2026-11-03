package no.kartverket.geonorge.kartkatalog.integrations.solr

private val solrSpecialChars =
    charArrayOf('+', '-', '&', '|', '!', '(', ')', '{', '}', '[', ']', '^', '"', '~', '*', '?', ':', '\\', '/')

internal fun escapeSolrSpecialChars(input: String): String =
    buildString {
        input.forEach { char ->
            if (char in solrSpecialChars) append('\\')
            append(char)
        }
    }

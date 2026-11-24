package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.Contact
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.DistributionFormat
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.KeywordGroup
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.LegalConstraints
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.OnlineResource
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.ReferenceSystem
import no.kartverket.geonorge.kartkatalog.integrations.register.CodeList
import no.kartverket.geonorge.kartkatalog.metadata.models.AccessState
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductBoundingBox
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductConstraints
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductDistributionEntry
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductDistributionFormat
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductDistributionGroup
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductKeyword
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductMetadata
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductMetadataContact
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductReferenceSystem
import no.kartverket.geonorge.kartkatalog.metadata.models.ProductValidityPeriod

class MetadataMapper(
    private val codeListTranslator: CodeListTranslator,
) {
    private data class ResourceContribution(
        val formatName: String,
        val resource: OnlineResource,
    )

    suspend fun toProductMetadata(record: MetadataRecord): ProductMetadata {
        val accessState = resolveAccessState(record)
        val rawSpatialScope = mapRawSpatialScope(record)
        val spatialScope = mapSpatialScope(rawSpatialScope)
        val collaborationKeywords = mapCollaborationKeywords(record)
        val hvdKeywords = mapHvdKeywords(record)
        return ProductMetadata(
            title = record.title,
            organization = record.metadataContact.organization.orEmpty(),
            hierarchyLevel = record.hierarchyLevel,
            seriesType = record.hierarchyLevelName,
            accessState = accessState,
            datePublished = record.dates.firstOrNull { it.type == "publication" }?.date,
            dateUpdated = record.dates.firstOrNull { it.type == "revision" }?.date,
            dateMetadataUpdated = record.dateStamp.takeIf { it.isNotBlank() },
            validityPeriod = mapValidityPeriod(record),
            geographicAreas =
                mapKeywords(
                    record,
                ) { it.type.equals("place", ignoreCase = true) }.mapNotNull { it.keywordValue },
            boundingBox =
                record.boundingBox?.let {
                    ProductBoundingBox(
                        westBoundLongitude = it.westBoundLongitude,
                        eastBoundLongitude = it.eastBoundLongitude,
                        southBoundLatitude = it.southBoundLatitude,
                        northBoundLatitude = it.northBoundLatitude,
                    )
                },
            cloudCoverPercentage = record.cloudCoverPercentage,
            maintenanceFrequency =
                codeListTranslator.translate(
                    CodeList.MAINTENANCE_FREQUENCY,
                    record.maintenanceFrequency,
                ),
            spatialRepresentation =
                codeListTranslator.translate(
                    CodeList.SPATIAL_REPRESENTATIONS,
                    record.spatialRepresentationTypes.firstOrNull(),
                ),
            spatialScope = spatialScope,
            resolutionScale = record.resolutionScale,
            keywordsTheme = mapThemeKeywords(record),
            nationalKeywords = mapNationalKeywords(record),
            nationalInitiatives = mapNationalInitiatives(collaborationKeywords),
            dokStatus = mapDokStatus(collaborationKeywords, rawSpatialScope),
            collaborationAndLaws = mapCollaboration(collaborationKeywords),
            datasetLanguage = mapLanguage(record.resourceLanguages.firstOrNull() ?: record.language),
            namespace = record.resourceIdentifierCodeSpace,
            datasetId = record.resourceIdentifierCode,
            isHighValueDataset = hvdKeywords.isNotEmpty(),
            distributionFormats =
                record.distributionInfo?.formats.orEmpty().map {
                    it.toProductDistributionFormat()
                },
            referenceSystems =
                mapReferenceSystems(record.referenceSystems),
            distributionGroups = mapDistributionGroups(record),
            thumbnailUrl = pickThumbnailUrl(record),
            fairStatusPercentFromMetadata = findFairPercent(record),
            abstractText = record.abstract,
            purpose = record.purpose,
            specificUsage = record.specificUsage,
            supplementalDescription = record.supplementalDescription,
            helpUrl =
                record.findExtensionUrl("hjelp"),
            productPageUrl = record.findExtensionUrl("produktside")?.let(::withHttpsScheme),
            processHistory = record.processHistory,
            constraints = record.legalConstraints?.toProductConstraints(accessState = accessState),
            securityClassification =
                codeListTranslator.translate(
                    CodeList.CLASSIFICATION,
                    record.securityConstraints?.classification,
                ),
            contactMetadata = record.metadataContact.toProductMetadataContact(),
            contactOwner =
                record.contacts
                    .firstOrNull { it.role.equals("owner", ignoreCase = true) }
                    ?.toProductMetadataContact(),
            contactPublisher =
                record.contacts
                    .firstOrNull { it.role.equals("publisher", ignoreCase = true) }
                    ?.toProductMetadataContact(),
            coverageData = getCoverageLinks(record.extensionResources),
        )
    }

    private fun mapValidityPeriod(record: MetadataRecord): ProductValidityPeriod? {
        val extent = record.temporalExtents.firstOrNull() ?: return null
        val from = extent.begin.takeUnless { it.isNullOrBlank() || it == "unknown" }
        val to = extent.end.takeUnless { it.isNullOrBlank() || it == "unknown" }
        return if (from == null && to == null) null else ProductValidityPeriod(from = from, to = to)
    }

//    private fun describeAccessConstraints(
//        recordAccessConstraints: String?,
//        accessState: AccessState?,
//    ): String =
//        when {
//            accessState == AccessState.OPEN -> "Åpne data"
//            accessState == AccessState.RESTRICTED -> "Norge digitalt-begrenset"
//            else -> recordAccessConstraints ?: "-"
//        }

    private suspend fun describeUseConstraints(
        useConstraints: String?,
        otherConstraintsLink: String?,
    ): String? {
        val code = if (!otherConstraintsLink.isNullOrEmpty()) "license" else useConstraints
        return codeListTranslator.translate(CodeList.RESTRICTIONS, code)
    }

    private suspend fun mapThemeKeywords(record: MetadataRecord): List<ProductKeyword> =
        record.keywordGroups
            .filter { it.type.equals("theme", ignoreCase = true) }
            .let { themeGroups ->
                val inspireCodeListItems =
                    if (themeGroups.any { it.isInspireTheme() }) {
                        codeListTranslator.getCodeListItems(CodeList.INSPIRE)
                    } else {
                        null
                    }

                themeGroups
                    .flatMap { group ->
                        group.keywords.map { keyword ->
                            ProductKeyword(
                                keywordValue =
                                    if (group.isInspireTheme()) {
                                        codeListTranslator.translate(
                                            inspireCodeListItems,
                                            keyword.value,
                                        ) ?: keyword.value
                                    } else {
                                        keyword.value
                                    },
                                type = group.type,
                            )
                        }
                    }
            }

    private fun mapNationalKeywords(record: MetadataRecord): List<ProductKeyword> =
        mapKeywords(record) {
            it.thesaurus.equals("Nasjonal tematisk inndeling (DOK-kategori)", ignoreCase = true)
        }

    private fun mapCollaborationKeywords(record: MetadataRecord): List<ProductKeyword> =
        mapKeywords(record) {
            it.thesaurusHref?.contains("samarbeid-og-lover", ignoreCase = true) == true
        }

    private fun mapHvdKeywords(record: MetadataRecord): List<ProductKeyword> =
        mapKeywords(record) {
            it.thesaurusHref?.contains("data.europa.eu/bna/", ignoreCase = true) == true
        }

    private fun mapNationalInitiatives(collaborationKeywords: List<ProductKeyword>): List<String> {
        val matched =
            collaborationKeywords
                .mapNotNull { it.keywordValue?.let(NationalInitiatives::find) }
                .toSet()
        return NationalInitiatives.all
            .filter { it.showAsProductTag && it in matched }
            .map { it.label }
    }

    private fun mapCollaboration(collaborationKeywords: List<ProductKeyword>): List<String> =
        collaborationKeywords
            .mapNotNull { it.keywordValue?.takeIf(String::isNotBlank) }
            .map { NationalInitiatives.find(it)?.label ?: it }
            .distinct()

    private val languageLabels =
        mapOf(
            "nor" to "Norsk",
            "nob" to "Norsk bokmål",
            "nno" to "Norsk nynorsk",
            "eng" to "Engelsk",
            "sme" to "Nordsamisk",
            "swe" to "Svensk",
            "dan" to "Dansk",
        )

    private fun mapLanguage(code: String?): String? {
        val value = code?.takeIf { it.isNotBlank() } ?: return null
        return languageLabels[value.lowercase()] ?: value
    }

    private fun mapDokStatus(
        collaborationKeywords: List<ProductKeyword>,
        rawSpatialScope: String?,
    ): String? {
        val isDok =
            collaborationKeywords.any {
                it.keywordValue.equals("Det offentlige kartgrunnlaget", ignoreCase = true)
            }
        return when {
            !isDok -> null
            rawSpatialScope.equals("Local", ignoreCase = true) -> "Lokalt DOK-datasett"
            else -> "DOK-datasett"
        }
    }

    private val spatialScopeTranslations =
        mapOf(
            "European" to "Europeisk",
            "Global" to "Global",
            "Local" to "Lokal",
            "National" to "Nasjonal",
            "Regional" to "Regional",
        )

    private fun mapRawSpatialScope(record: MetadataRecord): String? =
        mapKeywords(record) {
            it.thesaurus?.equals("Spatial scope", ignoreCase = true) == true ||
                it.thesaurusHref?.contains("SpatialScope", ignoreCase = true) == true
        }.firstOrNull()?.keywordValue

    private fun mapSpatialScope(rawSpatialScope: String?): String? =
        rawSpatialScope?.let { raw -> spatialScopeTranslations[raw] ?: raw }

    private fun mapKeywords(
        record: MetadataRecord,
        predicate: (KeywordGroup) -> Boolean,
    ): List<ProductKeyword> =
        record.keywordGroups
            .filter(predicate)
            .flatMap { group ->
                group.keywords.map { keyword ->
                    ProductKeyword(
                        keywordValue = keyword.value,
                        type = group.type,
                    )
                }
            }

    private fun KeywordGroup.isInspireTheme(): Boolean =
        thesaurusHref?.contains("inspire.ec.europa.eu/theme", ignoreCase = true) == true ||
            thesaurus?.contains("INSPIRE themes", ignoreCase = true) == true

    private suspend fun mapDistributionGroups(record: MetadataRecord): List<ProductDistributionGroup> =
        record.distributionInfo
            ?.formats
            .orEmpty()
            .flatMap { format ->
                format.onlineResources.map { resource ->
                    ResourceContribution(formatName = format.name, resource = resource)
                }
            }.groupBy { it.resource.protocol?.takeIf(String::isNotBlank) }
            .map { (protocol, contributions) ->
                val distributionType =
                    codeListTranslator.findItem(
                        CodeList.DISTRIBUTION_TYPES,
                        protocol,
                    )
                ProductDistributionGroup(
                    protocol = protocol,
                    protocolName = distributionType?.label ?: protocol.orEmpty(),
                    protocolDescription = distributionType?.description,
                    entries = mapDistributionEntries(contributions, record.uuid),
                    unitsOfDistribution =
                        contributions.firstNotNullOfOrNull {
                            it.resource.unitsOfDistribution?.takeIf(String::isNotBlank)
                        },
                )
            }

    private fun mapDistributionEntries(
        contributions: List<ResourceContribution>,
        uuid: String,
    ): List<ProductDistributionEntry> =
        contributions
            .mapNotNull { contribution ->
                contribution.resource.url.takeIf(String::isNotBlank)?.let { rawUrl ->
                    normalizeDistributionUrl(rawUrl, contribution.resource.protocol, uuid) to contribution.formatName
                }
            }.groupBy(
                keySelector = { it.first },
                valueTransform = { it.second },
            ).map { (url, formatNames) ->
                ProductDistributionEntry(
                    url = url,
                    formatNames = formatNames.distinct(),
                )
            }

    private fun normalizeDistributionUrl(
        url: String,
        protocol: String?,
        uuid: String,
    ): String =
        DistributionProtocols.appendUuidForGeonorgeDownload(
            url,
            protocol,
            uuid,
        )

    private fun DistributionFormat.toProductDistributionFormat() =
        ProductDistributionFormat(
            name = name,
            version = version,
        )

    private suspend fun mapReferenceSystems(referenceSystems: List<ReferenceSystem>): List<ProductReferenceSystem> {
        if (referenceSystems.isEmpty()) return emptyList()
        val items = codeListTranslator.getCodeListItems(CodeList.COORDINATE_SYSTEMS)
        return referenceSystems.map { rs ->
            val item =
                codeListTranslator.findItem(items, rs.codeSpace)
                    ?: codeListTranslator.findItem(items, rs.code)
            ProductReferenceSystem(
                code = rs.code,
                codeSpace = rs.codeSpace,
                title = item?.label,
            )
        }
    }

    private fun Contact.toProductMetadataContact() =
        ProductMetadataContact(
            name = name,
            email = email,
            organization = organization,
            organizationEnglish = organizationEnglish,
        )

    private suspend fun LegalConstraints.toProductConstraints(accessState: AccessState?) =
        ProductConstraints(
            accessConstraints = describeAccessConstraints(this.accessConstraints, accessState),
            useConstraints =
                describeUseConstraints(
                    this.useConstraints,
                    this.otherConstraintsLink,
                ),
            useLimitations = useLimitations,
            otherConstraintsLink = otherConstraintsLink,
            otherConstraintsLinkText = otherConstraintsLinkText,
            otherConstraintsAccess = otherConstraintsAccess,
        )

    private fun findFairPercent(record: MetadataRecord): Int? =
        record.dataQualityMeasures
            .firstOrNull { it.nameOfMeasure == "Prosentvis oppfyllelse av FAIR-prinsipper" }
            ?.value

    private fun pickThumbnailUrl(record: MetadataRecord): String? {
        fun pickFrom(prefix: String): String? {
            val matches =
                record.thumbnails.filter {
                    it.url.startsWith(prefix, ignoreCase = true)
                }
            return matches.firstOrNull { it.type.equals("medium", ignoreCase = true) }?.url
                ?: matches.firstOrNull()?.url
        }

        return pickFrom("https://editor.geonorge.no/thumbnails/")
            ?: pickFrom("https://editor.test.geonorge.no/thumbnails/")
    }
}

package no.kartverket.geonorge.kartkatalog.metadata

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.Contact
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.KeywordGroup
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.OnlineResource
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.ReferenceSystem
import no.kartverket.geonorge.kartkatalog.integrations.register.CodeList
import no.kartverket.geonorge.kartkatalog.integrations.register.RegisterCodeListItem
import no.kartverket.geonorge.kartkatalog.integrations.solr.RelatedServiceReference
import no.kartverket.geonorge.kartkatalog.integrations.solr.SolrDocument
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyBoundingBox
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyConstraints
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyContact
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyDatasetService
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyDistribution
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyDistributionDetails
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyDistributionFormat
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyDistributionFormatGrouped
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyDistributionFormatItem
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyDistributionViewModel
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyDistributions
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyKeyword
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyMetadataViewModel
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyOperation
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyQualitySpecification
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyReferenceSystem
import no.kartverket.geonorge.kartkatalog.metadata.models.LegacyThumbnail

class LegacyMetadataMapper(
    private val staticNorgeskartUrl: String,
    private val codeListTranslator: CodeListTranslator,
    private val mapOnlyWms: Boolean,
) {
    suspend fun toLegacyMetadata(
        record: MetadataRecord,
        solrDocument: SolrDocument? = null,
    ): LegacyMetadataViewModel {
        val resources =
            record.distributionInfo?.formats.orEmpty().flatMap { format ->
                format.onlineResources.map { format to it }
            }
        val primary =
            resources.firstOrNull { (_, resource) ->
                resource.protocol in downloadProtocols
            } ?: resources.firstOrNull()
        val primaryResource = primary?.second
        val access = record.legalConstraints
        val restrictions = codeListTranslator.getCodeListItems(CodeList.RESTRICTIONS)
        val normalizedAccessConstraints =
            access?.accessConstraints.normalizedLegacyAccessConstraint(
                access?.accessConstraintsLink,
            )
        val open =
            normalizedAccessConstraints.equals("no restrictions", ignoreCase = true)
        val restricted =
            normalizedAccessConstraints.equals("norway digital restricted", ignoreCase = true) ||
                normalizedAccessConstraints.equals("restricted", ignoreCase = true)
        val protected =
            normalizedAccessConstraints.equals("restricted", ignoreCase = true) ||
                normalizedAccessConstraints.equals("Beskyttet", ignoreCase = true) ||
                normalizedAccessConstraints.equals("Personvern begrenset", ignoreCase = true) ||
                normalizedAccessConstraints.equals("Privacy restricted", ignoreCase = true)
        val accessConstraints =
            legacyRestriction(
                normalizedAccessConstraints,
                access?.otherConstraintsAccess,
                restrictions,
            )
        val useConstraints =
            legacyRestriction(
                if ((access?.useConstraintsLicenseLink ?: access?.otherConstraintsLink).isNullOrBlank()) {
                    access?.useConstraints
                } else {
                    "license"
                },
                null,
                restrictions,
            )
        val date = { type: String -> record.dates.firstOrNull { it.type.equals(type, true) }?.date }
        val owner = record.contacts.firstOrNull { it.role.equals("owner", true) }
        val publisher = record.contacts.firstOrNull { it.role.equals("publisher", true) }
        val coverageRaw = extensionUrl(record, "dekningsoversikt")
        val coverageGrid = extensionUrl(record, "dekningsoversikt rutenett")
        val distributionTypes = codeListTranslator.getCodeListItems(CodeList.DISTRIBUTION_TYPES)
        val translateDistribution = { protocol: String? ->
            codeListTranslator.findItem(distributionTypes, protocol)
        }
        val topicCategories =
            record.topicCategories.map {
                codeListTranslator.translate(CodeList.TOPIC_CATEGORIES, it) ?: it
            }
        val relatedServices = solrDocument?.datasetservice.orEmpty().mapNotNull(::parseRelatedService)
        val viewServices = relatedServices.filter { DistributionProtocols.isViewService(it.protocol) }
        val downloadServices = relatedServices.filter { DistributionProtocols.isDownloadService(it.protocol) }
        val ownViewService =
            resources.firstOrNull {
                    (_, resource) ->
                resource.protocol?.contains("OGC:WMS") == true
            }?.second
        val serviceDistributionProtocol =
            solrDocument?.serviceDistributionProtocolForDataset ?: ownViewService?.protocol
        val serviceDistributionUrl = solrDocument?.serviceDistributionUrlForDataset ?: ownViewService?.url
        val serviceDistributionName = solrDocument?.serviceDistributionNameForDataset ?: ownViewService?.name

        return LegacyMetadataViewModel(
            mapOnlyWms = mapOnlyWms,
            abstractText = record.abstract,
            boundingBox =
                record.boundingBox?.let {
                    LegacyBoundingBox(
                        it.eastBoundLongitude.toLegacyCoordinate(),
                        it.northBoundLatitude.toLegacyCoordinate(),
                        it.southBoundLatitude.toLegacyCoordinate(),
                        it.westBoundLongitude.toLegacyCoordinate(),
                    )
                },
            constraints =
                access?.let {
                    LegacyConstraints(
                        accessConstraints,
                        it.otherConstraints.orEmpty(),
                        it.otherConstraintsLink,
                        it.otherConstraintsLinkText,
                        codeListTranslator.translate(
                            CodeList.CLASSIFICATION,
                            record.securityConstraints?.classification,
                        ),
                        record.securityConstraints?.userNote.orEmpty(),
                        useConstraints,
                        it.useLimitations.joinToString("\n").ifBlank { null },
                        it.otherConstraintsAccess,
                    )
                },
            contactMetadata = record.metadataContact.toLegacyContact(),
            contactOwner = owner?.toLegacyContact(),
            organization = owner?.organization,
            organizationEnglish = owner?.organizationEnglish,
            contactOwners = record.contacts.filter { it.role.equals("owner", true) }.map { it.toLegacyContact() },
            contactPublisher = publisher?.toLegacyContact(),
            dateCreated = date("creation").asLegacyDateTime(),
            dateMetadataUpdated = record.dateStamp.asLegacyDateTime(),
            dateMetadataValidFrom = record.temporalExtents.firstOrNull()?.begin?.asLegacyDateTime(),
            dateMetadataValidTo =
                record.temporalExtents.firstOrNull()?.end?.takeUnless {
                    it.equals("unknown", true)
                }?.asLegacyDateTime(),
            datePublished = date("publication").asLegacyDateTime(),
            dateUpdated = date("revision").asLegacyDateTime(),
            distributionDetails =
                primaryResource?.toLegacyDetails(
                    translateDistribution(primaryResource.protocol)?.label,
                ),
            distributionProtocol = primaryResource?.protocol,
            protocol = translateDistribution(primaryResource?.protocol)?.label,
            distributionFormat =
                primary?.first?.let { format ->
                    LegacyDistributionFormat(format.name, format.version)
                },
            distributionFormats =
                record.distributionInfo?.formats?.map {
                    LegacyDistributionFormat(
                        it.name,
                        it.version,
                    )
                },
            distributionsFormats =
                resources.map {
                        (format, resource) ->
                    resource.toLegacyDistribution(
                        format.name,
                        format.version,
                        translateDistribution(resource.protocol)?.label,
                    )
                },
            distributionFormatsGrouped =
                resources.groupBy { it.second.protocol to it.second.organization }.map { (key, grouped) ->
                    val (protocol, organization) = key
                    val first = grouped.first().second
                    LegacyDistributionFormatGrouped(
                        protocolName = translateDistribution(protocol)?.label,
                        protocolDescription = translateDistribution(protocol)?.description,
                        protocol = protocol,
                        organization = organization.orEmpty(),
                        unitsOfDistribution = first.unitsOfDistribution.orEmpty(),
                        englishUnitsOfDistribution = first.englishUnitsOfDistribution.orEmpty(),
                        formats =
                            grouped.map {
                                LegacyDistributionFormatItem(
                                    formatName = it.first.name,
                                    formatVersion = it.first.version,
                                    url = it.second.url,
                                )
                            },
                        url = grouped.map { it.second.url }.distinct(),
                    )
                },
            unitsOfDistribution = primaryResource?.unitsOfDistribution,
            operations =
                record.serviceOperations.map {
                        operation ->
                    LegacyOperation(
                        operation.operationName,
                        operation.dcp.joinToString(",").ifBlank {
                            null
                        },
                        operation.connectPoints.firstOrNull()?.url,
                        operation.operationDescription,
                    )
                },
            referenceSystems = record.referenceSystems.map { it.toLegacyReferenceSystem(codeListTranslator) },
            englishAbstract = record.englishAbstract,
            englishTitle = record.englishTitle,
            norwegianTitle = record.title,
            hierarchyLevel = record.hierarchyLevel,
            type = record.hierarchyLevel,
            typeTranslated = record.hierarchyLevel.toLegacyType(),
            typeName = record.hierarchyLevelName,
            keywords = record.keywordGroups.toLegacyKeywords(),
            keywordsPlace = record.keywordGroups.toLegacyKeywords { it.type.equals("place", true) },
            keywordsTheme = record.keywordGroups.toLegacyKeywords { it.type.equals("theme", true) },
            keywordsInspire = record.keywordGroups.toLegacyKeywords { it.thesaurus?.contains("INSPIRE", true) == true },
            keywordsInspirePriorityDataset =
                record.keywordGroups.toLegacyKeywords {
                    it.thesaurus?.contains("priority", true) == true
                },
            keywordsHighValueDatasetCategories =
                record.keywordGroups.toLegacyKeywords {
                    it.thesaurusHref?.contains("data.europa.eu/bna", true) == true
                },
            keywordsNationalInitiative =
                record.keywordGroups.toLegacyKeywords { it.thesaurus?.contains("nasjonal", true) == true },
            keywordsNationalTheme =
                record.keywordGroups.toLegacyKeywords {
                    it.thesaurus?.contains("nasjonal tematisk", true) == true
                },
            keywordsOther =
                record.keywordGroups.toLegacyKeywords { group ->
                    group.type.isNullOrBlank() &&
                        !group.thesaurus.isLegacySpecialThesaurus()
                },
            keywordsConcept = record.keywordGroups.toLegacyKeywords { it.thesaurus?.contains("concept", true) == true },
            keywordsAdministrativeUnits =
                record.keywordGroups.toLegacyKeywords {
                    it.thesaurus?.contains("administrative", true) == true
                },
            spatialScope =
                record.keywordGroups.firstOrNull {
                    it.thesaurus?.equals("Spatial scope", true) == true
                }?.keywords?.firstOrNull()?.value,
            maintenanceFrequency =
                codeListTranslator.translate(
                    CodeList.MAINTENANCE_FREQUENCY,
                    record.maintenanceFrequency,
                ),
            legendDescriptionUrl = solrDocument?.legendDescriptionUrl ?: extensionUrl(record, "tegnforklaring"),
            datasetLanguage = record.resourceLanguages.firstOrNull(),
            metadataLanguage = record.language,
            metadataStandard = record.metadataStandard,
            metadataStandardVersion = record.metadataStandardVersion,
            operatesOn = record.operatesOn.map { it.uuidref },
            processHistory = record.processHistory,
            productPageUrl = solrDocument?.productPageUrl ?: extensionUrl(record, "produktside"),
            productSheetUrl = solrDocument?.productSheetUrl ?: extensionUrl(record, "produktark"),
            productSpecificationUrl =
                solrDocument?.productSpecificationUrl ?: extensionUrl(record, "produktspesifikasjon"),
            coverageUrl =
                getCoverageLink(record.extensionResources, staticNorgeskartUrl = staticNorgeskartUrl) ?: coverageRaw,
            coverageGridUrl = coverageGrid,
            coverageCellUrl = extensionUrl(record, "dekningsoversikt celle"),
            surveyAreaMapUrl = extensionUrl(record, "fullstendighetsdekningskart"),
            surveyAreaMapUrlWms = extensionUrl(record, "fullstendighetsdekningskart wms"),
            downloadUrl = primaryResource?.url,
            purpose = record.purpose,
            qualitySpecifications =
                record.qualitySpecifications.map {
                    LegacyQualitySpecification(
                        it.date.asLegacyDateTime(),
                        it.dateType,
                        it.explanation,
                        it.pass,
                        it.title,
                        it.specificationHref,
                    )
                },
            referenceSystem = record.referenceSystems.firstOrNull()?.toLegacyReferenceSystem(codeListTranslator),
            resolutionScale = record.resolutionScale,
            spatialRepresentation =
                codeListTranslator.translate(
                    CodeList.SPATIAL_REPRESENTATIONS,
                    record.spatialRepresentationTypes.firstOrNull(),
                ),
            specificUsage = record.specificUsage,
            status = codeListTranslator.translate(CodeList.STATUS, record.status),
            orderingInstructions = record.orderingInstructions.orEmpty(),
            supplementalDescription = record.supplementalDescription,
            helpUrl = extensionUrl(record, "hjelp"),
            thumbnails = record.thumbnails.map { LegacyThumbnail(it.type, it.url) },
            title = record.title,
            topicCategory = topicCategories.firstOrNull(),
            topicCategories = topicCategories.takeIf { it.isNotEmpty() },
            uuid = record.uuid,
            resourceReferenceCode = record.resourceReferenceCode,
            resourceReferenceCodespace = record.resourceReferenceCodespace,
            organizationLogoUrl = solrDocument?.organizationLogoUrl,
            serviceDistributionNameForDataset = serviceDistributionName,
            serviceDistributionUrlForDataset = serviceDistributionUrl,
            serviceDistributionProtocolForDataset = serviceDistributionProtocol,
            serviceDistributionAccessConstraint = solrDocument?.serviceDistributionAccessConstraint,
            serviceUuid =
                solrDocument?.serviceDistributionUuidForDataset
                    ?: if (record.hierarchyLevel == "service" && !record.parentIdentifier.isNullOrBlank()) {
                        record.parentIdentifier
                    } else {
                        record.uuid
                    },
            accessIsOpendata = open,
            accessIsRestricted = restricted,
            accessIsProtected = protected,
            dataAccess = accessConstraints,
            canShowMapUrl =
                primaryResource?.let {
                    it.protocol?.contains("OGC:WMS") == true || it.protocol?.contains("OGC:WFS") == true
                } == true,
            canShowDownloadUrl =
                primaryResource?.protocol?.let {
                    it.contains("WWW:DOWNLOAD") || it.contains("GEONORGE:FILEDOWNLOAD")
                } == true,
            canShowWebsiteUrl = resources.any { it.second.protocol?.contains("WWW:LINK") == true },
            canShowServiceMapUrl = viewServices.isNotEmpty(),
            mapLink = primaryResource?.url,
            serviceLink =
                legacyServiceLink(
                    record.hierarchyLevel,
                    serviceDistributionProtocol,
                    serviceDistributionUrl,
                    serviceDistributionName,
                ),
            distributionUrl = primaryResource?.url,
            distributions =
                LegacyDistributions(
                    relatedViewServices = viewServices.map { it.toLegacyDistribution() },
                    relatedDownloadServices = downloadServices.map { it.toLegacyDistribution() },
                ),
            datasetServicesWithShowMapLink = viewServices.map { it.toLegacyDatasetService() },
            serviceType = record.serviceType,
            parentIdentifier = record.parentIdentifier,
        )
    }

    private fun String?.normalizedLegacyAccessConstraint(accessConstraintsLink: String?): String? =
        when {
            accessConstraintsLink?.contains("noLimitations", ignoreCase = true) == true -> "no restrictions"
            accessConstraintsLink?.contains("INSPIRE_Directive_Article13_1d", ignoreCase = true) == true ->
                "norway digital restricted"
            accessConstraintsLink?.contains("INSPIRE_Directive_Article13_1b", ignoreCase = true) == true -> "restricted"
            else -> this
        }

    private fun legacyRestriction(
        value: String?,
        otherConstraintsAccess: String?,
        restrictions: List<RegisterCodeListItem>?,
    ): String? {
        val translated = codeListTranslator.translate(restrictions, value)
        val normalized = translated ?: return null
        val specialAccess =
            when {
                normalized.equals(
                    "restricted",
                    ignoreCase = true,
                ) -> "$INSPIRE_LIMITATIONS_ON_PUBLIC_ACCESS/INSPIRE_Directive_Article13_1b"
                normalized.equals("no restrictions", ignoreCase = true) ||
                    otherConstraintsAccess.equals("no restrictions", ignoreCase = true) ->
                    "$INSPIRE_LIMITATIONS_ON_PUBLIC_ACCESS/noLimitations"
                normalized.equals("norway digital restricted", ignoreCase = true) ||
                    otherConstraintsAccess.equals("norway digital restricted", ignoreCase = true) ->
                    "$INSPIRE_LIMITATIONS_ON_PUBLIC_ACCESS/INSPIRE_Directive_Article13_1d"
                else -> return normalized
            }
        return codeListTranslator.findItem(restrictions, specialAccess)?.label
            ?: when (specialAccess.substringAfterLast('/')) {
                "INSPIRE_Directive_Article13_1b" -> "Skjermede data"
                "noLimitations" -> "Åpne data"
                else -> "Norge digitalt begrenset"
            }
    }

    private fun Contact.toLegacyContact() = LegacyContact(email, name, organization, organizationEnglish, role)

    private fun OnlineResource.toLegacyDetails(protocolName: String?) =
        LegacyDistributionDetails(name, protocol, protocolName, url)

    private fun OnlineResource.toLegacyDistribution(
        formatName: String,
        formatVersion: String?,
        protocolName: String?,
    ) = LegacyDistributionViewModel(
        formatName = formatName,
        formatVersion = formatVersion,
        url = url,
        protocol = protocol,
        protocolName = protocolName,
        name = name,
        organization = organization,
        unitsOfDistribution = unitsOfDistribution,
        englishUnitsOfDistribution = englishUnitsOfDistribution,
    )

    private fun legacyServiceLink(
        hierarchyLevel: String,
        protocol: String?,
        url: String?,
        name: String?,
    ): String? {
        if (hierarchyLevel !in setOf("dataset", "series") || protocol.isNullOrBlank() || url.isNullOrBlank()) {
            return null
        }

        val serviceType =
            when {
                protocol.contains("OGC:WMS", ignoreCase = true) -> "wms"
                !mapOnlyWms && protocol.contains("OGC:WFS", ignoreCase = true) -> "wfs"
                else -> return null
            }
        return "#!?zoom=3&lon=306722&lat=7197864&$serviceType=${url.substringBefore('?')}" +
            name?.takeIf { it.isNotBlank() }?.let { "&addLayers=$it" }.orEmpty()
    }

    private fun RelatedServiceReference.toLegacyDistribution() =
        LegacyDistribution(
            uuid = uuid,
            title = name,
            type = "Tjeneste",
            typeTranslated = "Tjeneste",
            organization = organizationName,
            organizations = organizationName?.let(::listOf),
            canShowMapUrl = DistributionProtocols.isViewService(protocol),
            accessIsOpendata = accessIsOpendata,
            accessIsRestricted = accessIsRestricted,
            getCapabilitiesUrl = distributionUrl,
            protocol = protocol,
            distributionUrl = distributionUrl,
        )

    private fun RelatedServiceReference.toLegacyDatasetService() =
        LegacyDatasetService(
            uuid = uuid,
            title = name,
            distributionProtocol = protocol,
            getCapabilitiesUrl = distributionUrl,
        )

    private fun parseRelatedService(value: String): RelatedServiceReference? {
        val parts = value.split("|")
        val uuid = parts.getOrNull(0)?.takeIf { it.isNotBlank() } ?: return null
        return RelatedServiceReference(
            uuid = uuid,
            name = parts.getOrNull(1),
            organizationName = parts.getOrNull(4),
            protocol = parts.getOrNull(6),
            distributionUrl = parts.getOrNull(7),
            accessIsOpendata = parts.getOrNull(14)?.toBoolean() ?: false,
            accessIsRestricted = parts.getOrNull(15)?.toBoolean() ?: false,
        )
    }

    private fun List<KeywordGroup>.toLegacyKeywords(
        predicate: (KeywordGroup) -> Boolean = {
            true
        },
    ) = filter(predicate).flatMap { group ->
        group.keywords.map {
            LegacyKeyword(it.englishValue, it.value, group.thesaurus, group.type, it.href)
        }
    }

    private fun String?.isLegacySpecialThesaurus(): Boolean =
        this?.contains("INSPIRE", true) == true ||
            this?.contains("Nasjonal", true) == true ||
            this.equals("Spatial scope", true) ||
            this?.contains("concept", true) == true ||
            this?.contains("administrative", true) == true

    private suspend fun ReferenceSystem.toLegacyReferenceSystem(translator: CodeListTranslator) =
        LegacyReferenceSystem(
            coordinateSystem = translator.translate(CodeList.COORDINATE_SYSTEMS, code) ?: code,
            coordinateSystemUrl = codeSpace,
        )

    private fun Double.toLegacyCoordinate(): String = toString().replace('.', ',')

    private fun String?.asLegacyDateTime(): String? =
        this?.takeIf { it.isNotBlank() }?.let { value ->
            if (value.length == 10) "${value}T00:00:00" else value
        }

    private fun String.toLegacyType() =
        mapOf(
            "dataset" to "Datasett",
            "service" to "Tjeneste",
            "series" to "Datasettserie",
            "software" to "Applikasjon",
            "dimensionGroup" to "Datapakke",
        )[this] ?: this

    private fun extensionUrl(
        record: MetadataRecord,
        profile: String,
    ) = record.extensionResources.firstOrNull {
        it.applicationProfile.trim().equals(profile, true)
    }?.url

    private companion object {
        const val INSPIRE_LIMITATIONS_ON_PUBLIC_ACCESS =
            "http://inspire.ec.europa.eu/metadata-codelist/LimitationsOnPublicAccess"
        val downloadProtocols = setOf("GEONORGE:DOWNLOAD", "WWW:DOWNLOAD-1.0-http--download", "GEONORGE:FILEDOWNLOAD")
    }
}

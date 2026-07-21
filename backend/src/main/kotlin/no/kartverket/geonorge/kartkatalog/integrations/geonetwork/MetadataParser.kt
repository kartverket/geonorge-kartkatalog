package no.kartverket.geonorge.kartkatalog.integrations.geonetwork

import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.ApplicationSchemaInfo
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.BoundingBox
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.Contact
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.DataQualityMeasure
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.DistributionFormat
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.DistributionInfo
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.ExtensionResource
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.Keyword
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.KeywordGroup
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.LegalConstraints
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataDate
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.MetadataRecord
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.OnlineResource
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.OperatesOn
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.QualitySpecification
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.ReferenceSystem
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.SecurityConstraints
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.ServiceOperation
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.TemporalExtent
import no.kartverket.geonorge.kartkatalog.integrations.geonetwork.model.Thumbnail
import org.w3c.dom.Document
import org.w3c.dom.Node
import org.w3c.dom.NodeList
import java.io.InputStream
import javax.xml.namespace.NamespaceContext
import javax.xml.parsers.DocumentBuilderFactory
import javax.xml.xpath.XPath
import javax.xml.xpath.XPathConstants
import javax.xml.xpath.XPathFactory

object MetadataParser {
    fun parse(input: InputStream): MetadataRecord {
        val factory = DocumentBuilderFactory.newInstance().also { it.isNamespaceAware = true }
        val doc = factory.newDocumentBuilder().parse(input)
        return Parser(doc).parse()
    }

    private class Parser(
        doc: Document,
    ) {
        private val xpath: XPath =
            XPathFactory.newInstance().newXPath().also { it.namespaceContext = isoNamespaceContext }
        private val md: Node = xpath.node("//gmd:MD_Metadata", doc)!!

        fun parse(): MetadataRecord {
            val idInfo = md.node("gmd:identificationInfo/*")
            return MetadataRecord(
                uuid = md.text("gmd:fileIdentifier/gco:CharacterString") ?: "",
                parentIdentifier = md.text("gmd:parentIdentifier/gco:CharacterString"),
                language = md.attr("gmd:language/gmd:LanguageCode", "codeListValue") ?: "",
                characterSet =
                    md.attr("gmd:characterSet/gmd:MD_CharacterSetCode", "codeListValue"),
                hierarchyLevel =
                    md.attr("gmd:hierarchyLevel/gmd:MD_ScopeCode", "codeListValue") ?: "",
                hierarchyLevelName = md.text("gmd:hierarchyLevelName/gco:CharacterString"),
                metadataStandard = md.text("gmd:metadataStandardName/gco:CharacterString"),
                metadataStandardVersion =
                    md.text("gmd:metadataStandardVersion/gco:CharacterString"),
                dateStamp =
                    md.text("gmd:dateStamp/gco:Date")
                        ?: md.text("gmd:dateStamp/gco:DateTime")
                        ?: "",
                metadataContact = parseContact(md.node("gmd:contact/gmd:CI_ResponsibleParty")!!),
                referenceSystems = parseReferenceSystems(),
                extensionResources = parseExtensionResources(),
                applicationSchemaInfos = parseApplicationSchemaInfos(),
                title =
                    idInfo?.text("gmd:citation/gmd:CI_Citation/gmd:title/gco:CharacterString")
                        ?: "",
                abstract = idInfo?.text("gmd:abstract/gco:CharacterString"),
                purpose = idInfo?.text("gmd:purpose/gco:CharacterString"),
                status = idInfo?.attr("gmd:status/gmd:MD_ProgressCode", "codeListValue"),
                maintenanceFrequency =
                    idInfo?.attr(
                        "gmd:resourceMaintenance/gmd:MD_MaintenanceInformation" +
                            "/gmd:maintenanceAndUpdateFrequency/gmd:MD_MaintenanceFrequencyCode",
                        "codeListValue",
                    ),
                resolutionScale = parseResolutionScale(idInfo),
                specificUsage =
                    idInfo?.text(
                        "gmd:resourceSpecificUsage/gmd:MD_Usage" +
                            "/gmd:specificUsage/gco:CharacterString",
                    ),
                processHistory =
                    md.text(
                        "gmd:dataQualityInfo/gmd:DQ_DataQuality/gmd:lineage" +
                            "/gmd:LI_Lineage/gmd:statement/gco:CharacterString",
                    ),
                contacts =
                    idInfo
                        ?.nodes("gmd:pointOfContact/gmd:CI_ResponsibleParty")
                        ?.map { parseContact(it) }
                        ?: emptyList(),
                dates =
                    idInfo
                        ?.nodes("gmd:citation/gmd:CI_Citation/gmd:date/gmd:CI_Date")
                        ?.map { parseDate(it) }
                        ?: emptyList(),
                thumbnails =
                    idInfo
                        ?.nodes("gmd:graphicOverview/gmd:MD_BrowseGraphic")
                        ?.map { parseThumbnail(it) }
                        ?: emptyList(),
                keywordGroups =
                    idInfo
                        ?.nodes("gmd:descriptiveKeywords/gmd:MD_Keywords")
                        ?.map { parseKeywordGroup(it) }
                        ?: emptyList(),
                legalConstraints = parseLegalConstraints(idInfo),
                securityConstraints = parseSecurityConstraints(idInfo),
                boundingBox = parseBoundingBox(idInfo),
                temporalExtents = parseTemporalExtents(idInfo),
                resourceLanguages =
                    idInfo
                        ?.nodes("gmd:language")
                        ?.mapNotNull { lang ->
                            lang.attr("gmd:LanguageCode", "codeListValue")
                                ?: lang.text("gco:CharacterString")
                        }
                        ?: emptyList(),
                topicCategories =
                    idInfo
                        ?.nodes("gmd:topicCategory/gmd:MD_TopicCategoryCode")
                        ?.mapNotNull { it.textContent.trim().takeIf { s -> s.isNotEmpty() } }
                        ?: emptyList(),
                spatialRepresentationTypes =
                    idInfo
                        ?.nodes(
                            "gmd:spatialRepresentationType" +
                                "/gmd:MD_SpatialRepresentationTypeCode",
                        )?.mapNotNull { it.attr("codeListValue") }
                        ?: emptyList(),
                distributionInfo = parseDistributionInfo(),
                qualitySpecifications = parseQualitySpecifications(),
                dataQualityMeasures = parseDataQualityMeasures(),
                serviceType = idInfo?.text("srv:serviceType/gco:LocalName"),
                serviceTypeVersion =
                    idInfo?.text("srv:serviceTypeVersion/gco:CharacterString"),
                couplingType =
                    idInfo?.attr("srv:couplingType/srv:SV_CouplingType", "codeListValue"),
                orderingInstructions =
                    idInfo?.text(
                        "srv:accessProperties/gmd:MD_StandardOrderProcess" +
                            "/gmd:orderingInstructions/gco:CharacterString",
                    ),
                serviceOperations = parseServiceOperations(idInfo),
                operatesOn =
                    idInfo
                        ?.nodes("srv:operatesOn")
                        ?.map { node ->
                            OperatesOn(
                                uuidref = node.attr("uuidref") ?: "",
                                href = node.attr("xlink:href"),
                            )
                        }
                        ?: emptyList(),
            )
        }

        private fun parseReferenceSystems(): List<ReferenceSystem> =
            md
                .nodes(
                    "gmd:referenceSystemInfo/gmd:MD_ReferenceSystem" +
                        "/gmd:referenceSystemIdentifier/gmd:RS_Identifier",
                ).map { rs ->
                    val anchor = rs.node("gmd:code/gmx:Anchor")
                    ReferenceSystem(
                        code =
                            anchor?.textContent?.trim()
                                ?: rs.text("gmd:code/gco:CharacterString")
                                ?: "",
                        codeSpace = anchor?.attr("xlink:href"),
                    )
                }

        private fun parseExtensionResources(): List<ExtensionResource> =
            md
                .nodes(
                    "gmd:metadataExtensionInfo/gmd:MD_MetadataExtensionInformation" +
                        "/gmd:extensionOnLineResource/gmd:CI_OnlineResource",
                ).map { or ->
                    ExtensionResource(
                        applicationProfile =
                            or.text("gmd:applicationProfile/gco:CharacterString") ?: "",
                        url = or.text("gmd:linkage/gmd:URL"),
                        name = or.text("gmd:name/gco:CharacterString"),
                        nameEnglish =
                            or.text(
                                "gmd:name/gmd:PT_FreeText/gmd:textGroup" +
                                    "/gmd:LocalisedCharacterString",
                            ),
                        protocol = or.text("gmd:protocol/gco:CharacterString"),
                    )
                }

        private fun parseApplicationSchemaInfos(): List<ApplicationSchemaInfo> =
            md
                .nodes("gmd:applicationSchemaInfo/gmd:MD_ApplicationSchemaInformation")
                .map { schema ->
                    ApplicationSchemaInfo(
                        name =
                            schema.text(
                                "gmd:name/gmd:CI_Citation/gmd:title/gco:CharacterString",
                            ),
                        schemaLanguage = schema.text("gmd:schemaLanguage/gco:CharacterString"),
                        constraintLanguage =
                            schema.text("gmd:constraintLanguage/gco:CharacterString"),
                    )
                }

        private fun parseContact(node: Node): Contact =
            Contact(
                name = node.text("gmd:individualName/gco:CharacterString"),
                organization = node.text("gmd:organisationName/gco:CharacterString"),
                organizationEnglish =
                    node.text(
                        "gmd:organisationName/gmd:PT_FreeText/gmd:textGroup" +
                            "/gmd:LocalisedCharacterString",
                    ),
                positionName = node.text("gmd:positionName/gco:CharacterString"),
                email =
                    node.text(
                        "gmd:contactInfo/gmd:CI_Contact/gmd:address" +
                            "/gmd:CI_Address/gmd:electronicMailAddress/gco:CharacterString",
                    ),
                role = node.attr("gmd:role/gmd:CI_RoleCode", "codeListValue") ?: "",
            )

        private fun parseDate(node: Node): MetadataDate =
            MetadataDate(
                date = node.text("gmd:date/gco:Date") ?: node.text("gmd:date/gco:DateTime") ?: "",
                type = node.attr("gmd:dateType/gmd:CI_DateTypeCode", "codeListValue") ?: "",
            )

        private fun parseThumbnail(node: Node): Thumbnail =
            Thumbnail(
                url = node.text("gmd:fileName/gco:CharacterString") ?: "",
                type = node.text("gmd:fileDescription/gco:CharacterString"),
            )

        private fun parseKeywordGroup(node: Node): KeywordGroup {
            val keywords =
                node.nodes("gmd:keyword").map { kw ->
                    val anchor = kw.node("gmx:Anchor")
                    val value = anchor?.textContent?.trim() ?: kw.text("gco:CharacterString") ?: ""
                    val href = anchor?.attr("xlink:href")
                    val english =
                        kw.text("gmd:PT_FreeText/gmd:textGroup/gmd:LocalisedCharacterString")
                    Keyword(value = value, englishValue = english, href = href)
                }
            val thesaurusTitleNode = node.node("gmd:thesaurusName/gmd:CI_Citation/gmd:title")
            val thesaurusAnchor = thesaurusTitleNode?.node("gmx:Anchor")
            val thesaurus =
                thesaurusAnchor?.textContent?.trim()?.takeIf { it.isNotEmpty() }
                    ?: thesaurusTitleNode?.text("gco:CharacterString")
            return KeywordGroup(
                type = node.attr("gmd:type/gmd:MD_KeywordTypeCode", "codeListValue"),
                thesaurus = thesaurus,
                thesaurusHref = thesaurusAnchor?.attr("xlink:href"),
                keywords = keywords,
            )
        }

        private fun parseLegalConstraints(idInfo: Node?): LegalConstraints? {
            if (idInfo == null) return null
            var accessConstraints: String? = null
            var useConstraints: String? = null
            val useLimitations = mutableListOf<String>()
            var otherConstraintsLink: String? = null
            var otherConstraintsLinkText: String? = null
            var otherConstraintsAccess: String? = null

            idInfo.nodes("gmd:resourceConstraints/gmd:MD_Constraints").forEach { c ->
                c.nodes("gmd:useLimitation/gco:CharacterString").forEach { n ->
                    n.textContent
                        .trim()
                        .takeIf { it.isNotEmpty() }
                        ?.let { useLimitations.add(it) }
                }
            }
            idInfo.nodes("gmd:resourceConstraints/gmd:MD_LegalConstraints").forEach { c ->
                val ac = c.attr("gmd:accessConstraints/gmd:MD_RestrictionCode", "codeListValue")
                val uc = c.attr("gmd:useConstraints/gmd:MD_RestrictionCode", "codeListValue")
                val anchor = c.node("gmd:otherConstraints/gmx:Anchor")
                if (ac != null) {
                    accessConstraints = ac
                    otherConstraintsAccess = anchor?.attr("xlink:href")
                }
                if (uc != null) {
                    useConstraints = uc
                    otherConstraintsLink = anchor?.attr("xlink:href")
                    otherConstraintsLinkText =
                        anchor?.textContent?.trim()?.takeIf { it.isNotEmpty() }
                }
            }

            if (accessConstraints == null && useConstraints == null && useLimitations.isEmpty()) {
                return null
            }
            return LegalConstraints(
                accessConstraints = accessConstraints,
                useConstraints = useConstraints,
                useLimitations = useLimitations,
                otherConstraintsLink = otherConstraintsLink,
                otherConstraintsLinkText = otherConstraintsLinkText,
                otherConstraintsAccess = otherConstraintsAccess,
            )
        }

        private fun parseSecurityConstraints(idInfo: Node?): SecurityConstraints? {
            val node =
                idInfo?.node("gmd:resourceConstraints/gmd:MD_SecurityConstraints") ?: return null
            return SecurityConstraints(
                classification =
                    node.attr("gmd:classification/gmd:MD_ClassificationCode", "codeListValue"),
                userNote = node.text("gmd:userNote/gco:CharacterString"),
            )
        }

        private fun parseBoundingBox(idInfo: Node?): BoundingBox? {
            val bb = idInfo?.node(".//gmd:EX_GeographicBoundingBox") ?: return null
            return BoundingBox(
                westBoundLongitude =
                    bb.text("gmd:westBoundLongitude/gco:Decimal")?.toDoubleOrNull() ?: return null,
                eastBoundLongitude =
                    bb.text("gmd:eastBoundLongitude/gco:Decimal")?.toDoubleOrNull() ?: return null,
                southBoundLatitude =
                    bb.text("gmd:southBoundLatitude/gco:Decimal")?.toDoubleOrNull() ?: return null,
                northBoundLatitude =
                    bb.text("gmd:northBoundLatitude/gco:Decimal")?.toDoubleOrNull() ?: return null,
            )
        }

        private fun parseTemporalExtents(idInfo: Node?): List<TemporalExtent> =
            idInfo
                ?.nodes(".//gmd:EX_TemporalExtent/gmd:extent")
                ?.mapNotNull { extent ->
                    val period = extent.node("gml:TimePeriod")
                    val instant = extent.node("gml:TimeInstant")
                    when {
                        period != null -> {
                            TemporalExtent(
                                begin = period.text("gml:beginPosition"),
                                end = period.text("gml:endPosition"),
                            )
                        }

                        instant != null -> {
                            TemporalExtent(begin = instant.text("gml:timePosition"))
                        }

                        else -> {
                            null
                        }
                    }
                }
                ?: emptyList()

        private fun parseResolutionScale(idInfo: Node?): String? {
            val denominator =
                idInfo
                    ?.node(
                        "gmd:spatialResolution/gmd:MD_Resolution" +
                            "/gmd:equivalentScale/gmd:MD_RepresentativeFraction" +
                            "/gmd:denominator/gco:Integer",
                    )?.textContent
                    ?.trim()
                    ?.takeIf { it.isNotEmpty() }
            return denominator
        }

        private fun parseDistributionInfo(): DistributionInfo? {
            val dist = md.node("gmd:distributionInfo/gmd:MD_Distribution") ?: return null
            val formats =
                dist.nodes("gmd:distributionFormat/gmd:MD_Format").map { f ->
                    DistributionFormat(
                        name = f.text("gmd:name/gco:CharacterString") ?: "",
                        version = f.text("gmd:version/gco:CharacterString"),
                    )
                }
            val onlineResources =
                dist.nodes("gmd:transferOptions/gmd:MD_DigitalTransferOptions").flatMap { dto ->
                    val units = dto.text("gmd:unitsOfDistribution/gco:CharacterString")
                    dto.nodes("gmd:onLine/gmd:CI_OnlineResource").map { or ->
                        OnlineResource(
                            url = or.text("gmd:linkage/gmd:URL") ?: "",
                            protocol = or.text("gmd:protocol/gco:CharacterString"),
                            name = or.text("gmd:name/gco:CharacterString"),
                            description = or.text("gmd:description/gco:CharacterString"),
                            unitsOfDistribution = units,
                            applicationProfile =
                                or.text("gmd:applicationProfile/gco:CharacterString"),
                            function =
                                or.attr(
                                    "gmd:function/gmd:CI_OnLineFunctionCode",
                                    "codeListValue",
                                ),
                        )
                    }
                }
            return DistributionInfo(formats = formats, onlineResources = onlineResources)
        }

        private fun parseServiceOperations(idInfo: Node?): List<ServiceOperation> =
            idInfo
                ?.nodes("srv:containsOperations/srv:SV_OperationMetadata")
                ?.map { op ->
                    ServiceOperation(
                        operationName = op.text("srv:operationName/gco:CharacterString"),
                        dcp =
                            op.nodes("srv:DCP/srv:DCPList").mapNotNull { it.attr("codeListValue") },
                        operationDescription =
                            op.text("srv:operationDescription/gco:CharacterString"),
                        connectPoints =
                            op.nodes("srv:connectPoint/gmd:CI_OnlineResource").map { or ->
                                OnlineResource(
                                    url = or.text("gmd:linkage/gmd:URL") ?: "",
                                    protocol = or.text("gmd:protocol/gco:CharacterString"),
                                    name = or.text("gmd:name/gco:CharacterString"),
                                    description = or.text("gmd:description/gco:CharacterString"),
                                    applicationProfile =
                                        or.text("gmd:applicationProfile/gco:CharacterString"),
                                    function =
                                        or.attr(
                                            "gmd:function/gmd:CI_OnLineFunctionCode",
                                            "codeListValue",
                                        ),
                                )
                            },
                    )
                }
                ?: emptyList()

        private fun parseQualitySpecifications(): List<QualitySpecification> =
            md.nodes(".//gmd:DQ_ConformanceResult").map { result ->
                val specNode = result.node("gmd:specification")
                val titleNode = specNode?.node("gmd:CI_Citation/gmd:title")
                val title =
                    titleNode?.node("gmx:Anchor")?.textContent?.trim()
                        ?: titleNode?.text("gco:CharacterString")
                        ?: ""
                val date =
                    result.text(
                        "gmd:specification/gmd:CI_Citation/gmd:date/gmd:CI_Date/gmd:date/gco:Date",
                    )
                val dateType =
                    result.attr(
                        "gmd:specification/gmd:CI_Citation/gmd:date/gmd:CI_Date" +
                            "/gmd:dateType/gmd:CI_DateTypeCode",
                        "codeListValue",
                    )
                val explanation = result.text("gmd:explanation/gco:CharacterString")
                val explanationEnglish =
                    result.text(
                        "gmd:explanation/gmd:PT_FreeText/gmd:textGroup/gmd:LocalisedCharacterString",
                    )
                val passNode = result.node("gmd:pass")
                val pass =
                    if (passNode?.attr("gco:nilReason") != null) {
                        null
                    } else {
                        passNode?.textContent?.trim()?.let { it == "true" }
                    }
                QualitySpecification(
                    title = title,
                    date = date,
                    dateType = dateType,
                    explanation = explanation,
                    explanationEnglish = explanationEnglish,
                    pass = pass,
                    specificationHref = specNode?.attr("xlink:href"),
                    specificationIdentifier =
                        result.text(
                            "gmd:specification/gmd:CI_Citation/gmd:identifier/gmd:MD_Identifier" +
                                "/gmd:authority/gmd:CI_Citation/gmd:title/gco:CharacterString",
                        ),
                )
            }

        private fun parseDataQualityMeasures(): List<DataQualityMeasure> =
            md.nodes(".//gmd:DQ_CompletenessOmission").map { node ->
                // Name of measure can be an Anchor or a CharacterString
                val name =
                    node.node("gmd:nameOfMeasure/gmx:Anchor")?.textContent?.trim()
                        ?: node.text("gmd:nameOfMeasure/gco:CharacterString")

                val desc = node.text("gmd:measureDescription/gco:CharacterString")

                // valueUnit is typically an element with xlink:href attribute
                val unit =
                    node.attr(
                        "gmd:result/gmd:DQ_QuantitativeResult/gmd:valueUnit",
                        "xlink:href",
                    )

                // value may be in a record wrapper, try the usual places
                val valueStr =
                    node.text(
                        "gmd:result/gmd:DQ_QuantitativeResult/gmd:value/gco:Record/gco:Integer",
                    ) ?: node.text("gmd:result/gmd:DQ_QuantitativeResult/gmd:value/gco:Integer")

                val value = valueStr?.toIntOrNull()

                DataQualityMeasure(
                    nameOfMeasure = name,
                    measureDescription = desc,
                    value = value,
                    valueUnit = unit,
                )
            }

        private fun XPath.node(
            expr: String,
            ctx: Any,
        ): Node? = evaluate(expr, ctx, XPathConstants.NODE) as? Node

        private fun XPath.nodes(
            expr: String,
            ctx: Any,
        ): List<Node> {
            val nl = evaluate(expr, ctx, XPathConstants.NODESET) as? NodeList ?: return emptyList()
            return (0 until nl.length).map { nl.item(it) }
        }

        private fun Node.text(expr: String): String? =
            xpath
                .node(expr, this)
                ?.textContent
                ?.trim()
                ?.takeIf { it.isNotEmpty() }

        private fun Node.node(expr: String): Node? = xpath.node(expr, this)

        private fun Node.nodes(expr: String): List<Node> = xpath.nodes(expr, this)

        private fun Node.attr(
            expr: String,
            attrName: String,
        ): String? = xpath.node(expr, this)?.attr(attrName)

        private fun Node.attr(attrName: String): String? {
            val attrs = attributes ?: return null
            if (':' in attrName) {
                val prefix = attrName.substringBefore(':')
                val local = attrName.substringAfter(':')
                val ns = isoNamespaceContext.getNamespaceURI(prefix)
                return attrs
                    .getNamedItemNS(ns, local)
                    ?.nodeValue
                    ?.trim()
                    ?.takeIf { it.isNotEmpty() }
            }
            return attrs
                .getNamedItem(attrName)
                ?.nodeValue
                ?.trim()
                ?.takeIf { it.isNotEmpty() }
        }
    }
}

private val isoNamespaceContext: NamespaceContext =
    object : NamespaceContext {
        private val ns =
            mapOf(
                "csw" to "http://www.opengis.net/cat/csw/2.0.2",
                "gmd" to "http://www.isotc211.org/2005/gmd",
                "gco" to "http://www.isotc211.org/2005/gco",
                "gmx" to "http://www.isotc211.org/2005/gmx",
                "srv" to "http://www.isotc211.org/2005/srv",
                "xlink" to "http://www.w3.org/1999/xlink",
                "gml" to "http://www.opengis.net/gml/3.2",
            )

        override fun getNamespaceURI(prefix: String) = ns[prefix] ?: ""

        override fun getPrefix(uri: String) = ns.entries.firstOrNull { it.value == uri }?.key

        override fun getPrefixes(uri: String) = listOfNotNull(getPrefix(uri)).iterator()
    }

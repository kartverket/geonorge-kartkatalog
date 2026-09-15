import type { ProductMetadata } from "@/lib/schemas/product";

type DatasetStructuredDataProps = {
  uuid: string;
  metadata: ProductMetadata;
};

function getSiteUrl(): string | undefined {
  const siteUrl = process.env.SITE_URL?.trim();
  return siteUrl ? siteUrl.replace(/\/$/, "") : undefined;
}

function getAbsoluteUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;

  try {
    return new URL(url).toString();
  } catch {
    return undefined;
  }
}

function getKeywords(metadata: ProductMetadata): string[] {
  const keywords = [
    ...metadata.keywordsTheme.map((keyword) => keyword.keywordValue),
    ...metadata.nationalKeywords.map((keyword) => keyword.keywordValue),
    ...metadata.nationalInitiatives,
  ].filter((keyword): keyword is string => Boolean(keyword?.trim()));

  return [...new Set(keywords)];
}

function serializeJsonLd(value: object): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function DatasetStructuredData({
  uuid,
  metadata,
}: DatasetStructuredDataProps) {
  if (metadata.hierarchyLevel.toLowerCase() !== "dataset") {
    return null;
  }

  const siteUrl = getSiteUrl();
  const pageUrl = siteUrl
    ? `${siteUrl}/metadata/${encodeURIComponent(uuid)}`
    : undefined;
  const keywords = getKeywords(metadata);

  const distributions = metadata.distributionGroups.flatMap((group) =>
    group.entries.flatMap((entry) => {
      const contentUrl = getAbsoluteUrl(entry.url);
      if (!contentUrl) return [];

      const encodingFormats = entry.formatNames.filter(Boolean);
      return [
        {
          "@type": "DataDownload",
          contentUrl,
          encodingFormat:
            encodingFormats.length === 0
              ? undefined
              : encodingFormats.length === 1
                ? encodingFormats[0]
                : encodingFormats,
          name: group.protocolName ?? undefined,
        },
      ];
    }),
  );

  const thumbnailUrl = getAbsoluteUrl(metadata.thumbnailUrl);
  const licenseUrl = getAbsoluteUrl(metadata.constraints?.otherConstraintsLink);
  const publisher = metadata.contactPublisher?.organization ?? undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": pageUrl ? `${pageUrl}#dataset` : undefined,
    url: pageUrl,
    identifier: uuid,
    name: metadata.title,
    description: metadata.abstractText ?? undefined,
    keywords: keywords.length > 0 ? keywords : undefined,
    dateModified: metadata.dateUpdated ?? undefined,
    license: licenseUrl,
    isAccessibleForFree: metadata.accessState === "open",
    creator: metadata.organization
      ? { "@type": "Organization", name: metadata.organization }
      : undefined,
    publisher: publisher
      ? { "@type": "Organization", name: publisher }
      : undefined,
    image: thumbnailUrl,
    distribution: distributions.length > 0 ? distributions : undefined,
  };

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD must be emitted as raw JSON; '<' is escaped during serialization.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}

import { DownloadIcon, ExternalLinkIcon } from "@navikt/aksel-icons";
import AddToDownloadsButton from "@/app/_components/addToDownloads/AddToDownloadsButton";
import AddSeriesToDownloadsButton from "@/app/_components/addToDownloads/AddSeriesToDownloadsButton";
import type { DownloadItem } from "@/app/_components/addToDownloads/downloadStorage";
import { CopyButton } from "@/app/metadata/[uuid]/_components/CopyButton";
import { DistributionActionLinkButton } from "@/app/metadata/[uuid]/_components/DistributionActionLinkButton";
import {
  isCopyableDistributionProtocol,
  isDirectDownloadPageProtocol,
  isGeonorgeDownloadProtocol,
  isGeonorgeFileDownloadProtocol,
} from "@/app/metadata/[uuid]/_utils/distributionProtocols";
import { getGeonorgeDownloadUrl } from "@/app/metadata/[uuid]/_utils/distributions";
import type { AccessState, DistributionGroup } from "@/lib/schemas/product";
import { LOCATIONS } from "@/posthog/posthog";

export function DistributionDetailActionButton({
  uuid,
  title,
  organizationName,
  hierarchyLevel,
  seriesType,
  accessState,
  group,
  formatNames,
  urlLabel,
  thematicSeriesDownloadItem,
  downloadableSeriesMembers,
}: {
  uuid: string;
  title: string;
  organizationName: string | null;
  hierarchyLevel: string | null;
  seriesType: string | null;
  accessState: AccessState | null;
  group: DistributionGroup;
  formatNames: string[];
  urlLabel: string;
  thematicSeriesDownloadItem: DownloadItem | null;
  downloadableSeriesMembers: DownloadItem[];
}) {
  const firstUrl = group.entries[0]?.url ?? null;

  if (!firstUrl) return null;

  const trackingProperties = {
    protocol: group.protocol,
    protocolName: group.protocolName,
    format: formatNames.join(", "),
    urlLabel,
  };

  const canDownloadDirectly =
    hierarchyLevel === "dataset" ||
    (hierarchyLevel === "series" && seriesType === "series_thematic");

  if (
    isGeonorgeDownloadProtocol(group.protocol) &&
    thematicSeriesDownloadItem
  ) {
    return (
      <AddToDownloadsButton
        item={thematicSeriesDownloadItem}
        size="sm"
        location={LOCATIONS.MetadataPageTabs}
        variant="secondary"
        preventAccordionToggle
      />
    );
  }

  if (isGeonorgeDownloadProtocol(group.protocol) && canDownloadDirectly) {
    return (
      <AddToDownloadsButton
        item={{
          accessType: accessState,
          uuid,
          name: title,
          organizationName,
          distributionUrl: getGeonorgeDownloadUrl([group]),
        }}
        size="sm"
        location={LOCATIONS.MetadataPageTabs}
        variant="secondary"
        addLabel="Legg til nedlasting"
        removeLabel="Fjern fra nedlasting"
        preventAccordionToggle
      />
    );
  }

  if (
    isGeonorgeDownloadProtocol(group.protocol) &&
    downloadableSeriesMembers.length > 0
  ) {
    return (
      <AddSeriesToDownloadsButton
        item={{ uuid, title }}
        downloadableItems={downloadableSeriesMembers}
        size="sm"
        variant="secondary"
        location={LOCATIONS.MetadataPageTabs}
        preventAccordionToggle
      />
    );
  }

  if (isGeonorgeFileDownloadProtocol(group.protocol)) {
    return (
      <DistributionActionLinkButton
        size="sm"
        href={firstUrl}
        icon={<DownloadIcon aria-hidden />}
        title="Last ned"
        eventName="download-file-distribution-from-accordion-summary"
        trackingProperties={trackingProperties}
      />
    );
  }

  if (isDirectDownloadPageProtocol(group.protocol)) {
    return (
      <DistributionActionLinkButton
        size="sm"
        href={firstUrl}
        icon={<ExternalLinkIcon aria-hidden />}
        title="Åpne nettside"
        eventName="open-download-distribution-from-accordion-summary"
        trackingProperties={trackingProperties}
      />
    );
  }

  if (isCopyableDistributionProtocol(group.protocol)) {
    return (
      <CopyButton
        size="sm"
        url={firstUrl}
        eventName="copy-distribution-link-from-accordion-summary"
        trackingProperties={trackingProperties}
        preventAccordionToggle
      />
    );
  }

  return null;
}

import { ExternalLinkIcon } from "@navikt/aksel-icons";
import AddToCartButton from "@/app/_components/addToCart/AddToCartButton";
import { CopyButton } from "@/app/metadata/[uuid]/_components/CopyButton";
import { DistributionActionLinkButton } from "@/app/metadata/[uuid]/_components/DistributionActionLinkButton";
import {
  isCopyableDistributionProtocol,
  isDirectDownloadPageProtocol,
  isGeonorgeDownloadProtocol,
} from "@/app/metadata/[uuid]/_utils/distributionProtocols";
import { getGeonorgeDownloadUrl } from "@/app/metadata/[uuid]/_utils/distributions";
import type { AccessState, DistributionGroup } from "@/lib/schemas/product";
import { LOCATIONS } from "@/posthog/posthog";

export function DistributionDetailActionButton({
  uuid,
  title,
  hierarchyLevel,
  accessState,
  group,
  formatNames,
  urlLabel,
}: {
  uuid: string;
  title: string;
  hierarchyLevel: string | null;
  accessState: AccessState | null;
  group: DistributionGroup;
  formatNames: string[];
  urlLabel: string;
}) {
  const firstUrl = group.entries[0]?.url ?? null;

  if (!firstUrl) return null;

  const trackingProperties = {
    protocol: group.protocol,
    protocolName: group.protocolName,
    format: formatNames.join(", "),
    urlLabel,
  };

  if (
    isGeonorgeDownloadProtocol(group.protocol) &&
    hierarchyLevel === "dataset" &&
    accessState === "open"
  ) {
    return (
      <AddToCartButton
        item={{
          uuid,
          name: title,
          distributionUrl: getGeonorgeDownloadUrl([group]),
        }}
        location={LOCATIONS.MetadataPageTabs}
        variant="secondary"
        addLabel="Last ned"
        removeLabel="Fjern fra handlekurv"
        preventAccordionToggle
      />
    );
  }

  if (isDirectDownloadPageProtocol(group.protocol)) {
    return (
      <DistributionActionLinkButton
        href={firstUrl}
        icon={<ExternalLinkIcon aria-hidden />}
        title="Åpne nedlastinger"
        eventName="open-download-distribution-from-accordion-summary"
        trackingProperties={trackingProperties}
      />
    );
  }

  if (isCopyableDistributionProtocol(group.protocol)) {
    return (
      <CopyButton
        url={firstUrl}
        eventName="copy-distribution-link-from-accordion-summary"
        trackingProperties={trackingProperties}
        preventAccordionToggle
      />
    );
  }

  return null;
}

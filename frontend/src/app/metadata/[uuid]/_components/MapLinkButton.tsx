"use client";

import { EarthIcon, ExternalLinkIcon } from "@navikt/aksel-icons";
import { posthog } from "posthog-js";
import { basePath } from "@/lib/basePath";
import type { ProductMetadata } from "@/lib/schemas/product";
import { shouldShowCoverageMap } from "../dekningskart/utils";
import { TrackedActionLinkButton } from "./TrackedActionLinkButton";

export const MapLinkButton = ({
  metadata,
  uuid,
}: {
  metadata: ProductMetadata;
  uuid: string;
}) => {
  const useNewMap = posthog.getFeatureFlag(
    "new-dekningskart-button",
  ) as boolean;
  return (
    <>
      {useNewMap
        ? shouldShowCoverageMap(metadata) && (
            <TrackedActionLinkButton
              eventName="show-coverage-data"
              href={`${basePath}/metadata/${uuid}/dekningskart`}
              target="_self"
              icon={<EarthIcon aria-hidden />}
              title="Vis dekningskart"
            />
          )
        : metadata.coverageUrl && (
            <TrackedActionLinkButton
              eventName="show-coverage-map"
              href={metadata.coverageUrl}
              icon={<ExternalLinkIcon aria-hidden />}
              title="Vis dekningskart"
            />
          )}
    </>
  );
};

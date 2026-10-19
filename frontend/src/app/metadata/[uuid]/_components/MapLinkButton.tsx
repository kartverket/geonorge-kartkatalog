"use client";

import { EarthIcon, ExternalLinkIcon } from "@navikt/aksel-icons";
import { posthog } from "posthog-js";
import { basePath } from "@/lib/basePath";
import { TrackedActionLinkButton } from "./TrackedActionLinkButton";

export const MapLinkButton = ({
  coverageUrl,
  shouldShowCoverageMap,

  uuid,
}: {
  coverageUrl: string | null;
  shouldShowCoverageMap: boolean;
  uuid: string;
}) => {
  const useNewMap = posthog.isFeatureEnabled("new-dekningskart-button", {
    defaultValue: false,
  });
  return (
    <>
      {useNewMap
        ? shouldShowCoverageMap && (
            <TrackedActionLinkButton
              eventName="show-coverage-data"
              href={`${basePath}/metadata/${uuid}/dekningskart`}
              target="_self"
              icon={<EarthIcon aria-hidden />}
              title="Vis dekningskart"
            />
          )
        : coverageUrl && (
            <TrackedActionLinkButton
              eventName="show-coverage-map"
              href={coverageUrl}
              icon={<ExternalLinkIcon aria-hidden />}
              title="Vis dekningskart"
            />
          )}
    </>
  );
};

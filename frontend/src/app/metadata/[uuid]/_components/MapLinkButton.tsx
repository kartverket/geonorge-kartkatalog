"use client";

import { EarthIcon, ExternalLinkIcon } from "@navikt/aksel-icons";
import { useFeatureFlagEnabled } from "@posthog/react";
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
  const useNewMap = useFeatureFlagEnabled("new-dekningskart-button", false);

  return (
    <>
      {useNewMap
        ? shouldShowCoverageMap && (
            <TrackedActionLinkButton
              eventName="show-coverage-map"
              properties={{ uuid }}
              href={`${basePath}/metadata/${uuid}/dekningskart`}
              target="_self"
              icon={<EarthIcon aria-hidden />}
              title="Vis dekningskart"
            />
          )
        : coverageUrl && (
            <TrackedActionLinkButton
              eventName="show-coverage-map-old"
              properties={{ uuid }}
              href={coverageUrl}
              icon={<ExternalLinkIcon aria-hidden />}
              title="Vis dekningskart"
            />
          )}
    </>
  );
};

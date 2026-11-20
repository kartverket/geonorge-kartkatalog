import { EarthIcon } from "@navikt/aksel-icons";
import { basePath } from "@/lib/basePath";
import { TrackedActionLinkButton } from "./TrackedActionLinkButton";

export const MapLinkButton = ({
  shouldShowCoverageMap,
  uuid,
}: {
  shouldShowCoverageMap: boolean;
  uuid: string;
}) => {
  if (!shouldShowCoverageMap) return null;

  return (
    <TrackedActionLinkButton
      eventName="show-coverage-map"
      properties={{ uuid }}
      href={`${basePath}/metadata/${uuid}/dekningskart`}
      target="_self"
      icon={<EarthIcon aria-hidden />}
      title="Vis dekningskart"
    />
  );
};

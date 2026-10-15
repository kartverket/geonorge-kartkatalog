"use client";

import { FeatureInfo } from "@/app/_components/MapComponent/Content";
import type {
  FeatureInfoResult,
  FeatureInfoResults,
} from "@/lib/schemas/feature-info";
import { Heading } from "@kv-designsystem/react";

const FeatureInfoSection = ({
  result,
}: {
  title: string;
  result: FeatureInfo;
}) => (
  <div>
    <Heading level={4} data-size={"xs"}>
      noe greier
    </Heading>
    <div>{JSON.stringify(result)}</div>
  </div>
);

export interface FeatureInfoProps {
  featureInfos: FeatureInfo[];
}

export const FeatureInfoContent = ({ featureInfos }: FeatureInfoProps) => {
  console.log(JSON.stringify(featureInfos));
  return (
    <div>
      Feature Info Component
      {featureInfos
        .filter((r) => r != null)
        .map((result, index) => (
          <FeatureInfoSection
            key={index}
            title={`Feature Info ${index + 1}`}
            result={result}
          />
        ))}
    </div>
  );
};

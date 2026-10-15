"use client";

import { FeatureInfo } from "@/app/_components/MapComponent/Content";
import type {
  FeatureInfoResult,
  FeatureInfoResults,
} from "@/lib/schemas/feature-info";
import { Heading } from "@kv-designsystem/react";
import { LayerIdToName } from "../layerUtils";

const FeatureInfoLine = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div>
    <strong>{label}:</strong> {value}
  </div>
);

const UnknownLayerName = "Ukjent lag";
const FeatureInfoSection = ({ info }: { info: FeatureInfo }) => {
  const layerName =
    info.layerId != null
      ? (LayerIdToName.get(info.layerId) ?? UnknownLayerName)
      : UnknownLayerName;
  console.log(info);
  return (
    <div>
      <Heading level={4} data-size={"xs"}>
        Fra laget "{layerName}"
      </Heading>
      <div>
        {(() => {
          switch (info.layerId) {
            case "overview":
              return (
                <FeatureInfoLine
                  label="Kommunenummer"
                  value={
                    info.result.msGMLOutput.datasett_dekning_layer
                      .datasett_dekning_feature.kommunenr._text
                  }
                />
              );
            case "coverage":
              return (
                <FeatureInfoLine
                  label="Objektid"
                  value={
                    info.result.msGMLOutput.datasett_dekning_layer
                      .datasett_dekning_feature.objid._text
                  }
                />
              );
            default:
              return UnknownLayerName;
          }
        })()}
      </div>
      
    </div>
  );
};

export interface FeatureInfoProps {
  featureInfos: FeatureInfo[];
}

export const FeatureInfoContent = ({ featureInfos }: FeatureInfoProps) => {
  console.log(JSON.stringify(featureInfos));
  return (
    <div>
      {featureInfos.map((result, index) => (
        <FeatureInfoSection key={index} info={result} />
      ))}
    </div>
  );
};

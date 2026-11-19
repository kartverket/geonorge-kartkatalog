"use client";

import { Heading } from "@kv-designsystem/react";
import type { FeatureInfo } from "@/app/_components/MapComponent/Content";
import { LayerIdToName } from "../layerUtils";
import styles from "./FeatureInfoContent.module.css";

const FeatureInfoLine = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className={styles.featureInfoLine}>
    <span>{label}:</span> <span>{value}</span>
  </div>
);

const UnknownLayerName = "Ukjent lag";
const FeatureInfoSection = ({ info }: { info: FeatureInfo }) => {
  const layerName =
    info.layerId != null
      ? (LayerIdToName.get(info.layerId) ?? UnknownLayerName)
      : UnknownLayerName;
  const feature =
    info.result.msGMLOutput.datasett_dekning_layer.datasett_dekning_feature;

  return (
    <div>
      <Heading level={4} data-size={"2xs"}>
        Fra laget "{layerName}"
      </Heading>
      <div>
        {(() => {
          switch (info.layerId) {
            case "overview": {
              if (!("navn" in feature)) return null;
              return (
                <>
                  <FeatureInfoLine
                    value={feature.navn._text}
                    label={"Kommunenavn"}
                  />
                  <FeatureInfoLine
                    value={feature.kommunenr._text}
                    label={"Kommunenummer"}
                  />
                </>
              );
            }
            case "coverage":
              if (!("objid" in feature)) return null;
              return (
                <FeatureInfoLine label="Objektid" value={feature.objid._text} />
              );
            default:
              return null;
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
  return (
    <div>
      {featureInfos.map((result, index) => (
        <FeatureInfoSection key={result.layerId ?? index} info={result} />
      ))}
    </div>
  );
};

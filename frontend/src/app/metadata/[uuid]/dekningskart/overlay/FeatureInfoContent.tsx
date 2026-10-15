"use client";

import { Heading } from "@kv-designsystem/react";
import type { FeatureInfo } from "@/app/_components/MapComponent/Content";
import type { Kommune } from "@/lib/schemas/kommune";
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
const FeatureInfoSection = ({
  info,
  kommunerByNummer,
}: {
  info: FeatureInfo;
  kommunerByNummer: Record<string, Kommune>;
}) => {
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
              if (!("kommunenr" in feature)) return null;
              const kommunenr = feature.kommunenr._text;
              const kommune = kommunerByNummer[kommunenr];
              const val = kommune?.kommunenavn ?? kommunenr;
              const label = kommune?.kommunenavn
                ? "Kommunenavn"
                : "Kommunenummer";
              return <FeatureInfoLine label={label} value={val} />;
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
  kommunerByNummer: Record<string, Kommune>;
}

export const FeatureInfoContent = ({
  featureInfos,
  kommunerByNummer,
}: FeatureInfoProps) => {
  return (
    <div>
      {featureInfos.map((result, index) => (
        <FeatureInfoSection
          key={result.layerId ?? index}
          info={result}
          kommunerByNummer={kommunerByNummer}
        />
      ))}
    </div>
  );
};

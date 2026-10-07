"use client";

import MapComponent from "@/app/_components/MapComponent/MapComponent";
import type { ProductMetadata } from "@/lib/schemas/product";
import { getGEOJSONLayerFromUrl, getWMSLayerFromUrl } from "./utils";
import BaseLayer from "ol/layer/Base";

export interface DekningkartProps {
  metadata: ProductMetadata;
}

export const Dekningskart = (props: DekningkartProps) => {
  const layers: BaseLayer[] = [];
  const coverageData = props.metadata.coverageData;
  if (!coverageData) return null;

  const coverageLayer =
    coverageData.coverageWMSUrl?.url != null
      ? getWMSLayerFromUrl(coverageData.coverageWMSUrl.url, {
          LAYERS: coverageData.coverageWMSUrl.layers,
          CRS: "EPSG:25833",
        })
      : null;
  if (coverageLayer) layers.push(coverageLayer);

  const coverageOverviewLayer =
    coverageData.coverageOverviewWMSUrl?.url != null
      ? getWMSLayerFromUrl(coverageData.coverageOverviewWMSUrl.url, {
          LAYERS: coverageData.coverageOverviewWMSUrl.layers,
          CRS: "EPSG:25833",
        })
      : null;
  if (coverageOverviewLayer) layers.push(coverageOverviewLayer);

  const completenessLayer = 
    coverageData.completenessCoverageWMSUrl?.url != null
      ? getGEOJSONLayerFromUrl(coverageData.completenessCoverageWMSUrl.url)
      : null;
  if (completenessLayer) layers.push(completenessLayer);

  return <MapComponent backgroundLayerName={"topograyscale"} layers={layers} />;
};

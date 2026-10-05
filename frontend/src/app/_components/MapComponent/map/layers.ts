import TileLayer from "ol/layer/Tile";
import { XYZ } from "ol/source";

export type BackgroundLayerName = "topograyscale"; // Add more as needed

export type BackgroundLayer = {
  name: BackgroundLayerName;
  source: string;
};

export const backgroundLayers: BackgroundLayer[] = [
  {
    name: "topograyscale",
    source:
      "https://cache.kartverket.no/v1/wmts/1.0.0/topograatone/default/webmercator/{z}/{y}/{x}.png",
  },
];

export const getBackgroundLayer = (
  name: BackgroundLayerName,
): TileLayer | undefined => {
  const config = backgroundLayers.find((layer) => layer.name === name);
  if (!config) {
    return undefined;
  }

  return new TileLayer({
    source: new XYZ({
      url: config.source,
    }),
  });
};

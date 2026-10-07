import TileLayer from "ol/layer/Tile";
import type { ProjectionLike } from "ol/proj";
import WMTSCapabilities from "ol/format/WMTSCapabilities.js";
import WMTS, { optionsFromCapabilities } from "ol/source/WMTS";

export type BackgroundLayerName = "topograyscale"; // Add more as needed

export type BackgroundLayer = {
  name: BackgroundLayerName;
  wmtsLayer: string;
  capabilities: string;
};

export const backgroundLayers: BackgroundLayer[] = [
  {
    name: "topograyscale",
    wmtsLayer: "topograatone",
    capabilities:
      "https://cache.kartverket.no/v1/wmts/1.0.0/WMTSCapabilities.xml",
  },
];

export const getBackgroundLayer = async (
  name: BackgroundLayerName,
  projection: ProjectionLike,
): Promise<TileLayer | undefined> => {
  const config = backgroundLayers.find((layer) => layer.name === name);
  if (!config) {
    console.warn(`Background layer configuration for "${name}" not found.`);
    return undefined;
  }

  const res = await fetch(config.capabilities);
  if (!res.ok) {
    console.warn(
      `Failed to fetch capabilities for background layer "${name}". Status: ${res.status}`,
    );
    return undefined;
  }
  const capabilitiesXml = await res.text();
  const parser = new WMTSCapabilities();
  const capabilities = parser.read(capabilitiesXml);
  const options = optionsFromCapabilities(capabilities, {
    layer: config.wmtsLayer,
    projection,
  });
  if (!options) {
    console.warn(
      `Failed to get options from capabilities for background layer "${name}".`,
    );
    return undefined;
  }

  return new TileLayer({
    source: new WMTS(options),
    zIndex: 0,
  });
};

import GeoJSON from "ol/format/GeoJSON";
import type BaseLayer from "ol/layer/Base";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { TileWMS } from "ol/source";
import VectorSource from "ol/source/Vector";
import type { CoverageDataSource } from "@/lib/schemas/product";

export const LayerIdToName = new Map<string, string>([
  ["overview", "Kommune"],
  ["coverage", "Rutenett"],
  ["fullstendig", "Fullstendig kartlagt"],
  ["ufullstendig", "Ufullstendig kartlagt"],
  ["ikkeKartlagt", "Ikke kartlagt"],
  ["ikkeRelevant", "Ikke relevant"],
]);

export const getLayerFromCoverageData = (
  data: CoverageDataSource,
  internalId?: string,
): BaseLayer => {
  if (data.type === "WMS") {
    return getWMSLayerFromUrl(
      data.url,
      {
        LAYERS: data.layers ?? "",
      },
      internalId,
    );
  }
  if (data.type === "GEOJSON") {
    return getGEOJSONLayerFromUrl(data.url);
  }
  throw new Error("Unsupported coverage data type");
};

export const getWMSLayerFromUrl = (
  url: string,
  params?: Record<string, string | boolean | number>,
  internalId?: string,
): TileLayer => {
  const wmsLayer = new TileLayer({
    source: new TileWMS({
      url: url,
      params: {
        ...params,
        TILED: true,
      },

      projection: "EPSG:25833",
    }),
    properties: {
      id: internalId,
    },
  });
  return wmsLayer;
};

export const getGEOJSONLayerFromUrl = (url: string): VectorLayer => {
  const layer = new VectorLayer({
    source: new VectorSource({
      format: new GeoJSON(),
      url,
    }),
  });

  return layer;
};

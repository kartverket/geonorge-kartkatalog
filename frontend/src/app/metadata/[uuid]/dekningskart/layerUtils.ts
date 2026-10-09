import GeoJSON from "ol/format/GeoJSON";
import type BaseLayer from "ol/layer/Base";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { TileWMS } from "ol/source";
import VectorSource from "ol/source/Vector";
import type { CoverageDataSource } from "@/lib/schemas/product";

export const getLayerFromCoverageData = (
  data: CoverageDataSource,
): BaseLayer => {
  if (data.type === "WMS") {
    return getWMSLayerFromUrl(data.url ?? "", {
      LAYERS: data.layers ?? "",
    });
  }
  if (data.type === "GEOJSON") {
    return getGEOJSONLayerFromUrl(data.url ?? "");
  }
  throw new Error("Unsupported coverage data type");
};

export const getWMSLayerFromUrl = (
  url: string,
  params?: Record<string, string | boolean | number>,
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
  });
  return wmsLayer;
};

export const getGEOJSONLayerFromUrl = (url: string): VectorLayer => {
  return new VectorLayer({
    source: new VectorSource({
      format: new GeoJSON(),
      url,
    }),
  });
};

import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { TileWMS } from "ol/source";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";

export const getWMSLayerFromUrl = (
  url: string,
  params?: Record<string, any>,
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

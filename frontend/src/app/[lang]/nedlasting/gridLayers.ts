import { basePath } from "@/lib/basePath";

type GridLayerConfig = {
  dataProjection: "EPSG:25833" | "EPSG:4326";
};

// Rutenett-filene ligger i public/rutenett og er navngitt etter
// mapSelectionLayer fra nedlastings-API-ets capabilities. Filene oppgir
// ikke koordinatsystem selv, så det må angis her (samme som gammel Norgeskart).
const GRID_LAYERS = {
  "raster-32": { dataProjection: "EPSG:25833" },
  "raster-33": { dataProjection: "EPSG:25833" },
  "raster-35": { dataProjection: "EPSG:25833" },
  "raster-n250": { dataProjection: "EPSG:4326" },
  "raster-n500": { dataProjection: "EPSG:4326" },
  "raster-n1000": { dataProjection: "EPSG:4326" },
  n100_raster_ruter: { dataProjection: "EPSG:25833" },
  "dtm-dekning-utm32": { dataProjection: "EPSG:25833" },
  "dtm-dekning-utm33": { dataProjection: "EPSG:25833" },
  "dtm-dekning-utm35": { dataProjection: "EPSG:25833" },
  "dtm-dekning-utm33-100km": { dataProjection: "EPSG:25833" },
  "dtm-sjo-5": { dataProjection: "EPSG:4326" },
  "dtm-sjo-25": { dataProjection: "EPSG:4326" },
  "dtm-sjo-50": { dataProjection: "EPSG:4326" },
  dybdedata_50m: { dataProjection: "EPSG:25833" },
} as const satisfies Record<string, GridLayerConfig>;

export type GridLayerName = keyof typeof GRID_LAYERS;

export function isSupportedGridLayer(
  name: string | null | undefined,
): name is GridLayerName {
  return name != null && Object.hasOwn(GRID_LAYERS, name);
}

export function getGridLayerUrl(name: GridLayerName): string {
  return `${basePath}/rutenett/${name}.geojson`;
}

export function getGridLayerDataProjection(
  name: GridLayerName,
): GridLayerConfig["dataProjection"] {
  return GRID_LAYERS[name].dataProjection;
}

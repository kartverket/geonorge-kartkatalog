/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: Map is a good openlayers name and biome should not complain about it */
"use client";
import Map from "ol/Map";
import View from "ol/View";
import { register } from "ol/proj/proj4";
import proj4 from "proj4";
import { get as getProjection } from "ol/proj";

// proj4.defs(
//   "EPSG:25833",
//   "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
// );
// register(proj4);

const projection = getProjection("EPSG:25833")!!;
console.log("Using projection:", projection);

export const map = new Map({
  view: new View({
    projection: projection,
    center: [500000, 7200000],
    zoom: 5,
  }),
  controls: [],
});

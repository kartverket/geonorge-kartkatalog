/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: Map is a good openlayers name and biome should not complain about it */
"use client";
import Map from "ol/Map";
import { get as getProjection } from "ol/proj";
import View from "ol/View";

const projection = getProjection("EPSG:25833") || "EPSG:25833"; //Fix this better

export const map = new Map({
  view: new View({
    projection: projection,
    center: [500000, 7200000],
    zoom: 6,
  }),
  controls: [],
});

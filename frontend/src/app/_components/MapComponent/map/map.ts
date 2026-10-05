/** biome-ignore-all lint/suspicious/noShadowRestrictedNames: Map is a good openlayers name and biome should not complain about it */
"use client";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";

export const map = new Map({
  layers: [
    new TileLayer({
      source: new XYZ({
        url: "https://cache.kartverket.no/v1/wmts/1.0.0/topograatone/default/webmercator/{z}/{y}/{x}.png",
      }),
    }),
  ],
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

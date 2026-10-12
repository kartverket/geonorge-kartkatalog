import type { FeatureLike } from "ol/Feature";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import type { StyleFunction } from "ol/style/Style";
import Style from "ol/style/Style";

export type CoverageStatus =
  | "fullstendig"
  | "ufullstendig"
  | "ikkeKartlagt"
  | "ikkeRelevant";

export const statusColors = new Map([
  ["fullstendig", "rgba(166, 211, 136, 0.5)"],
  ["ufullstendig", "rgba(232, 211, 138, 0.5)"],
  ["ikkeKartlagt", "rgba(240, 156, 90, 0.5)"],
  ["ikkeRelevant", "rgba(180, 180, 180, 0.5)"], //TODO: undersøk om vi skal vise ikkeRelevant noe sted
]);

const statusStyles = new Map(
  Array.from(statusColors).map(([status, color]) => [
    status,
    new Style({
      fill: new Fill({ color }),
      stroke: new Stroke({
        color: "rgba(35, 35, 35, 0.5)",
        width: 1,
        lineJoin: "bevel",
      }),
    }),
  ]),
);

export const getCompletenessStyleFunction = (
  status: CoverageStatus,
): StyleFunction => {
  return (f: FeatureLike) => {
    if (f.get("dekningsstatus") === status) {
      return statusStyles.get(status);
    } else {
      return undefined;
    }
  };
};

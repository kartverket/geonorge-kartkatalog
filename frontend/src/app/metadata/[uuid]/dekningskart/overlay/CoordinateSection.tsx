"use client";

import { Button, Heading } from "@kv-designsystem/react";
import { FilesIcon } from "@navikt/aksel-icons";
import type { Coordinate } from "ol/coordinate";

interface CoordinateSectionProps {
  coord: Coordinate;
  crs: string;
}

export const CoordinateSection = ({ coord, crs }: CoordinateSectionProps) => {
  return (
    <>
      <Heading level={4} data-size="2xs">
        Koordinater:
      </Heading>
      <div>{`Ø: ${coord[0].toFixed(0)}, N: ${coord[1].toFixed(0)},`}</div>
      <div>{crs}</div>
      <Button
        variant="secondary"
        onClick={() => {
          navigator.clipboard.writeText(
            `Ø: ${coord[0].toFixed(0)}, N: ${coord[1].toFixed(0)}, ${crs}`,
          );
        }}
      >
        <FilesIcon />
        Kopier koordinatene
      </Button>
    </>
  );
};

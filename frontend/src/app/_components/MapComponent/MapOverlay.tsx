"use client";

import { Button, Card } from "@kv-designsystem/react";
import {
  ExpandIcon,
  MinusIcon,
  PlusIcon,
  ShrinkIcon,
} from "@navikt/aksel-icons";
import { transform } from "ol/proj";
import { useEffect, useState } from "react";
import styles from "./MapOverlay.module.css";
import { MyLocationIcon } from "./MyLocationIcon";
import { map } from "./map/map";

export type MapOverlayProps = {
  showMovementControls?: boolean;
  fullScreenElementRef?: React.RefObject<HTMLElement | null>;
};

const zoomTo = (zoomLevel: number) => {
  const view = map.getView();
  const currentZoom = view.getZoom();
  if (currentZoom === undefined) {
    return;
  }

  view.animate({
    zoom: zoomLevel,
    duration: 300,
  });
};

const onZoomIn = () => {
  const currentLevel = map.getView().getZoom();
  if (currentLevel === undefined) {
    return;
  }
  zoomTo(currentLevel + 1);
};

const onZoomOut = () => {
  const currentLevel = map.getView().getZoom();
  if (currentLevel === undefined) {
    return;
  }
  zoomTo(currentLevel - 1);
};

const ControlButton = ({
  disabled,
  icon,
  onClick,
}: {
  disabled?: boolean;
  icon: React.ReactNode;
  onClick?: () => void;
}) => (
  <Button
    variant="secondary"
    className={styles.controlButton}
    onClick={onClick}
    disabled={disabled === true}
  >
    {icon}
  </Button>
);

export const MapOverlay = (props: MapOverlayProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const onShowMyLocation = () => {
    const view = map.getView();
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          const currentProjection = view.getProjection();
          const [x, y] = transform(
            [longitude, latitude],
            "EPSG:4326",
            currentProjection,
          );

          view.animate({
            center: [x, y],
            zoom: 15,
            duration: 500,
          });
          setIsGettingLocation(false);
        },
        () => {
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: false, timeout: 10_000 },
      );
    } else {
      setIsGettingLocation(false);
    }
  };

  useEffect(() => {
    if (isFullscreen) {
      const elem =
        props.fullScreenElementRef?.current ?? map.getTargetElement();
      if (elem && !document.fullscreenElement) {
        elem.requestFullscreen().catch((err) => {
          console.warn(
            `Error attempting to enable full-screen mode: ${err.message} (${err.name})`,
          );
        });
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => {
          console.warn(
            `Error attempting to exit full-screen mode: ${err.message} (${err.name})`,
          );
        });
      }
    }
    return () => {};
  }, [isFullscreen, props.fullScreenElementRef?.current]);

  return (
    <div className={styles.mapOverlay}>
      <div className={styles.middleColumn}>
        {props.showMovementControls && (
          <Card className={styles.movementControls}>
            <ControlButton
              disabled={isGettingLocation || !navigator.geolocation}
              icon={
                <MyLocationIcon
                  style={{
                    width: "var(--ds-font-size-5)",
                    height: "var(--ds-font-size-5)",
                  }}
                />
              }
              onClick={onShowMyLocation}
            />
            <div className={styles.zoomButtons}>
              <ControlButton icon={<MinusIcon />} onClick={onZoomOut} />
              <ControlButton icon={<PlusIcon />} onClick={onZoomIn} />
            </div>
            <ControlButton
              icon={isFullscreen ? <ShrinkIcon /> : <ExpandIcon />}
              onClick={() => setIsFullscreen(!isFullscreen)}
            />
          </Card>
        )}
      </div>
    </div>
  );
};

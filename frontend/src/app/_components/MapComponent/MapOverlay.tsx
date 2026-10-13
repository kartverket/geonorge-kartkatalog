import { Button, Card } from "@kv-designsystem/react";
import {
  CompassIcon,
  ExpandIcon,
  MinusIcon,
  PlusIcon,
} from "@navikt/aksel-icons";
import styles from "./MapOverlay.module.css";
import { map } from "./map/map";

export type MapOverlayProps = {
  showMovementControls?: boolean;
};

const ControlButton = ({ icon }: { icon: React.ReactNode }) => (
  <Button
    variant="secondary"
    data-color="accent"
    className={styles.controlButton}
  >
    {icon}
  </Button>
);

export const MapOverlay = (props: MapOverlayProps) => {
  return (
    <div className={styles.mapOverlay}>
      <div className={styles.middleColumn}>
        {props.showMovementControls && (
          <Card className={styles.movementControls}>
            <ControlButton icon={<CompassIcon />} />
            <div className={styles.zoomButtons}>
              <ControlButton icon={<MinusIcon />} />
              <ControlButton icon={<PlusIcon />} />
            </div>
            <ControlButton icon={<ExpandIcon />} />
          </Card>
        )}
      </div>
    </div>
  );
};

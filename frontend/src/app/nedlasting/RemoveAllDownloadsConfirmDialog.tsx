"use client";

import { Button, Dialog, Heading, Paragraph } from "@kv-designsystem/react";
import styles from "./RemoveAllDownloadsConfirmDialog.module.css";

type RemoveAllDownloadsConfirmDialogProps = {
  open: boolean;
  onConfirmAction: () => void;
  onCancelAction: () => void;
};

export function RemoveAllDownloadsConfirmDialog({
  open,
  onConfirmAction,
  onCancelAction,
}: RemoveAllDownloadsConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancelAction}>
      <Dialog.Block>
        <Heading level={2} data-size="xs">
          Er du sikker?
        </Heading>
      </Dialog.Block>
      <Dialog.Block>
        <Paragraph>
          Dette fjerner alle datasett og valg fra nedlastingskurven. Dette kan
          ikke angres.
        </Paragraph>
      </Dialog.Block>
      <Dialog.Block>
        <div className={styles.buttonRow}>
          <Button type="button" variant="secondary" onClick={onCancelAction}>
            Avbryt
          </Button>
          <Button type="button" variant="primary" onClick={onConfirmAction}>
            Ja, fjern alle
          </Button>
        </div>
      </Dialog.Block>
    </Dialog>
  );
}

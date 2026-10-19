"use client";

import { Button, Dialog, Heading, Paragraph } from "@kv-designsystem/react";
import styles from "./OverwriteConfirmDialog.module.css";

type OverwriteConfirmDialogProps = {
  open: boolean;
  onConfirmAction: () => void;
  onCancelAction: () => void;
};

export function OverwriteConfirmDialog({
  open,
  onConfirmAction,
  onCancelAction,
}: OverwriteConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancelAction} closeButton={false}>
      <Dialog.Block>
        <Heading level={2} data-size="xs">
          Ønsker du å overskrive?
        </Heading>
      </Dialog.Block>
      <Dialog.Block>
        <Paragraph>
          Ett eller flere av de valgte produktene har allerede manuelt valgte
          områder. Vil du overskrive disse med fellesvalget, eller legge
          fellesvalget til som nye områder i tillegg?
        </Paragraph>
      </Dialog.Block>
      <Dialog.Block>
        <div className={styles.buttonRow}>
          <Button type="button" variant="secondary" onClick={onCancelAction}>
            Nei, legg til
          </Button>
          <Button type="button" variant="primary" onClick={onConfirmAction}>
            Ja, overskriv
          </Button>
        </div>
      </Dialog.Block>
    </Dialog>
  );
}

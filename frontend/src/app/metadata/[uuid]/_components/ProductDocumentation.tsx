import { Card, Heading, Paragraph, Tag } from "@kv-designsystem/react";
import { PencilBoardIcon } from "@navikt/aksel-icons";
import styles from "./ProductDocumentation.module.css";

export function ProductDocumentation() {
  return (
    <Card asChild data-color="neutral" className={styles.wrapper}>
      <button type="button">
        <div className={styles.tagGroup}>
          <PencilBoardIcon aria-hidden className={styles.icon} />
          <Tag data-color="accent" data-size="sm">
            Gyldig
          </Tag>
        </div>
        <Heading data-size="md">Tegneregler</Heading>
        <Paragraph data-size="md">
          Tegneregler forklarer hvordan dataene skal visualiseres i kart,
          inkludert symboler, farger og utforming.
        </Paragraph>
        <Paragraph data-size="sm">Dato publisert</Paragraph>
      </button>
    </Card>
  );
}

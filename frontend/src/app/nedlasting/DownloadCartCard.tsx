"use client";

import {Button, Card, Heading, Tag} from "@kv-designsystem/react";
import {ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon} from "@navikt/aksel-icons";
import { useId, useState } from "react";
import AddToCartButton from "@/app/_components/addToCart/AddToCartButton";
import {
  AccessStateTag,
  type AccessTagContext,
} from "@/components/AccessStateTag/AccessStateTag";
import { LOCATIONS, trackClick } from "@/posthog/posthog";
import styles from "./DownloadCartCard.module.css";

export type DownloadCartCardProps = {
  uuid: string;
  title: string;
  organization: string | null;
  typeTranslated: string | null;
  accessState: "restricted" | "open" | "protected" | null;
  distributionUrl: string;
};

const TYPE_TO_ACCESS_CONTEXT: Record<string, AccessTagContext> = {
  Tjeneste: "tjeneste",
  Tjenestelag: "tjenestelag",
  Applikasjon: "applikasjon",
  Datasettserie: "datasettserie",
};

export function DownloadCartCard({
  uuid,
  title,
  organization,
  typeTranslated,
  accessState,
  distributionUrl,
}: DownloadCartCardProps) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const accessContext =
    TYPE_TO_ACCESS_CONTEXT[typeTranslated ?? ""] ?? "datasett";

  return (
    <Card data-color="neutral" className={styles.card}>
      <div className={styles.content}>
        {typeTranslated ? (
          <div className={styles.badgeRow}>
            <AccessStateTag accessState={accessState} context={accessContext} />
            <Tag data-color="neutral" data-size="sm" className={styles.typeTag}>
              {organization ?? typeTranslated}
            </Tag>
          </div>
        ) : null}
        <Heading level={3} data-size={"xs"}>{title}</Heading>
        {expanded ? (
          <p id={detailsId} className={styles.expandedContent}>
            ekspandert
          </p>
        ) : null}
      </div>

      <div className={styles.actions}>
        <Button className={styles.productPageButton} asChild variant="secondary" data-size={"sm"}>
          <a href={`/metadata/${uuid}`} onClick={()=>trackClick("open-dataset-card", LOCATIONS.DownloadPage, {
            datasetTitle: title,
            datasetUuid: uuid,
          })}>
            <ExternalLinkIcon aria-hidden={"true"} />
            <span>Vis produktsiden</span>
          </a>
        </Button>

        <AddToCartButton
          item={{
            accessIsOpendata: accessState === "open",
            accessIsRestricted: accessState === "restricted",
            uuid,
            name: title,
            organizationName: organization,
            distributionUrl,
          }}
          location={LOCATIONS.DownloadPage}
          variant="secondary"
          size="sm"
          removeLabel="Fjern fra handlekurv"
        />
        <Button
          variant="tertiary"
          data-size="sm"
          className={
            expanded
              ? `${styles.expandButton} ${styles.expanded}`
              : styles.expandButton
          }
          aria-expanded={expanded}
          aria-controls={detailsId}
          aria-label={expanded ? "Skjul detaljer" : "Vis detaljer"}
          onClick={() => setExpanded((isExpanded) => !isExpanded)}
        >
          {expanded ? <ChevronUpIcon aria-hidden /> : <ChevronDownIcon aria-hidden />}
        </Button>
      </div>
    </Card>
  );
}

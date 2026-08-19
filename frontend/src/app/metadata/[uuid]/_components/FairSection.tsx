"use client";

import { Button, Details, Heading } from "@kv-designsystem/react";
import { useState } from "react";
import { CheckmarkIcon, MinusIcon, XMarkIcon } from "@navikt/aksel-icons";
import type { ProductFairStatus } from "@/lib/schemas/product";
import styles from "./FairSection.module.css";

function CriterionStatus({ fulfilled }: { fulfilled: boolean | null }) {
  if (fulfilled === null) return <MinusIcon aria-hidden />;
  return fulfilled ? <CheckmarkIcon aria-hidden /> : <XMarkIcon aria-hidden />;
}

export function FairSection({ fairStatus }: { fairStatus: ProductFairStatus }) {
  const [showLevels, setShowLevels] = useState(false);
  return (
    <>
      <div className={styles.headingGroup}>
        <Heading data-size="sm">Metadatakvalitet (FAIR-status)</Heading>
        <p>
          En FAIR-status gir en kort vurdering av hvor godt et datasett følger
          FAIR-prinsippene: Findable (søkbarhet), Accessible (tilgjengelighet),
          Interoperabel (interoperabilitet), Reusable (gjenbrukbar).
        </p>
        {showLevels && (
          <ul>
            {fairStatus.rating.Levels.map((level) => (
              <li key={level.Status}>{level.Description}</li>
            ))}
          </ul>
        )}
        <Button
          variant="tertiary"
          className={styles.showMoreButton}
          onClick={() => setShowLevels((v) => !v)}
        >
          {showLevels ? "Skjul" : "Vis mer"}
        </Button>
      </div>
      <div className={styles.headingGroup}>
        <Heading data-size="sm">Resultater for dette datasettet</Heading>
        <p>Total vurdering: {fairStatus.totalPercent ?? "-"}%.</p>
      </div>
      <div className={styles.accordionGroup} data-color="neutral">
        {fairStatus.principles.map((principle) => (
          <Details key={principle.Code}>
            <Details.Summary>{principle.Label}</Details.Summary>
            <Details.Content>
              <p>
                <strong>
                  {principle.Label.split(" (")[0]}:{" "}
                  {principle.StatusPerCent ?? "-"}%
                </strong>
              </p>
              <ul className={styles.criteriaGroupList}>
                {principle.CriteriaGroups.map((group) => (
                  <li key={group.Code}>
                    {group.Label}
                    <ul className={styles.criteriaList}>
                      {group.Criteria.map((criterion) => (
                        <li
                          key={criterion.Code}
                          className={styles.criteriaItem}
                        >
                          <CriterionStatus fulfilled={criterion.Fulfilled} />
                          <span>{criterion.Description}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </Details.Content>
          </Details>
        ))}
      </div>
    </>
  );
}

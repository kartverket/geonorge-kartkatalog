"use client";

import Markdown from "react-markdown";
import { getProductTypeString } from "@/lib/productType";
import type { Alerts } from "@/lib/schemas/alerts";

type AlertWithDetailsUrl = Alerts[number] & { detailsUrl: string | null };

export default function ProductAlert({
  alerts,
  hierarchyLevel,
}: {
  alerts: AlertWithDetailsUrl[];
  hierarchyLevel: string;
}) {
  const parser = new DOMParser();
  const alertsWithNotes = alerts.flatMap((alert) => {
    if (!alert.note) return [];

    const parsedAlertNote = parser.parseFromString(alert.note, "text/html");
    return [{ alert, note: parsedAlertNote.body.textContent || alert.note }];
  });

  if (alertsWithNotes.length === 0) {
    return null;
  }

  const productType =
    getProductTypeString(hierarchyLevel).toLocaleLowerCase("nb-NO");

  return (
    <div className="ds-alert" data-color="info">
      <h2 className="ds-heading" data-size="xs">
        Varsler for {productType}
      </h2>
      <ul>
        {alertsWithNotes.map(({ alert, note }, index) => (
          <li key={`${alert.systemId ?? alert.alertType ?? "alert"}-${index}`}>
            {alert.alertType}
            {alert.detailsUrl && (
              <>
              {" ("}<a href={alert.detailsUrl}>Gå til varsel</a>{"). "}
              </>
            )}
            <Markdown components={{ p: ({ children }) => <>{children}</> }}>
              {note}
            </Markdown>
          </li>
        ))}
      </ul>
    </div>
  );
}

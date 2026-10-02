"use client";

import Markdown from "react-markdown";
import { getProductTypeString } from "@/lib/productType";
import type { Alerts } from "@/lib/schemas/alerts";

type AlertWithDetailsUrl = Alerts[number] & { detailsUrl: string | null };

function formatEffectiveDate(effectiveDate: string | null) {
  if (!effectiveDate) return null;

  const date = new Date(effectiveDate);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

export default function ProductAlert({
  alerts,
  hierarchyLevel,
}: {
  alerts: AlertWithDetailsUrl[];
  hierarchyLevel: string;
}) {
  const alertsWithNotes = alerts.flatMap((alert) => {
    if (!alert.note) return [];

    const parser = new DOMParser();
    const parsedAlertNote = parser.parseFromString(alert.note, "text/html");
    return [
      {
        alert,
        note: parsedAlertNote.body.textContent || alert.note,
        effectiveDate: formatEffectiveDate(alert.effectiveDate),
      },
    ];
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
        {alertsWithNotes.map(({ alert, note, effectiveDate }, index) => (
          <li key={`${alert.systemId ?? alert.alertType ?? "alert"}-${index}`}>
            {alert.alertType}
            {alert.detailsUrl && (
              <>
                {" ("}
                <a href={alert.detailsUrl}>Gå til varsel</a>
                {"). "}
              </>
            )}
            <Markdown components={{ p: ({ children }) => <>{children}</> }}>
              {note}
            </Markdown>
            {effectiveDate && <em> Gjelder fra {effectiveDate}.</em>}
          </li>
        ))}
      </ul>
    </div>
  );
}

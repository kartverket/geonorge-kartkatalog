'use client';

import type { Alert } from "@/lib/schemas/alerts";

export default function ProductAlert({ alert }: { alert: Alert }) {
  const parser = new DOMParser();
  if(!alert.note) {
    return null;
  }
  const parsedAlertNote = parser.parseFromString(alert.note, "text/html");
  const alertNoteText = parsedAlertNote.body.textContent || alert.note;
  return (
    <div>
      <div className="ds-alert" data-color="info">
        <h3 className="ds-heading" data-size="xs">
          {alert.alertType}
        </h3>
        <p className="ds-paragraph">{alertNoteText}</p>
      </div>
    </div>
  );
}

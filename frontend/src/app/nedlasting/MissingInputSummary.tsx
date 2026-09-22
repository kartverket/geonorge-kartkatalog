import { ErrorSummary } from "@kv-designsystem/react";
import type { MissingDownloadSelectionField } from "@/app/nedlasting/downloadUtils";

export function MissingInputSummary({
  productsWithMissingFields,
}: {
  productsWithMissingFields: {
    uuid: string;
    title: string;
    missingFields: MissingDownloadSelectionField[];
  }[];
}) {
  function formatMissingFields(fields: MissingDownloadSelectionField[]) {
    const FIELD_LABELS = {
      area: "geografisk område",
      format: "format",
      projection: "projeksjon",
    } as const;
    const labels = fields.map((field) => FIELD_LABELS[field]);

    if (labels.length < 2) return labels[0];
    if (labels.length === 2) return labels.join(" og ");

    return `${labels.slice(0, -1).join(", ")} og ${labels.at(-1)}`;
  }
  return (
    <ErrorSummary>
      <ErrorSummary.Heading>
        Følgende produkter mangler valg:
      </ErrorSummary.Heading>
      <ErrorSummary.List>
        {productsWithMissingFields.map(({ uuid, title, missingFields }) => (
          <ErrorSummary.Item key={uuid}>
            <ErrorSummary.Link href="#">
              {title} mangler {formatMissingFields(missingFields)}.
            </ErrorSummary.Link>
          </ErrorSummary.Item>
        ))}
      </ErrorSummary.List>
    </ErrorSummary>
  );
}

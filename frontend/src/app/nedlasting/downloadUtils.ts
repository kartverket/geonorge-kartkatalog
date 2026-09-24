import type {
  DownloadOptions,
  DownloadOrderItemInput,
} from "@/lib/schemas/download";

export type DownloadSelection = {
  areaCode: string[];
  formatNames: string[];
  projectionCodes: string[];
};

export type MissingDownloadSelectionField = "area" | "projection" | "format";

export function getMissingDownloadSelectionFields(
  selection: DownloadSelection,
): MissingDownloadSelectionField[] {
  const missingFields: MissingDownloadSelectionField[] = [];

  if (!selection.areaCode || selection.areaCode.length === 0)
    missingFields.push("area");
  if (!selection.projectionCodes || selection.projectionCodes.length === 0)
    missingFields.push("projection");
  if (selection.formatNames.length === 0) missingFields.push("format");

  return missingFields;
}

export function getAvailableProjections(options: DownloadOptions | null) {
  if (!options) return [];

  return Array.from(
    new Map(
      options.formats
        .flatMap((format) => format.projections)
        .map((projection) => [projection.code, projection]),
    ).values(),
  );
}

export function getAvailableFormats(
  options: DownloadOptions | null,
  projectionCodes: string[],
) {
  if (!options || projectionCodes.length === 0) return [];

  return options.formats.filter((format) =>
    projectionCodes.every((projectionCode) =>
      format.projections.some((projection) => projection.code === projectionCode),
    ),
  );
}

export function createDownloadOrderItem(
  uuid: string,
  options: DownloadOptions | null,
  selection: DownloadSelection,
): DownloadOrderItemInput | null {
  const areas =
    options?.areas.filter((candidate) =>
      selection.areaCode.includes(candidate.code),
    ) ?? [];
  const selectedProjectionSet = new Set(selection.projectionCodes);
  const projections = getAvailableProjections(options).filter((candidate) =>
    selectedProjectionSet.has(candidate.code),
  );
  const formats = getAvailableFormats(options, selection.projectionCodes).filter(
    (format) => selection.formatNames.includes(format.name),
  );

  if (areas.length === 0 || projections.length === 0 || formats.length === 0)
    return null;

  return {
    uuid,
    areas: areas,
    projections,
    formats: formats.map((format) => ({ name: format.name })),
  };
}

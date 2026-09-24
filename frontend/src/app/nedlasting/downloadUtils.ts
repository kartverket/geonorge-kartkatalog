import type {
  DownloadOptions,
  DownloadOrderItemInput,
} from "@/lib/schemas/download";

export type DownloadSelection = {
  areaCode: string;
  formatNames: string[];
  projectionCode: string;
};

export const EMPTY_DOWNLOAD_SELECTION: DownloadSelection = {
  areaCode: "",
  formatNames: [],
  projectionCode: "",
};

export type MissingDownloadSelectionField = "area" | "projection" | "format";

export function getMissingDownloadSelectionFields(
  selection: DownloadSelection,
): MissingDownloadSelectionField[] {
  const missingFields: MissingDownloadSelectionField[] = [];

  if (!selection.areaCode) missingFields.push("area");
  if (!selection.projectionCode) missingFields.push("projection");
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
  projectionCode: string,
) {
  if (!options || !projectionCode) return [];

  return options.formats.filter((format) =>
    format.projections.some((projection) => projection.code === projectionCode),
  );
}

export function createDownloadOrderItem(
  uuid: string,
  options: DownloadOptions | null,
  selection: DownloadSelection,
): DownloadOrderItemInput | null {
  const area = options?.areas.find(
    (candidate) => candidate.code === selection.areaCode,
  );
  const projection = getAvailableProjections(options).find(
    (candidate) => candidate.code === selection.projectionCode,
  );
  const formats = getAvailableFormats(options, selection.projectionCode).filter(
    (format) => selection.formatNames.includes(format.name),
  );

  if (!area || !projection || formats.length === 0) return null;

  return {
    uuid,
    areas: [area],
    projections: [projection],
    formats: formats.map((format) => ({ name: format.name })),
  };
}

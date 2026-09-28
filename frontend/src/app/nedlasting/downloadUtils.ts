import type {
  DownloadOptions,
  DownloadOrderItemInput,
} from "@/lib/schemas/download";

export type DownloadCard = {
  uuid: string;
  title: string;
  organization: string | null;
  typeTranslated: string | null;
  accessState: "restricted" | "open" | "protected" | null;
  distributionUrl: string;
};

export type DownloadOptionsState = {
  options: DownloadOptions | null;
  isLoading: boolean;
  error: string | null;
};

export type DownloadOptionsByUuid = Record<string, DownloadOptionsState>;

export type DownloadSelection = {
  areaCodes: string[];
  formatNames: string[];
  projectionCodes: string[];
};

export const EMPTY_DOWNLOAD_SELECTION: DownloadSelection = {
  areaCodes: [],
  formatNames: [],
  projectionCodes: [],
};

export type MissingDownloadSelectionField = "area" | "projection" | "format";

export function getMissingDownloadSelectionFields(
  selection: DownloadSelection,
): MissingDownloadSelectionField[] {
  const missingFields: MissingDownloadSelectionField[] = [];

  if (selection.areaCodes.length === 0) missingFields.push("area");
  if (selection.projectionCodes.length === 0) missingFields.push("projection");
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
      format.projections.some(
        (projection) => projection.code === projectionCode,
      ),
    ),
  );
}

export function createDownloadOrderItem(
  uuid: string,
  options: DownloadOptions | null,
  selection: DownloadSelection,
): DownloadOrderItemInput | null {
  const areaCodeSet = new Set(selection.areaCodes);
  const areas =
    options?.areas.filter((candidate) => areaCodeSet.has(candidate.code)) ?? [];
  const projectionCodeSet = new Set(selection.projectionCodes);
  const projections = getAvailableProjections(options).filter((candidate) =>
    projectionCodeSet.has(candidate.code),
  );
  const formats = getAvailableFormats(
    options,
    selection.projectionCodes,
  ).filter((format) => selection.formatNames.includes(format.name));

  if (areas.length === 0 || projections.length === 0 || formats.length === 0)
    return null;

  return {
    uuid,
    areas: areas,
    projections,
    formats: formats.map((format) => ({ name: format.name })),
  };
}

export type DownloadArea = DownloadOptions["areas"][number];
type DownloadFormat = DownloadOptions["formats"][number];
type DownloadProjection = ReturnType<typeof getAvailableProjections>[number];

export type AreaOptionGroup = {
  label: string;
  areas: DownloadArea[];
};

const AREA_GROUPS = [
  { type: "landsdekkende", label: "Hele landet" },
  { type: "fylke", label: "Fylke" },
  { type: "kommune", label: "Kommune" },
] as const;

export function getAreaOptionGroups(areas: DownloadArea[]): AreaOptionGroup[] {
  const knownTypes = new Set<string>(AREA_GROUPS.map((group) => group.type));

  const groups = AREA_GROUPS.flatMap(({ type, label }) => {
    const groupedAreas = areas.filter((area) => area.type === type);

    return groupedAreas.length > 0 ? [{ label, areas: groupedAreas }] : [];
  });

  const otherAreas = areas.filter(
    (area) => !area.type || !knownTypes.has(area.type),
  );

  return otherAreas.length > 0
    ? [...groups, { label: "Annet", areas: otherAreas }]
    : groups;
}

function intersectByKey<T>(lists: T[][], key: (item: T) => string): T[] {
  if (lists.length === 0) return [];

  const [first, ...rest] = lists;
  return first.filter((item) =>
    rest.every((list) =>
      list.some((candidate) => key(candidate) === key(item)),
    ),
  );
}

export function getCommonAreas(
  optionsList: (DownloadOptions | null)[],
): DownloadArea[] {
  if (optionsList.length === 0 || optionsList.some((options) => !options)) {
    return [];
  }

  return intersectByKey(
    optionsList.map((options) => options?.areas ?? []),
    (area) => area.code,
  );
}

export function getCommonProjections(
  optionsList: (DownloadOptions | null)[],
): DownloadProjection[] {
  if (optionsList.length === 0 || optionsList.some((options) => !options)) {
    return [];
  }

  return intersectByKey(
    optionsList.map((options) => getAvailableProjections(options)),
    (projection) => projection.code,
  );
}

export function getCommonFormats(
  optionsList: (DownloadOptions | null)[],
  projectionCodes: string[],
): DownloadFormat[] {
  if (
    projectionCodes.length === 0 ||
    optionsList.length === 0 ||
    optionsList.some((options) => !options)
  ) {
    return [];
  }

  return intersectByKey(
    optionsList.map((options) => getAvailableFormats(options, projectionCodes)),
    (format) => format.name,
  );
}

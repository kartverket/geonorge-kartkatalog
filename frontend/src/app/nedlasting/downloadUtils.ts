import type {
  DownloadOptions,
  DownloadOrderAreaInput,
  DownloadOrderItemInput,
  DownloadOrderProjectionInput,
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

export function selectDownloadAreas(
  selection: DownloadSelection,
  areaCodes: string[],
): DownloadSelection {
  return {
    ...selection,
    areaCodes,
    projectionCodes: [],
    formatNames: [],
  };
}

export function selectDownloadProjections(
  selection: DownloadSelection,
  projectionCodes: string[],
): DownloadSelection {
  return {
    ...selection,
    projectionCodes,
    formatNames: [],
  };
}

export function selectDownloadFormats(
  selection: DownloadSelection,
  formatNames: string[],
): DownloadSelection {
  return {
    ...selection,
    formatNames,
  };
}

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

function getSelectedAreas(options: DownloadOptions, areaCodes: string[]) {
  const selectedCodes = new Set(areaCodes);
  const areas = options.areas.filter((option) =>
    selectedCodes.has(option.area.code),
  );
  return areas.length === selectedCodes.size ? areas : [];
}

function resolveProjectionOptions(areas: DownloadAreaOption[]) {
  if (areas.length === 0) return [];
  return intersectByKey(
    areas.map((area) => area.projections),
    (projection) => projection.code,
  );
}

function resolveFormatOptions(
  areas: DownloadAreaOption[],
  projectionCodes: string[],
) {
  if (areas.length === 0 || projectionCodes.length === 0) return [];

  const formatLists = areas.flatMap((area) =>
    projectionCodes.map(
      (projectionCode) =>
        area.projections.find(
          (projection) => projection.code === projectionCode,
        )?.formats ?? [],
    ),
  );

  return intersectByKey(formatLists, (format) => format.name);
}

export type DownloadAvailability = {
  areaOptions: DownloadAreaOption[];
  selectedAreaOptions: DownloadAreaOption[];
  projectionOptions: DownloadProjectionOption[];
  formatOptions: DownloadFormat[];
};

export function resolveDownloadAvailability(
  options: DownloadOptions | null,
  selection: Pick<DownloadSelection, "areaCodes" | "projectionCodes">,
): DownloadAvailability {
  const areaOptions = options?.areas ?? [];
  const selectedAreaOptions = options
    ? getSelectedAreas(options, selection.areaCodes)
    : [];

  return {
    areaOptions,
    selectedAreaOptions,
    projectionOptions: resolveProjectionOptions(selectedAreaOptions),
    formatOptions: resolveFormatOptions(
      selectedAreaOptions,
      selection.projectionCodes,
    ),
  };
}

export function createDownloadOrderItem(
  uuid: string,
  options: DownloadOptions | null,
  selection: DownloadSelection,
): DownloadOrderItemInput | null {
  const availability = resolveDownloadAvailability(options, selection);
  const projectionCodeSet = new Set(selection.projectionCodes);
  const projections = availability.projectionOptions.filter((candidate) =>
    projectionCodeSet.has(candidate.code),
  );
  const formats = availability.formatOptions.filter((format) =>
    selection.formatNames.includes(format.name),
  );

  if (
    availability.selectedAreaOptions.length === 0 ||
    projections.length === 0 ||
    formats.length === 0
  )
    return null;

  return {
    uuid,
    areas: availability.selectedAreaOptions.map(toDownloadOrderArea),
    projections: projections.map(toDownloadOrderProjection),
    formats: formats.map((format) => ({ name: format.name })),
  };
}

export type DownloadAreaOption = DownloadOptions["areas"][number];
type DownloadProjectionOption = DownloadAreaOption["projections"][number];
type DownloadFormat = DownloadProjectionOption["formats"][number];

function toDownloadOrderArea(
  option: DownloadAreaOption,
): DownloadOrderAreaInput {
  const { code, name, type } = option.area;
  return { code, name, type };
}

function toDownloadOrderProjection(
  projection: DownloadProjectionOption,
): DownloadOrderProjectionInput {
  const { code, name, codespace } = projection;
  return { code, name, codespace };
}

export type AreaOptionGroup = {
  label: string;
  areas: DownloadAreaOption[];
};

const AREA_GROUPS = [
  { type: "landsdekkende", label: "Hele landet" },
  { type: "fylke", label: "Fylke" },
  { type: "kommune", label: "Kommune" },
  { type: "celle", label: "Celle" },
] as const;

export function getAreaOptionGroups(
  areas: DownloadAreaOption[],
): AreaOptionGroup[] {
  const knownTypes = new Set<string>(AREA_GROUPS.map((group) => group.type));

  const groups = AREA_GROUPS.flatMap(({ type, label }) => {
    const groupedAreas = areas.filter((option) => option.area.type === type);

    return groupedAreas.length > 0 ? [{ label, areas: groupedAreas }] : [];
  });

  const otherAreas = areas.filter(
    (option) => !option.area.type || !knownTypes.has(option.area.type),
  );

  return otherAreas.length > 0
    ? [...groups, { label: "Annet", areas: otherAreas }]
    : groups;
}

function intersectByKey<T>(lists: T[][], key: (item: T) => string): T[] {
  if (lists.length === 0) return [];

  const [first, ...rest] = lists;
  const keySets = rest.map((list) => new Set(list.map(key)));

  return first.filter((item) => {
    const itemKey = key(item);
    return keySets.every((keys) => keys.has(itemKey));
  });
}

function getCommonAreas(
  optionsList: (DownloadOptions | null)[],
): DownloadAreaOption[] {
  if (optionsList.length === 0 || optionsList.some((options) => !options)) {
    return [];
  }

  return intersectByKey(
    optionsList.map((options) => options?.areas ?? []),
    (option) => option.area.code,
  );
}

export function resolveCommonDownloadAvailability(
  optionsList: (DownloadOptions | null)[],
  selection: Pick<DownloadSelection, "areaCodes" | "projectionCodes">,
): DownloadAvailability {
  if (optionsList.length === 0 || optionsList.some((options) => !options)) {
    return {
      areaOptions: [],
      selectedAreaOptions: [],
      projectionOptions: [],
      formatOptions: [],
    };
  }

  const resolutions = optionsList.map((options) =>
    resolveDownloadAvailability(options, selection),
  );
  const areaOptions = getCommonAreas(optionsList);
  const selectedCodes = new Set(selection.areaCodes);
  const selectedAreaOptions = areaOptions.filter((option) =>
    selectedCodes.has(option.area.code),
  );

  return {
    areaOptions,
    selectedAreaOptions:
      selectedAreaOptions.length === selectedCodes.size
        ? selectedAreaOptions
        : [],
    projectionOptions: intersectByKey(
      resolutions.map((resolution) => resolution.projectionOptions),
      (projection) => projection.code,
    ),
    formatOptions: intersectByKey(
      resolutions.map((resolution) => resolution.formatOptions),
      (format) => format.name,
    ),
  };
}

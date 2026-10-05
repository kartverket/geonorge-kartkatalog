import type {
  DownloadOptions,
  DownloadOrderAreaInput,
  DownloadOrderItemInput,
  DownloadOrderProjectionInput,
  DownloadOrderResult,
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

function getMatchingAreas(options: DownloadOptions, areaCodes: string[]) {
  const selectedCodes = new Set(areaCodes);
  return options.areas.filter((option) => selectedCodes.has(option.area.code));
}

function getSelectedAreas(options: DownloadOptions, areaCodes: string[]) {
  const areas = getMatchingAreas(options, areaCodes);
  return areas.length === new Set(areaCodes).size ? areas : [];
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

export function filterSelectionForProduct(
  options: DownloadOptions | null,
  bulkSelection: DownloadSelection,
): DownloadSelection {
  if (!options) return EMPTY_DOWNLOAD_SELECTION;

  const matchingAreas = getMatchingAreas(options, bulkSelection.areaCodes);
  const areaCodes = matchingAreas.map((area) => area.area.code);

  const projectionOptions = resolveProjectionOptions(matchingAreas);
  const projectionCodeSet = new Set(bulkSelection.projectionCodes);
  const projectionCodes = projectionOptions
    .filter((projection) => projectionCodeSet.has(projection.code))
    .map((projection) => projection.code);

  const formatOptions = resolveFormatOptions(matchingAreas, projectionCodes);
  const formatNameSet = new Set(bulkSelection.formatNames);
  const formatNames = formatOptions
    .filter((format) => formatNameSet.has(format.name))
    .map((format) => format.name);

  return { areaCodes, projectionCodes, formatNames };
}

export function createDownloadOrderItem(
  uuid: string,
  capabilitiesUrl: string,
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
    capabilitiesUrl,
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

function intersectByKey<T>(lists: T[][], key: (item: T) => string): T[] {
  if (lists.length === 0) return [];

  const [first, ...rest] = lists;
  const keySets = rest.map((list) => new Set(list.map(key)));

  return first.filter((item) => {
    const itemKey = key(item);
    return keySets.every((keys) => keys.has(itemKey));
  });
}

function unionByKey<T>(lists: T[][], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const list of lists) {
    for (const item of list) {
      const itemKey = key(item);
      if (seen.has(itemKey)) continue;
      seen.add(itemKey);
      result.push(item);
    }
  }

  return result;
}

export type DownloadSelectionGapCounts = {
  areas: number;
  projections: number;
  formats: number;
};

export function getDownloadSelectionGapCounts(
  optionsList: (DownloadOptions | null)[],
  bulkSelection: DownloadSelection,
): DownloadSelectionGapCounts {
  const perProductSelections = optionsList.map((options) =>
    filterSelectionForProduct(options, bulkSelection),
  );

  function countGaps(
    bulkField: string[],
    getField: (selection: DownloadSelection) => string[],
  ) {
    if (bulkField.length === 0) return 0;
    return perProductSelections.filter(
      (selection) => getField(selection).length === 0,
    ).length;
  }

  return {
    areas: countGaps(bulkSelection.areaCodes, (s) => s.areaCodes),
    projections: countGaps(
      bulkSelection.projectionCodes,
      (s) => s.projectionCodes,
    ),
    formats: countGaps(bulkSelection.formatNames, (s) => s.formatNames),
  };
}

function unionProjectionsAcrossAreas(
  areas: DownloadAreaOption[],
): DownloadProjectionOption[] {
  return unionByKey(
    areas.map((area) => area.projections),
    (projection) => projection.code,
  );
}

function unionFormatsAcrossAreas(
  areas: DownloadAreaOption[],
): DownloadFormat[] {
  return unionByKey(
    areas.flatMap((area) =>
      area.projections.map((projection) => projection.formats),
    ),
    (format) => format.name,
  );
}

export function resolveUnionDownloadAvailability(
  optionsList: (DownloadOptions | null)[],
  selection: Pick<DownloadSelection, "areaCodes" | "projectionCodes">,
): DownloadAvailability {
  const presentOptionsList = optionsList.flatMap((options) =>
    options ? [options] : [],
  );

  const areaOptions = unionByKey(
    presentOptionsList.map((options) => options.areas),
    (option) => option.area.code,
  );
  const selectedCodes = new Set(selection.areaCodes);
  const selectedAreaOptions = areaOptions.filter((option) =>
    selectedCodes.has(option.area.code),
  );

  const displayAreasByProduct = presentOptionsList.map((options) =>
    selection.areaCodes.length === 0
      ? options.areas
      : getMatchingAreas(options, selection.areaCodes),
  );

  return {
    areaOptions,
    selectedAreaOptions,
    projectionOptions: unionByKey(
      displayAreasByProduct.map((areas) =>
        selection.areaCodes.length === 0
          ? unionProjectionsAcrossAreas(areas)
          : resolveProjectionOptions(areas),
      ),
      (projection) => projection.code,
    ),
    formatOptions: unionByKey(
      displayAreasByProduct.map((areas) =>
        selection.projectionCodes.length === 0
          ? unionFormatsAcrossAreas(areas)
          : resolveFormatOptions(areas, selection.projectionCodes),
      ),
      (format) => format.name,
    ),
  };
}

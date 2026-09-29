import type {
  DownloadOptions,
  DownloadOrderAreaInput,
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

function getSelectedAreas(options: DownloadOptions, areaCodes: string[]) {
  const selectedCodes = new Set(areaCodes);
  const areas = options.areas.filter((option) =>
    selectedCodes.has(option.area.code),
  );
  return areas.length === selectedCodes.size ? areas : [];
}

export function getAvailableProjections(
  options: DownloadOptions | null,
  areaCodes: string[],
) {
  if (!options || areaCodes.length === 0) return [];

  const areas = getSelectedAreas(options, areaCodes);
  if (areas.length === 0) return [];

  return intersectByKey(
    areas.map((area) => area.projections),
    (projection) => projection.code,
  );
}

export function getAvailableFormats(
  options: DownloadOptions | null,
  areaCodes: string[],
  projectionCodes: string[],
) {
  if (!options || areaCodes.length === 0 || projectionCodes.length === 0)
    return [];

  const areas = getSelectedAreas(options, areaCodes);
  if (areas.length === 0) return [];

  return intersectByKey(
    areas.map((area) =>
      area.formats.filter((format) =>
        projectionCodes.every((projectionCode) =>
          format.projections.some(
            (projection) => projection.code === projectionCode,
          ),
        ),
      ),
    ),
    (format) => format.name,
  );
}

export function createDownloadOrderItem(
  uuid: string,
  options: DownloadOptions | null,
  selection: DownloadSelection,
): DownloadOrderItemInput | null {
  const areaCodeSet = new Set(selection.areaCodes);
  const areas =
    options?.areas.filter((candidate) =>
      areaCodeSet.has(candidate.area.code),
    ) ?? [];
  const projectionCodeSet = new Set(selection.projectionCodes);
  const projections = getAvailableProjections(
    options,
    selection.areaCodes,
  ).filter((candidate) => projectionCodeSet.has(candidate.code));
  const formats = getAvailableFormats(
    options,
    selection.areaCodes,
    selection.projectionCodes,
  ).filter((format) => selection.formatNames.includes(format.name));

  if (areas.length === 0 || projections.length === 0 || formats.length === 0)
    return null;

  return {
    uuid,
    areas: areas.map(toDownloadOrderArea),
    projections,
    formats: formats.map((format) => ({ name: format.name })),
  };
}

export type DownloadAreaOption = DownloadOptions["areas"][number];
type DownloadFormat = DownloadAreaOption["formats"][number];
type DownloadProjection = ReturnType<typeof getAvailableProjections>[number];

function toDownloadOrderArea(
  option: DownloadAreaOption,
): DownloadOrderAreaInput {
  const { code, name, type } = option.area;
  return { code, name, type };
}

export type AreaOptionGroup = {
  label: string;
  areas: DownloadAreaOption[];
};

const AREA_GROUPS = [
  { type: "landsdekkende", label: "Hele landet" },
  { type: "fylke", label: "Fylke" },
  { type: "kommune", label: "Kommune" },
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
  return first.filter((item) =>
    rest.every((list) =>
      list.some((candidate) => key(candidate) === key(item)),
    ),
  );
}

export function getCommonAreas(
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

export function getCommonProjections(
  optionsList: (DownloadOptions | null)[],
  areaCodes: string[],
): DownloadProjection[] {
  if (
    areaCodes.length === 0 ||
    optionsList.length === 0 ||
    optionsList.some((options) => !options)
  ) {
    return [];
  }

  return intersectByKey(
    optionsList.map((options) => getAvailableProjections(options, areaCodes)),
    (projection) => projection.code,
  );
}

export function getCommonFormats(
  optionsList: (DownloadOptions | null)[],
  areaCodes: string[],
  projectionCodes: string[],
): DownloadFormat[] {
  if (
    areaCodes.length === 0 ||
    projectionCodes.length === 0 ||
    optionsList.length === 0 ||
    optionsList.some((options) => !options)
  ) {
    return [];
  }

  return intersectByKey(
    optionsList.map((options) =>
      getAvailableFormats(options, areaCodes, projectionCodes),
    ),
    (format) => format.name,
  );
}

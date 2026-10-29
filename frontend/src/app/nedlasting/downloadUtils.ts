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

export type DownloadAreaBlock = {
  areaCode: string | null;
  polygon: string | null;
  projectionCodes: string[];
  formatNames: string[];
};

export type DownloadSelection = {
  areaBlocks: DownloadAreaBlock[];
};

const EMPTY_AREA_BLOCK: DownloadAreaBlock = {
  areaCode: null,
  polygon: null,
  projectionCodes: [],
  formatNames: [],
};

export const EMPTY_DOWNLOAD_SELECTION: DownloadSelection = {
  areaBlocks: [EMPTY_AREA_BLOCK],
};

export function selectAreaBlockArea(
  selection: DownloadSelection,
  blockIndex: number,
  areaCode: string | null,
): DownloadSelection {
  return {
    areaBlocks: selection.areaBlocks.map((block, index) =>
      index === blockIndex
        ? { areaCode, polygon: null, projectionCodes: [], formatNames: [] }
        : block,
    ),
  };
}

export function selectAreaBlockPolygon(
  selection: DownloadSelection,
  blockIndex: number,
  polygon: string | null,
): DownloadSelection {
  return {
    areaBlocks: selection.areaBlocks.map((block, index) =>
      index === blockIndex
        ? { areaCode: null, polygon, projectionCodes: [], formatNames: [] }
        : block,
    ),
  };
}

export function selectAreaBlockProjections(
  selection: DownloadSelection,
  blockIndex: number,
  projectionCodes: string[],
): DownloadSelection {
  return {
    areaBlocks: selection.areaBlocks.map((block, index) =>
      index === blockIndex
        ? { ...block, projectionCodes, formatNames: [] }
        : block,
    ),
  };
}

export function selectAreaBlockFormats(
  selection: DownloadSelection,
  blockIndex: number,
  formatNames: string[],
): DownloadSelection {
  return {
    areaBlocks: selection.areaBlocks.map((block, index) =>
      index === blockIndex ? { ...block, formatNames } : block,
    ),
  };
}

export function addAreaBlock(selection: DownloadSelection): DownloadSelection {
  return { areaBlocks: [...selection.areaBlocks, { ...EMPTY_AREA_BLOCK }] };
}

export function removeAreaBlock(
  selection: DownloadSelection,
  blockIndex: number,
): DownloadSelection {
  return {
    areaBlocks: selection.areaBlocks.filter((_, index) => index !== blockIndex),
  };
}

export type MissingDownloadSelectionField = "area" | "projection" | "format";

function getMissingAreaBlockFields(
  block: DownloadAreaBlock,
): MissingDownloadSelectionField[] {
  const missingFields: MissingDownloadSelectionField[] = [];

  if (!block.areaCode && !block.polygon) missingFields.push("area");
  if (block.projectionCodes.length === 0) missingFields.push("projection");
  if (block.formatNames.length === 0) missingFields.push("format");

  return missingFields;
}

export function getMissingDownloadSelectionFields(
  selection: DownloadSelection,
): MissingDownloadSelectionField[] {
  const missingFields = new Set<MissingDownloadSelectionField>();

  for (const block of selection.areaBlocks) {
    for (const field of getMissingAreaBlockFields(block)) {
      missingFields.add(field);
    }
  }

  return Array.from(missingFields);
}

function getMatchingArea(
  options: DownloadOptions,
  areaCode: string | null,
): DownloadAreaOption | null {
  if (!areaCode) return null;
  return options.areas.find((option) => option.area.code === areaCode) ?? null;
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

export type DownloadAreaBlockAvailability = {
  areaOptions: DownloadAreaOption[];
  selectedArea: DownloadAreaOption | null;
  orderArea: DownloadAreaOption | null;
  projectionOptions: DownloadProjectionOption[];
  formatOptions: DownloadFormat[];
  supportsPolygonSelection: boolean;
};

export function resolveAreaBlockAvailability(
  options: DownloadOptions | null,
  block: Pick<DownloadAreaBlock, "areaCode" | "polygon" | "projectionCodes">,
): DownloadAreaBlockAvailability {
  const areaOptions = sortAreaOptionsNationwideFirst(
    unionByKey([options?.areas ?? []], (option) => option.area.code),
  );

  if (block.polygon) {
    const nationwideArea =
      areaOptions.find((option) => option.area.type === "landsdekkende") ??
      null;
    const referenceArea = nationwideArea ?? areaOptions[0] ?? null;
    const referenceAreas = referenceArea ? [referenceArea] : [];

    return {
      areaOptions,
      selectedArea: null,
      orderArea: referenceArea,
      projectionOptions: resolveProjectionOptions(referenceAreas),
      formatOptions: resolveFormatOptions(
        referenceAreas,
        block.projectionCodes,
      ),
      supportsPolygonSelection: options?.supportsPolygonSelection ?? false,
    };
  }

  const selectedArea = options
    ? getMatchingArea(options, block.areaCode)
    : null;
  const selectedAreas = selectedArea ? [selectedArea] : [];

  return {
    areaOptions,
    selectedArea,
    orderArea: selectedArea,
    projectionOptions: resolveProjectionOptions(selectedAreas),
    formatOptions: resolveFormatOptions(selectedAreas, block.projectionCodes),
    supportsPolygonSelection: options?.supportsPolygonSelection ?? false,
  };
}

function createOrderItemForBlock(
  uuid: string,
  capabilitiesUrl: string,
  options: DownloadOptions | null,
  block: DownloadAreaBlock,
): DownloadOrderItemInput | null {
  const availability = resolveAreaBlockAvailability(options, block);
  if (!block.polygon && !availability.selectedArea) return null;

  const projectionCodeSet = new Set(block.projectionCodes);
  const projections = availability.projectionOptions.filter((candidate) =>
    projectionCodeSet.has(candidate.code),
  );
  const formats = availability.formatOptions.filter((format) =>
    block.formatNames.includes(format.name),
  );

  if (projections.length === 0 || formats.length === 0) return null;

  return {
    uuid,
    capabilitiesUrl,
    areas: availability.orderArea
      ? [toDownloadOrderArea(availability.orderArea)]
      : [],
    projections: projections.map(toDownloadOrderProjection),
    formats: formats.map((format) => ({ name: format.name })),
    ...(block.polygon ? { coordinates: block.polygon } : {}),
  };
}

export function createDownloadOrderItems(
  uuid: string,
  capabilitiesUrl: string,
  options: DownloadOptions | null,
  selection: DownloadSelection,
): DownloadOrderItemInput[] {
  return selection.areaBlocks.flatMap((block) => {
    const item = createOrderItemForBlock(uuid, capabilitiesUrl, options, block);
    return item ? [item] : [];
  });
}

export function filterAreaBlockForProduct(
  options: DownloadOptions | null,
  bulkBlock: DownloadAreaBlock,
): DownloadAreaBlock {
  if (!options) return { ...EMPTY_AREA_BLOCK };

  if (bulkBlock.polygon) {
    if (!options.supportsPolygonSelection) return { ...EMPTY_AREA_BLOCK };

    const referenceArea =
      options.areas.find((option) => option.area.type === "landsdekkende") ??
      options.areas[0] ??
      null;
    const referenceAreas = referenceArea ? [referenceArea] : [];

    const projectionOptions = resolveProjectionOptions(referenceAreas);
    const projectionCodeSet = new Set(bulkBlock.projectionCodes);
    const projectionCodes = projectionOptions
      .filter((projection) => projectionCodeSet.has(projection.code))
      .map((projection) => projection.code);

    const formatOptions = resolveFormatOptions(referenceAreas, projectionCodes);
    const formatNameSet = new Set(bulkBlock.formatNames);
    const formatNames = formatOptions
      .filter((format) => formatNameSet.has(format.name))
      .map((format) => format.name);

    return {
      areaCode: null,
      polygon: bulkBlock.polygon,
      projectionCodes,
      formatNames,
    };
  }

  if (!bulkBlock.areaCode) return { ...EMPTY_AREA_BLOCK };

  const matchingArea = getMatchingArea(options, bulkBlock.areaCode);
  if (!matchingArea) return { ...EMPTY_AREA_BLOCK };

  const matchingAreas = [matchingArea];
  const projectionOptions = resolveProjectionOptions(matchingAreas);
  const projectionCodeSet = new Set(bulkBlock.projectionCodes);
  const projectionCodes = projectionOptions
    .filter((projection) => projectionCodeSet.has(projection.code))
    .map((projection) => projection.code);

  const formatOptions = resolveFormatOptions(matchingAreas, projectionCodes);
  const formatNameSet = new Set(bulkBlock.formatNames);
  const formatNames = formatOptions
    .filter((format) => formatNameSet.has(format.name))
    .map((format) => format.name);

  return {
    areaCode: matchingArea.area.code,
    polygon: null,
    projectionCodes,
    formatNames,
  };
}

export function appendBulkAreaBlocks(
  existingBlocks: DownloadAreaBlock[],
  newBlocks: DownloadAreaBlock[],
): DownloadAreaBlock[] {
  function keyOf(block: DownloadAreaBlock): string | null {
    return block.areaCode ?? block.polygon;
  }

  const merged = existingBlocks
    .filter((block) => keyOf(block) !== null)
    .map((block) => ({ ...block }));

  for (const newBlock of newBlocks) {
    const key = keyOf(newBlock);
    if (key === null) continue;

    const matchingBlock = merged.find((block) => keyOf(block) === key);

    if (matchingBlock) {
      matchingBlock.projectionCodes = Array.from(
        new Set([
          ...matchingBlock.projectionCodes,
          ...newBlock.projectionCodes,
        ]),
      );
      matchingBlock.formatNames = Array.from(
        new Set([...matchingBlock.formatNames, ...newBlock.formatNames]),
      );
    } else {
      merged.push(newBlock);
    }
  }

  return merged.length > 0 ? merged : [{ ...EMPTY_AREA_BLOCK }];
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

function sortAreaOptionsNationwideFirst(
  areas: DownloadAreaOption[],
): DownloadAreaOption[] {
  return [...areas].sort((a, b) => {
    const aIsNationwide = a.area.type === "landsdekkende" ? 0 : 1;
    const bIsNationwide = b.area.type === "landsdekkende" ? 0 : 1;
    return aIsNationwide - bIsNationwide;
  });
}

export type DownloadSelectionGapCounts = {
  areas: number;
  projections: number;
  formats: number;
};

export function getDownloadSelectionGapCounts(
  optionsList: (DownloadOptions | null)[],
  bulkBlock: DownloadAreaBlock,
): DownloadSelectionGapCounts {
  const perProductBlocks = optionsList.map((options) =>
    filterAreaBlockForProduct(options, bulkBlock),
  );

  function countGaps(
    bulkField: string[],
    getField: (block: DownloadAreaBlock) => string[],
  ) {
    if (bulkField.length === 0) return 0;
    return perProductBlocks.filter((block) => getField(block).length === 0)
      .length;
  }

  return {
    areas:
      bulkBlock.areaCode || bulkBlock.polygon
        ? perProductBlocks.filter((block) => !block.areaCode && !block.polygon)
            .length
        : 0,
    projections: countGaps(bulkBlock.projectionCodes, (b) => b.projectionCodes),
    formats: countGaps(bulkBlock.formatNames, (b) => b.formatNames),
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
  bulkBlock: Pick<DownloadAreaBlock, "areaCode" | "projectionCodes">,
): DownloadAreaBlockAvailability {
  const presentOptionsList = optionsList.flatMap((options) =>
    options ? [options] : [],
  );

  const areaOptions = sortAreaOptionsNationwideFirst(
    unionByKey(
      presentOptionsList.map((options) => options.areas),
      (option) => option.area.code,
    ),
  );
  const selectedArea =
    areaOptions.find((option) => option.area.code === bulkBlock.areaCode) ??
    null;

  const displayAreasByProduct = presentOptionsList.map((options) => {
    if (!bulkBlock.areaCode) return options.areas;
    const matchingArea = getMatchingArea(options, bulkBlock.areaCode);
    return matchingArea ? [matchingArea] : [];
  });

  return {
    areaOptions,
    selectedArea,
    orderArea: selectedArea,
    projectionOptions: unionByKey(
      displayAreasByProduct.map((areas) =>
        bulkBlock.areaCode
          ? resolveProjectionOptions(areas)
          : unionProjectionsAcrossAreas(areas),
      ),
      (projection) => projection.code,
    ),
    formatOptions: unionByKey(
      displayAreasByProduct.map((areas) =>
        bulkBlock.projectionCodes.length === 0
          ? unionFormatsAcrossAreas(areas)
          : resolveFormatOptions(areas, bulkBlock.projectionCodes),
      ),
      (format) => format.name,
    ),
    supportsPolygonSelection: presentOptionsList.some(
      (options) => options.supportsPolygonSelection,
    ),
  };
}

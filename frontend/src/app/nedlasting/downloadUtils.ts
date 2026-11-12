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
  gridCellCodes: string[];
  projectionCodes: string[];
  formatNames: string[];
};

export type DownloadSelection = {
  areaBlocks: DownloadAreaBlock[];
};

const EMPTY_AREA_BLOCK: DownloadAreaBlock = {
  areaCode: null,
  polygon: null,
  gridCellCodes: [],
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
        ? {
            areaCode,
            polygon: null,
            gridCellCodes: [],
            projectionCodes: [],
            formatNames: [],
          }
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
        ? {
            areaCode: null,
            polygon,
            gridCellCodes: [],
            projectionCodes: [],
            formatNames: [],
          }
        : block,
    ),
  };
}

export function selectAreaBlockGridCells(
  selection: DownloadSelection,
  blockIndex: number,
  gridCellCodes: string[],
  options: DownloadOptions | null,
): DownloadSelection {
  return {
    areaBlocks: selection.areaBlocks.map((block, index) => {
      if (index !== blockIndex) return block;

      // Beholder projeksjoner og formater som fortsatt støttes av alle valgte
      // ruter, så brukeren slipper å velge på nytt når flere ruter legges til
      const nextBlock: DownloadAreaBlock = {
        areaCode: null,
        polygon: null,
        gridCellCodes,
        projectionCodes: [],
        formatNames: [],
      };
      const projectionCodes = resolveAreaBlockAvailability(options, nextBlock)
        .projectionOptions.map((projection) => projection.code)
        .filter((code) => block.projectionCodes.includes(code));
      const formatNames = resolveAreaBlockAvailability(options, {
        ...nextBlock,
        projectionCodes,
      })
        .formatOptions.map((format) => format.name)
        .filter((name) => block.formatNames.includes(name));

      return { ...nextBlock, projectionCodes, formatNames };
    }),
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

export function canAddAreaBlock(
  optionsList: (DownloadOptions | null)[],
  selection: DownloadSelection,
): boolean {
  const presentOptionsList = optionsList.filter(
    (options): options is DownloadOptions => options !== null,
  );
  if (presentOptionsList.some((options) => options.supportsPolygonSelection)) {
    return true;
  }

  const usedAreaCodes = new Set(
    selection.areaBlocks.flatMap((block) => [
      ...(block.areaCode ? [block.areaCode] : []),
      ...block.gridCellCodes,
    ]),
  );
  const unusedAreaCodes = new Set(
    presentOptionsList.flatMap((options) =>
      options.areas
        .filter((option) => !usedAreaCodes.has(option.area.code))
        .map((option) => option.area.code),
    ),
  );
  const emptyBlockCount = selection.areaBlocks.filter(
    (block) =>
      !block.areaCode && !block.polygon && block.gridCellCodes.length === 0,
  ).length;
  return unusedAreaCodes.size > emptyBlockCount;
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

  if (!block.areaCode && !block.polygon && block.gridCellCodes.length === 0) {
    missingFields.push("area");
  }
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

// Noen rutenett (f.eks. DTM sjø) har samme rutenummer flere ganger i
// områdelisten, med ulike formater. Oppføringene slås sammen per rute.
function getMatchingGridCells(
  options: DownloadOptions,
  gridCellCodes: string[],
): DownloadAreaOption[] {
  return gridCellCodes.flatMap((code) => {
    const entries = options.areas.filter((option) => option.area.code === code);
    if (entries.length === 0) return [];

    const projections = unionByKey(
      entries.map((entry) => entry.projections),
      (projection) => projection.code,
    ).map((projection) => ({
      ...projection,
      formats: unionByKey(
        entries.map(
          (entry) =>
            entry.projections.find(
              (candidate) => candidate.code === projection.code,
            )?.formats ?? [],
        ),
        (format) => format.name,
      ),
    }));

    return [{ ...entries[0], projections }];
  });
}

function resolvePolygonReferenceArea(
  areas: DownloadAreaOption[],
): DownloadAreaOption | null {
  return (
    areas.find((option) => option.area.type === "landsdekkende") ??
    areas[0] ??
    null
  );
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
  projectionOptions: DownloadProjectionOption[];
  formatOptions: DownloadFormat[];
  supportsPolygonSelection: boolean;
  selectedGridCells: DownloadAreaOption[];
  gridSelectionLayer: string | null;
};

export function resolveAreaBlockAvailability(
  options: DownloadOptions | null,
  block: Pick<
    DownloadAreaBlock,
    "areaCode" | "polygon" | "gridCellCodes" | "projectionCodes"
  >,
): DownloadAreaBlockAvailability {
  const areaOptions = sortAreaOptionsNationwideFirst(
    unionByKey([options?.areas ?? []], (option) => option.area.code),
  );

  if (block.polygon) {
    const referenceArea = resolvePolygonReferenceArea(areaOptions);
    const referenceAreas = referenceArea ? [referenceArea] : [];

    return {
      areaOptions,
      selectedArea: referenceArea,
      projectionOptions: resolveProjectionOptions(referenceAreas),
      formatOptions: resolveFormatOptions(
        referenceAreas,
        block.projectionCodes,
      ),
      supportsPolygonSelection: options?.supportsPolygonSelection ?? false,
      selectedGridCells: [],
      gridSelectionLayer: options?.gridSelectionLayer ?? null,
    };
  }

  if (block.gridCellCodes.length > 0) {
    const selectedGridCells = options
      ? getMatchingGridCells(options, block.gridCellCodes)
      : [];

    return {
      areaOptions,
      selectedArea: null,
      selectedGridCells,
      projectionOptions: resolveProjectionOptions(selectedGridCells),
      formatOptions: resolveFormatOptions(
        selectedGridCells,
        block.projectionCodes,
      ),
      supportsPolygonSelection: options?.supportsPolygonSelection ?? false,
      gridSelectionLayer: options?.gridSelectionLayer ?? null,
    };
  }

  const selectedArea = options
    ? getMatchingArea(options, block.areaCode)
    : null;
  const selectedAreas = selectedArea ? [selectedArea] : [];

  return {
    areaOptions,
    selectedArea,
    projectionOptions: resolveProjectionOptions(selectedAreas),
    formatOptions: resolveFormatOptions(selectedAreas, block.projectionCodes),
    supportsPolygonSelection: options?.supportsPolygonSelection ?? false,
    selectedGridCells: [],
    gridSelectionLayer: options?.gridSelectionLayer ?? null,
  };
}

// Nedlastings-API-et forventer dette spesifikke, ikke-ekte området (ikke en
// kode fra det vanlige områdekodeverket) for å vite at bestillingen er et
// tegnet område og at "coordinates" skal brukes til å klippe, i stedet for å
// levere et forhåndsdefinert område i sin helhet. Verdien er hentet fra
// hvordan gammel løsning gjorde det samme (code: "Kart", type: "polygon").
const POLYGON_AREA: DownloadOrderAreaInput = {
  code: "Kart",
  name: "Valgt fra kart",
  type: "polygon",
};

function resolveOrderAreas(
  options: DownloadOptions | null,
  block: DownloadAreaBlock,
  availability: DownloadAreaBlockAvailability,
): DownloadOrderAreaInput[] {
  if (block.polygon) return [POLYGON_AREA];

  if (block.gridCellCodes.length > 0) {
    // Sender alle oppføringer for valgte ruter, også duplikater med ulik
    // type (f.eks. DTM sjø), slik gammel løsning gjorde
    const gridCellCodeSet = new Set(block.gridCellCodes);
    return (options?.areas ?? [])
      .filter((option) => gridCellCodeSet.has(option.area.code))
      .map(toDownloadOrderArea);
  }

  return availability.selectedArea
    ? [toDownloadOrderArea(availability.selectedArea)]
    : [];
}

function createOrderItemForBlock(
  uuid: string,
  capabilitiesUrl: string,
  options: DownloadOptions | null,
  block: DownloadAreaBlock,
): DownloadOrderItemInput | null {
  const availability = resolveAreaBlockAvailability(options, block);
  const areas = resolveOrderAreas(options, block, availability);
  if (areas.length === 0) return null;

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
    areas,
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

    const referenceArea = resolvePolygonReferenceArea(options.areas);
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
      gridCellCodes: [],
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
    gridCellCodes: [],
    projectionCodes,
    formatNames,
  };
}

export function appendBulkAreaBlocks(
  existingBlocks: DownloadAreaBlock[],
  newBlocks: DownloadAreaBlock[],
): DownloadAreaBlock[] {
  function keyOf(block: DownloadAreaBlock): string | null {
    if (block.gridCellCodes.length > 0) return block.gridCellCodes.join(",");
    return block.areaCode ?? block.polygon ?? null;
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
  bulkBlock: Pick<
    DownloadAreaBlock,
    "areaCode" | "polygon" | "gridCellCodes" | "projectionCodes"
  >,
): DownloadAreaBlockAvailability {
  const presentOptionsList = optionsList.flatMap((options) =>
    options ? [options] : [],
  );

  const areaOptions = sortAreaOptionsNationwideFirst(
    unionByKey(
      presentOptionsList
        // Fellesvalg støtter ikke rutenett, så rutene holdes utenfor listen
        .filter((options) => !options.gridSelectionLayer)
        .map((options) => options.areas),
      (option) => option.area.code,
    ),
  );

  if (bulkBlock.polygon) {
    const polygonCapableOptionsList = presentOptionsList.filter(
      (options) => options.supportsPolygonSelection,
    );

    const displayAreasByProduct = polygonCapableOptionsList.map((options) =>
      resolvePolygonReferenceArea(options.areas)
        ? [resolvePolygonReferenceArea(options.areas) as DownloadAreaOption]
        : [],
    );

    return {
      areaOptions,
      selectedArea: null,
      projectionOptions: unionByKey(
        displayAreasByProduct.map((areas) => resolveProjectionOptions(areas)),
        (projection) => projection.code,
      ),
      formatOptions: unionByKey(
        displayAreasByProduct.map((areas) =>
          resolveFormatOptions(areas, bulkBlock.projectionCodes),
        ),
        (format) => format.name,
      ),
      supportsPolygonSelection: presentOptionsList.some(
        (options) => options.supportsPolygonSelection,
      ),
      selectedGridCells: [],
      gridSelectionLayer: null,
    };
  }

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
    selectedGridCells: [],
    gridSelectionLayer: null,
  };
}

import type { DownloadOrderResult } from "@/lib/schemas/download";
import type { DownloadCard } from "./downloadUtils";

export type GroupedFormat = {
  key: string;
  label: string;
  downloadUrl: string | null;
  isReady: boolean;
  isFailed: boolean;
};

export type GroupedProjection = {
  projectionName: string;
  formats: GroupedFormat[];
};

export type GroupedArea = {
  areaName: string;
  projections: GroupedProjection[];
};

export type GroupedProduct = {
  uuid: string;
  title: string;
  organization: string | null;
  typeTranslated: string | null;
  accessState: DownloadCard["accessState"];
  areas: GroupedArea[];
};

export function groupOrderedProducts(
  orderResult: DownloadOrderResult,
  cards: DownloadCard[],
): GroupedProduct[] {
  const files = orderResult.orders.flatMap((order) =>
    order.status === "ordered" ? order.files : [],
  );

  const filesByUuid = new Map<string, typeof files>();
  for (const file of files) {
    if (!file.metadataUuid) continue;
    const existing = filesByUuid.get(file.metadataUuid);
    if (existing) {
      existing.push(file);
    } else {
      filesByUuid.set(file.metadataUuid, [file]);
    }
  }

  return Array.from(filesByUuid.entries()).map(([uuid, productFiles]) => {
    const card = cards.find((c) => c.uuid === uuid);

    const areaNames = Array.from(
      new Set(productFiles.map((file) => file.areaName ?? "Ukjent område")),
    );

    const areas: GroupedArea[] = areaNames.map((areaName) => {
      const areaFiles = productFiles.filter(
        (file) => (file.areaName ?? "Ukjent område") === areaName,
      );
      const projectionNames = Array.from(
        new Set(
          areaFiles.map((file) => file.projectionName ?? "Ukjent projeksjon"),
        ),
      );

      const projections: GroupedProjection[] = projectionNames.map(
        (projectionName) => ({
          projectionName,
          formats: areaFiles
            .filter(
              (file) =>
                (file.projectionName ?? "Ukjent projeksjon") === projectionName,
            )
            .map((file, index) => ({
              key: `${file.metadataUuid}-${areaName}-${projectionName}-${index}`,
              label: file.format ?? file.name ?? "Fil",
              downloadUrl: file.downloadUrl ?? null,
              isReady: file.status === "ReadyForDownload",
              isFailed: file.status === "Failed",
            })),
        }),
      );

      return { areaName, projections };
    });

    return {
      uuid,
      title: card?.title ?? productFiles[0]?.metadataName ?? uuid,
      organization: card?.organization ?? null,
      typeTranslated: card?.typeTranslated ?? null,
      accessState: card?.accessState ?? null,
      areas,
    };
  });
}

export function filterProductByFormats(
  product: GroupedProduct,
  predicate: (format: GroupedFormat) => boolean,
): GroupedProduct | null {
  const areas = product.areas
    .map((area) => ({
      ...area,
      projections: area.projections
        .map((projection) => ({
          ...projection,
          formats: projection.formats.filter(predicate),
        }))
        .filter((projection) => projection.formats.length > 0),
    }))
    .filter((area) => area.projections.length > 0);

  return areas.length > 0 ? { ...product, areas } : null;
}

export function filterProducts(
  products: GroupedProduct[],
  predicate: (format: GroupedFormat) => boolean,
): GroupedProduct[] {
  return products
    .map((product) => filterProductByFormats(product, predicate))
    .filter((product): product is GroupedProduct => product !== null);
}

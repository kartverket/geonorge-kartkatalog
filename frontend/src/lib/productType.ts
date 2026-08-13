export function getProductTypeString(
  hierarchyLevel: string | null | undefined,
): string {
  switch (hierarchyLevel) {
    case "dataset":
      return "Datasett";
    case "series":
      return "Datasettserie";
    case "service":
      return "Tjeneste";
    case "software":
      return "Applikasjon";
    default:
      return "Produkt";
  }
}

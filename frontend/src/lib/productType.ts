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
    case "servicelayer":
      return "Tjenestelag";
    case "software":
      return "Applikasjon";
    default:
      return "Produkt";
  }
}

export function getProductTypeDefiniteString(
  hierarchyLevel: string | null | undefined,
): string {
  switch (hierarchyLevel) {
    case "dataset":
      return "datasettet";
    case "series":
      return "datasettserien";
    case "service":
      return "tjenesten";
    case "servicelayer":
      return "tjenestelaget";
    case "software":
      return "applikasjonen";
    default:
      return "produktet";
  }
}

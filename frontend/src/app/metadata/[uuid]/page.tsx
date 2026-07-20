import getData from "../../../mocks/getData.json";
import { DatasetHeader } from "./_components/DatasetHeader";

export default async function DatasetPage() {
  const d = getData;
  return (
    <div>
      <DatasetHeader
        title={d.Title}
        organization={d.Organization}
        access={d.AccessIsOpendata ? "Åpent datasett" : "Lukke datasett"}
      />
    </div>
  );
}

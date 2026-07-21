import { getMetadataSummary } from "@/app/api";
import { DatasetHeader } from "./_components/DatasetHeader";

export default async function DatasetPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const d = await getMetadataSummary(uuid);
  return (
    <div>
      <DatasetHeader
        title={d.title ?? "datafeil"}
        organization={d.organization ?? "kitkat"}
        isOpen={d.accessIsOpenData ?? false}
      />
    </div>
  );
}

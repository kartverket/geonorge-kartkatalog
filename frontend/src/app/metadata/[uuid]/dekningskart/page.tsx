import { getMetadata } from "@/app/api";
import { Dekningskart } from "./Dekningskart";
import { shouldShowCoverageMap } from "./utils";

export const instant = false;
export default async function DekningskartPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const uuid = (await params).uuid;
  const metadata = await getMetadata(uuid);
  if (!shouldShowCoverageMap(metadata)) {
    return <p>No coverage available</p>;
  }

  return (
    <div style={{ width: "100%", height: "80vh" }}>
      <Dekningskart metadata={metadata} />
    </div>
  );
}

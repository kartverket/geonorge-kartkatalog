import { getMetadata } from "@/app/api";
import MapComponent from "@/app/_components/MapComponent/MapComponent";

export const instant = false;
export default async function DekningskartPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const uuid = (await params).uuid;
  const metadata = await getMetadata(uuid);

  if (metadata.coverageUrl) {
    return (
      <div style={{ width: "100%", height: "80vh" }}>
        <MapComponent />
      </div>
    );
  } else {
    return <p>No coverage available</p>;
  }
}

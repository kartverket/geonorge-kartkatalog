import { getProductAlerts } from "@/app/api";

export default async function ProductAlert() {
  const varsler = await getProductAlerts(
    "a8456aed-441a-40c4-831f-46bcbe4e6ff1",
  ); // Example UUID, replace with actual UUID as needed
  return (
    <>
      {varsler.map((varsel, index) => (
        <div key={varsel.systemId} className="ds-alert" data-color="info">
          <h1 className="ds-heading">{varsel.alertType}</h1>
        </div>
      ))}
    </>
  );
}

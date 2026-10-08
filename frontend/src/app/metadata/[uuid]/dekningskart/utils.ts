import type { ProductMetadata } from "@/lib/schemas/product";

export const shouldShowCoverageMap = (m: ProductMetadata) => {
  return (
    m.coverageData?.completenessCoverageWMSUrl != null ||
    m.coverageData?.coverageOverviewWMSUrl != null ||
    m.coverageData?.coverageWMSUrl != null
  );
};

import type { ProductMetadata } from "@/lib/schemas/product";

export const shouldShowCoverageMap = (m: ProductMetadata) => {
  return (
    m.coverageData?.completenessCoverageData != null ||
    m.coverageData?.coverageOverviewData != null ||
    m.coverageData?.coverageData != null
  );
};

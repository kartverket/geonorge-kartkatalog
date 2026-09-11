import type { Alerts } from "@/lib/schemas/alerts";

type NonEmptyValue<T> = Exclude<T, "" | null | undefined>;

const hasNonEmptyValue = <T>(value: T): value is NonEmptyValue<T> =>
  value != null && value !== "";

export const getUniqueItemsFromListByKey = <
  T extends Record<string, unknown>,
  K extends keyof T,
>(
  list: T[],
  field: K,
): NonEmptyValue<T[K]>[] => {
  return [
    ...new Set(
      list.flatMap((item) => {
        const value = item[field];
        return hasNonEmptyValue(value) ? [value] : [];
      }),
    ),
  ];
};

export const formatDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("nb-NO", { dateStyle: "long" }) : "-";

export const getRelevantAlerts = (alerts: Alerts | null): Alerts => {
  return (
    alerts?.filter((alert) => {
      if (!alert || !alert.effectiveDate || !alert.alertDate) return false;

      const lengthInDays = 30; // fra gammel frontend
      const alertDate = new Date(alert.alertDate);
      const effectiveDate = new Date(alert.effectiveDate);

      if (
        Number.isNaN(alertDate.getTime()) ||
        Number.isNaN(effectiveDate.getTime())
      ) {
        return false;
      }

      const currentDate = new Date();
      const visibleUntil = new Date(effectiveDate);
      visibleUntil.setDate(visibleUntil.getDate() + lengthInDays);

      return currentDate >= alertDate && currentDate <= visibleUntil;
    }) ?? []
  );
};

export function unwrapSettled<T>(
  result: PromiseSettledResult<T>,
  errorMessage: string,
  fallback: T,
): T {
  if (result.status === "rejected") {
    console.error(errorMessage, result.reason);
    return fallback;
  }
  return result.value;
}

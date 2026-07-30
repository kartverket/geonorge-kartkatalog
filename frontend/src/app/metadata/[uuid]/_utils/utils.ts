import type { Alerts } from "@/lib/schemas/alerts";

export const getUniqueItemsFromListByKey = <
  T extends Record<string, any>,
  K extends keyof T,
>(
  list: T[],
  field: K,
): Exclude<T[K], null | undefined>[] => {
  return [
    ...new Set(
      list.flatMap((item) => {
        const value = item[field];
        return value != null ? [value] : [];
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

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

export const formatDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString("nb-NO", { dateStyle: "long" }) : "-";

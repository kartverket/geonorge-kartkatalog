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

"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const useUpdateUrlProp = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const updateUrlProp = (field: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(field);
    params.append(field, value);

    router.push(`${pathname}?${params.toString()}` as Route, { scroll: false });
  };

  return updateUrlProp;
};

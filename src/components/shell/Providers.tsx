"use client";

import { SWRConfig } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        refreshInterval: 60_000,
        revalidateOnFocus: true,
        dedupingInterval: 15_000,
        errorRetryInterval: 8_000,
        shouldRetryOnError: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}

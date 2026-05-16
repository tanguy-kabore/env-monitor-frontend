"use client";
import { QueryClient } from "@tanstack/react-query";

// Shared QueryClient — stale time = 5 min (matches backend shortest cache TTL), gc = 30 min
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.message?.startsWith("[4")) return false; // no retry on 4xx
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});

"use client";
/**
 * Generic data-fetching hook built on React Query.
 *
 * Drop-in replacement for the old custom hook — same return shape
 * (data, loading, error, refetch) so existing call-sites keep working.
 * Adds: automatic background refetch, deduplication, and cache sharing.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  revalidating: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T = any>(
  fetcher: () => Promise<T>,
  deps: any[] = [],
  key?: string,
  options?: { enabled?: boolean; staleTime?: number }
): UseApiResult<T> {
  // Build a stable query key from the cache key + deps
  const queryKey: unknown[] = key ? [key, ...deps] : [...deps];

  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, error } = useQuery<T, Error>({
    queryKey,
    queryFn: fetcher,
    enabled: options?.enabled ?? true,
    // Keep previous data while revalidating so the UI never blanks
    placeholderData: (prev) => prev,
    staleTime: options?.staleTime ?? 2 * 60 * 1000,
  });

  return {
    data: data ?? null,
    loading: isLoading,
    revalidating: isFetching && !isLoading,
    error: error ? error.message : null,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  };
}

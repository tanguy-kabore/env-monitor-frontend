"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { revalidationBus } from "@/lib/revalidationBus";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  revalidating: boolean;
  error: string | null;
  refetch: () => void;
}

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const cache = new Map<string, CacheEntry<any>>();
const TTL_MS = 2 * 60 * 1000;

export function useApi<T = any>(
  fetcher: () => Promise<T>,
  deps: any[] = [],
  key?: string
): UseApiResult<T> {
  const cacheKey = key ? `${key}:${JSON.stringify(deps)}` : JSON.stringify(deps);

  const cached = cache.get(cacheKey);
  const isStale = cached ? Date.now() - cached.ts > TTL_MS : false;

  const [data, setData] = useState<T | null>(cached?.data ?? null);
  const [loading, setLoading] = useState(!cached);
  const [revalidating, setRevalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else { setRevalidating(true); revalidationBus.start(); }
    setError(null);
    try {
      const result = await fetcher();
      cache.set(cacheKey, { data: result, ts: Date.now() });
      if (isMounted.current) setData(result);
    } catch (err: any) {
      if (isMounted.current) setError(err.message || "Erreur de chargement");
    } finally {
      if (isMounted.current) {
        setLoading(false);
        if (revalidating) revalidationBus.stop();
        setRevalidating(false);
      }
    }
  }, deps);

  useEffect(() => {
    isMounted.current = true;
    const cached = cache.get(cacheKey);
    if (cached && !isStale) {
      setData(cached.data);
      setLoading(false);
    } else if (cached && isStale) {
      setData(cached.data);
      setLoading(false);
      fetchData(true);
    } else {
      fetchData(false);
    }
    return () => { isMounted.current = false; };
  }, [fetchData]);

  const refetch = useCallback(() => {
    cache.delete(cacheKey);
    fetchData(false);
  }, [fetchData, cacheKey]);

  return { data, loading, revalidating, error, refetch };
}

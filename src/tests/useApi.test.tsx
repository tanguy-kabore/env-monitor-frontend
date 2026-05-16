/**
 * Tests for the useApi hook (React Query wrapper).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useApi } from "@/hooks/useApi";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Successful fetch ───────────────────────────────────────────────────────────

it("returns data after successful fetch", async () => {
  const fetcher = vi.fn().mockResolvedValue({ value: 42 });
  const { result } = renderHook(
    () => useApi(fetcher, [], "test-key"),
    { wrapper: makeWrapper() }
  );

  expect(result.current.loading).toBe(true);

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.data).toEqual({ value: 42 });
  expect(result.current.error).toBeNull();
  expect(fetcher).toHaveBeenCalledTimes(1);
});

// ── Error state ───────────────────────────────────────────────────────────────

it("sets error message on failed fetch", async () => {
  const fetcher = vi.fn().mockRejectedValue(new Error("[404] Not found"));
  const { result } = renderHook(
    () => useApi(fetcher, [], "error-key"),
    { wrapper: makeWrapper() }
  );

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.data).toBeNull();
  expect(result.current.error).toBe("[404] Not found");
});

// ── Refetch ───────────────────────────────────────────────────────────────────

it("refetch triggers a new request", async () => {
  const fetcher = vi.fn().mockResolvedValue({ calls: 1 });
  const { result } = renderHook(
    () => useApi(fetcher, [], "refetch-key"),
    { wrapper: makeWrapper() }
  );

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(fetcher).toHaveBeenCalledTimes(1);

  result.current.refetch();
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
});

// ── Deduplication ─────────────────────────────────────────────────────────────

it("deduplicates concurrent fetches with same key", async () => {
  const fetcher = vi.fn().mockResolvedValue({ x: 1 });
  const wrapper = makeWrapper();

  const { result: r1 } = renderHook(
    () => useApi(fetcher, [], "shared-key"),
    { wrapper }
  );
  const { result: r2 } = renderHook(
    () => useApi(fetcher, [], "shared-key"),
    { wrapper }
  );

  await waitFor(() => expect(r1.current.loading).toBe(false));
  await waitFor(() => expect(r2.current.loading).toBe(false));

  // React Query deduplicates: only one actual network call
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(r1.current.data).toEqual(r2.current.data);
});

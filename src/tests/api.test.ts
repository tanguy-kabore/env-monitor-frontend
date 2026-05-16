/**
 * Tests for the API client (src/lib/api.ts).
 * All network calls are mocked via global fetch.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Set env before importing api
vi.stubEnv("NEXT_PUBLIC_API_URL", "http://test-backend");
vi.stubEnv("NEXT_PUBLIC_API_KEY", "");

const { api } = await import("@/lib/api");

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── URL construction ──────────────────────────────────────────────────────────

it("getDashboard calls /api/v1/dashboard", async () => {
  global.fetch = mockFetch({ app: {}, all_cities: [] });
  await api.getDashboard();
  expect((global.fetch as any).mock.calls[0][0]).toBe(
    "http://test-backend/api/v1/dashboard"
  );
});

it("getHealth calls /api/v1/system/health", async () => {
  global.fetch = mockFetch({ status: "healthy" });
  await api.getHealth();
  expect((global.fetch as any).mock.calls[0][0]).toContain("/api/v1/system/health");
});

it("getCollectionLog includes limit and offset", async () => {
  global.fetch = mockFetch({ data: [], pagination: {} });
  await api.getCollectionLog(10, 20);
  const url = (global.fetch as any).mock.calls[0][0] as string;
  expect(url).toContain("limit=10");
  expect(url).toContain("offset=20");
});

it("getCollectionLog includes status filter when provided", async () => {
  global.fetch = mockFetch({ data: [], pagination: {} });
  await api.getCollectionLog(20, 0, "failed");
  const url = (global.fetch as any).mock.calls[0][0] as string;
  expect(url).toContain("status=failed");
});

it("getAlerts builds correct query string", async () => {
  global.fetch = mockFetch({ data: [], pagination: {} });
  await api.getAlerts({ active: "true", severity: "danger" });
  const url = (global.fetch as any).mock.calls[0][0] as string;
  expect(url).toContain("active=true");
  expect(url).toContain("severity=danger");
});

// ── Error handling ─────────────────────────────────────────────────────────────

it("throws on non-ok response with status code prefix", async () => {
  global.fetch = mockFetch({ detail: "Not found" }, 404);
  await expect(api.getHealth()).rejects.toThrow("[404]");
});

it("throws on 401 with detail message", async () => {
  global.fetch = mockFetch({ detail: "X-API-Key manquant" }, 401);
  await expect(api.initialize()).rejects.toThrow("X-API-Key manquant");
});

it("throws on 429 rate limit", async () => {
  global.fetch = mockFetch({ detail: "Limite dépassée." }, 429);
  await expect(api.getDashboard()).rejects.toThrow("[429]");
});

// ── API key header ─────────────────────────────────────────────────────────────

it("sends X-API-Key header when NEXT_PUBLIC_API_KEY is set", async () => {
  vi.stubEnv("NEXT_PUBLIC_API_KEY", "my-secret");
  // Re-import to pick up new env
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://test-backend");
  vi.stubEnv("NEXT_PUBLIC_API_KEY", "my-secret");
  const { api: freshApi } = await import("@/lib/api");

  global.fetch = mockFetch({ status: "healthy" });
  await freshApi.getHealth();
  const headers = (global.fetch as any).mock.calls[0][1]?.headers as Record<string, string>;
  expect(headers?.["X-API-Key"]).toBe("my-secret");
  vi.unstubAllEnvs();
});

// ── Download URL ──────────────────────────────────────────────────────────────

it("getExportDownloadUrl returns full v1 URL", () => {
  const url = api.getExportDownloadUrl("weather_data", "csv", 30);
  expect(url).toContain("/api/v1/export/download/weather_data");
  expect(url).toContain("fmt=csv");
  expect(url).toContain("days=30");
});

"use client";
/**
 * Domain-specific React Query hooks.
 * Each hook has a stable query key so pages that share the same data
 * automatically deduplicate requests and share the cache.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ── Keys ─────────────────────────────────────────────────────────────────────
export const keys = {
  dashboard: ["dashboard"] as const,
  health: ["system", "health"] as const,
  status: ["system", "status"] as const,
  cacheStats: ["system", "cache-stats"] as const,
  config: ["system", "config"] as const,
  collectionLog: (limit: number, offset: number, status?: string) =>
    ["system", "collection-log", limit, offset, status] as const,
  models: (limit: number, offset: number, type?: string) =>
    ["system", "models", limit, offset, type] as const,

  locations: (params?: Record<string, string>) => ["locations", params] as const,
  cities: ["locations", "cities"] as const,
  regions: ["locations", "regions"] as const,

  weather: (locationId: string, days?: number) =>
    ["weather", locationId, days] as const,
  weatherSummary: ["weather", "summary"] as const,

  floods: (locationId: string, days?: number) =>
    ["floods", locationId, days] as const,
  floodRiskMap: ["floods", "risk-map"] as const,

  airQuality: (locationId: string, days?: number) =>
    ["air-quality", locationId, days] as const,
  airQualityMap: ["air-quality", "map"] as const,

  drought: (locationId: string, days?: number) =>
    ["drought", locationId, days] as const,
  droughtMap: ["drought", "map"] as const,

  alerts: (params?: Record<string, string>) => ["alerts", params] as const,
  alertStats: ["alerts", "stats"] as const,

  report: (days: number) => ["report", days] as const,
  exportCatalogue: ["export", "catalogue"] as const,
};

// ── System ────────────────────────────────────────────────────────────────────
export function useHealth() {
  return useQuery({ queryKey: keys.health, queryFn: api.getHealth, staleTime: 30_000 });
}

export function useSystemStatus() {
  return useQuery({ queryKey: keys.status, queryFn: api.getStatus, staleTime: 60_000 });
}

export function useConfig() {
  return useQuery({ queryKey: keys.config, queryFn: api.getConfig, staleTime: 5 * 60_000 });
}

export function useCacheStats() {
  return useQuery({ queryKey: keys.cacheStats, queryFn: api.getCacheStats, staleTime: 10_000 });
}

export function useCollectionLog(limit = 20, offset = 0, status?: string) {
  return useQuery({
    queryKey: keys.collectionLog(limit, offset, status),
    queryFn: () => api.getCollectionLog(limit, offset, status),
  });
}

export function useModels(limit = 50, offset = 0, modelType?: string) {
  return useQuery({
    queryKey: keys.models(limit, offset, modelType),
    queryFn: () => api.getModels(limit, offset, modelType),
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function useDashboard() {
  return useQuery({ queryKey: keys.dashboard, queryFn: api.getDashboard, staleTime: 5 * 60_000 });
}

// ── Locations ─────────────────────────────────────────────────────────────────
export function useCities() {
  return useQuery({ queryKey: keys.cities, queryFn: api.getCities, staleTime: 10 * 60_000 });
}

export function useRegions() {
  return useQuery({ queryKey: keys.regions, queryFn: api.getRegions, staleTime: 10 * 60_000 });
}

// ── Weather ───────────────────────────────────────────────────────────────────
export function useCurrentWeather(locationId: string) {
  return useQuery({
    queryKey: keys.weather(locationId),
    queryFn: () => api.getCurrentWeather(locationId),
    enabled: !!locationId,
  });
}

export function useWeatherHistory(locationId: string, days = 30) {
  return useQuery({
    queryKey: keys.weather(locationId, days),
    queryFn: () => api.getWeatherHistory(locationId, days),
    enabled: !!locationId,
  });
}

export function useWeatherSummary() {
  return useQuery({ queryKey: keys.weatherSummary, queryFn: api.getWeatherSummary, staleTime: 30 * 60_000 });
}

// ── Floods ────────────────────────────────────────────────────────────────────
export function useCurrentFlood(locationId: string) {
  return useQuery({
    queryKey: keys.floods(locationId),
    queryFn: () => api.getCurrentFlood(locationId),
    enabled: !!locationId,
    staleTime: 5 * 60_000,
  });
}

export function useFloodRiskMap() {
  return useQuery({ queryKey: keys.floodRiskMap, queryFn: api.getFloodRiskMap, staleTime: 30 * 60_000 });
}

// ── Air Quality ───────────────────────────────────────────────────────────────
export function useCurrentAirQuality(locationId: string) {
  return useQuery({
    queryKey: keys.airQuality(locationId),
    queryFn: () => api.getCurrentAirQuality(locationId),
    enabled: !!locationId,
    staleTime: 5 * 60_000,
  });
}

export function useAirQualityMap() {
  return useQuery({ queryKey: keys.airQualityMap, queryFn: api.getAirQualityMap, staleTime: 30 * 60_000 });
}

// ── Drought ───────────────────────────────────────────────────────────────────
export function useCurrentDrought(locationId: string) {
  return useQuery({
    queryKey: keys.drought(locationId),
    queryFn: () => api.getCurrentDrought(locationId),
    enabled: !!locationId,
    staleTime: 5 * 60_000,
  });
}

export function useDroughtMap() {
  return useQuery({ queryKey: keys.droughtMap, queryFn: api.getDroughtMap, staleTime: 30 * 60_000 });
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export function useAlerts(params?: Record<string, string>) {
  return useQuery({
    queryKey: keys.alerts(params),
    queryFn: () => api.getAlerts(params),
  });
}

export function useAlertStats() {
  return useQuery({ queryKey: keys.alertStats, queryFn: api.getAlertStats, staleTime: 60_000 });
}

// ── Report ────────────────────────────────────────────────────────────────────
export function useReport(days = 30) {
  return useQuery({ queryKey: keys.report(days), queryFn: () => api.getReport(days) });
}

// ── Export ────────────────────────────────────────────────────────────────────
export function useExportCatalogue() {
  return useQuery({
    queryKey: keys.exportCatalogue,
    queryFn: api.getExportCatalogue,
    staleTime: 10 * 60_000,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────
export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.resolveAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useGenerateAlerts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.generateAlerts,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useClearCache() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.clearCache,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.cacheStats }),
  });
}

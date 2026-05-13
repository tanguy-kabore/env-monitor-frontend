const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchApi<T = any>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // System
  getHealth: () => fetchApi("/api/system/health"),
  getConfig: () => fetchApi("/api/system/config"),
  getStatus: () => fetchApi("/api/system/status"),
  initialize: () => fetchApi("/api/system/initialize", { method: "POST" }),
  resetStatus: () => fetchApi("/api/system/reset-status", { method: "POST" }),
  getCollectionLog: (limit = 20) => fetchApi(`/api/system/collection-log?limit=${limit}`),
  getModels: () => fetchApi("/api/system/models"),
  triggerCollect: (type: string) => fetchApi(`/api/system/collect/${type}`, { method: "POST" }),
  triggerTrain: () => fetchApi("/api/system/train", { method: "POST" }),
  cleanupModels: () => fetchApi("/api/system/models/cleanup", { method: "POST" }),
  cleanupPartialLogs: () => fetchApi("/api/system/collection-log/cleanup", { method: "POST" }),
  generateAlerts: () => fetchApi("/api/alerts/generate", { method: "POST" }),
  resolveAlert: (id: string) => fetchApi(`/api/alerts/${id}/resolve`, { method: "POST" }),
  deleteAlert: (id: string) => fetchApi(`/api/alerts/${id}`, { method: "DELETE" }),
  resolveAllAlerts: () => fetchApi("/api/alerts/resolve-all", { method: "POST" }),
  getAlertHistoryStats: (days = 30) => fetchApi(`/api/alerts/history-stats?days=${days}`),
  resetAllData: () => fetchApi("/api/system/reset-all", { method: "POST" }),

  // Dashboard
  getDashboard: () => fetchApi("/api/dashboard"),

  // Locations
  getLocations: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchApi(`/api/locations${qs}`);
  },
  getRegions: () => fetchApi("/api/locations/regions"),
  getCities: () => fetchApi("/api/locations/cities"),
  getLocationTree: () => fetchApi("/api/locations/tree"),
  getLocation: (id: string) => fetchApi(`/api/locations/${id}`),

  // Weather
  getCurrentWeather: (locationId: string) => fetchApi(`/api/weather/current/${locationId}`),
  getWeatherForecast: (locationId: string, days = 7) =>
    fetchApi(`/api/weather/forecast/${locationId}?days=${days}`),
  getWeatherHistory: (locationId: string, days = 30) =>
    fetchApi(`/api/weather/history/${locationId}?days=${days}`),
  getWeatherPredictions: (locationId: string) =>
    fetchApi(`/api/weather/predictions/${locationId}`),
  getWeatherSummary: () => fetchApi("/api/weather/summary"),

  // Floods
  getCurrentFlood: (locationId: string) => fetchApi(`/api/floods/current/${locationId}`),
  getFloodForecast: (locationId: string) => fetchApi(`/api/floods/forecast/${locationId}`),
  getFloodHistory: (locationId: string, days = 90) =>
    fetchApi(`/api/floods/history/${locationId}?days=${days}`),
  getFloodPredictions: (locationId: string) =>
    fetchApi(`/api/floods/predictions/${locationId}`),
  getFloodRiskMap: () => fetchApi("/api/floods/risk-map"),

  // Air Quality
  getCurrentAirQuality: (locationId: string) =>
    fetchApi(`/api/air-quality/current/${locationId}`),
  getAirQualityForecast: (locationId: string) =>
    fetchApi(`/api/air-quality/forecast/${locationId}`),
  getAirQualityHistory: (locationId: string, days = 30) =>
    fetchApi(`/api/air-quality/history/${locationId}?days=${days}`),
  getAirQualityPredictions: (locationId: string) =>
    fetchApi(`/api/air-quality/predictions/${locationId}`),
  getAirQualityMap: () => fetchApi("/api/air-quality/map"),

  // Drought
  getCurrentDrought: (locationId: string) => fetchApi(`/api/drought/current/${locationId}`),
  getDroughtHistory: (locationId: string, days = 90) =>
    fetchApi(`/api/drought/history/${locationId}?days=${days}`),
  getDroughtPredictions: (locationId: string) =>
    fetchApi(`/api/drought/predictions/${locationId}`),
  getDroughtMap: () => fetchApi("/api/drought/map"),

  // Climate
  getClimateData: (locationId: string, startYear = 2020, endYear = 2025) =>
    fetchApi(`/api/climate/data/${locationId}?start_year=${startYear}&end_year=${endYear}`),
  getClimateTrends: (locationId: string, startYear?: number) =>
    fetchApi(`/api/climate/trends/${locationId}${startYear ? `?start_year=${startYear}` : ""}`),
  compareClimate: (locationIds: string[]) =>
    fetchApi(`/api/climate/comparison?location_ids=${locationIds.join(",")}`),

  // Export
  getExportCatalogue: () => fetchApi("/api/export/catalogue"),
  getExportPreview: (dataset: string, limit = 50, offset = 0, locationId?: string) => {
    const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (locationId) qs.set("location_id", locationId);
    return fetchApi(`/api/export/preview/${dataset}?${qs}`);
  },
  getExportDownloadUrl: (dataset: string, fmt: "csv" | "json", days?: number, locationId?: string) => {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const qs = new URLSearchParams({ fmt });
    if (days) qs.set("days", String(days));
    if (locationId) qs.set("location_id", locationId);
    return `${base}/api/export/download/${dataset}?${qs}`;
  },

  // Report
  getReport: (days = 30) => fetchApi(`/api/report?days=${days}`),

  // Alerts
  getAlerts: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchApi(`/api/alerts${qs}`);
  },
  getAlertStats: () => fetchApi("/api/alerts/stats"),
};

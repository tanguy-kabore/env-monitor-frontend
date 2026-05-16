const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_V1 = `${API_BASE}/api/v1`;

// Read at runtime so tests / SSR can set NEXT_PUBLIC_API_KEY
function getApiKey(): string {
  return (
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_KEY) || ""
  );
}

async function fetchApi<T = any>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_V1}${path}`;
  const apiKey = getApiKey();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-API-Key": apiKey } : {}),
        ...options?.headers,
      },
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const body = await res.json();
        detail = body.detail ?? body.error ?? detail;
      } catch {}
      throw new Error(`[${res.status}] ${detail}`);
    }
    return res.json();
  } catch (err: any) {
    if (err.name === "AbortError") throw new Error("Délai d'attente dépassé — le serveur met trop de temps à répondre");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  // System
  getHealth: () => fetchApi("/system/health"),
  getConfig: () => fetchApi("/system/config"),
  getStatus: () => fetchApi("/system/status"),
  getCacheStats: () => fetchApi("/system/cache-stats"),
  initialize: () => fetchApi("/system/initialize", { method: "POST" }),
  resetStatus: () => fetchApi("/system/reset-status", { method: "POST" }),
  getCollectionLog: (limit = 20, offset = 0, status?: string) => {
    const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (status) qs.set("status", status);
    return fetchApi(`/system/collection-log?${qs}`);
  },
  getModels: (limit = 50, offset = 0, modelType?: string) => {
    const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (modelType) qs.set("model_type", modelType);
    return fetchApi(`/system/models?${qs}`);
  },
  triggerCollect: (type: string) => fetchApi(`/system/collect/${type}`, { method: "POST" }),
  triggerTrain: () => fetchApi("/system/train", { method: "POST" }),
  cleanupModels: () => fetchApi("/system/models/cleanup", { method: "POST" }),
  cleanupPartialLogs: () => fetchApi("/system/collection-log/cleanup", { method: "POST" }),
  clearCache: () => fetchApi("/system/cache", { method: "DELETE" }),
  generateAlerts: () => fetchApi("/alerts/generate", { method: "POST" }),
  resolveAlert: (id: string) => fetchApi(`/alerts/${id}/resolve`, { method: "POST" }),
  deleteAlert: (id: string) => fetchApi(`/alerts/${id}`, { method: "DELETE" }),
  resolveAllAlerts: () => fetchApi("/alerts/resolve-all", { method: "POST" }),
  getAlertHistoryStats: (days = 30) => fetchApi(`/alerts/history-stats?days=${days}`),
  resetAllData: () => fetchApi("/system/reset-all", { method: "POST" }),

  // Scheduler Control
  getJobDetails: (jobId: string) => fetchApi(`/system/scheduler/jobs/${jobId}`),
  runJobNow: (jobId: string) => fetchApi(`/system/scheduler/jobs/${jobId}/run`, { method: "POST" }),
  pauseJob: (jobId: string) => fetchApi(`/system/scheduler/jobs/${jobId}/pause`, { method: "POST" }),
  resumeJob: (jobId: string) => fetchApi(`/system/scheduler/jobs/${jobId}/resume`, { method: "POST" }),
  updateJobInterval: (jobId: string, data: { minutes?: number; hours?: number; days?: number; cron?: object }) =>
    fetchApi(`/system/scheduler/jobs/${jobId}/interval`, { method: "PUT", body: JSON.stringify(data) }),

  // Dashboard
  getDashboard: () => fetchApi("/dashboard"),

  // Locations
  getLocations: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchApi(`/locations${qs}`);
  },
  getRegions: () => fetchApi("/locations/regions"),
  getCities: () => fetchApi("/locations/cities"),
  getLocationTree: () => fetchApi("/locations/tree"),
  getLocation: (id: string) => fetchApi(`/locations/${id}`),

  // Weather
  getCurrentWeather: (locationId: string) => fetchApi(`/weather/current/${locationId}`),
  getWeatherForecast: (locationId: string, days = 7) =>
    fetchApi(`/weather/forecast/${locationId}?days=${days}`),
  getWeatherHistory: (locationId: string, days = 30) =>
    fetchApi(`/weather/history/${locationId}?days=${days}`),
  getWeatherPredictions: (locationId: string) =>
    fetchApi(`/weather/predictions/${locationId}`),
  getWeatherSummary: () => fetchApi("/weather/summary"),

  // Floods
  getCurrentFlood: (locationId: string) => fetchApi(`/floods/current/${locationId}`),
  getFloodForecast: (locationId: string) => fetchApi(`/floods/forecast/${locationId}`),
  getFloodHistory: (locationId: string, days = 90) =>
    fetchApi(`/floods/history/${locationId}?days=${days}`),
  getFloodPredictions: (locationId: string) =>
    fetchApi(`/floods/predictions/${locationId}`),
  getFloodRiskMap: () => fetchApi("/floods/risk-map"),

  // Air Quality
  getCurrentAirQuality: (locationId: string) =>
    fetchApi(`/air-quality/current/${locationId}`),
  getAirQualityForecast: (locationId: string) =>
    fetchApi(`/air-quality/forecast/${locationId}`),
  getAirQualityHistory: (locationId: string, days = 30) =>
    fetchApi(`/air-quality/history/${locationId}?days=${days}`),
  getAirQualityPredictions: (locationId: string) =>
    fetchApi(`/air-quality/predictions/${locationId}`),
  getAirQualityMap: () => fetchApi("/air-quality/map"),

  // Drought
  getCurrentDrought: (locationId: string) => fetchApi(`/drought/current/${locationId}`),
  getDroughtHistory: (locationId: string, days = 90) =>
    fetchApi(`/drought/history/${locationId}?days=${days}`),
  getDroughtPredictions: (locationId: string) =>
    fetchApi(`/drought/predictions/${locationId}`),
  getDroughtMap: () => fetchApi("/drought/map"),

  // Climate
  getClimateData: (locationId: string, startYear = 2020, endYear = 2025) =>
    fetchApi(`/climate/data/${locationId}?start_year=${startYear}&end_year=${endYear}`),
  getClimateTrends: (locationId: string, startYear?: number) =>
    fetchApi(`/climate/trends/${locationId}${startYear ? `?start_year=${startYear}` : ""}`),
  compareClimate: (locationIds: string[]) =>
    fetchApi(`/climate/comparison?location_ids=${locationIds.join(",")}`),

  // Export
  getExportCatalogue: () => fetchApi("/export/catalogue"),
  getExportPreview: (dataset: string, limit = 50, offset = 0, locationId?: string) => {
    const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (locationId) qs.set("location_id", locationId);
    return fetchApi(`/export/preview/${dataset}?${qs}`);
  },
  getExportDownloadUrl: (dataset: string, fmt: "csv" | "json", days?: number, locationId?: string) => {
    const qs = new URLSearchParams({ fmt });
    if (days) qs.set("days", String(days));
    if (locationId) qs.set("location_id", locationId);
    return `${API_V1}/export/download/${dataset}?${qs}`;
  },

  // Report
  getReport: (days = 30) => fetchApi(`/report?days=${days}`),

  // Alerts
  getAlerts: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchApi(`/alerts${qs}`);
  },
  getAlertStats: () => fetchApi("/alerts/stats"),
};

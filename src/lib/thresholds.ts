import { useState, useEffect } from "react";

/**
 * Centralized thresholds — single source of truth for the frontend.
 *
 * Values are loaded at runtime from /api/system/config (which reads app_config.yaml).
 * The constants below are FALLBACKS used only if the API call has not resolved yet
 * (they match the values in app_config.yaml exactly).
 *
 * Usage:
 *   import { THRESHOLDS, useThresholds } from "@/lib/thresholds";
 *   - THRESHOLDS  → synchronous access (fallback values, always safe)
 *   - useThresholds() → React hook that returns live values from API
 */

// ─── Fallback constants (mirrors app_config.yaml alerts.thresholds) ──────────

export const FLOOD_THRESHOLDS = {
  low:      20,   // m³/s — débit saisonnier normal
  moderate: 75,   // m³/s — ~Q2 crue biennale sahélienne
  high:     150,  // m³/s — ~Q5 crue quinquennale
  extreme:  300,  // m³/s — ~Q20 crue vicennale (type sept. 2009)
} as const;

export const AIR_QUALITY_THRESHOLDS = {
  good:      20,  // EAQI Bon
  fair:      40,  // EAQI Acceptable
  moderate:  60,  // EAQI Modéré
  poor:      80,  // EAQI Mauvais
  very_poor: 100, // EAQI Très mauvais
} as const;

export const DROUGHT_THRESHOLDS = {
  normal:   -0.5, // SPI > -0.5 : normale
  moderate: -1.0, // SPI -0.5 à -1.0
  severe:   -1.5, // SPI -1.0 à -1.5
  extreme:  -2.0, // SPI < -2.0
} as const;

export const TEMPERATURE_THRESHOLDS = {
  heat_warning: 40,  // °C — dépasse la moy. max saison chaude BF (38–39°C)
  heat_extreme: 43,  // °C — canicule sévère documentée
  cold_warning: 15,  // °C — froid relatif sahélien
} as const;

/**
 * Official EAQI per-pollutant breakpoints (μg/m³) for the reference table.
 * Source: European Environment Agency — EAQI specification.
 */
export const EAQI_POLLUTANT_RANGES = {
  pm25: { good: 10,  fair: 20,  moderate: 25,  poor: 50,  very_poor: 75  },
  pm10: { good: 20,  fair: 40,  moderate: 50,  poor: 100, very_poor: 150 },
  o3:   { good: 50,  fair: 100, moderate: 130, poor: 240, very_poor: 380 },
  no2:  { good: 40,  fair: 90,  moderate: 120, poor: 230, very_poor: 340 },
} as const;

/** OMS / WHO annual guideline values (μg/m³) used as warning thresholds in pollutant mini-cards */
export const POLLUTANT_WARN_THRESHOLDS = {
  pm25:  15,    // OMS 2021
  pm10:  45,    // OMS 2021
  dust:  100,   // indicatif
  co:    4000,  // OMS 24h
  no2:   40,    // OMS annuel
  o3:    120,   // OMS 8h
  so2:   40,    // OMS 24h
} as const;

export const THRESHOLDS = {
  flood:       FLOOD_THRESHOLDS,
  air_quality: AIR_QUALITY_THRESHOLDS,
  drought:     DROUGHT_THRESHOLDS,
  temperature: TEMPERATURE_THRESHOLDS,
};

export type Thresholds = typeof THRESHOLDS;

// ─── Canonical colour palette (hex) ──────────────────────────────────────────
// Single source for ALL pages, charts, maps, badges.

export const RISK_COLORS = {
  low:      { hex: "#00B894", color: "text-green-700",  bg: "bg-green-100",  border: "border-green-200"  },
  moderate: { hex: "#F59E0B", color: "text-yellow-700", bg: "bg-yellow-100", border: "border-yellow-200" },
  high:     { hex: "#E17055", color: "text-orange-700", bg: "bg-orange-100", border: "border-orange-200" },
  extreme:  { hex: "#D63031", color: "text-red-700",    bg: "bg-red-100",    border: "border-red-200"    },
  unknown:  { hex: "#94A3B8", color: "text-gray-500",   bg: "bg-gray-100",   border: "border-gray-200"   },
} as const;

export const AQI_COLORS = {
  good:      { hex: "#00B894", color: "text-green-700",  bg: "bg-green-100",  border: "border-green-200"  },
  fair:      { hex: "#84CC16", color: "text-lime-700",   bg: "bg-lime-100",   border: "border-lime-200"   },
  moderate:  { hex: "#F59E0B", color: "text-yellow-700", bg: "bg-yellow-100", border: "border-yellow-200" },
  poor:      { hex: "#E17055", color: "text-orange-700", bg: "bg-orange-100", border: "border-orange-200" },
  very_poor: { hex: "#D63031", color: "text-red-700",    bg: "bg-red-100",    border: "border-red-200"    },
  unknown:   { hex: "#94A3B8", color: "text-gray-500",   bg: "bg-gray-100",   border: "border-gray-200"   },
} as const;

export const DROUGHT_COLORS = {
  normal:   { hex: "#00B894", color: "text-green-700",  bg: "bg-green-100",  border: "border-green-200"  },
  mild:     { hex: "#60A5FA", color: "text-blue-600",   bg: "bg-blue-100",   border: "border-blue-200"   },
  moderate: { hex: "#F59E0B", color: "text-yellow-700", bg: "bg-yellow-100", border: "border-yellow-200" },
  severe:   { hex: "#E17055", color: "text-orange-700", bg: "bg-orange-100", border: "border-orange-200" },
  extreme:  { hex: "#D63031", color: "text-red-700",    bg: "bg-red-100",    border: "border-red-200"    },
  unknown:  { hex: "#94A3B8", color: "text-gray-500",   bg: "bg-gray-100",   border: "border-gray-200"   },
} as const;

export const TEMP_COLORS = {
  normal:       { hex: "#00B894", color: "text-green-700",  bg: "bg-green-100"  },
  cold_warning: { hex: "#60A5FA", color: "text-blue-600",   bg: "bg-blue-100"   },
  heat_warning: { hex: "#E17055", color: "text-orange-700", bg: "bg-orange-100" },
  heat_extreme: { hex: "#D63031", color: "text-red-700",    bg: "bg-red-100"    },
} as const;

// ─── Chart / UI colour palettes ──────────────────────────────────────────────

/** Weather series colours (Temp Max, Temp Min, Precipitation, Humidity, Rain prob.) */
export const CHART_COLORS = {
  temp_max:   "#D63031",
  temp_min:   "#1B6FA8",
  precip:     "#00B894",
  humidity:   "#A29BFE",
  rain_prob:  "#F59E0B",
  neutral:    "#64748B",
} as const;

/** Alert severity colours */
export const ALERT_SEVERITY_COLORS: Record<string, string> = {
  info:     "#3B82F6",
  warning:  "#F59E0B",
  danger:   "#F97316",
  critical: "#EF4444",
};

/** Alert type colours */
export const ALERT_TYPE_COLORS: Record<string, string> = {
  flood:       "#3B82F6",
  air_quality: "#14B8A6",
  heat_wave:   "#EF4444",
  drought:     "#F59E0B",
};

/** Climate / anomaly colours */
export const CLIMATE_COLORS = {
  temp_line:     "#D63031",
  temp_partial:  "#F59E0B",
  precip_fill:   "#BFDBFE",
  precip_stroke: "#3B82F6",
  precip_wet:    "#1D4ED8",
  precip_dry:    "#F59E0B",
  humidity:      "#059669",
  anomaly_pos:   "#EF4444",
  anomaly_neg:   "#3B82F6",
  anomaly_part:  "#FBBF24",
  reference:     "#64748B",
  ref_mean:      "#F59E0B",
} as const;

/** AQI / pollutant chart series colours */
export const AQI_CHART_COLORS = {
  aqi:      "#7C3AED",
  pm25:     "#E17055",
  pm10:     "#1B6FA8",
  dust:     "#F0A500",
  no2:      "#FDCB6E",
} as const;

/** Drought / SPI chart series colours */
export const DROUGHT_CHART_COLORS = {
  spi_line:    "#E8A838",
  spi_fill:    "#10B981",
  precip_30d:  "#93C5FD",
  precip_90d:  "#1B6FA8",
} as const;

/** Flood chart series colours (river discharge lines/bars) */
export const FLOOD_CHART_COLORS = {
  historic:  "#1B6FA8",
  forecast:  "#0EA5E9",
  predicted: "#7C3AED",
  neutral:   "#64748B",
} as const;

/** Quick hex lookup for flood/generic risk strings */
export function riskHex(risk?: string | null): string {
  return RISK_COLORS[(risk as keyof typeof RISK_COLORS) ?? "unknown"]?.hex ?? RISK_COLORS.unknown.hex;
}

/** Quick hex lookup for AQI level strings */
export function aqiHex(level?: string | null): string {
  return AQI_COLORS[(level as keyof typeof AQI_COLORS) ?? "unknown"]?.hex ?? AQI_COLORS.unknown.hex;
}

/** Classify an AQI numeric value and return the level key */
export function aqiLevel(
  aqi: number | null | undefined,
  t = AIR_QUALITY_THRESHOLDS,
): keyof typeof AQI_COLORS {
  if (aqi == null) return "unknown";
  if (aqi <= t.good)     return "good";
  if (aqi <= t.fair)     return "fair";
  if (aqi <= t.moderate) return "moderate";
  if (aqi <= t.poor)     return "poor";
  return "very_poor";
}

// ─── Risk classification helpers ─────────────────────────────────────────────

export function classifyFloodRisk(
  discharge: number | null | undefined,
  t = FLOOD_THRESHOLDS,
): "low" | "moderate" | "high" | "extreme" {
  if (discharge == null) return "low";
  if (discharge >= t.extreme)  return "extreme";
  if (discharge >= t.high)     return "high";
  if (discharge >= t.moderate) return "moderate";
  return "low";
}

export function classifyAqi(
  aqi: number | null | undefined,
  t = AIR_QUALITY_THRESHOLDS,
): "good" | "fair" | "moderate" | "poor" | "very_poor" {
  if (aqi == null) return "good";
  if (aqi > t.poor)     return "very_poor";
  if (aqi > t.moderate) return "poor";
  if (aqi > t.fair)     return "moderate";
  if (aqi > t.good)     return "fair";
  return "good";
}

export function classifySpi(
  spi: number | null | undefined,
  t = DROUGHT_THRESHOLDS,
): "normal" | "moderate" | "severe" | "extreme" {
  if (spi == null) return "normal";
  if (spi <= t.extreme)  return "extreme";
  if (spi <= t.severe)   return "severe";
  if (spi <= t.moderate) return "moderate";
  return "normal";
}

export function classifyTemperature(
  temp: number | null | undefined,
  t = TEMPERATURE_THRESHOLDS,
): "normal" | "heat_warning" | "heat_extreme" | "cold_warning" {
  if (temp == null) return "normal";
  if (temp >= t.heat_extreme) return "heat_extreme";
  if (temp >= t.heat_warning) return "heat_warning";
  if (temp <= t.cold_warning) return "cold_warning";
  return "normal";
}

// ─── React hook — loads live thresholds from the API ─────────────────────────

export function useThresholds(): Thresholds {
  const [thresholds, setThresholds] = useState<Thresholds>(THRESHOLDS);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/system/config`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.alert_thresholds) {
          setThresholds({
            flood:       { ...FLOOD_THRESHOLDS,       ...data.alert_thresholds.flood       },
            air_quality: { ...AIR_QUALITY_THRESHOLDS, ...data.alert_thresholds.air_quality },
            drought:     { ...DROUGHT_THRESHOLDS,     ...data.alert_thresholds.drought     },
            temperature: { ...TEMPERATURE_THRESHOLDS, ...data.alert_thresholds.temperature },
          });
        }
      })
      .catch(() => {
        // API unavailable — keep fallback values silently
      });
  }, []);

  return thresholds;
}

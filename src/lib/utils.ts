import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AQI_COLORS, RISK_COLORS, DROUGHT_COLORS, AIR_QUALITY_THRESHOLDS } from "@/lib/thresholds";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale = "fr-FR"): string {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date, locale = "fr-FR"): string {
  const cleaned = typeof date === "string" ? date.replace(/^"|"$/g, "") : date;
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(num: number | null | undefined, decimals = 1): string {
  if (num === null || num === undefined) return "N/A";
  return num.toFixed(decimals);
}

export function getAqiLabel(
  aqi: number | null,
  t = AIR_QUALITY_THRESHOLDS,
): { label: string; color: string; bg: string; hex: string } {
  if (aqi === null) return { label: "Inconnu", ...AQI_COLORS.unknown };
  if (aqi <= t.good)     return { label: "Bon",          ...AQI_COLORS.good };
  if (aqi <= t.fair)     return { label: "Acceptable",   ...AQI_COLORS.fair };
  if (aqi <= t.moderate) return { label: "Modéré",       ...AQI_COLORS.moderate };
  if (aqi <= t.poor)     return { label: "Mauvais",      ...AQI_COLORS.poor };
  return { label: "Très mauvais", ...AQI_COLORS.very_poor };
}

export function getFloodRiskLabel(level: string | null): { label: string; color: string; bg: string; hex: string } {
  switch (level) {
    case "low":      return { label: "Faible",  ...RISK_COLORS.low };
    case "moderate": return { label: "Modéré",  ...RISK_COLORS.moderate };
    case "high":     return { label: "Élevé",   ...RISK_COLORS.high };
    case "extreme":  return { label: "Extrême", ...RISK_COLORS.extreme };
    default:         return { label: "Inconnu", ...RISK_COLORS.unknown };
  }
}

export function getDroughtLabel(level: string | null): { label: string; color: string; bg: string; hex: string } {
  switch (level) {
    case "normal":   return { label: "Normal",   ...DROUGHT_COLORS.normal };
    case "mild":     return { label: "Anomalie", ...DROUGHT_COLORS.mild };
    case "moderate": return { label: "Modérée",  ...DROUGHT_COLORS.moderate };
    case "severe":   return { label: "Sévère",   ...DROUGHT_COLORS.severe };
    case "extreme":  return { label: "Extrême",  ...DROUGHT_COLORS.extreme };
    default:         return { label: "Inconnu",  ...DROUGHT_COLORS.unknown };
  }
}

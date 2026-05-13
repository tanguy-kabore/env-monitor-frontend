import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export function getAqiLabel(aqi: number | null): { label: string; color: string; bg: string } {
  if (aqi === null) return { label: "Inconnu", color: "text-gray-500", bg: "bg-gray-100" };
  if (aqi <= 20) return { label: "Bon", color: "text-green-700", bg: "bg-green-100" };
  if (aqi <= 40) return { label: "Acceptable", color: "text-lime-700", bg: "bg-lime-100" };
  if (aqi <= 60) return { label: "Modéré", color: "text-yellow-700", bg: "bg-yellow-100" };
  if (aqi <= 80) return { label: "Mauvais", color: "text-orange-700", bg: "bg-orange-100" };
  return { label: "Très mauvais", color: "text-red-700", bg: "bg-red-100" };
}

export function getFloodRiskLabel(level: string | null): { label: string; color: string; bg: string } {
  switch (level) {
    case "low": return { label: "Faible", color: "text-green-700", bg: "bg-green-100" };
    case "moderate": return { label: "Modéré", color: "text-yellow-700", bg: "bg-yellow-100" };
    case "high": return { label: "Élevé", color: "text-orange-700", bg: "bg-orange-100" };
    case "extreme": return { label: "Extrême", color: "text-red-700", bg: "bg-red-100" };
    default: return { label: "Inconnu", color: "text-gray-500", bg: "bg-gray-100" };
  }
}

export function getDroughtLabel(level: string | null): { label: string; color: string; bg: string } {
  switch (level) {
    case "normal": return { label: "Normal", color: "text-green-700", bg: "bg-green-100" };
    case "moderate": return { label: "Modérée", color: "text-yellow-700", bg: "bg-yellow-100" };
    case "severe": return { label: "Sévère", color: "text-orange-700", bg: "bg-orange-100" };
    case "extreme": return { label: "Extrême", color: "text-red-700", bg: "bg-red-100" };
    default: return { label: "Inconnu", color: "text-gray-500", bg: "bg-gray-100" };
  }
}

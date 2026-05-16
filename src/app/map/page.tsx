"use client";
import { useState, useMemo } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import MapView from "@/components/MapView";
import { Map as MapIcon, Thermometer, Wind, Waves, Droplets, Info } from "lucide-react";
import {
  useThresholds,
  RISK_COLORS, TEMP_COLORS, AQI_COLORS, DROUGHT_COLORS,
} from "@/lib/thresholds";
import type { Thresholds } from "@/lib/thresholds";

type MapLayer = "weather" | "air_quality" | "flood" | "drought";

// ── Layer metadata (legend items derived from live thresholds) ────────────────
function buildLegend(layer: MapLayer, t: Thresholds) {
  if (layer === "weather") return [
    { color: TEMP_COLORS.cold_warning.hex, label: "Froid",    range: `≤ ${t.temperature.cold_warning}°C` },
    { color: TEMP_COLORS.normal.hex,       label: "Normal",   range: `${t.temperature.cold_warning}–${t.temperature.heat_warning}°C` },
    { color: TEMP_COLORS.heat_warning.hex, label: "Chaleur",  range: `${t.temperature.heat_warning}–${t.temperature.heat_extreme}°C` },
    { color: TEMP_COLORS.heat_extreme.hex, label: "Canicule", range: `≥ ${t.temperature.heat_extreme}°C` },
  ];
  if (layer === "air_quality") return [
    { color: AQI_COLORS.good.hex,      label: "Bon",          range: `≤ ${t.air_quality.good} AQI` },
    { color: AQI_COLORS.fair.hex,      label: "Acceptable",   range: `${t.air_quality.good}–${t.air_quality.fair} AQI` },
    { color: AQI_COLORS.moderate.hex,  label: "Modéré",       range: `${t.air_quality.fair}–${t.air_quality.moderate} AQI` },
    { color: AQI_COLORS.poor.hex,      label: "Mauvais",      range: `${t.air_quality.moderate}–${t.air_quality.poor} AQI` },
    { color: AQI_COLORS.very_poor.hex, label: "Très mauvais", range: `> ${t.air_quality.poor} AQI` },
  ];
  if (layer === "flood") return [
    { color: RISK_COLORS.low.hex,      label: "Faible",  range: `< ${t.flood.moderate} m³/s` },
    { color: RISK_COLORS.moderate.hex, label: "Modéré",  range: `${t.flood.moderate}–${t.flood.high} m³/s` },
    { color: RISK_COLORS.high.hex,     label: "Élevé",   range: `${t.flood.high}–${t.flood.extreme} m³/s` },
    { color: RISK_COLORS.extreme.hex,  label: "Extrême", range: `≥ ${t.flood.extreme} m³/s` },
  ];
  // drought
  return [
    { color: DROUGHT_COLORS.normal.hex,   label: "Normal",  range: `SPI > ${t.drought.moderate}` },
    { color: DROUGHT_COLORS.moderate.hex, label: "Modérée", range: `SPI ${t.drought.severe} à ${t.drought.moderate}` },
    { color: DROUGHT_COLORS.severe.hex,   label: "Sévère",  range: `SPI ${t.drought.extreme} à ${t.drought.severe}` },
    { color: DROUGHT_COLORS.extreme.hex,  label: "Extrême", range: `SPI ≤ ${t.drought.extreme}` },
  ];
}

const LAYER_CONFIG = {
  weather:     { label: "Température",    icon: Thermometer, accent: "text-red-500 border-red-400 bg-red-50 dark:bg-red-950/30",       desc: "Température actuelle par ville", unit: "°C" },
  air_quality: { label: "Qualité de l'air", icon: Wind,      accent: "text-teal-500 border-teal-400 bg-teal-50 dark:bg-teal-950/30",   desc: "Indice de qualité de l'air (EAQI)", unit: "AQI" },
  flood:       { label: "Inondations",    icon: Waves,       accent: "text-blue-500 border-blue-400 bg-blue-50 dark:bg-blue-950/30",   desc: "Risque d'inondation fluviale", unit: "m³/s" },
  drought:     { label: "Sécheresse",    icon: Droplets,     accent: "text-amber-500 border-amber-400 bg-amber-50 dark:bg-amber-950/30", desc: "Indice SPI de sécheresse", unit: "SPI" },
};

const LAYERS: MapLayer[] = ["weather", "air_quality", "flood", "drought"];

export default function MapPage() {
  const [layer, setLayer] = useState<MapLayer>("weather");
  const thresholds = useThresholds();
  const cfg = LAYER_CONFIG[layer];
  const Icon = cfg.icon;

  const weatherSummary = useApi(() => api.getWeatherSummary(), [], "map-weather",    { enabled: layer === "weather",     staleTime: 5 * 60_000 });
  const aqMap          = useApi(() => api.getAirQualityMap(), [], "map-aq",          { enabled: layer === "air_quality", staleTime: 30 * 60_000 });
  const floodMap       = useApi(() => api.getFloodRiskMap(),  [], "map-flood",       { enabled: layer === "flood",       staleTime: 30 * 60_000 });
  const droughtMap     = useApi(() => api.getDroughtMap(),    [], "map-drought",     { enabled: layer === "drought",     staleTime: 30 * 60_000 });

  const isLoading =
    (layer === "weather"     && weatherSummary.loading) ||
    (layer === "air_quality" && aqMap.loading) ||
    (layer === "flood"       && floodMap.loading) ||
    (layer === "drought"     && droughtMap.loading);

  const points = useMemo(() => {
    const t = thresholds;
    if (layer === "weather") {
      return (weatherSummary.data?.data ?? []).filter((d: any) => d?.location).map((d: any) => {
        const temp = d.current?.temperature ?? d.current?.temperature_max ?? null;
        const risk =
          temp === null        ? "unknown"
          : temp >= t.temperature.heat_extreme ? "heat_extreme"
          : temp >= t.temperature.heat_warning ? "heat_warning"
          : temp <= t.temperature.cold_warning ? "cold_warning"
          : "normal";
        return { id: d.location.external_id, name: d.location.name, latitude: d.location.latitude, longitude: d.location.longitude, value: temp, label: temp != null ? `${temp.toFixed(1)}°C` : "N/A", risk };
      });
    }
    if (layer === "air_quality") {
      return (aqMap.data?.data ?? []).filter((d: any) => d?.location).map((d: any) => {
        const aqi = d.latest?.aqi ?? null;
        const risk =
          aqi === null          ? "unknown"
          : aqi > t.air_quality.poor     ? "very_poor"
          : aqi > t.air_quality.moderate ? "poor"
          : aqi > t.air_quality.fair     ? "moderate"
          : aqi > t.air_quality.good     ? "fair"
          : "good";
        return { id: d.location.external_id, name: d.location.name, latitude: d.location.latitude, longitude: d.location.longitude, value: aqi, label: aqi != null ? `AQI: ${aqi}` : "N/A", risk };
      });
    }
    if (layer === "flood") {
      return (floodMap.data?.data ?? []).filter((d: any) => d?.location).map((d: any) => {
        const q = d.latest_flood?.river_discharge ?? null;
        const risk = d.latest_flood?.flood_risk_level ?? "low";
        return { id: d.location.external_id, name: d.location.name, latitude: d.location.latitude, longitude: d.location.longitude, value: q, label: q != null ? `${q.toFixed(2)} m³/s` : "N/A", risk };
      });
    }
    // drought
    return (droughtMap.data?.data ?? []).filter((d: any) => d?.location).map((d: any) => {
      const spi = d.latest?.spi_value ?? null;
      const risk =
        spi === null              ? "unknown"
        : spi <= t.drought.extreme  ? "extreme"
        : spi <= t.drought.severe   ? "severe"
        : spi <= t.drought.moderate ? "moderate"
        : "normal";
      return { id: d.location.external_id, name: d.location.name, latitude: d.location.latitude, longitude: d.location.longitude, value: spi, label: spi != null ? `SPI: ${spi.toFixed(1)}` : "N/A", risk };
    });
  }, [layer, weatherSummary.data, aqMap.data, floodMap.data, droughtMap.data, thresholds]);

  // ── Color function per layer ──────────────────────────────────────────────
  const colorFn = (p: any) => {
    if (layer === "weather") {
      return TEMP_COLORS[(p.risk as keyof typeof TEMP_COLORS) ?? "normal"]?.hex ?? TEMP_COLORS.normal.hex;
    }
    if (layer === "air_quality") {
      return AQI_COLORS[(p.risk as keyof typeof AQI_COLORS) ?? "unknown"]?.hex ?? AQI_COLORS.unknown.hex;
    }
    if (layer === "drought") {
      return DROUGHT_COLORS[(p.risk as keyof typeof DROUGHT_COLORS) ?? "unknown"]?.hex ?? DROUGHT_COLORS.unknown.hex;
    }
    return RISK_COLORS[(p.risk as keyof typeof RISK_COLORS) ?? "unknown"]?.hex ?? RISK_COLORS.unknown.hex;
  };

  // ── Stats: count per legend bucket ──────────────────────────────────────
  const legend = buildLegend(layer, thresholds);
  const legendKeys = legend.map((l) => l.label);

  const statsByLabel = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of points) {
      const matched = legend.find((l) => l.color === colorFn(p));
      const key = matched?.label ?? "Inconnu";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [points, layer, thresholds]);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapIcon className="w-7 h-7 text-secondary" /> Carte Interactive
          </h1>
          <p className="text-sm text-text-muted mt-1 flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5" />
            {cfg.desc} — <span className="font-medium text-text">{points.length} villes</span>
          </p>
        </div>

        {/* Layer tabs */}
        <div className="flex flex-wrap gap-2">
          {LAYERS.map((key) => {
            const { label, icon: LayerIcon, accent } = LAYER_CONFIG[key];
            const active = layer === key;
            return (
              <button
                key={key}
                onClick={() => setLayer(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150 ${
                  active
                    ? `${accent} shadow-sm`
                    : "border-border bg-card text-text-muted hover:text-text hover:border-primary/40"
                }`}
              >
                <LayerIcon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Map + Legend layout ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">

        {/* Map */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/70 backdrop-blur-sm rounded-t-2xl">
              <div className="flex items-center gap-2 text-sm text-text-muted px-4 py-2 bg-card border border-border rounded-xl shadow">
                <svg className="animate-spin w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Chargement des données…
              </div>
            </div>
          )}
          <MapView
            points={points}
            height="580px"
            colorFn={colorFn}
            radiusFn={() => 11}
          />
        </div>

        {/* ── Legend bar ─────────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-t border-border bg-bg/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">

            {/* Title + source hint */}
            <div className="flex items-center gap-1.5 text-xs text-text-muted shrink-0">
              <Info className="w-3.5 h-3.5" />
              <span className="font-medium">Légende</span>
            </div>

            {/* Color chips */}
            <div className="flex flex-wrap gap-2 flex-1">
              {legend.map(({ color, label, range }) => {
                const count = statsByLabel[label] ?? 0;
                return (
                  <div
                    key={label}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-xs"
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 ring-1 ring-black/10"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-text">{label}</span>
                    <span className="text-text-muted">{range}</span>
                    {count > 0 && (
                      <span
                        className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Unit badge */}
            <span className="text-xs text-text-muted border border-border rounded-lg px-2 py-1 shrink-0 bg-card">
              Unité : <span className="font-semibold text-text">{cfg.unit}</span>
            </span>
          </div>

          {/* Stats summary row */}
          {points.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-3">
              {legend.map(({ color, label }) => {
                const count = statsByLabel[label] ?? 0;
                const pct = points.length ? Math.round(count / points.length * 100) : 0;
                return (
                  <div key={label} className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span>{label}</span>
                    <span className="font-semibold text-text">{count}</span>
                    <span className="text-text-muted/60">({pct}%)</span>
                  </div>
                );
              })}
              <span className="ml-auto text-xs text-text-muted">
                {points.length} villes · Survol = valeur · Source : Open-Meteo / GloFAS
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

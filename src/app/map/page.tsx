"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import Card from "@/components/Card";
import LoadingSpinner from "@/components/LoadingSpinner";
import MapView from "@/components/MapView";
import { Map as MapIcon } from "lucide-react";
import { useThresholds, RISK_COLORS, AQI_COLORS, TEMP_COLORS } from "@/lib/thresholds";

type MapLayer = "weather" | "air_quality" | "flood" | "drought";

export default function MapPage() {
  const [layer, setLayer] = useState<MapLayer>("weather");
  const thresholds = useThresholds();

  const weatherSummary = useApi(() => api.getWeatherSummary(), [], "map-weather");
  const aqMap = useApi(() => api.getAirQualityMap(), [], "map-aq");
  const floodMap = useApi(() => api.getFloodRiskMap(), [], "map-flood");
  const droughtMap = useApi(() => api.getDroughtMap(), [], "map-drought");

  const getPoints = () => {
    if (layer === "weather") {
      const wsData = weatherSummary.data?.data;
      return (Array.isArray(wsData) ? wsData : []).filter((d: any) => d?.location).map((d: any) => ({
        id: d.location.external_id,
        name: d.location.name,
        latitude: d.location.latitude,
        longitude: d.location.longitude,
        value: d.current?.temperature || 0,
        label: d.current ? `${d.current.temperature?.toFixed(1)}°C` : "N/A",
        risk: (d.current?.temperature || 0) >= thresholds.temperature.heat_extreme ? "extreme"
          : (d.current?.temperature || 0) >= thresholds.temperature.heat_warning ? "high"
          : (d.current?.temperature || 0) <= thresholds.temperature.cold_warning ? "low" : "moderate",
      }));
    }
    if (layer === "air_quality") {
      const aqData = aqMap.data?.data;
      return (Array.isArray(aqData) ? aqData : []).filter((d: any) => d?.location).map((d: any) => ({
        id: d.location.external_id,
        name: d.location.name,
        latitude: d.location.latitude,
        longitude: d.location.longitude,
        value: d.latest?.aqi || 0,
        label: d.latest ? `AQI: ${d.latest.aqi}` : "N/A",
        risk: (d.latest?.aqi || 0) > thresholds.air_quality.poor     ? "extreme"
          : (d.latest?.aqi || 0) > thresholds.air_quality.moderate ? "high"
          : (d.latest?.aqi || 0) > thresholds.air_quality.fair     ? "moderate" : "low",
      }));
    }
    if (layer === "flood") {
      const floodData = floodMap.data?.data;
      return (Array.isArray(floodData) ? floodData : []).filter((d: any) => d?.location).map((d: any) => ({
        id: d.location.external_id,
        name: d.location.name,
        latitude: d.location.latitude,
        longitude: d.location.longitude,
        value: d.latest_flood?.river_discharge || 0,
        label: d.latest_flood ? `${d.latest_flood.river_discharge?.toFixed(2)} m³/s` : "N/A",
        risk: d.latest_flood?.flood_risk_level || "low",
      }));
    }
    const droughtData = droughtMap.data?.data;
    return (Array.isArray(droughtData) ? droughtData : []).filter((d: any) => d?.location).map((d: any) => ({
      id: d.location.external_id,
      name: d.location.name,
      latitude: d.location.latitude,
      longitude: d.location.longitude,
      value: d.latest?.spi_value || 0,
      label: d.latest ? `SPI: ${d.latest.spi_value?.toFixed(1)}` : "N/A",
      risk: d.latest?.drought_level || "normal",
    }));
  };

  const layers: { key: MapLayer; label: string; color: string }[] = [
    { key: "weather", label: "Température", color: "bg-red-500" },
    { key: "air_quality", label: "Qualité de l'air", color: "bg-teal-500" },
    { key: "flood", label: "Inondations", color: "bg-blue-500" },
    { key: "drought", label: "Sécheresse", color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapIcon className="w-7 h-7 text-secondary" /> Carte Interactive
        </h1>
        <div className="flex gap-2">
          {layers.map((l) => (
            <button
              key={l.key}
              onClick={() => setLayer(l.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                layer === l.key ? "bg-sidebar text-white" : "bg-card border border-border text-text-secondary hover:bg-gray-50"
              }`}
            >
              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${l.color}`} />
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <MapView
          points={getPoints()}
          height="650px"
          colorFn={(p) => {
            if (layer === "weather") {
              if ((p.value || 0) >= thresholds.temperature.heat_extreme) return TEMP_COLORS.heat_extreme.hex;
              if ((p.value || 0) >= thresholds.temperature.heat_warning) return TEMP_COLORS.heat_warning.hex;
              if ((p.value || 0) <= thresholds.temperature.cold_warning) return TEMP_COLORS.cold_warning.hex;
              return TEMP_COLORS.normal.hex;
            }
            return RISK_COLORS[(p.risk as keyof typeof RISK_COLORS) ?? "unknown"]?.hex ?? RISK_COLORS.unknown.hex;
          }}
          radiusFn={() => 11}
        />
      </Card>
    </div>
  );
}

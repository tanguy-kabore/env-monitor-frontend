"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import Card from "@/components/Card";
import LoadingSpinner from "@/components/LoadingSpinner";
import MapView from "@/components/MapView";
import { Map as MapIcon } from "lucide-react";

type MapLayer = "weather" | "air_quality" | "flood" | "drought";

export default function MapPage() {
  const [layer, setLayer] = useState<MapLayer>("weather");

  const weatherSummary = useApi(() => api.getWeatherSummary(), []);
  const aqMap = useApi(() => api.getAirQualityMap(), []);
  const floodMap = useApi(() => api.getFloodRiskMap(), []);
  const droughtMap = useApi(() => api.getDroughtMap(), []);

  const getPoints = () => {
    if (layer === "weather") {
      return (weatherSummary.data?.data || []).map((d: any) => ({
        id: d.location.external_id,
        name: d.location.name,
        latitude: d.location.latitude,
        longitude: d.location.longitude,
        value: d.current?.temperature || 0,
        label: d.current ? `${d.current.temperature?.toFixed(1)}°C` : "N/A",
        risk: (d.current?.temperature || 0) > 40 ? "high" : "low",
      }));
    }
    if (layer === "air_quality") {
      return (aqMap.data?.data || []).map((d: any) => ({
        id: d.location.external_id,
        name: d.location.name,
        latitude: d.location.latitude,
        longitude: d.location.longitude,
        value: d.latest?.aqi || 0,
        label: d.latest ? `AQI: ${d.latest.aqi}` : "N/A",
        risk: (d.latest?.aqi || 0) > 60 ? "high" : (d.latest?.aqi || 0) > 40 ? "moderate" : "low",
      }));
    }
    if (layer === "flood") {
      return (floodMap.data?.data || []).map((d: any) => ({
        id: d.location.external_id,
        name: d.location.name,
        latitude: d.location.latitude,
        longitude: d.location.longitude,
        value: d.latest_flood?.river_discharge || 0,
        label: d.latest_flood ? `${d.latest_flood.river_discharge?.toFixed(2)} m³/s` : "N/A",
        risk: d.latest_flood?.flood_risk_level || "low",
      }));
    }
    return (droughtMap.data?.data || []).map((d: any) => ({
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
              if ((p.value || 0) > 42) return "#D63031";
              if ((p.value || 0) > 38) return "#E17055";
              if ((p.value || 0) > 32) return "#FDCB6E";
              return "#00B894";
            }
            if (p.risk === "extreme" || p.risk === "high") return "#D63031";
            if (p.risk === "moderate" || p.risk === "severe") return "#FDCB6E";
            return "#00B894";
          }}
          radiusFn={() => 11}
        />
      </Card>
    </div>
  );
}

"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import Card from "@/components/Card";
import LoadingSpinner from "@/components/LoadingSpinner";
import MapView from "@/components/MapView";
import { formatNumber, formatDateTime, getAqiLabel, getFloodRiskLabel } from "@/lib/utils";
import { RISK_COLORS } from "@/lib/thresholds";
import {
  Thermometer, Droplets, Wind, Waves, AlertTriangle, Activity,
  CloudSun, BarChart3, RefreshCw, Zap
} from "lucide-react";
import DataTimestamp from "@/components/DataTimestamp";

export default function DashboardPage() {
  const { data: dashboard, loading, error, refetch } = useApi(
    () => api.getDashboard(), [], "dashboard", { staleTime: 90 * 1000 }
  );
  const [initializing, setInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const handleInitialize = async () => {
    setInitializing(true);
    setInitError(null);
    try {
      await api.initialize();
      setTimeout(refetch, 5000);
    } catch (err: any) {
      setInitError(err.message);
    } finally {
      setInitializing(false);
    }
  };

  if (loading) return <LoadingSpinner message="Chargement du tableau de bord..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="w-12 h-12 text-warning mb-4" />
        <h2 className="text-lg font-semibold mb-2">Connexion au serveur impossible</h2>
        <p className="text-sm text-text-secondary mb-4">{error}</p>
        <button onClick={refetch} className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition">
          Réessayer
        </button>
      </div>
    );
  }

  const allCities = dashboard?.all_cities || dashboard?.top_cities || [];
  const cities = dashboard?.top_cities || [];
  const totalCities = dashboard?.total_cities ?? cities.length;
  const mapPoints = allCities.map((c: any) => ({
    id: c.location.external_id,
    name: c.location.name,
    latitude: c.location.latitude,
    longitude: c.location.longitude,
    value: c.weather?.temperature ?? undefined,
    label: [
      c.weather?.temperature != null ? `${formatNumber(c.weather.temperature)}°C` : null,
      c.flood?.flood_risk_level ? `Inond. : ${getFloodRiskLabel(c.flood.flood_risk_level).label}` : null,
    ].filter(Boolean).join(" • ") || "N/A",
    risk: c.flood?.flood_risk_level || "unknown",
  }));

  const hasData = allCities.some((c: any) => c.weather);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Tableau de bord</h1>
          <p className="text-sm text-text-secondary mt-1">
            Vue d&apos;ensemble de la surveillance environnementale du {dashboard?.app?.country}
          </p>
          <DataTimestamp
            timestamp={dashboard?.latest_collection?.created_at}
            label="Dernière collecte le"
            className="mt-1"
          />
        </div>
        <div className="flex flex-col items-end gap-1">
          {initError && <p className="text-xs text-danger">{initError}</p>}
          <div className="flex gap-2">
          {!hasData && (
            <button
              onClick={handleInitialize}
              disabled={initializing}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-amber-600 transition disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {initializing ? "Initialisation..." : "Initialiser le système"}
            </button>
          )}
          <button onClick={refetch} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition">
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<CloudSun className="w-5 h-5" />}
          label="Villes surveillées"
          value={String(totalCities)}
          color="bg-blue-50 text-secondary"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Alertes actives"
          value={String(dashboard?.active_alerts_count || 0)}
          color="bg-red-50 text-danger"
        />
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label="Dernière collecte"
          value={dashboard?.latest_collection ? formatDateTime(dashboard.latest_collection.created_at) : "Aucune"}
          color="bg-green-50 text-primary"
          small
        />
        <StatCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Statut système"
          value={hasData ? "Opérationnel" : "En attente"}
          color={hasData ? "bg-emerald-50 text-success" : "bg-amber-50 text-accent"}
        />
      </div>

      {/* Map */}
      <Card title="Carte du risque inondation" icon={<Waves className="w-5 h-5" />}>
        <MapView
          points={mapPoints}
          height="420px"
          colorFn={(p) => RISK_COLORS[(p.risk as keyof typeof RISK_COLORS) ?? "unknown"]?.hex ?? RISK_COLORS.unknown.hex}
          radiusFn={() => 10}
        />
        {/* Légende carte */}
        <div className="flex items-center gap-3 mt-3 text-xs text-text-secondary flex-wrap">
          <span className="font-medium text-text-muted">Risque inondation :</span>
          {(["low","moderate","high","extreme"] as const).map(lvl => {
            const r = getFloodRiskLabel(lvl);
            return (
              <span key={lvl} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: RISK_COLORS[lvl]?.hex }} />
                <span className={r.color}>{r.label}</span>
              </span>
            );
          })}
          <span className="flex items-center gap-1 ml-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: RISK_COLORS.unknown.hex }} />
            <span className="text-text-muted">Données manquantes</span>
          </span>
        </div>
      </Card>

      {/* City details */}
      <div className="flex items-center justify-between mb-2 mt-6">
        <h2 className="text-base font-semibold text-text">
          Toutes les villes surveillées <span className="text-text-muted font-normal text-sm">({cities.length})</span>
        </h2>
        {/* Légende */}
        <div className="flex items-center gap-3 text-xs text-text-secondary flex-wrap justify-end">
          <span className="font-medium text-text-muted mr-1">Risque inondation :</span>
          {(["low","moderate","high","extreme"] as const).map(lvl => {
            const r = getFloodRiskLabel(lvl);
            return (
              <span key={lvl} className={`px-2 py-0.5 rounded-full font-medium ${r.bg} ${r.color}`}>{r.label}</span>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {cities.map((c: any) => (
          <Card key={c.location.id} className="hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-text">{c.location.name}</h4>
                <p className="text-xs text-text-muted">{c.location.population?.toLocaleString()} hab.</p>
              </div>
              {c.flood && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getFloodRiskLabel(c.flood.flood_risk_level).bg} ${getFloodRiskLabel(c.flood.flood_risk_level).color}`}>
                  {getFloodRiskLabel(c.flood.flood_risk_level).label}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat icon={<Thermometer className="w-3.5 h-3.5 text-red-500" />} label="Temp."
                value={c.weather?.temperature != null ? `${formatNumber(c.weather.temperature)}°C` : "—"} />
              <MiniStat icon={<Droplets className="w-3.5 h-3.5 text-blue-500" />} label="Humidité"
                value={c.weather?.humidity != null ? `${Math.round(c.weather.humidity)}%` : "—"} />
              <MiniStat icon={<Wind className="w-3.5 h-3.5 text-teal-500" />} label="AQI"
                value={c.air_quality?.aqi != null ? String(c.air_quality.aqi) : "—"} />
              <MiniStat icon={<Waves className="w-3.5 h-3.5 text-indigo-500" />} label="Débit"
                value={c.flood?.river_discharge != null ? `${formatNumber(c.flood.river_discharge, 2)} m³/s` : "—"} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, small }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 animate-fade-in">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className={`font-bold text-text ${small ? "text-xs" : "text-lg"}`}>{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-[10px] text-text-muted">{label}</p>
        <p className="text-xs font-semibold">{value}</p>
      </div>
    </div>
  );
}

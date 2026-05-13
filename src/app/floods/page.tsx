"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import Card from "@/components/Card";
import LoadingSpinner from "@/components/LoadingSpinner";
import LocationSelect from "@/components/LocationSelect";
import MapView from "@/components/MapView";
import { formatNumber, formatDate, getFloodRiskLabel } from "@/lib/utils";
import { Waves, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ReferenceLine } from "recharts";

const CITY_RIVERS: Record<string, string> = {
  ouagadougou: "Massili / Nakambé (Volta Blanche)",
  bobo_dioulasso: "Houet (affluent du Mouhoun)",
  banfora: "Comoé",
  dedougou: "Mouhoun (Volta Noire)",
  nouna: "Mouhoun (Volta Noire)",
  boromo: "Mouhoun (Volta Noire)",
  tougan: "Sourou",
  tenkodogo: "Nakambé (Volta Blanche)",
  koupela: "Nakambé (Volta Blanche)",
  fada_ngourma: "Sirba / Tapoa",
  diapaga: "Tapoa",
  pama: "Kompienga",
  po: "Nakambé (Volta Blanche)",
  manga: "Sissili",
  leo: "Sissili",
  diebougou: "Bougouriba",
  gaoua: "Bougouriba / Poni",
  batie: "Bougouriba",
  dori: "Béli / Gorouol",
  gorom_gorom: "Béli",
  djibo: "Sourou / Yatenga",
  sebba: "Sirba",
  kaya: "Nakambé (Volta Blanche)",
  ouahigouya: "Nakambé (amont)",
  kongoussi: "Lac Bam",
  boulsa: "Nakambé",
  zorgho: "Nakambé",
  kombissiri: "Nazinon (Volta Rouge)",
  hounde: "Mouhoun",
  orodara: "Kenékégou",
  reo: "Mouhoun",
  koudougou: "Mouhoun / Nakambé",
  ziniare: "Nakambé",
  bousse: "Nakambé",
  yako: "Nakambé (amont)",
  gourcy: "Nakambé (amont)",
  titao: "Nakambé (amont)",
  solenzo: "Mouhoun",
  toma: "Mouhoun",
  sindou: "Léraba",
  bogande: "Gorouol",
  gayeri: "Sirba",
  dano: "Bougouriba",
  sapouy: "Sissili",
  ouargaye: "Nakambé",
};

export default function FloodsPage() {
  const [locationId, setLocationId] = useState("ouagadougou");
  const [locationName, setLocationName] = useState("Ouagadougou");

  const riverName = CITY_RIVERS[locationId] || "cours d'eau local (GloFAS)";

  const forecast = useApi(() => api.getFloodForecast(locationId), [locationId]);
  const history = useApi(() => api.getFloodHistory(locationId, 90), [locationId]);
  const riskMap = useApi(() => api.getFloodRiskMap(), []);

  const forecastDaily = forecast.data?.data?.daily;
  const forecastChart = forecastDaily?.time?.map((t: string, i: number) => ({
    date: formatDate(t),
    "Débit (m³/s)": forecastDaily.river_discharge?.[i],
  })) || [];

  const historyChart = history.data?.data?.map((d: any) => ({
    date: formatDate(d.observed_at),
    "Débit (m³/s)": d.river_discharge,
    risk: d.flood_risk_level,
  })) || [];

  const mapPoints = (riskMap.data?.data || []).map((d: any) => ({
    id: d.location.external_id,
    name: d.location.name,
    latitude: d.location.latitude,
    longitude: d.location.longitude,
    value: d.latest_flood?.river_discharge || 0,
    label: d.latest_flood ? `${formatNumber(d.latest_flood.river_discharge, 2)} m³/s` : "N/A",
    risk: d.latest_flood?.flood_risk_level || "low",
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Waves className="w-7 h-7 text-secondary" /> Suivi des Inondations
          </h1>
          <p className="text-sm text-text-secondary mt-1">Débit fluvial et risques d&apos;inondation — {locationName}</p>
          <p className="text-xs text-text-muted mt-0.5">Fleuve surveillé : <span className="font-medium text-secondary">{riverName}</span> · Source : GloFAS / Open-Meteo</p>
        </div>
        <LocationSelect value={locationId} onChange={(id, loc) => { setLocationId(id); setLocationName(loc.name); }} className="w-64" />
      </div>

      {/* Risk Map */}
      <Card title="Carte des risques d'inondation" icon={<Waves className="w-5 h-5" />}>
        <MapView
          points={mapPoints}
          height="400px"
          colorFn={(p) => {
            if (p.risk === "extreme") return "#D63031";
            if (p.risk === "high") return "#E17055";
            if (p.risk === "moderate") return "#FDCB6E";
            return "#00B894";
          }}
          radiusFn={(p) => Math.max(6, Math.min(18, (p.value || 0) / 10 + 6))}
        />
        <div className="flex gap-4 mt-3 justify-center">
          {["low", "moderate", "high", "extreme"].map((r) => {
            const { label, bg, color } = getFloodRiskLabel(r);
            return <span key={r} className={`text-xs px-2 py-1 rounded-full ${bg} ${color}`}>{label}</span>;
          })}
        </div>
      </Card>

      {forecast.loading ? <LoadingSpinner /> : (
        <>
          {forecastChart.length > 0 && (
            <Card title={`Prévisions de débit — ${riverName} (92 jours)`} icon={<TrendingUp className="w-5 h-5" />}>
              <p className="text-xs text-text-muted mb-3">📅 Données <span className="font-semibold text-secondary">futures</span> — d&apos;aujourd&apos;hui jusqu&apos;à J+92 · Source : GloFAS / Open-Meteo</p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={forecastChart}>
                  <defs>
                    <linearGradient id="floodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B6FA8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1B6FA8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={10} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <ReferenceLine y={50} stroke="#FDCB6E" strokeDasharray="5 5" label="Risque modéré" />
                  <ReferenceLine y={100} stroke="#D63031" strokeDasharray="5 5" label="Risque élevé" />
                  <Area type="monotone" dataKey="Débit (m³/s)" stroke="#1B6FA8" fill="url(#floodGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}

      {!history.loading && historyChart.length > 0 && (
        <Card title={`Historique du débit — ${riverName}`} icon={<Waves className="w-5 h-5" />}>
          <p className="text-xs text-text-muted mb-3">📅 Données <span className="font-semibold text-orange-600">passées</span> — 90 derniers jours · Source : {
            history.data?.source === "database" ? "Base de données" :
            history.data?.source === "merged" ? "Base de données + GloFAS / Open-Meteo" :
            "GloFAS / Open-Meteo"
          }</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={7} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Débit (m³/s)" stroke="#1B6FA8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import Card from "@/components/Card";
import LoadingSpinner from "@/components/LoadingSpinner";
import LocationSelect from "@/components/LocationSelect";
import MapView from "@/components/MapView";
import { formatNumber, formatDate, getFloodRiskLabel } from "@/lib/utils";
import DataTimestamp from "@/components/DataTimestamp";
import { useThresholds, classifyFloodRisk, RISK_COLORS, FLOOD_CHART_COLORS } from "@/lib/thresholds";
import { Waves, TrendingUp, BarChart2, AlertTriangle, Droplets, Activity, Info, Sparkles } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area, ReferenceLine, ComposedChart, Bar, Cell,
  ReferenceArea,
} from "recharts";

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


function riskColor(risk?: string) {
  return RISK_COLORS[(risk as keyof typeof RISK_COLORS) ?? "low"]?.hex ?? RISK_COLORS.low.hex;
}

function KpiCard({ label, value, sub, icon, accent }: { label: string; value: any; sub?: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 flex items-start gap-3`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>{icon}</div>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-xl font-bold text-text leading-tight">{value ?? "—"}</p>
        {sub && <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const CustomHistTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const { label: rLabel, color } = getFloodRiskLabel(d?.risk || "low");
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-text mb-1">{label}</p>
      <p className="text-text-muted">Débit : <span className="font-bold text-text">{formatNumber(payload[0]?.value, 2)} m³/s</span></p>
      <p className="mt-1">Risque : <span className="font-bold" style={{ color }}>{rLabel}</span></p>
    </div>
  );
};

const CustomFcastTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-text mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name} : <span className="font-bold text-text">{formatNumber(p.value, 2)} m³/s</span></p>
      ))}
    </div>
  );
};

export default function FloodsPage() {
  const [locationId, setLocationId] = useState("ouagadougou");
  const [locationName, setLocationName] = useState("Ouagadougou");
  const [histDays, setHistDays] = useState(90);
  const thresholds = useThresholds();
  const RISK_THRESHOLDS = thresholds.flood;

  const riverName = CITY_RIVERS[locationId] || "cours d'eau local (GloFAS)";

  const forecast    = useApi(() => api.getFloodForecast(locationId), [locationId], "flood-forecast", { staleTime: 25 * 60 * 1000 });
  const history     = useApi(() => api.getFloodHistory(locationId, histDays), [locationId, histDays], "flood-history", { staleTime: 8 * 60 * 1000 });
  const predictions = useApi(() => api.getFloodPredictions(locationId), [locationId], "flood-predictions", { staleTime: 8 * 60 * 1000 });
  const riskMap     = useApi(() => api.getFloodRiskMap(), [], "flood-map", { staleTime: 8 * 60 * 1000 });

  // ── Forecast chart ──
  const forecastDaily = forecast.data?.data?.daily;
  const forecastChart = (forecastDaily?.time || []).map((t: string, i: number) => ({
    date: formatDate(t),
    "Débit prévu (m³/s)": forecastDaily.river_discharge?.[i] ?? null,
  }));

  // ── History chart ──
  const histRaw: any[] = history.data?.data || [];
  const historyChart = histRaw.map((d: any) => ({
    date: new Date(d.observed_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    "Débit (m³/s)": d.river_discharge,
    risk: d.flood_risk_level,
  }));

  // ── KPIs from history ──
  const validHist = historyChart.filter((d: any) => d["Débit (m³/s)"] != null);
  const avgDischarge = validHist.length
    ? validHist.reduce((s: number, d: any) => s + d["Débit (m³/s)"], 0) / validHist.length
    : null;
  const maxDischarge = validHist.length
    ? Math.max(...validHist.map((d: any) => d["Débit (m³/s)"]))
    : null;
  const daysAtRisk = validHist.filter((d: any) => d.risk === "high" || d.risk === "extreme").length;
  const lastPastHist = history.loading ? undefined : histRaw.filter((d: any) => new Date(d.observed_at) <= new Date()).at(-1);
  const currentRisk = history.loading ? null : (lastPastHist?.flood_risk_level ?? null);
  const currentDischarge = history.loading ? undefined : lastPastHist?.river_discharge;

  // ── Risk distribution ──
  const riskCounts: Record<string, number> = { low: 0, moderate: 0, high: 0, extreme: 0 };
  validHist.forEach((d: any) => { if (d.risk) riskCounts[d.risk] = (riskCounts[d.risk] || 0) + 1; });
  const riskDistChart = Object.entries(riskCounts).map(([risk, count]) => ({
    name: getFloodRiskLabel(risk).label,
    count,
    risk,
  }));

  // ── ML Predictions chart ──
  const predRaw: any[] = Array.isArray(predictions.data?.data) ? predictions.data?.data : [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  // Deduplicate by day
  const predByDay = new Map<string, any>();
  for (const d of predRaw) {
    const day = String(d.target_date).slice(0, 10);
    if (!predByDay.has(day)) predByDay.set(day, d);
  }
  const predChart = Array.from(predByDay.values()).map((d: any) => {
    const dt = new Date(String(d.target_date).slice(0, 10));
    const isFuture = dt >= today;
    return {
      date: dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      "Passé prédit (m³/s)": !isFuture ? (d.river_discharge != null ? +Number(d.river_discharge).toFixed(2) : null) : null,
      "Futur prédit (m³/s)": isFuture  ? (d.river_discharge != null ? +Number(d.river_discharge).toFixed(2) : null) : null,
      "Probabilité inondation (%)": d.flood_probability != null ? +(d.flood_probability * 100).toFixed(1) : null,
      isFuture,
    };
  });

  // ── Combined past (7j) + future (14j) bar chart ──
  const combinedChart = (() => {
    // Past: deduplicate by day, take last 7 unique days
    const byDay = new Map<string, any>();
    for (const d of histRaw) {
      const day = new Date(d.observed_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      byDay.set(day, d);
    }
    const past = Array.from(byDay.entries()).slice(-7).map(([day, d]) => ({
      date: day,
      "Passé (m³/s)": d.river_discharge != null ? +Number(d.river_discharge).toFixed(2) : null,
      "Prévision (m³/s)": null as number | null,
      type: "past" as const,
      risk: d.flood_risk_level,
    }));
    // Future: first 14 days of GloFAS forecast
    const futureDates = (forecastDaily?.time || []).slice(0, 14);
    const futureVals  = (forecastDaily?.river_discharge || []).slice(0, 14);
    const future = futureDates.map((t: string, i: number) => ({
      date: new Date(t).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      "Passé (m³/s)": null as number | null,
      "Prévision (m³/s)": futureVals[i] != null ? +Number(futureVals[i]).toFixed(2) : null,
      type: "future" as const,
      risk: null,
    }));
    return [...past, ...future];
  })();

  // ── Map ──
  const riskMapData = riskMap.data?.data;
  const mapPoints = (Array.isArray(riskMapData) ? riskMapData : [])
    .filter((d: any) => d?.location)
    .map((d: any) => ({
      id: d.location.external_id,
      name: d.location.name,
      latitude: d.location.latitude,
      longitude: d.location.longitude,
      value: d.latest_flood?.river_discharge || 0,
      label: d.latest_flood ? `${formatNumber(d.latest_flood.river_discharge, 2)} m³/s` : "N/A",
      risk: d.latest_flood?.flood_risk_level || "low",
    }));

  const { label: riskLabel, bg: riskBg, color: riskColor2 } = getFloodRiskLabel(currentRisk ?? "low");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Waves className="w-7 h-7 text-secondary" /> Suivi des Inondations
          </h1>
          <p className="text-sm text-text-secondary mt-1">Débit fluvial et risques d&apos;inondation — {locationName}</p>
          <p className="text-xs text-text-muted mt-0.5">
            Fleuve surveillé : <span className="font-medium text-secondary">{riverName}</span> · Source : GloFAS / Open-Meteo
          </p>
          <DataTimestamp
            timestamp={histRaw.filter((d: any) => new Date(d.observed_at) <= new Date()).at(-1)?.observed_at}
            label="Dernier relevé le"
            className="mt-1"
          />
        </div>
        <LocationSelect value={locationId} onChange={(id, loc) => { setLocationId(id); setLocationName(loc.name); }} className="w-64" />
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Risque actuel"
          value={currentRisk ? <span className={riskColor2}>{riskLabel}</span> : "—"}
          sub={currentDischarge != null ? `${formatNumber(currentDischarge, 1)} m³/s` : undefined}
          icon={<AlertTriangle className="w-4 h-4 text-white" />}
          accent={currentRisk ? riskBg : "bg-gray-400/10"}
        />
        <KpiCard
          label="Débit moyen"
          value={avgDischarge != null ? `${formatNumber(avgDischarge, 1)} m³/s` : "—"}
          sub={`sur ${histDays} jours`}
          icon={<Droplets className="w-4 h-4 text-blue-500" />}
          accent="bg-blue-500/10"
        />
        <KpiCard
          label="Débit max"
          value={maxDischarge != null ? `${formatNumber(maxDischarge, 1)} m³/s` : "—"}
          sub="pic enregistré"
          icon={<Activity className="w-4 h-4 text-orange-500" />}
          accent="bg-orange-500/10"
        />
        <KpiCard
          label="Jours à risque élevé"
          value={daysAtRisk}
          sub="high + extrême"
          icon={<Waves className="w-4 h-4 text-red-500" />}
          accent="bg-red-500/10"
        />
      </div>

      {/* ── ML Predictions (Featured) ── */}
      {predChart.length > 0 && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Prédictions Intelligence Artificielle</span>
              <span className="text-xs font-normal text-text-muted ml-2">
                ({predChart.filter((d: any) => !d.isFuture).length}j passés · {predChart.filter((d: any) => d.isFuture).length}j futurs)
              </span>
              <DataTimestamp
                timestamp={predRaw[0]?.predicted_at}
                label="Générées le"
                className="ml-auto"
              />
            </div>
          }
          icon={<Activity className="w-4 h-4" />}
          className="border-primary/20 shadow-lg shadow-primary/5"
        >
          {/* Enhanced Legend */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 p-3 bg-bg rounded-lg border border-border/50">
            <span className="font-medium text-sm text-text">Modèle <span className="text-primary font-bold">Gradient Boosting</span></span>
            <span className="w-px h-4 bg-border" />
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted font-medium">Seuils :</span>
              {[
                { color: RISK_COLORS.low.hex, label: `Faible` },
                { color: RISK_COLORS.moderate.hex, label: `Modéré` },
                { color: RISK_COLORS.high.hex, label: `Élevé` },
                { color: RISK_COLORS.extreme.hex, label: `Extrême` },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-text-muted">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </span>
              ))}
            </div>
            <span className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <span className="w-4 border-t-2 border-dashed border-primary" />
                Passé
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 border-t-2 border-primary" />
                Futur
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={predChart} margin={{ top: 10, right: 48, left: 0, bottom: 0 }}>
              {/* Colored risk zone backgrounds */}
              <ReferenceArea yAxisId="q" y1={0}                          y2={RISK_THRESHOLDS.moderate} fill={RISK_COLORS.low.hex}      fillOpacity={0.06} />
              <ReferenceArea yAxisId="q" y1={RISK_THRESHOLDS.moderate}   y2={RISK_THRESHOLDS.high}    fill={RISK_COLORS.moderate.hex} fillOpacity={0.08} />
              <ReferenceArea yAxisId="q" y1={RISK_THRESHOLDS.high}       y2={RISK_THRESHOLDS.extreme} fill={RISK_COLORS.high.hex}     fillOpacity={0.08} />
              <ReferenceArea yAxisId="q" y1={RISK_THRESHOLDS.extreme}    y2={9999}                    fill={RISK_COLORS.extreme.hex}  fillOpacity={0.08} />

              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                interval={Math.max(0, Math.floor(predChart.length / 8) - 1)} axisLine={false} tickLine={false} />
              <YAxis yAxisId="q" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                axisLine={false} tickLine={false} width={48} unit=" m³/s" />
              <YAxis yAxisId="p" orientation="right" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                axisLine={false} tickLine={false} width={40} unit="%" domain={[0, 100]} />

              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null;
                  const pt = payload[0]?.payload;
                  const q = pt["Passé prédit (m³/s)"] ?? pt["Futur prédit (m³/s)"];
                  const prob = pt["Probabilité inondation (%)"];
                  const discharge = q ?? 0;
                  const risk = discharge >= RISK_THRESHOLDS.extreme ? "extreme"
                    : discharge >= RISK_THRESHOLDS.high     ? "high"
                    : discharge >= RISK_THRESHOLDS.moderate ? "moderate" : "low";
                  const { label: rl, color: rc } = getFloodRiskLabel(risk);
                  return (
                    <div className="bg-card border border-border rounded-lg shadow-xl p-3 text-xs min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{pt.isFuture ? "🔮" : "📊"}</span>
                        <p className="font-semibold text-text">{label}</p>
                      </div>
                      <p className="text-text-muted text-[10px] uppercase tracking-wide">{pt.isFuture ? "Prédiction future" : "Rétro-prédiction"}</p>
                      <p className="font-bold text-xl text-text mt-1">{formatNumber(q, 2)} <span className="text-sm font-normal text-text-muted">m³/s</span></p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-text-muted">Risque:</span>
                        <span className="font-bold px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: rc + "20", color: rc }}>{rl}</span>
                      </div>
                      {prob != null && (
                        <div className="mt-3 pt-2 border-t border-border">
                          <p className="text-text-muted text-[10px]">Probabilité inondation</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-border rounded-full h-2">
                              <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(prob,100)}%`, backgroundColor: prob > 50 ? RISK_COLORS.extreme.hex : RISK_COLORS.moderate.hex }} />
                            </div>
                            <span className="font-bold text-text">{prob}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }}
              />

              {/* Today separator */}
              {predChart.find((d: any) => d.isFuture) && (
                <ReferenceLine yAxisId="q"
                  x={predChart.find((d: any) => d.isFuture)?.date}
                  stroke={FLOOD_CHART_COLORS.neutral} strokeWidth={2} strokeDasharray="6 3"
                  label={{ value: "▶ Aujourd'hui", fill: FLOOD_CHART_COLORS.neutral, fontSize: 10, position: "insideTopLeft", dy: -4 }}
                />
              )}

              {/* Risk threshold lines */}
              <ReferenceLine yAxisId="q" y={RISK_THRESHOLDS.moderate} stroke={RISK_COLORS.moderate.hex} strokeDasharray="4 2" strokeOpacity={0.8}
                label={{ value: "Modéré", fill: RISK_COLORS.moderate.hex, fontSize: 10, position: "insideRight", dx: -4 }} />
              <ReferenceLine yAxisId="q" y={RISK_THRESHOLDS.high}     stroke={RISK_COLORS.high.hex}     strokeDasharray="4 2" strokeOpacity={0.8}
                label={{ value: "Élevé",  fill: RISK_COLORS.high.hex,     fontSize: 10, position: "insideRight", dx: -4 }} />
              <ReferenceLine yAxisId="q" y={RISK_THRESHOLDS.extreme}  stroke={RISK_COLORS.extreme.hex}  strokeDasharray="4 2" strokeOpacity={0.8}
                label={{ value: "Extrême", fill: RISK_COLORS.extreme.hex,  fontSize: 10, position: "insideRight", dx: -4 }} />

              {/* Probability alert threshold */}
              <ReferenceLine yAxisId="p" y={50} stroke={RISK_COLORS.extreme.hex} strokeDasharray="3 3" strokeOpacity={0.4} />

              {/* Bars colored by risk */}
              <Bar yAxisId="q" dataKey="Passé prédit (m³/s)" radius={[4,4,0,0]} maxBarSize={40} strokeDasharray="4 2" strokeWidth={1}>
                {predChart.map((entry: any, idx: number) => {
                  const q = entry["Passé prédit (m³/s)"] ?? 0;
                  const color = riskColor(q >= RISK_THRESHOLDS.extreme ? "extreme" : q >= RISK_THRESHOLDS.high ? "high" : q >= RISK_THRESHOLDS.moderate ? "moderate" : "low");
                  return <Cell key={`past-${idx}`} fill={color} fillOpacity={0.9} stroke={color} />;
                })}
              </Bar>
              <Bar yAxisId="q" dataKey="Futur prédit (m³/s)" radius={[4,4,0,0]} maxBarSize={40} strokeWidth={1.5}>
                {predChart.map((entry: any, idx: number) => {
                  const q = entry["Futur prédit (m³/s)"] ?? 0;
                  const color = riskColor(q >= RISK_THRESHOLDS.extreme ? "extreme" : q >= RISK_THRESHOLDS.high ? "high" : q >= RISK_THRESHOLDS.moderate ? "moderate" : "low");
                  return <Cell key={`fut-${idx}`} fill={color} fillOpacity={0.6} stroke={color} />
                })}
              </Bar>

              {/* Probability line */}
              <Line yAxisId="p" type="monotone" dataKey="Probabilité inondation (%)"
                stroke={RISK_COLORS.extreme.hex} strokeWidth={2.5} strokeDasharray="5 3" dot={false} activeDot={{ r: 5, fill: RISK_COLORS.extreme.hex, strokeWidth: 2, stroke: "#fff" }} />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-between mt-3 text-[11px] text-text-muted px-2">
            <span>Barres opaques = données passées · Barres translucides = prédictions futures</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Ligne = Probabilité d&apos;inondation (%)
            </span>
          </div>
        </Card>
      )}

      {/* ── Carte ── */}
      <Card title="Carte nationale des risques d'inondation" icon={<Waves className="w-5 h-5" />}>
        <MapView
          points={mapPoints}
          height="400px"
          colorFn={(p) => RISK_COLORS[(p.risk as keyof typeof RISK_COLORS) ?? "unknown"]?.hex ?? RISK_COLORS.unknown.hex}
          radiusFn={(p) => Math.max(6, Math.min(20, (p.value || 0) / 10 + 6))}
        />
        <div className="flex gap-3 mt-3 justify-center flex-wrap">
          {["low", "moderate", "high", "extreme"].map((r) => {
            const { label, bg, color } = getFloodRiskLabel(r);
            return <span key={r} className={`text-xs px-3 py-1 rounded-full font-medium ${bg} ${color}`}>{label}</span>;
          })}
        </div>
      </Card>

      {/* ── Historique + Distribution ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* History chart — 2/3 width */}
        <Card
          className="xl:col-span-2"
          title={`Historique du débit — ${riverName}`}
          icon={<Waves className="w-4 h-4" />}
          headerAction={
            <div className="flex gap-1">
              {[30, 60, 90].map(d => (
                <button key={d} onClick={() => setHistDays(d)}
                  className={`px-2 py-0.5 text-xs rounded-full border transition ${histDays === d ? "bg-primary text-white border-primary" : "border-border text-text-muted hover:border-primary"}`}>
                  {d}j
                </button>
              ))}
            </div>
          }
        >
          {history.loading ? (
            <div className="h-52 flex items-center justify-center text-sm text-text-muted">Chargement…</div>
          ) : historyChart.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-text-muted">Aucune donnée historique</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={historyChart} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="histFloodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={FLOOD_CHART_COLORS.historic} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={FLOOD_CHART_COLORS.historic} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {/* Risk zones background */}
                  <ReferenceArea y1={0}                            y2={RISK_THRESHOLDS.moderate} fill={RISK_COLORS.low.hex}      fillOpacity={0.04} />
                  <ReferenceArea y1={RISK_THRESHOLDS.moderate}    y2={RISK_THRESHOLDS.high}     fill={RISK_COLORS.moderate.hex} fillOpacity={0.08} />
                  <ReferenceArea y1={RISK_THRESHOLDS.high}        y2={RISK_THRESHOLDS.extreme}  fill={RISK_COLORS.high.hex}     fillOpacity={0.08} />
                  <ReferenceArea y1={RISK_THRESHOLDS.extreme}     y2={9999}                     fill={RISK_COLORS.extreme.hex}  fillOpacity={0.08} />
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                    interval={Math.max(0, Math.floor(historyChart.length / 8) - 1)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                    axisLine={false} tickLine={false} width={40} unit=" m³/s" />
                  <Tooltip content={<CustomHistTooltip />} />
                  <ReferenceLine y={RISK_THRESHOLDS.moderate} stroke={RISK_COLORS.moderate.hex} strokeDasharray="4 2" strokeOpacity={0.8}
                    label={{ value: "Modéré", fill: RISK_COLORS.moderate.hex, fontSize: 9, position: "insideRight", dx: -4 }} />
                  <ReferenceLine y={RISK_THRESHOLDS.high} stroke={RISK_COLORS.high.hex} strokeDasharray="4 2" strokeOpacity={0.8}
                    label={{ value: "Élevé", fill: RISK_COLORS.high.hex, fontSize: 9, position: "insideRight", dx: -4 }} />
                  <ReferenceLine y={RISK_THRESHOLDS.extreme} stroke={RISK_COLORS.extreme.hex} strokeDasharray="4 2" strokeOpacity={0.8}
                    label={{ value: "Extrême", fill: RISK_COLORS.extreme.hex, fontSize: 9, position: "insideRight", dx: -4 }} />
                  <Area type="monotoneX" dataKey="Débit (m³/s)" stroke={FLOOD_CHART_COLORS.historic} fill="url(#histFloodGrad)"
                    strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-text-muted text-right mt-1 pr-2">
                {historyChart.length} enregistrements · Source : {history.data?.source === "database" ? "BD locale" : "GloFAS / Open-Meteo"}
              </p>
            </>
          )}
        </Card>

        {/* Risk distribution — 1/3 width */}
        <Card title="Répartition des risques" icon={<BarChart2 className="w-4 h-4" />}>
          {history.loading ? (
            <div className="h-52 flex items-center justify-center text-sm text-text-muted">Chargement…</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={riskDistChart} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} width={62} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: any) => [`${v} jours`, "Jours"]} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {riskDistChart.map((entry) => (
                      <Cell key={entry.risk} fill={riskColor(entry.risk)} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {riskDistChart.map(({ name, count, risk }) => {
                  const pct = validHist.length ? Math.round(count / validHist.length * 100) : 0;
                  return (
                    <div key={risk} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: riskColor(risk) }} />
                        <span className="text-text-muted">{name}</span>
                      </span>
                      <span className="font-semibold text-text">{count}j <span className="text-text-muted font-normal">({pct}%)</span></span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── GloFAS Forecast 92j ── */}
      {forecast.loading ? <LoadingSpinner /> : forecastChart.length > 0 && (
        <Card title={`Prévisions GloFAS — ${riverName} (92 jours)`} icon={<TrendingUp className="w-4 h-4" />}>
          <p className="text-xs text-text-muted mb-3">
            Prévisions <span className="font-semibold text-secondary">hydrologiques</span> d&apos;aujourd&apos;hui à J+92 · Modèle GloFAS (Global Flood Awareness System)
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={forecastChart} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fcastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={FLOOD_CHART_COLORS.forecast} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={FLOOD_CHART_COLORS.forecast} stopOpacity={0} />
                </linearGradient>
              </defs>
              <ReferenceArea y1={0}                         y2={RISK_THRESHOLDS.moderate} fill={RISK_COLORS.low.hex}      fillOpacity={0.04} />
              <ReferenceArea y1={RISK_THRESHOLDS.moderate}  y2={RISK_THRESHOLDS.high}    fill={RISK_COLORS.moderate.hex} fillOpacity={0.08} />
              <ReferenceArea y1={RISK_THRESHOLDS.high}      y2={RISK_THRESHOLDS.extreme} fill={RISK_COLORS.high.hex}     fillOpacity={0.08} />
              <ReferenceArea y1={RISK_THRESHOLDS.extreme}   y2={9999}                    fill={RISK_COLORS.extreme.hex}  fillOpacity={0.08} />
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                interval={Math.max(0, Math.floor(forecastChart.length / 10) - 1)} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                axisLine={false} tickLine={false} width={40} unit=" m³/s" />
              <Tooltip content={<CustomFcastTooltip />} />
              <ReferenceLine y={RISK_THRESHOLDS.moderate} stroke={RISK_COLORS.moderate.hex} strokeDasharray="4 2"
                label={{ value: `Modéré (${RISK_THRESHOLDS.moderate})`, fill: RISK_COLORS.moderate.hex, fontSize: 9, position: "insideRight", dx: -4 }} />
              <ReferenceLine y={RISK_THRESHOLDS.high} stroke={RISK_COLORS.high.hex} strokeDasharray="4 2"
                label={{ value: `Élevé (${RISK_THRESHOLDS.high})`, fill: RISK_COLORS.high.hex, fontSize: 9, position: "insideRight", dx: -4 }} />
              <ReferenceLine y={RISK_THRESHOLDS.extreme} stroke={RISK_COLORS.extreme.hex} strokeDasharray="4 2"
                label={{ value: `Extrême (${RISK_THRESHOLDS.extreme})`, fill: RISK_COLORS.extreme.hex, fontSize: 9, position: "insideRight", dx: -4 }} />
              <Area type="monotone" dataKey="Débit prévu (m³/s)" stroke={FLOOD_CHART_COLORS.forecast} fill="url(#fcastGrad)"
                strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── Combined past + future bar chart ── */}
      {combinedChart.length > 0 && (
        <Card title="Débit : 7 jours passés + 14 jours de prévision" icon={<BarChart2 className="w-4 h-4" />}>
          <p className="text-xs text-text-muted mb-3">
            <span className="inline-flex items-center gap-1 mr-3">
              <span className="w-3 h-3 rounded-sm inline-block bg-[#1B6FA8] opacity-80" /> Mesuré (passé)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-3 h-3 rounded-sm inline-block bg-[#0EA5E9] opacity-50" /> Prévu (GloFAS)
            </span>
            <span className="ml-3 text-[10px] text-text-muted">Ligne pointillée = seuils de risque</span>
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={combinedChart} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} width={44} unit=" m³/s" />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null;
                  const pt = payload[0]?.payload;
                  const val = pt["Passé (m³/s)"] ?? pt["Prévision (m³/s)"];
                  const isPast = pt.type === "past";
                  const { label: rl, color: rc } = pt.risk ? getFloodRiskLabel(pt.risk) : { label: "", color: "" };
                  return (
                    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs min-w-[150px]">
                      <p className="font-semibold text-text mb-1">{label}</p>
                      <p className={isPast ? "text-blue-600" : "text-sky-500"}>
                        {isPast ? "📊 Mesuré" : "🔮 Prévu"} : <span className="font-bold text-text">{formatNumber(val, 2)} m³/s</span>
                      </p>
                      {pt.risk && <p className="mt-1">Risque : <span className="font-bold" style={{ color: rc }}>{rl}</span></p>}
                    </div>
                  );
                }}
              />
              <ReferenceLine y={RISK_THRESHOLDS.moderate} stroke={RISK_COLORS.moderate.hex} strokeDasharray="4 2"
                label={{ value: "Modéré", fill: RISK_COLORS.moderate.hex, fontSize: 9, position: "insideRight", dx: -4 }} />
              <ReferenceLine y={RISK_THRESHOLDS.high} stroke={RISK_COLORS.high.hex} strokeDasharray="4 2"
                label={{ value: "Élevé", fill: RISK_COLORS.high.hex, fontSize: 9, position: "insideRight", dx: -4 }} />
              <Bar dataKey="Passé (m³/s)" fill={FLOOD_CHART_COLORS.historic} fillOpacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={36} />
              <Bar dataKey="Prévision (m³/s)" fill={FLOOD_CHART_COLORS.forecast} fillOpacity={0.5} radius={[3, 3, 0, 0]} maxBarSize={36} strokeDasharray="4 2" stroke={FLOOD_CHART_COLORS.forecast} />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-text-muted text-right mt-1 pr-2">
            {combinedChart.filter((d: any) => d.type === "past").length} jours observés · {combinedChart.filter((d: any) => d.type === "future").length} jours prévus
          </p>
        </Card>
      )}

      {/* ── Info card ── */}
      <Card title="Comprendre les seuils GloFAS" icon={<Info className="w-4 h-4" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { risk: "low",      range: `< ${RISK_THRESHOLDS.moderate} m³/s`,                                          desc: "Débit normal, aucun risque significatif" },
            { risk: "moderate", range: `${RISK_THRESHOLDS.moderate}–${RISK_THRESHOLDS.high} m³/s`,                   desc: "Surveillance recommandée, crues mineures possibles" },
            { risk: "high",     range: `${RISK_THRESHOLDS.high}–${RISK_THRESHOLDS.extreme} m³/s`,                   desc: "Risque élevé, évacuation préventive possible" },
            { risk: "extreme",  range: `> ${RISK_THRESHOLDS.extreme} m³/s`,                                          desc: "Crue majeure imminente, mesures d'urgence requises" },
          ].map(({ risk, range, desc }) => {
            const { label, bg, color } = getFloodRiskLabel(risk);
            return (
              <div key={risk} className={`rounded-lg p-3 ${bg}`}>
                <p className={`text-xs font-bold ${color}`}>{label}</p>
                <p className="text-xs font-semibold text-text mt-1">{range}</p>
                <p className="text-[10px] text-text-muted mt-1">{desc}</p>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-text-muted mt-3">
          Seuils indicatifs basés sur les percentiles GloFAS (2.0 / ERA5). Les valeurs réelles varient selon le cours d&apos;eau et la saison.
          Source : <span className="font-medium">GloFAS — Copernicus Emergency Management Service</span>
        </p>
      </Card>
    </div>
  );
}

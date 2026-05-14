"use client";
import { useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import Card from "@/components/Card";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatDateTime, getAqiLabel, getFloodRiskLabel, getDroughtLabel, formatNumber } from "@/lib/utils";
import { ALERT_SEVERITY_COLORS, ALERT_TYPE_COLORS, DROUGHT_COLORS, RISK_COLORS, DROUGHT_THRESHOLDS } from "@/lib/thresholds";
import {
  FileText, Download, Printer, RefreshCw, Calendar,
  Thermometer, Wind, Waves, Droplets, Bell, AlertTriangle,
  CheckCircle, TrendingUp, TrendingDown, Minus, MapPin,
  ShieldAlert, Siren, Info,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell, AreaChart, Area,
} from "recharts";

// ─── helpers ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  flood:       "Inondation",
  air_quality: "Qualité de l'air",
  heat_wave:   "Canicule",
  drought:     "Sécheresse",
};

const SEVERITY_LABELS: Record<string, string> = {
  info:     "Surveillance",
  warning:  "Avertissement",
  danger:   "Danger",
  critical: "Critique",
};

const SEVERITY_COLOR = ALERT_SEVERITY_COLORS;
const TYPE_COLOR     = ALERT_TYPE_COLORS;

function getSPILabel(spi: number | null) {
  if (spi === null || spi === undefined) return { label: "—", color: DROUGHT_COLORS.unknown.color };
  if (spi <= DROUGHT_THRESHOLDS.extreme)  return { label: "Extrême",       color: DROUGHT_COLORS.extreme.color };
  if (spi <= DROUGHT_THRESHOLDS.severe)   return { label: "Sévère",         color: DROUGHT_COLORS.severe.color };
  if (spi <= DROUGHT_THRESHOLDS.moderate) return { label: "Modérée",        color: DROUGHT_COLORS.moderate.color };
  if (spi < 0)                            return { label: "Anomalie sèche", color: DROUGHT_COLORS.mild.color };
  return                                         { label: "Normale",           color: DROUGHT_COLORS.normal.color };
}

function StatBadge({ label, value, color }: { label: string; value: string | number | null; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-bg border border-border rounded-xl p-3 text-center min-w-[90px]">
      <span className={`text-lg font-bold ${color || "text-text"}`}>{value ?? "—"}</span>
      <span className="text-[10px] text-text-muted mt-0.5 leading-tight">{label}</span>
    </div>
  );
}

function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="text-primary">{icon}</div>
      <div>
        <h2 className="text-base font-semibold text-text">{title}</h2>
        {sub && <p className="text-xs text-text-muted">{sub}</p>}
      </div>
    </div>
  );
}

function RiskPill({ level }: { level: string | null }) {
  const { label, color, bg } = getFloodRiskLabel(level);
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${bg} ${color}`}>{label}</span>;
}

// ─── main component ──────────────────────────────────────────────────────────

export default function ReportPage() {
  const [days, setDays] = useState(30);
  const printRef = useRef<HTMLDivElement>(null);

  const report = useApi(() => api.getReport(days), [days], "report");
  const data = report.data;

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExportJSON = useCallback(() => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-environnemental-${data.meta.period_start?.slice(0, 10)}_${data.meta.period_end?.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const handleExportCSV = useCallback(() => {
    if (!data) return;
    const rows = data.city_summaries.map((c: any) => ({
      Ville: c.location.name,
      Population: c.location.population ?? "",
      "Temp. actuelle (°C)": c.weather.current_temp ?? "",
      "Humidité actuelle (%)": c.weather.current_humidity ?? "",
      "Temp. moy. période (°C)": c.weather.avg_temp ?? "",
      "Précip. totale période (mm)": c.weather.total_precip ?? "",
      "AQI actuel": c.air_quality.current_aqi ?? "",
      "AQI moyen période": c.air_quality.avg_aqi ?? "",
      "PM2.5 actuel": c.air_quality.current_pm25 ?? "",
      "Débit actuel (m³/s)": c.flood.current_discharge ?? "",
      "Risque inondation": c.flood.current_risk ?? "",
      "SPI actuel": c.drought.current_spi ?? "",
      "Niveau sécheresse": c.drought.current_level ?? "",
      "Alertes sur période": c.alerts.total ?? "",
    }));
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(";"),
      ...rows.map((r: any) => headers.map((h: string) => String(r[h])).join(";")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-environnemental-${data.meta.period_start?.slice(0, 10)}_${data.meta.period_end?.slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const alertTimelineChart = (data?.alert_timeline || []).map((d: any) => ({
    date: d.date,
    Inondation:       d.flood || 0,
    "Qualité air":    d.air_quality || 0,
    Canicule:         d.heat_wave || 0,
    Sécheresse:       d.drought || 0,
  }));

  const alertByTypeChart = data?.summary
    ? Object.entries(data.summary.alerts_by_type || {}).map(([k, v]) => ({
        name: TYPE_LABELS[k] || k,
        value: v as number,
        color: TYPE_COLOR[k] || RISK_COLORS.unknown.hex,
      }))
    : [];

  const alertBySeverityChart = data?.summary
    ? Object.entries(data.summary.alerts_by_severity || {}).map(([k, v]) => ({
        name: SEVERITY_LABELS[k] || k,
        value: v as number,
        color: SEVERITY_COLOR[k] || RISK_COLORS.unknown.hex,
      }))
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" /> Rapport Environnemental
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Synthèse automatisée basée sur les données collectées
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden text-xs">
            {[7, 14, 30, 60, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 transition ${days === d ? "bg-primary text-white" : "bg-card text-text hover:bg-border/30"}`}
              >
                {d}j
              </button>
            ))}
          </div>
          <button
            onClick={() => report.refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg bg-card hover:bg-border/30 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualiser
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!data}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg bg-card hover:bg-border/30 transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={handleExportJSON}
            disabled={!data}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg bg-card hover:bg-border/30 transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> JSON
          </button>
          <button
            onClick={handlePrint}
            disabled={!data}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-40"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimer / PDF
          </button>
        </div>
      </div>

      {report.loading && <LoadingSpinner message="Génération du rapport…" />}
      {report.error && (
        <Card>
          <div className="flex items-center gap-3 text-danger">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm">{report.error}</p>
          </div>
        </Card>
      )}

      {data?.meta && (
        <div ref={printRef} className="space-y-6 print-area">

          {/* ── Cover / meta ── */}
          <Card>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-text">{data.meta.app_name}</h2>
                <p className="text-sm text-text-secondary mt-0.5">Rapport de surveillance environnementale — {data.meta.country}</p>
                <div className="flex flex-wrap gap-3 mt-3">
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Calendar className="w-3.5 h-3.5" />
                    Période : {new Date(data.meta.period_start).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    {" "} → {new Date(data.meta.period_end).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <span className="text-xs text-text-muted">|</span>
                  <span className="flex items-center gap-1 text-xs text-text-muted">
                    <Info className="w-3.5 h-3.5" />
                    Généré le {formatDateTime(data.meta.generated_at)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <StatBadge label="Villes surveillées"    value={data.summary.total_cities_monitored}   color="text-primary" />
                <StatBadge label="Alertes actives"       value={data.summary.active_alerts}             color={data.summary.active_alerts > 0 ? "text-danger" : "text-green-600"} />
                <StatBadge label="Alertes sur période"   value={data.summary.total_alerts_period}       color="text-warning" />
              </div>
            </div>
          </Card>

          {/* ── Coverage ── */}
          <Card>
            <SectionTitle icon={<MapPin className="w-4.5 h-4.5" />} title="Couverture des données" sub={`Sur les ${days} derniers jours`} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Météo",         value: data.summary.cities_with_weather_data,     icon: <Thermometer className="w-4 h-4 text-orange-500" /> },
                { label: "Qualité air",   value: data.summary.cities_with_air_quality_data, icon: <Wind className="w-4 h-4 text-teal-500" /> },
                { label: "Inondations",   value: data.summary.cities_with_flood_data,        icon: <Waves className="w-4 h-4 text-blue-500" /> },
                { label: "Sécheresse",    value: data.summary.cities_with_drought_data,      icon: <Droplets className="w-4 h-4 text-amber-500" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex items-center gap-3 bg-bg border border-border rounded-xl p-3">
                  {icon}
                  <div>
                    <p className="text-base font-bold text-text">{value} / {data.summary.total_cities_monitored}</p>
                    <p className="text-[10px] text-text-muted">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Situation alerts ── */}
          {(data.summary.high_flood_risk_cities > 0 || data.summary.drought_alert_cities > 0 || data.summary.poor_air_quality_cities > 0) && (
            <Card className="border-l-4 border-l-danger">
              <SectionTitle icon={<ShieldAlert className="w-4.5 h-4.5 text-danger" />} title="Points de vigilance" sub="Villes dépassant les seuils d'alerte au moment du rapport" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.summary.high_flood_risk_cities > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                      <Waves className="w-3.5 h-3.5" /> Risque inondation élevé/extrême ({data.summary.high_flood_risk_cities} villes)
                    </p>
                    <div className="space-y-1">
                      {data.highlights.high_flood_risk_cities.map((c: any) => (
                        <div key={c.name} className="flex items-center justify-between text-xs bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
                          <span className="font-medium text-text">{c.name}</span>
                          <div className="flex items-center gap-2">
                            {c.discharge != null && <span className="text-text-muted">{formatNumber(c.discharge, 2)} m³/s</span>}
                            <RiskPill level={c.risk} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {data.summary.drought_alert_cities > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5" /> Sécheresse (SPI &lt; -1) ({data.summary.drought_alert_cities} villes)
                    </p>
                    <div className="space-y-1">
                      {data.highlights.drought_alert_cities.map((c: any) => {
                        const lbl = getSPILabel(c.spi);
                        return (
                          <div key={c.name} className="flex items-center justify-between text-xs bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                            <span className="font-medium text-text">{c.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-text-muted">SPI {c.spi?.toFixed(2)}</span>
                              <span className={`font-semibold ${lbl.color}`}>{lbl.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {data.summary.poor_air_quality_cities > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-teal-700 mb-2 flex items-center gap-1">
                      <Wind className="w-3.5 h-3.5" /> Qualité air dégradée (AQI &gt; 60) ({data.summary.poor_air_quality_cities} villes)
                    </p>
                    <div className="space-y-1">
                      {data.highlights.poor_air_quality_cities.map((c: any) => {
                        const aqiInfo = getAqiLabel(c.aqi);
                        return (
                          <div key={c.name} className="flex items-center justify-between text-xs bg-teal-50 border border-teal-100 rounded-lg px-2.5 py-1.5">
                            <span className="font-medium text-text">{c.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-text-muted">AQI {c.aqi}</span>
                              <span className={`font-semibold ${aqiInfo.color}`}>{aqiInfo.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* ── Global climate stats ── */}
          <Card>
            <SectionTitle icon={<Thermometer className="w-4.5 h-4.5 text-orange-500" />} title="Statistiques globales de la période" sub="Moyennes calculées sur toutes les villes avec données disponibles" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Weather */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-orange-500" /> Météo
                </p>
                {[
                  { label: "Temp. moyenne", value: data.global_stats.weather.avg_temp != null ? `${data.global_stats.weather.avg_temp}°C` : "—" },
                  { label: "Temp. maximale", value: data.global_stats.weather.max_temp != null ? `${data.global_stats.weather.max_temp}°C` : "—" },
                  { label: "Temp. minimale", value: data.global_stats.weather.min_temp != null ? `${data.global_stats.weather.min_temp}°C` : "—" },
                  { label: "Observations", value: data.global_stats.weather.observations },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs border-b border-border pb-1">
                    <span className="text-text-muted">{label}</span>
                    <span className="font-semibold text-text">{value}</span>
                  </div>
                ))}
              </div>
              {/* Air quality */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-teal-500" /> Qualité de l'air
                </p>
                {[
                  { label: "AQI moyen",      value: data.global_stats.air_quality.avg_aqi ?? "—" },
                  { label: "AQI max",         value: data.global_stats.air_quality.max_aqi ?? "—" },
                  { label: "Observations",    value: data.global_stats.air_quality.observations },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs border-b border-border pb-1">
                    <span className="text-text-muted">{label}</span>
                    <span className="font-semibold text-text">{value}</span>
                  </div>
                ))}
              </div>
              {/* Flood */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                  <Waves className="w-3.5 h-3.5 text-blue-500" /> Inondations
                </p>
                {[
                  { label: "Débit moyen",  value: data.global_stats.flood.avg_discharge != null ? `${data.global_stats.flood.avg_discharge} m³/s` : "—" },
                  { label: "Débit max",    value: data.global_stats.flood.max_discharge != null ? `${data.global_stats.flood.max_discharge} m³/s` : "—" },
                  { label: "Observations", value: data.global_stats.flood.observations },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs border-b border-border pb-1">
                    <span className="text-text-muted">{label}</span>
                    <span className="font-semibold text-text">{value}</span>
                  </div>
                ))}
              </div>
              {/* Drought */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-amber-500" /> Sécheresse
                </p>
                {[
                  { label: "SPI moyen",    value: data.global_stats.drought.avg_spi ?? "—" },
                  { label: "SPI minimal",  value: data.global_stats.drought.min_spi ?? "—" },
                  { label: "Observations", value: data.global_stats.drought.observations },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-xs border-b border-border pb-1">
                    <span className="text-text-muted">{label}</span>
                    <span className="font-semibold text-text">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ── Alerts section ── */}
          <Card>
            <SectionTitle icon={<Bell className="w-4.5 h-4.5 text-danger" />} title="Analyse des alertes" sub={`${data.summary.total_alerts_period} alertes déclenchées sur la période`} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Timeline */}
              <div className="lg:col-span-2">
                <p className="text-xs text-text-muted mb-2">Alertes déclenchées par jour</p>
                {alertTimelineChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={alertTimelineChart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        {Object.entries(TYPE_COLOR).map(([k, c]) => (
                          <linearGradient key={k} id={`grad_${k}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={c} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={c} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }}
                        tickFormatter={v => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}`; }}
                        interval={Math.max(1, Math.floor(alertTimelineChart.length / 7))} />
                      <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                      <Tooltip
                        labelFormatter={v => new Date(v).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                        contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
                      <Area type="monotone" dataKey="Inondation"    stroke={TYPE_COLOR.flood}       fill={`url(#grad_flood)`}       strokeWidth={1.5} />
                      <Area type="monotone" dataKey="Qualité air"   stroke={TYPE_COLOR.air_quality} fill={`url(#grad_air_quality)`} strokeWidth={1.5} />
                      <Area type="monotone" dataKey="Canicule"      stroke={TYPE_COLOR.heat_wave}   fill={`url(#grad_heat_wave)`}   strokeWidth={1.5} />
                      <Area type="monotone" dataKey="Sécheresse"    stroke={TYPE_COLOR.drought}     fill={`url(#grad_drought)`}     strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-sm text-text-muted">Aucune alerte sur la période</div>
                )}
              </div>

              {/* By type + severity */}
              <div className="flex flex-col gap-4">
                {alertByTypeChart.length > 0 && (
                  <div>
                    <p className="text-xs text-text-muted mb-2">Par type</p>
                    <div className="space-y-1.5">
                      {alertByTypeChart.map(({ name, value, color }) => (
                        <div key={name} className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="flex-1 text-text-muted truncate">{name}</span>
                          <span className="font-semibold text-text">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {alertBySeverityChart.length > 0 && (
                  <div>
                    <p className="text-xs text-text-muted mb-2">Par sévérité</p>
                    <div className="space-y-1.5">
                      {alertBySeverityChart.map(({ name, value, color }) => (
                        <div key={name} className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="flex-1 text-text-muted truncate">{name}</span>
                          <span className="font-semibold text-text">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active alerts list */}
            {data.highlights.recent_active_alerts.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-text mb-2">
                  Alertes actuellement actives ({data.highlights.recent_active_alerts.length})
                </p>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {data.highlights.recent_active_alerts.map((a: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-xs border border-border rounded-lg px-3 py-2 bg-bg">
                      <Siren className="w-3.5 h-3.5 text-danger shrink-0" />
                      <span className="flex-1 font-medium text-text truncate">{a.title || TYPE_LABELS[a.alert_type] || a.alert_type}</span>
                      <span className="text-text-muted shrink-0">
                        {a.start_date ? new Date(a.start_date).toLocaleDateString("fr-FR") : "—"}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0"
                        style={{ backgroundColor: SEVERITY_COLOR[a.severity] + "20", color: SEVERITY_COLOR[a.severity] }}
                      >
                        {SEVERITY_LABELS[a.severity] || a.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* ── Per-city table ── */}
          <Card>
            <SectionTitle
              icon={<MapPin className="w-4.5 h-4.5" />}
              title="Tableau de bord par ville"
              sub={`${data.city_summaries.length} villes — données les plus récentes disponibles`}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="text-left py-2 pr-3 font-medium">Ville</th>
                    <th className="text-right py-2 px-2 font-medium">Temp. (°C)</th>
                    <th className="text-right py-2 px-2 font-medium">Humidité (%)</th>
                    <th className="text-right py-2 px-2 font-medium">AQI</th>
                    <th className="text-right py-2 px-2 font-medium">PM2.5</th>
                    <th className="text-right py-2 px-2 font-medium">Débit (m³/s)</th>
                    <th className="text-center py-2 px-2 font-medium">Risque flood</th>
                    <th className="text-right py-2 px-2 font-medium">SPI</th>
                    <th className="text-center py-2 px-2 font-medium">Sécheresse</th>
                    <th className="text-right py-2 pl-2 font-medium">Alertes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.city_summaries.map((c: any) => {
                    const aqiInfo = getAqiLabel(c.air_quality.current_aqi);
                    const spiInfo = getSPILabel(c.drought.current_spi);
                    return (
                      <tr key={c.location.id} className="border-b border-border/50 hover:bg-bg/60 transition">
                        <td className="py-2 pr-3 font-medium text-text">{c.location.name}</td>
                        <td className="py-2 px-2 text-right text-text">
                          {c.weather.current_temp != null ? c.weather.current_temp : "—"}
                        </td>
                        <td className="py-2 px-2 text-right text-text">
                          {c.weather.current_humidity != null ? c.weather.current_humidity : "—"}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {c.air_quality.current_aqi != null ? (
                            <span className={`font-semibold ${aqiInfo.color}`}>{c.air_quality.current_aqi}</span>
                          ) : "—"}
                        </td>
                        <td className="py-2 px-2 text-right text-text">
                          {c.air_quality.current_pm25 != null ? c.air_quality.current_pm25 : "—"}
                        </td>
                        <td className="py-2 px-2 text-right text-text">
                          {c.flood.current_discharge != null ? formatNumber(c.flood.current_discharge, 2) : "—"}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {c.flood.current_risk ? <RiskPill level={c.flood.current_risk} /> : <span className="text-text-muted">—</span>}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {c.drought.current_spi != null ? (
                            <span className={`font-semibold ${spiInfo.color}`}>{c.drought.current_spi.toFixed(2)}</span>
                          ) : "—"}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {c.drought.current_level ? (
                            <span className={`${getDroughtLabel(c.drought.current_level).color} font-semibold`}>
                              {getDroughtLabel(c.drought.current_level).label}
                            </span>
                          ) : "—"}
                        </td>
                        <td className={`py-2 pl-2 text-right font-semibold ${c.alerts.total > 0 ? "text-danger" : "text-text-muted"}`}>
                          {c.alerts.total}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ── Footer ── */}
          <div className="text-[10px] text-text-muted border-t border-border pt-3 flex flex-wrap justify-between gap-2">
            <span>{data.meta.app_name} · Rapport généré le {formatDateTime(data.meta.generated_at)}</span>
            <span>Sources : Open-Meteo (météo, prévisions), Open-Meteo Air Quality, GloFAS (hydrologie), ERA5 (climat)</span>
          </div>

        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-area { padding: 0; }
          aside { display: none !important; }
          main { margin-left: 0 !important; padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}

"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import Card from "@/components/Card";
import LoadingSpinner from "@/components/LoadingSpinner";
import LocationSelect from "@/components/LocationSelect";
import MapView from "@/components/MapView";
import { formatNumber, getAqiLabel } from "@/lib/utils";
import { Wind, TrendingUp, Heart, Eye, Info } from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ReferenceLine,
} from "recharts";

// ── AQI colour helpers ────────────────────────────────────────────────────────
function aqiColor(v: number): string {
  if (v <= 20) return "#00B894";
  if (v <= 40) return "#55EFC4";
  if (v <= 60) return "#FDCB6E";
  if (v <= 80) return "#E17055";
  return "#D63031";
}

const HISTORY_DAYS_OPTIONS = [7, 14, 30, 60, 90];

// ── Custom tooltip ────────────────────────────────────────────────────────────
function AqiTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-text mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value != null ? formatNumber(Number(p.value)) : "—"}</span>
        </p>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AirQualityPage() {
  const [locationId, setLocationId] = useState("ouagadougou");
  const [locationName, setLocationName] = useState("Ouagadougou");
  const [histDays, setHistDays] = useState(30);

  const current  = useApi(() => api.getCurrentAirQuality(locationId), [locationId]);
  const history  = useApi(() => api.getAirQualityHistory(locationId, histDays), [locationId, histDays]);
  const forecast = useApi(() => api.getAirQualityForecast(locationId), [locationId]);
  const aqMap    = useApi(() => api.getAirQualityMap(), []);

  const aqData  = current.data?.data?.current || current.data?.data;
  const aqiVal  = aqData?.aqi ?? aqData?.european_aqi ?? null;
  const aqiInfo = getAqiLabel(aqiVal);

  // ── Radar data ──
  const radarData = aqData ? [
    { subject: "PM2.5",    value: Math.min((aqData.pm2_5 || 0) / 75 * 100, 100) },
    { subject: "PM10",     value: Math.min((aqData.pm10 || 0) / 150 * 100, 100) },
    { subject: "NO₂",      value: Math.min(((aqData.no2 || aqData.nitrogen_dioxide) || 0) / 200 * 100, 100) },
    { subject: "SO₂",      value: Math.min(((aqData.so2 || aqData.sulphur_dioxide) || 0) / 350 * 100, 100) },
    { subject: "O₃",       value: Math.min(((aqData.o3 || aqData.ozone) || 0) / 180 * 100, 100) },
    { subject: "Poussière", value: Math.min((aqData.dust || 0) / 200 * 100, 100) },
  ] : [];

  // ── History chart ──
  const histRaw: any[] = (history.data?.data || []);
  // For long periods (>14d): keep one record per day (last of the day)
  // For short periods: show every point with date+time
  const showTime = histDays <= 14;
  const histChart = (() => {
    if (showTime) {
      return histRaw.map((d: any) => ({
        date: new Date(d.observed_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
        AQI: d.aqi,
        "PM2.5": d.pm2_5,
        PM10: d.pm10,
        Poussière: d.dust,
      }));
    }
    // Deduplicate: one entry per day (last observation)
    const byDay = new Map<string, any>();
    for (const d of histRaw) {
      const day = new Date(d.observed_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      byDay.set(day, d);
    }
    return Array.from(byDay.entries()).map(([day, d]) => ({
      date: day,
      AQI: d.aqi,
      "PM2.5": d.pm2_5,
      PM10: d.pm10,
      Poussière: d.dust,
    }));
  })();

  // ── Forecast chart (from Open-Meteo hourly response) ──
  const fcastRaw = forecast.data?.data;
  const fcastChart: any[] = [];
  if (fcastRaw?.hourly) {
    const times: string[] = fcastRaw.hourly.time || [];
    const pm25: number[]  = fcastRaw.hourly.pm2p5 || fcastRaw.hourly.pm2_5 || [];
    const pm10: number[]  = fcastRaw.hourly.pm10 || [];
    const dust: number[]  = fcastRaw.hourly.dust || [];
    // sample every 6 hours, max 5 days
    times.forEach((t, i) => {
      if (i % 6 !== 0) return;
      const d = new Date(t);
      if (d < new Date()) return;
      if (fcastChart.length >= 20) return;
      fcastChart.push({
        date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        heure: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        "PM2.5": pm25[i] != null ? +pm25[i].toFixed(1) : null,
        PM10: pm10[i] != null ? +pm10[i].toFixed(1) : null,
        Poussière: dust[i] != null ? +dust[i].toFixed(1) : null,
      });
    });
  }

  // ── AQI history trend ──
  const aqiTrend = histChart.filter((d: any) => d.AQI != null);
  const avgAqi   = aqiTrend.length ? Math.round(aqiTrend.reduce((s: number, d: any) => s + d.AQI, 0) / aqiTrend.length) : null;
  const maxAqi   = aqiTrend.length ? Math.max(...aqiTrend.map((d: any) => d.AQI)) : null;
  const daysExceed = aqiTrend.filter((d: any) => d.AQI > 60).length;

  // ── Map ──
  const mapPoints = (aqMap.data?.data || []).map((d: any) => ({
    id: d.location.external_id,
    name: d.location.name,
    latitude: d.location.latitude,
    longitude: d.location.longitude,
    value: d.latest?.aqi || 0,
    label: d.latest ? `AQI: ${d.latest.aqi}` : "N/A",
    risk: d.latest?.aqi > 80 ? "extreme" : d.latest?.aqi > 60 ? "high" : d.latest?.aqi > 40 ? "moderate" : "low",
  }));

  // ── Health advice ──
  const healthAdvice = getHealthAdvice(aqiVal);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wind className="w-7 h-7 text-teal-600" /> Qualité de l&apos;Air
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Polluants, historique et prévisions — {locationName}
          </p>
        </div>
        <LocationSelect value={locationId} onChange={(id, loc) => { setLocationId(id); setLocationName(loc.name); }} className="w-64" />
      </div>

      {current.loading ? <LoadingSpinner /> : aqData && (
        <>
          {/* ── Row 1 : AQI + Radar + KPIs ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* AQI + pollutants */}
            <Card className="lg:col-span-1">
              <div className="text-center py-4">
                <div
                  className="inline-flex items-center justify-center w-28 h-28 rounded-full text-4xl font-bold mb-3 border-4"
                  style={{ borderColor: aqiColor(aqiVal ?? 0), color: aqiColor(aqiVal ?? 0), background: `${aqiColor(aqiVal ?? 0)}18` }}
                >
                  {aqiVal ?? "—"}
                </div>
                <p className="text-lg font-semibold" style={{ color: aqiColor(aqiVal ?? 0) }}>{aqiInfo.label}</p>
                <p className="text-xs text-text-muted mt-1">Indice Européen de Qualité de l&apos;Air (EAQI)</p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Relevé : {aqData.observed_at ? new Date(aqData.observed_at).toLocaleString("fr-FR") : "—"}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <PollutantMini label="PM2.5" value={aqData.pm2_5 || aqData.pm_2_5} unit="μg/m³" warn={15} />
                <PollutantMini label="PM10"  value={aqData.pm10}                   unit="μg/m³" warn={45} />
                <PollutantMini label="Poussière" value={aqData.dust}               unit="μg/m³" warn={100} />
                <PollutantMini label="CO"   value={aqData.co || aqData.carbon_monoxide} unit="μg/m³" warn={4000} />
                <PollutantMini label="NO₂"  value={aqData.no2 || aqData.nitrogen_dioxide} unit="μg/m³" warn={40} />
                <PollutantMini label="O₃"   value={aqData.o3 || aqData.ozone}     unit="μg/m³" warn={120} />
              </div>
            </Card>

            {/* Radar */}
            <Card title="Profil des polluants (% du seuil max)" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                  <Radar name="% seuil" dataKey="value" stroke="#1B6FA8" fill="#1B6FA8" fillOpacity={0.3} strokeWidth={2} />
                  <Tooltip content={<AqiTooltip />} formatter={(v: any) => [`${v.toFixed(0)} %`, "% du seuil"]} />
                </RadarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-text-muted text-center -mt-2">Seuils OMS : PM2.5=75, PM10=150, NO₂=200, SO₂=350, O₃=180, Poussière=200 μg/m³</p>
            </Card>
          </div>

          {/* ── Health advice ── */}
          {healthAdvice && (
            <Card>
              <div className={`flex items-start gap-3 p-3 rounded-lg border ${healthAdvice.border} ${healthAdvice.bg}`}>
                <Heart className={`w-5 h-5 shrink-0 mt-0.5 ${healthAdvice.iconColor}`} />
                <div>
                  <p className={`text-sm font-semibold ${healthAdvice.textColor}`}>{healthAdvice.title}</p>
                  <ul className="mt-1 space-y-0.5">
                    {healthAdvice.tips.map((t, i) => (
                      <li key={i} className="text-xs text-text-secondary flex items-start gap-1">
                        <span className="mt-1 shrink-0">•</span> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── Row 2 : History stats KPIs ── */}
      {!history.loading && histChart.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="AQI moyen" value={avgAqi ?? "—"} sub={`${histDays} derniers jours`} color="text-teal-600" />
          <KpiCard label="AQI maximum" value={maxAqi ?? "—"} sub="pic enregistré" color={maxAqi && maxAqi > 60 ? "text-danger" : "text-warning"} />
          <KpiCard label="Jours dégradés" value={daysExceed} sub="AQI > 60 (Mauvais)" color={daysExceed > 5 ? "text-danger" : "text-warning"} />
          <KpiCard label="Jours analysés" value={aqiTrend.length} sub="enregistrements" color="text-text" />
        </div>
      )}

      {/* ── Row 3 : AQI History chart ── */}
      <Card
        title={`Historique AQI — ${histDays} jours`}
        icon={<TrendingUp className="w-4 h-4" />}
        headerAction={
          <div className="flex gap-1">
            {HISTORY_DAYS_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setHistDays(d)}
                className={`px-2 py-0.5 text-xs rounded-full border transition ${histDays === d ? "bg-primary text-white border-primary" : "border-border text-text-muted hover:border-primary"}`}
              >
                {d}j
              </button>
            ))}
          </div>
        }
      >
        {history.loading ? (
          <div className="h-52 flex items-center justify-center text-sm text-text-muted">Chargement…</div>
        ) : histChart.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-sm text-text-muted">Aucune donnée historique disponible</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={histChart} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="zoneGood"  x1="0" y1="0" x2="0" y2="1"><stop stopColor="#00B894" stopOpacity={0.12}/></linearGradient>
                  <linearGradient id="zoneMod"   x1="0" y1="0" x2="0" y2="1"><stop stopColor="#FDCB6E" stopOpacity={0.15}/></linearGradient>
                  <linearGradient id="zoneBad"   x1="0" y1="0" x2="0" y2="1"><stop stopColor="#E17055" stopOpacity={0.15}/></linearGradient>
                  <linearGradient id="zoneVBad"  x1="0" y1="0" x2="0" y2="1"><stop stopColor="#D63031" stopOpacity={0.15}/></linearGradient>
                  <linearGradient id="aqiGrad"   x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                  interval={Math.max(0, Math.floor(histChart.length / 10) - 1)}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  domain={[0, 110]}
                  tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                  axisLine={false} tickLine={false}
                  width={28}
                />
                <Tooltip content={<AqiTooltip />} />
                {/* colored zone bands */}
                <ReferenceLine y={20} stroke="#00B894" strokeDasharray="3 3" strokeOpacity={0.6}
                  label={{ value: "Bon", fill: "#00B894", fontSize: 9, position: "insideRight", dx: -4 }} />
                <ReferenceLine y={40} stroke="#FDCB6E" strokeDasharray="3 3" strokeOpacity={0.6}
                  label={{ value: "Acceptable", fill: "#b59b00", fontSize: 9, position: "insideRight", dx: -4 }} />
                <ReferenceLine y={60} stroke="#E17055" strokeDasharray="3 3" strokeOpacity={0.6}
                  label={{ value: "Mauvais", fill: "#E17055", fontSize: 9, position: "insideRight", dx: -4 }} />
                <ReferenceLine y={80} stroke="#D63031" strokeDasharray="3 3" strokeOpacity={0.6}
                  label={{ value: "Très mauvais", fill: "#D63031", fontSize: 9, position: "insideRight", dx: -4 }} />
                <Area type="monotoneX" dataKey="AQI" stroke="#7C3AED" fill="url(#aqiGrad)" strokeWidth={2} dot={false} name="AQI" activeDot={{ r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-text-muted text-right mt-1 pr-2">
              {histChart.length} points · {showTime ? "granularité horaire" : "1 point / jour"}
            </p>
          </>
        )}
      </Card>

      {/* ── Row 4 : Pollutants history ── */}
      {!history.loading && histChart.length > 0 && (
        <Card title="Historique des polluants particulaires (μg/m³)" icon={<Eye className="w-4 h-4" />}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={histChart} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pm25Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#E17055" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#E17055" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="pm10Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1B6FA8" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#1B6FA8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="dustGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#FDCB6E" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#FDCB6E" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                interval={Math.max(0, Math.floor(histChart.length / 10) - 1)}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                axisLine={false} tickLine={false}
                width={36} unit=" μg"
              />
              <Tooltip content={<AqiTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
              <Area type="monotoneX" dataKey="PM2.5"    stroke="#E17055" fill="url(#pm25Grad)" strokeWidth={2}   dot={false} activeDot={{ r: 4 }} />
              <Area type="monotoneX" dataKey="PM10"     stroke="#1B6FA8" fill="url(#pm10Grad)" strokeWidth={2}   dot={false} activeDot={{ r: 4 }} />
              <Area type="monotoneX" dataKey="Poussière" stroke="#F0A500" fill="url(#dustGrad)" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-text-muted text-right mt-1 pr-2">
            Seuils OMS : PM2.5 &lt; 15 μg/m³ · PM10 &lt; 45 μg/m³
          </p>
        </Card>
      )}

      {/* ── Row 5 : Forecast ── */}
      <Card title="Prévisions PM2.5 / PM10 / Poussière (5 prochains jours)" icon={<TrendingUp className="w-4 h-4 text-primary" />}>
        {forecast.loading ? (
          <div className="h-48 flex items-center justify-center text-sm text-text-muted">Chargement des prévisions…</div>
        ) : fcastChart.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-text-muted">Prévisions non disponibles</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={fcastChart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} unit=" μg" />
                <Tooltip content={<AqiTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="PM2.5"     fill="#E17055" radius={[2, 2, 0, 0]} />
                <Bar dataKey="PM10"      fill="#1B6FA8" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Poussière" fill="#FDCB6E" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-text-muted mt-2 text-center">
              Source : Open-Meteo CAMS / Copernicus · Résolution horaire agrégée par tranche de 6h
            </p>
          </>
        )}
      </Card>

      {/* ── EAQI reference table ── */}
      <Card title="Référence — Échelle EAQI" icon={<Info className="w-4 h-4" />}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="text-left py-2 pr-4 font-medium">Niveau</th>
                <th className="text-left py-2 px-2 font-medium">AQI</th>
                <th className="text-left py-2 px-2 font-medium">PM2.5 (μg/m³)</th>
                <th className="text-left py-2 px-2 font-medium">PM10 (μg/m³)</th>
                <th className="text-left py-2 px-2 font-medium">O₃ (μg/m³)</th>
                <th className="text-left py-2 pl-2 font-medium">NO₂ (μg/m³)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Bon",          range: "0–20",   pm25: "0–10",   pm10: "0–20",   o3: "0–50",   no2: "0–40",   color: "#00B894" },
                { label: "Acceptable",   range: "20–40",  pm25: "10–20",  pm10: "20–40",  o3: "50–100", no2: "40–90",  color: "#55EFC4" },
                { label: "Modéré",       range: "40–60",  pm25: "20–25",  pm10: "40–50",  o3: "100–130",no2: "90–120", color: "#FDCB6E" },
                { label: "Mauvais",      range: "60–80",  pm25: "25–50",  pm10: "50–100", o3: "130–240",no2: "120–230",color: "#E17055" },
                { label: "Très mauvais", range: "80–100", pm25: "50–75",  pm10: "100–150",o3: "240–380",no2: "230–340",color: "#D63031" },
                { label: "Extrêmement",  range: "> 100",  pm25: "> 75",   pm10: "> 150",  o3: "> 380",  no2: "> 340",  color: "#6C1C1C" },
              ].map(row => (
                <tr key={row.label} className="border-b border-border/40">
                  <td className="py-1.5 pr-4">
                    <span className="flex items-center gap-2">
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: row.color }} />
                      <span className="font-medium" style={{ color: row.color }}>{row.label}</span>
                    </span>
                  </td>
                  <td className="py-1.5 px-2 font-mono">{row.range}</td>
                  <td className="py-1.5 px-2 text-text-muted">{row.pm25}</td>
                  <td className="py-1.5 px-2 text-text-muted">{row.pm10}</td>
                  <td className="py-1.5 px-2 text-text-muted">{row.o3}</td>
                  <td className="py-1.5 pl-2 text-text-muted">{row.no2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Map ── */}
      <Card title="Carte nationale de la qualité de l'air" icon={<Wind className="w-5 h-5" />}>
        <MapView
          points={mapPoints}
          height="420px"
          colorFn={(p) => aqiColor(p.value || 0)}
          radiusFn={() => 10}
        />
        <div className="flex items-center flex-wrap gap-3 mt-3 text-xs text-text-muted">
          {[
            { label: "Bon (0–20)",           color: "#00B894" },
            { label: "Acceptable (20–40)",   color: "#55EFC4" },
            { label: "Modéré (40–60)",       color: "#FDCB6E" },
            { label: "Mauvais (60–80)",      color: "#E17055" },
            { label: "Très mauvais (> 80)",  color: "#D63031" },
          ].map(l => (
            <span key={l.label} className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PollutantMini({ label, value, unit, warn }: { label: string; value: number | null | undefined; unit: string; warn?: number }) {
  const exceeded = warn != null && value != null && value > warn;
  return (
    <div className={`rounded-lg p-2 text-center border ${exceeded ? "bg-red-50 border-red-200" : "bg-bg border-border"}`}>
      <p className="text-[10px] text-text-muted">{label}</p>
      <p className={`text-sm font-bold ${exceeded ? "text-danger" : "text-text"}`}>
        {value != null ? formatNumber(value) : "—"}
      </p>
      <p className="text-[9px] text-text-muted">{unit}</p>
    </div>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: any; sub: string; color: string }) {
  return (
    <Card>
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      <p className="text-[11px] text-text-muted mt-0.5">{sub}</p>
    </Card>
  );
}

function getHealthAdvice(aqi: number | null) {
  if (aqi === null) return null;
  if (aqi <= 20) return {
    title: "Qualité de l'air bonne — Activités en plein air sans restriction",
    tips: ["Toutes les activités extérieures sont sûres.", "Profitez de l'air frais."],
    bg: "bg-green-50", border: "border-green-200", textColor: "text-green-800", iconColor: "text-green-600",
  };
  if (aqi <= 40) return {
    title: "Qualité de l'air acceptable — Quelques précautions pour les personnes sensibles",
    tips: ["Les personnes très sensibles peuvent ressentir une légère gêne.", "Les activités extérieures modérées sont acceptables."],
    bg: "bg-teal-50", border: "border-teal-200", textColor: "text-teal-800", iconColor: "text-teal-600",
  };
  if (aqi <= 60) return {
    title: "Qualité modérée — Précautions recommandées",
    tips: [
      "Les personnes asthmatiques ou cardiaques doivent limiter les efforts prolongés en extérieur.",
      "Évitez les zones à fort trafic.",
      "Aérez les intérieurs tôt le matin.",
    ],
    bg: "bg-yellow-50", border: "border-yellow-200", textColor: "text-yellow-800", iconColor: "text-yellow-600",
  };
  if (aqi <= 80) return {
    title: "Mauvaise qualité — Réduire les activités extérieures",
    tips: [
      "Réduisez les activités physiques intenses en extérieur.",
      "Les enfants, personnes âgées et malades respiratoires doivent rester à l'intérieur.",
      "Portez un masque FFP2 si sortie nécessaire.",
      "Fermez les fenêtres en journée.",
    ],
    bg: "bg-orange-50", border: "border-orange-200", textColor: "text-orange-800", iconColor: "text-orange-600",
  };
  return {
    title: "Très mauvaise qualité — Restez à l'intérieur",
    tips: [
      "Évitez toute sortie non indispensable.",
      "Portez impérativement un masque FFP2 à l'extérieur.",
      "Gardez les portes et fenêtres fermées.",
      "Les personnes vulnérables (enfants, personnes âgées, asthmatiques) doivent consulter un médecin en cas de symptômes.",
    ],
    bg: "bg-red-50", border: "border-red-200", textColor: "text-red-800", iconColor: "text-red-600",
  };
}

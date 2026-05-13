"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import Card from "@/components/Card";
import LoadingSpinner from "@/components/LoadingSpinner";
import LocationSelect from "@/components/LocationSelect";
import { Thermometer, TrendingUp, TrendingDown, Minus, Droplets, Sun, Wind } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, BarChart, Bar, Cell, ReferenceLine, ComposedChart, Area,
} from "recharts";

const CURRENT_YEAR = new Date().getFullYear();

export default function ClimatePage() {
  const [locationId, setLocationId] = useState("ouagadougou");
  const [locationName, setLocationName] = useState("Ouagadougou");
  const [startYear, setStartYear] = useState<number | null>(null);  // null = auto

  // First load with auto year
  const trends = useApi(() => api.getClimateTrends(locationId, startYear ?? undefined), [locationId, startYear]);

  // Once data arrives, set startYear from earliest_year if still null
  useEffect(() => {
    if (trends.data?.earliest_year && startYear === null) {
      setStartYear(trends.data.earliest_year);
    }
  }, [trends.data]);

  const yearlyData   = trends.data?.yearly_trends || [];
  const monthlyData  = trends.data?.monthly || [];
  const seasonal     = trends.data?.seasonal || [];
  const extremes     = trends.data?.extremes || [];
  const trendSlope   = trends.data?.trend_slope;
  const ltMean       = trends.data?.long_term_mean_temp;
  const source       = trends.data?.source;
  const earliestYear = trends.data?.earliest_year ?? CURRENT_YEAR - 4;

  const START_YEAR_OPTIONS = Array.from(
    { length: CURRENT_YEAR - earliestYear + 1 },
    (_, i) => earliestYear + i
  );

  const monthNames = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const monthlyChart = monthlyData.map((d: any) => ({
    ...d,
    label: `${monthNames[(d.month || 1) - 1]} ${d.year}`,
  }));

  // Seasonal chart: pivot humide/sèche per year
  const yearSet = Array.from(new Set(seasonal.map((s: any) => s.year))).sort() as number[];
  const seasonalChart = yearSet.map(yr => {
    const h = seasonal.find((s: any) => s.year === yr && s.season === "humide");
    const s = seasonal.find((s: any) => s.year === yr && s.season === "sèche");
    return {
      year: yr,
      precip_humide: h?.total_precipitation ? Math.round(h.total_precipitation) : 0,
      precip_seche: s?.total_precipitation ? Math.round(s.total_precipitation) : 0,
      temp_humide: h?.avg_temperature ? Math.round(h.avg_temperature * 10) / 10 : null,
      temp_seche: s?.avg_temperature ? Math.round(s.avg_temperature * 10) / 10 : null,
    };
  });

  // Anomaly chart
  const anomalyChart = yearlyData.filter((d: any) => d.temp_anomaly !== null).map((d: any) => ({
    year: d.year,
    anomalie: Math.round(d.temp_anomaly * 100) / 100,
    partial: d.partial,
    fill: d.partial ? "#FBBF24" : d.temp_anomaly > 0 ? "#EF4444" : "#3B82F6",
  }));
  const hasData = yearlyData.length > 0 || monthlyChart.length > 0;

  const TrendBadge = () => {
    if (trendSlope === null || trendSlope === undefined) return null;
    const abs = Math.abs(trendSlope);
    const perDecade = Math.round(abs * 10 * 100) / 100;
    if (trendSlope > 0.01) return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold border border-red-200">
        <TrendingUp className="w-3.5 h-3.5" /> +{perDecade}°C/décennie (réchauffement)
      </span>
    );
    if (trendSlope < -0.01) return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200">
        <TrendingDown className="w-3.5 h-3.5" /> -{perDecade}°C/décennie (refroidissement)
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
        <Minus className="w-3.5 h-3.5" /> Tendance stable
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Thermometer className="w-7 h-7 text-purple-600" /> Changement Climatique
          </h1>
          <p className="text-sm text-text-secondary mt-1">Tendances climatiques long terme — {locationName}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <TrendBadge />
            {ltMean !== null && ltMean !== undefined && (
              <span className="text-xs text-text-muted px-2 py-0.5 rounded-full bg-bg border border-border">
                Moyenne long terme : <strong>{ltMean}°C</strong>
              </span>
            )}
            {source && (
              <span className="text-[10px] text-text-muted px-2 py-0.5 rounded-full bg-bg border border-border">
                Source : {source === "era5+db" ? "ERA5 + collecte" : source === "weather_archive" ? "Open-Meteo historique" : source}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-muted whitespace-nowrap">Depuis :</label>
            <select
              value={startYear ?? ""}
              onChange={e => setStartYear(Number(e.target.value))}
              className="border border-border rounded-lg px-3 py-1.5 text-sm bg-card text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {START_YEAR_OPTIONS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <LocationSelect
            value={locationId}
            onChange={(id, loc) => { setLocationId(id); setLocationName(loc.name); setStartYear(null); }}
            className="w-64"
          />
        </div>
      </div>

      {trends.loading ? <LoadingSpinner /> : !hasData ? (
        <Card>
          <div className="text-center py-12 text-text-muted">
            <Thermometer className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune donnée climatique disponible pour cette localité.</p>
            <p className="text-xs mt-1">Initialisez le système pour collecter les données historiques.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Summary KPI cards */}
          {yearlyData.length > 0 && (() => {
            const complete = yearlyData.filter((d: any) => !d.partial);
            const recent = complete.at(-1);
            const oldest = complete.at(0);
            const tempDelta = (recent && oldest && recent !== oldest)
              ? (Number(recent.avg_temperature) - Number(oldest.avg_temperature)).toFixed(2)
              : null;
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: <Thermometer className="w-5 h-5 text-red-500" />, label: "Temp. moy. récente", val: recent ? `${Number(recent.avg_temperature).toFixed(1)}°C` : "—", sub: recent?.year?.toString() },
                  { icon: <TrendingUp className="w-5 h-5 text-orange-500" />, label: "Variation totale", val: tempDelta ? `${Number(tempDelta) >= 0 ? "+" : ""}${tempDelta}°C` : "—", sub: `${oldest?.year} → ${recent?.year}` },
                  { icon: <Droplets className="w-5 h-5 text-blue-500" />, label: "Précip. moy./an", val: recent ? `${Math.round(Number(recent.total_precipitation))} mm` : "—", sub: "année récente" },
                  { icon: <Sun className="w-5 h-5 text-yellow-500" />, label: "Années analysées", val: complete.length.toString(), sub: `${oldest?.year} – ${recent?.year}` },
                ].map((kpi, i) => (
                  <Card key={i}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-bg flex items-center justify-center shrink-0">{kpi.icon}</div>
                      <div>
                        <p className="text-xs text-text-muted">{kpi.label}</p>
                        <p className="font-bold text-sm">{kpi.val}</p>
                        {kpi.sub && <p className="text-[10px] text-text-muted">{kpi.sub}</p>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            );
          })()}

          {/* Temperature trend */}
          {yearlyData.length > 0 && (
            <Card title="Tendance annuelle des températures" subtitle="Température moyenne annuelle avec ligne de tendance">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="temp" tick={{ fontSize: 11 }} domain={["auto", "auto"]} tickFormatter={v => `${v}°C`} />
                  <YAxis yAxisId="precip" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}mm`} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    formatter={(val: any, name: string) => {
                      if (name.includes("°C")) return [`${Number(val).toFixed(1)}°C`, name];
                      if (name.includes("Précip")) return [`${Math.round(Number(val))} mm`, name];
                      return [val, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {ltMean && <ReferenceLine yAxisId="temp" y={ltMean} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: `Moyenne ${ltMean}°C`, position: 'insideBottomLeft', fontSize: 10, fill: "#92400E", dy: -10 }} />}
                  <Bar yAxisId="precip" dataKey="total_precipitation" name="Précip. (mm)" fill="#93C5FD" opacity={0.5} radius={[3,3,0,0]} />
                  <Line yAxisId="temp" type="monotone" dataKey="avg_temperature" name="Temp. moy. (°C)"
                    stroke="#D63031" strokeWidth={2.5}
                    dot={(p: any) => (
                      <circle key={p.key} cx={p.cx} cy={p.cy} r={p.payload?.partial ? 6 : 4}
                        fill={p.payload?.partial ? "#F59E0B" : "#D63031"} stroke="#fff" strokeWidth={2} />
                    )}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-text-muted">
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Au-dessus moyenne</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> En-dessous moyenne</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Année partielle</span>
                <span className="inline-flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-500" /> Moyenne long terme</span>
              </div>
            </Card>
          )}

          {/* Thermal anomaly */}
          {anomalyChart.length > 1 && (
            <Card title="Anomalie thermique annuelle" subtitle={`Écart par rapport à la moyenne long terme (${ltMean}°C)`}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={anomalyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v > 0 ? "+" : ""}${v}°C`} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    formatter={(v: any, name: string, props: any) => {
                      const p = props?.payload;
                      const label = p?.partial ? "Anomalie (année partielle)" : "Anomalie";
                      return [`${Number(v) > 0 ? "+" : ""}${Number(v).toFixed(2)}°C`, label];
                    }}
                  />
                  <ReferenceLine y={0} stroke="#64748B" strokeWidth={1.5} />
                  <Bar dataKey="anomalie" name="Anomalie (°C)" radius={[3,3,0,0]}>
                    {anomalyChart.map((d: any) => (
                      <Cell key={d.year}
                        fill={d.partial ? "#FBBF24" : d.anomalie > 0 ? "#EF4444" : "#3B82F6"}
                        opacity={d.partial ? 0.6 : 0.9}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-text-muted">
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500" /> Anomalie positive (plus chaud)</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500" /> Anomalie négative (plus frais)</span>
                <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400" /> Année partielle</span>
              </div>
            </Card>
          )}

          {/* Seasonal breakdown */}
          {seasonalChart.length > 1 && (
            <Card title="Saisons : sèche vs humide" subtitle="Cumul précipitations par saison (Sahel : mai–oct = humide)">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={seasonalChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}mm`} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    formatter={(v: any, name: string) => [`${Math.round(Number(v))} mm`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="precip_humide" name="Saison humide (mm)" fill="#1D4ED8" radius={[3,3,0,0]} />
                  <Bar dataKey="precip_seche"  name="Saison sèche (mm)"  fill="#F59E0B" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Monthly detail */}
          {monthlyChart.length > 0 && (
            <Card title="Données mensuelles détaillées" subtitle="Température, humidité et précipitations mois par mois">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={Math.max(1, Math.floor(monthlyChart.length / 24))} />
                  <YAxis yAxisId="temp" tick={{ fontSize: 11 }} tickFormatter={v => `${v}°C`} />
                  <YAxis yAxisId="precip" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}mm`} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area yAxisId="precip" type="monotone" dataKey="total_precipitation" name="Précip. (mm)" fill="#BFDBFE" stroke="#3B82F6" strokeWidth={1} dot={false} />
                  <Line yAxisId="temp" type="monotone" dataKey="avg_temperature" name="Temp. (°C)" stroke="#D63031" strokeWidth={2} dot={false} />
                  <Line yAxisId="temp" type="monotone" dataKey="avg_humidity" name="Humidité (%)" stroke="#059669" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Extremes table */}
          {extremes.length > 0 && (
            <Card title="Extrêmes annuels" subtitle="Mois le plus chaud et le plus pluvieux par année">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-text-muted font-medium">Année</th>
                      <th className="text-left py-2 px-3 text-text-muted font-medium">🌡 Mois le plus chaud</th>
                      <th className="text-left py-2 px-3 text-text-muted font-medium">Temp. max moy.</th>
                      <th className="text-left py-2 px-3 text-text-muted font-medium">🌧 Mois le plus pluvieux</th>
                      <th className="text-left py-2 px-3 text-text-muted font-medium">Précip. (mm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extremes.map((e: any) => (
                      <tr key={e.year} className="border-b border-border/50 hover:bg-bg transition">
                        <td className="py-2 px-3 font-semibold">{e.year}</td>
                        <td className="py-2 px-3">{e.hottest_month ? e.hottest_month : "—"}</td>
                        <td className="py-2 px-3 text-red-600 font-medium">{e.hottest_temp != null ? `${e.hottest_temp}°C` : "—"}</td>
                        <td className="py-2 px-3">{e.wettest_month ? e.wettest_month : "—"}</td>
                        <td className="py-2 px-3 text-blue-600 font-medium">{e.wettest_precip != null ? `${e.wettest_precip} mm` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

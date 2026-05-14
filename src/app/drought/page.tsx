"use client";
import { useState, useMemo } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import Card from "@/components/Card";
import LoadingSpinner from "@/components/LoadingSpinner";
import LocationSelect from "@/components/LocationSelect";
import MapView from "@/components/MapView";
import { formatNumber, formatDate, getDroughtLabel } from "@/lib/utils";
import { useThresholds, DROUGHT_COLORS, DROUGHT_CHART_COLORS } from "@/lib/thresholds";
import { 
  Droplets, Sun, CloudRain, AlertTriangle, TrendingDown, 
  Calendar, Clock, Thermometer 
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, ReferenceLine, ReferenceArea, Area, ComposedChart, Bar, Label
} from "recharts";

interface DroughtData {
  observed_at: string;
  spi_value: number;
  precipitation_30d: number;
  precipitation_90d: number;
  evapotranspiration?: number;
  drought_level?: string;
}

function makeSPIStatus(t: { moderate: number; severe: number; extreme: number }) {
  return function getSPIStatus(spi: number) {
    if (spi <= t.extreme)  return { label: "Extrême",      color: DROUGHT_COLORS.extreme.hex,  bg: DROUGHT_COLORS.extreme.bg,  text: DROUGHT_COLORS.extreme.color,  border: DROUGHT_COLORS.extreme.border };
    if (spi <= t.severe)   return { label: "Sévère",        color: DROUGHT_COLORS.severe.hex,   bg: DROUGHT_COLORS.severe.bg,   text: DROUGHT_COLORS.severe.color,   border: DROUGHT_COLORS.severe.border };
    if (spi <= t.moderate) return { label: "Modérée",       color: DROUGHT_COLORS.moderate.hex, bg: DROUGHT_COLORS.moderate.bg, text: DROUGHT_COLORS.moderate.color, border: DROUGHT_COLORS.moderate.border };
    if (spi < 0)           return { label: "Anomalie sèche", color: DROUGHT_COLORS.mild.hex,     bg: DROUGHT_COLORS.mild.bg,     text: DROUGHT_COLORS.mild.color,     border: DROUGHT_COLORS.mild.border };
    return { label: "Normale", color: DROUGHT_COLORS.normal.hex, bg: DROUGHT_COLORS.normal.bg, text: DROUGHT_COLORS.normal.color, border: DROUGHT_COLORS.normal.border };
  };
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

export default function DroughtPage() {
  const [locationId, setLocationId] = useState("ouagadougou");
  const [locationName, setLocationName] = useState("Ouagadougou");
  const [daysRange, setDaysRange] = useState(180);
  const thresholds = useThresholds();
  const dt = thresholds.drought;
  const getSPIStatus = makeSPIStatus(dt);

  const history = useApi(() => api.getDroughtHistory(locationId, daysRange), [locationId, daysRange], "drought-history");
  const droughtMap = useApi(() => api.getDroughtMap(), [], "drought-map");

  const rawData: DroughtData[] = Array.isArray(history.data?.data) ? history.data?.data : [];

  // KPI calculations
  const kpis = useMemo(() => {
    if (rawData.length === 0) return null;
    const latest = rawData[rawData.length - 1];
    const spiStatus = getSPIStatus(latest.spi_value);
    
    // Days since last rain (precip > 1mm)
    let daysSinceRain = 0;
    for (let i = rawData.length - 1; i >= 0; i--) {
      if (rawData[i].precipitation_30d > rawData[i-1]?.precipitation_30d || i === 0) break;
      daysSinceRain++;
    }

    // Deficit vs normal (assuming SPI 0 = normal)
    const deficit = Math.abs(latest.spi_value);
    const deficitPercent = Math.min(100, Math.round(deficit * 50)); // Approximate conversion

    // Find longest drought episode
    let maxDroughtDays = 0;
    let currentDroughtDays = 0;
    for (const d of rawData) {
      if (d.spi_value < dt.moderate) {
        currentDroughtDays++;
        maxDroughtDays = Math.max(maxDroughtDays, currentDroughtDays);
      } else {
        currentDroughtDays = 0;
      }
    }

    return {
      latest,
      spiStatus,
      daysSinceRain,
      deficitPercent,
      maxDroughtDays,
    };
  }, [rawData]);

  // Episodes de sécheresse
  const episodes = useMemo(() => {
    const eps: Array<{
      start: string;
      end: string;
      duration: number;
      maxSeverity: number;
      severityLabel: string;
    }> = [];
    let inDrought = false;
    let startDate = "";
    let maxSeverity = 0;

    for (const d of rawData) {
      if (d.spi_value < dt.moderate && !inDrought) {
        inDrought = true;
        startDate = d.observed_at;
        maxSeverity = d.spi_value;
      } else if (d.spi_value < dt.moderate && inDrought) {
        maxSeverity = Math.min(maxSeverity, d.spi_value);
      } else if (d.spi_value >= dt.moderate && inDrought) {
        inDrought = false;
        const duration = Math.ceil(
          (new Date(d.observed_at).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        const status = getSPIStatus(maxSeverity);
        eps.push({
          start: startDate,
          end: d.observed_at,
          duration,
          maxSeverity,
          severityLabel: status.label,
        });
      }
    }
    return eps.slice(-5).reverse(); // 5 derniers épisodes, plus récent en premier
  }, [rawData]);

  const historyChart = rawData.map((d) => ({
    date: formatShortDate(d.observed_at),
    fullDate: d.observed_at,
    SPI: Number(d.spi_value.toFixed(2)),
    precip30: d.precipitation_30d,
    precip90: d.precipitation_90d,
    et: d.evapotranspiration,
    status: getSPIStatus(d.spi_value).label,
  }));

  const droughtMapData = droughtMap.data?.data;
  const mapPoints = (Array.isArray(droughtMapData) ? droughtMapData : [])
    .filter((d: any) => d?.location)
    .map((d: any) => ({
    id: d.location.external_id,
    name: d.location.name,
    latitude: d.location.latitude,
    longitude: d.location.longitude,
    value: d.latest?.spi_value || 0,
    label: d.latest ? `SPI: ${formatNumber(d.latest.spi_value)}` : "N/A",
    risk: d.latest?.drought_level || "normal",
  }));

  const hasData = rawData.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Droplets className="w-7 h-7 text-amber-600" /> Suivi de la Sécheresse
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Indice standardisé de précipitations (SPI) — {locationName}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-muted whitespace-nowrap">Période :</label>
            <select
              value={daysRange}
              onChange={(e) => setDaysRange(Number(e.target.value))}
              className="border border-border rounded-lg px-3 py-1.5 text-sm bg-card text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={30}>30 jours</option>
              <option value={90}>3 mois</option>
              <option value={180}>6 mois</option>
              <option value={365}>1 an</option>
            </select>
          </div>
          <LocationSelect
            value={locationId}
            onChange={(id, loc) => { setLocationId(id); setLocationName(loc.name); }}
            className="w-64"
          />
        </div>
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpis.spiStatus.bg}`}>
                <Sun className={`w-5 h-5 ${kpis.spiStatus.text}`} />
              </div>
              <div>
                <p className="text-xs text-text-muted">SPI actuel</p>
                <p className="font-bold text-lg">{formatNumber(kpis.latest.spi_value)}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${kpis.spiStatus.bg} ${kpis.spiStatus.text} border ${kpis.spiStatus.border}`}>
                  {kpis.spiStatus.label}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Jours sans pluie</p>
                <p className="font-bold text-lg">{kpis.daysSinceRain}</p>
                <p className="text-[10px] text-text-muted">depuis dernière précipitation</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <TrendingDown className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Déficit hydrique</p>
                <p className="font-bold text-lg">~{kpis.deficitPercent}%</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all" 
                    style={{ width: `${kpis.deficitPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Épisode le plus long</p>
                <p className="font-bold text-lg">{kpis.maxDroughtDays}j</p>
                <p className="text-[10px] text-text-muted">sur la période</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Carte */}
      <Card title="Carte des conditions de sécheresse" icon={<Droplets className="w-5 h-5" />}>
        <MapView
          points={mapPoints}
          height="380px"
          colorFn={(p) => DROUGHT_COLORS[(p.risk as keyof typeof DROUGHT_COLORS) ?? "normal"]?.hex ?? DROUGHT_COLORS.normal.hex}
          radiusFn={() => 10}
        />
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {[
            { label: "Normale",        color: DROUGHT_COLORS.normal.hex,   bg: DROUGHT_COLORS.normal.bg,   text: DROUGHT_COLORS.normal.color },
            { label: "Anomalie sèche", color: DROUGHT_COLORS.mild.hex,     bg: DROUGHT_COLORS.mild.bg,     text: DROUGHT_COLORS.mild.color },
            { label: "Modérée",        color: DROUGHT_COLORS.moderate.hex, bg: DROUGHT_COLORS.moderate.bg, text: DROUGHT_COLORS.moderate.color },
            { label: "Sévère",         color: DROUGHT_COLORS.severe.hex,   bg: DROUGHT_COLORS.severe.bg,   text: DROUGHT_COLORS.severe.color },
            { label: "Extrême",         color: DROUGHT_COLORS.extreme.hex,  bg: DROUGHT_COLORS.extreme.bg,  text: DROUGHT_COLORS.extreme.color },
          ].map((s) => (
            <span key={s.label} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full ${s.bg} ${s.text} border`}>
              <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </Card>

      {history.loading ? <LoadingSpinner /> : hasData ? (
        <>
          {/* SPI Chart avec zones colorées */}
          <Card 
            title="Évolution de l'indice SPI" 
            subtitle="Suivi temporel avec seuils de sécheresse"
            icon={<Thermometer className="w-5 h-5" />}
          >
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={historyChart} margin={{ top: 30, right: 50, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="spiNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={DROUGHT_CHART_COLORS.spi_fill} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={DROUGHT_CHART_COLORS.spi_fill} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }} 
                  interval={Math.floor(historyChart.length / 8)}
                />
                
                <YAxis 
                  tick={{ fontSize: 11 }} 
                  domain={[-2.5, 1]} 
                  tickFormatter={(v) => `${v}`}
                />
                
                <Tooltip 
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(l, payload: any) => {
                    const d = payload?.[0]?.payload?.fullDate;
                    return d ? formatFullDate(d) : l;
                  }}
                  formatter={(val: any, name: string, props: any) => {
                    const status = props?.payload?.status;
                    return [`${val} (${status})`, "SPI"];
                  }}
                />
                
                <Legend 
                  verticalAlign="top" 
                  height={30}
                  content={() => (
                    <div className="flex flex-wrap justify-center gap-3 text-[10px] text-text-muted mb-2">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500/20 border border-green-500" /> Normale (SPI ≥ 0)</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400/20 border border-blue-400" /> Anomalie (-1 à 0)</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400/20 border border-amber-400" /> Modérée (-1.5 à -1)</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-400/20 border border-orange-400" /> Sévère (-2 à -1.5)</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/20 border border-red-500" /> Extrême (&lt; -2)</span>
                    </div>
                  )}
                />
                
                {/* Zones de référence */}
                <ReferenceArea y1={0}          y2={1}           stroke={DROUGHT_COLORS.normal.hex}   strokeOpacity={0.3} fill={DROUGHT_COLORS.normal.hex}   fillOpacity={0.05} />
                <ReferenceArea y1={dt.moderate} y2={0}           stroke={DROUGHT_COLORS.mild.hex}     strokeOpacity={0.3} fill={DROUGHT_COLORS.mild.hex}     fillOpacity={0.05} />
                <ReferenceArea y1={dt.severe}   y2={dt.moderate} stroke={DROUGHT_COLORS.moderate.hex} strokeOpacity={0.3} fill={DROUGHT_COLORS.moderate.hex} fillOpacity={0.05} />
                <ReferenceArea y1={dt.extreme}  y2={dt.severe}   stroke={DROUGHT_COLORS.severe.hex}   strokeOpacity={0.3} fill={DROUGHT_COLORS.severe.hex}   fillOpacity={0.05} />
                <ReferenceArea y1={-2.5}        y2={dt.extreme}  stroke={DROUGHT_COLORS.extreme.hex}  strokeOpacity={0.3} fill={DROUGHT_COLORS.extreme.hex}  fillOpacity={0.05} />

                {/* Lignes de seuil avec labels au-dessus */}
                <ReferenceLine y={0}          stroke={DROUGHT_COLORS.normal.hex}   strokeDasharray="3 3" strokeWidth={1.5}>
                  <Label value="Normale"  position="top" fill={DROUGHT_COLORS.normal.hex}   fontSize={10} dx={5} />
                </ReferenceLine>
                <ReferenceLine y={dt.moderate} stroke={DROUGHT_COLORS.moderate.hex} strokeDasharray="5 5" strokeWidth={1.5}>
                  <Label value="Modérée" position="top" fill={DROUGHT_COLORS.moderate.hex} fontSize={10} dx={5} />
                </ReferenceLine>
                <ReferenceLine y={dt.severe}   stroke={DROUGHT_COLORS.severe.hex}   strokeDasharray="5 5" strokeWidth={1.5}>
                  <Label value="Sévère"  position="top" fill={DROUGHT_COLORS.severe.hex}   fontSize={10} dx={5} />
                </ReferenceLine>
                <ReferenceLine y={dt.extreme}  stroke={DROUGHT_COLORS.extreme.hex}  strokeDasharray="5 5" strokeWidth={1.5}>
                  <Label value="Extrême" position="top" fill={DROUGHT_COLORS.extreme.hex}  fontSize={10} dx={5} />
                </ReferenceLine>
                
                {/* Ligne SPI */}
                <Area 
                  type="monotone" 
                  dataKey="SPI" 
                  stroke={DROUGHT_CHART_COLORS.spi_line} 
                  strokeWidth={3}
                  fill="url(#spiNormal)"
                  dot={(p: any) => {
                    const val = p.payload?.SPI;
                    const color = val < dt.extreme ? DROUGHT_COLORS.extreme.hex : val < dt.severe ? DROUGHT_COLORS.severe.hex : val < dt.moderate ? DROUGHT_COLORS.moderate.hex : val < 0 ? DROUGHT_COLORS.mild.hex : DROUGHT_COLORS.normal.hex;
                    return <circle key={`dot-${p.index}`} cx={p.cx} cy={p.cy} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />;
                  }}
                  activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
            
            <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-[10px] text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Extrême (SPI &lt; -2)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                Sévère (-2 à -1.5)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Modérée (-1.5 à -1)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                Anomalie (-1 à 0)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                Normale (≥ 0)
              </span>
            </div>
          </Card>

          {/* Précipitations cumulées */}
          <Card 
            title="Précipitations cumulées" 
            subtitle="Comparaison 30 jours vs 90 jours"
            icon={<CloudRain className="w-5 h-5" />}
          >
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={historyChart} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }} 
                  interval={Math.floor(historyChart.length / 8)}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 11 }} 
                  tickFormatter={(v) => `${v}mm`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(l, payload: any) => {
                    const d = payload?.[0]?.payload?.fullDate;
                    return d ? formatFullDate(d) : l;
                  }}
                  formatter={(val: any, name: string) => [`${Math.round(Number(val))} mm`, name]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                
                <Bar 
                  yAxisId="left"
                  dataKey="precip30" 
                  name="30 jours" 
                  fill={DROUGHT_CHART_COLORS.precip_30d} 
                  radius={[2, 2, 0, 0]}
                  opacity={0.8}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="precip90" 
                  name="90 jours" 
                  stroke={DROUGHT_CHART_COLORS.precip_90d} 
                  strokeWidth={2.5}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
            
            <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-[10px] text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-300" />
                Précipitations 30 jours (courtes périodes)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-800" />
                Précipitations 90 jours (tendance long terme)
              </span>
            </div>
          </Card>

          {/* Tableau des épisodes de sécheresse */}
          {episodes.length > 0 && (
            <Card 
              title="Épisodes de sécheresse récents" 
              subtitle="Début, fin, durée et intensité maximale"
              icon={<Calendar className="w-5 h-5" />}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2.5 px-3 text-text-muted font-medium">Début</th>
                      <th className="text-left py-2.5 px-3 text-text-muted font-medium">Fin</th>
                      <th className="text-left py-2.5 px-3 text-text-muted font-medium">Durée</th>
                      <th className="text-left py-2.5 px-3 text-text-muted font-medium">Sévérité max</th>
                      <th className="text-left py-2.5 px-3 text-text-muted font-medium">Intensité SPI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {episodes.map((ep, i) => {
                      const status = getSPIStatus(ep.maxSeverity);
                      return (
                        <tr key={i} className="border-b border-border/50 hover:bg-bg transition">
                          <td className="py-2.5 px-3">{formatFullDate(ep.start)}</td>
                          <td className="py-2.5 px-3">{formatFullDate(ep.end)}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold">{ep.duration} jours</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.text} border ${status.border}`}>
                              {ep.severityLabel}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            <span className={ep.maxSeverity < dt.severe ? "text-red-600 font-bold" : ep.maxSeverity < dt.moderate ? "text-amber-600" : "text-blue-600"}>
                              {ep.maxSeverity.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Sévérité sévère à extrême (SPI &lt; -1.5)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Sévérité modérée (SPI -1.5 à -1)
                </span>
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <div className="text-center py-12 text-text-muted">
            <Droplets className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune donnée de sécheresse disponible pour cette période.</p>
            <p className="text-xs mt-1">Sélectionnez une période plus longue ou initialisez le système.</p>
          </div>
        </Card>
      )}
    </div>
  );
}

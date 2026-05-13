"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import Card from "@/components/Card";
import LoadingSpinner from "@/components/LoadingSpinner";
import LocationSelect from "@/components/LocationSelect";
import { formatNumber, formatDate } from "@/lib/utils";
import { CloudSun, Thermometer, Droplets, Wind, Sun, TrendingUp } from "lucide-react";
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from "recharts";

export default function WeatherPage() {
  const [locationId, setLocationId] = useState("ouagadougou");
  const [locationName, setLocationName] = useState("Ouagadougou");

  const forecast = useApi(() => api.getWeatherForecast(locationId), [locationId]);
  const history = useApi(() => api.getWeatherHistory(locationId, 60), [locationId]);
  const predictions = useApi(() => api.getWeatherPredictions(locationId), [locationId]);

  const forecastData = forecast.data?.data;
  const currentData = forecastData?.current;
  const dailyData = forecastData?.daily;

  const dailyChart = dailyData?.time?.map((t: string, i: number) => ({
    date: formatDate(t),
    "Temp. Max": dailyData.temperature_2m_max?.[i] ?? null,
    "Temp. Min": dailyData.temperature_2m_min?.[i] ?? null,
    "Précipitations": dailyData.precipitation_sum?.[i] ?? null,
    "Prob. Pluie": dailyData.precipitation_probability_max?.[i] ?? null,
  })) || [];

  const historyChart = history.data?.data?.map((d: any) => ({
    date: formatDate(d.observed_at),
    "Temp. Max": d.temperature_max ?? null,
    "Temp. Min": d.temperature_min ?? null,
    "Précipitations": d.precipitation ?? null,
    "Humidité": d.humidity ?? null,
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CloudSun className="w-7 h-7 text-primary" /> Prévisions Météorologiques
          </h1>
          <p className="text-sm text-text-secondary mt-1">Données en temps réel et prévisions pour {locationName}</p>
        </div>
        <LocationSelect
          value={locationId}
          onChange={(id, loc) => { setLocationId(id); setLocationName(loc.name); }}
          className="w-64"
        />
      </div>

      {forecast.loading ? <LoadingSpinner /> : (
        <>
          {/* Current conditions */}
          {currentData && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <MetricCard icon={<Thermometer className="w-5 h-5 text-red-500" />} label="Température" value={`${formatNumber(currentData.temperature_2m)}°C`} />
              <MetricCard icon={<Droplets className="w-5 h-5 text-blue-500" />} label="Humidité" value={`${currentData.relative_humidity_2m}%`} />
              <MetricCard icon={<Wind className="w-5 h-5 text-teal-500" />} label="Vent" value={`${formatNumber(currentData.wind_speed_10m)} km/h`} />
              <MetricCard icon={<CloudSun className="w-5 h-5 text-gray-500" />} label="Nuages" value={`${currentData.cloud_cover}%`} />
              <MetricCard icon={<TrendingUp className="w-5 h-5 text-purple-500" />} label="Pression" value={`${formatNumber(currentData.pressure_msl, 0)} hPa`} />
              <MetricCard icon={<Sun className="w-5 h-5 text-amber-500" />} label="Précipitations" value={`${formatNumber(currentData.precipitation)} mm`} />
            </div>
          )}

          {/* Forecast chart */}
          {dailyChart.length > 0 && (
            <Card title="Prévisions à 16 jours" subtitle="Températures, précipitations et probabilité de pluie" icon={<TrendingUp className="w-5 h-5" />}>
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={dailyChart} margin={{ top: 5, right: 30, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="tempMaxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D63031" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#D63031" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="tempMinGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B6FA8" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1B6FA8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="precipGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00B894" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00B894" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="temp" tick={{ fontSize: 11 }} label={{ value: "°C", angle: -90, position: "insideLeft", fontSize: 11 }} />
                  <YAxis yAxisId="rain" orientation="right" tick={{ fontSize: 11 }} label={{ value: "mm / %", angle: 90, position: "insideRight", fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    formatter={(value: any, name: string) => {
                      if (name === "Précipitations") return [`${value} mm`, name];
                      if (name === "Prob. Pluie") return [`${value}%`, name];
                      return [`${value}°C`, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area yAxisId="temp" type="monotone" dataKey="Temp. Max" stroke="#D63031" fill="url(#tempMaxGrad)" strokeWidth={2} />
                  <Area yAxisId="temp" type="monotone" dataKey="Temp. Min" stroke="#1B6FA8" fill="url(#tempMinGrad)" strokeWidth={2} />
                  <Area yAxisId="rain" type="monotone" dataKey="Précipitations" stroke="#00B894" fill="url(#precipGrad)" strokeWidth={2} />
                  <Line yAxisId="rain" type="monotone" dataKey="Prob. Pluie" stroke="#FDCB6E" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}

      {/* Historical data */}
      {!history.loading && historyChart.length > 0 && (
        <Card title="Historique des 60 derniers jours" icon={<CloudSun className="w-5 h-5" />}>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={historyChart} margin={{ top: 5, right: 30, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="histMaxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D63031" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#D63031" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="histMinGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B6FA8" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#1B6FA8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="histPrecipGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00B894" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00B894" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={7} />
              <YAxis yAxisId="temp" tick={{ fontSize: 11 }} label={{ value: "°C", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} label={{ value: "mm / %", angle: 90, position: "insideRight", fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(value: any, name: string) => {
                  if (name === "Précipitations") return [`${value} mm`, name];
                  if (name === "Humidité") return [`${value}%`, name];
                  return [`${value}°C`, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area yAxisId="temp" type="monotone" dataKey="Temp. Max" stroke="#D63031" fill="url(#histMaxGrad)" strokeWidth={2} dot={false} />
              <Area yAxisId="temp" type="monotone" dataKey="Temp. Min" stroke="#1B6FA8" fill="url(#histMinGrad)" strokeWidth={2} dot={false} />
              <Area yAxisId="right" type="monotone" dataKey="Précipitations" stroke="#00B894" fill="url(#histPrecipGrad)" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="Humidité" stroke="#A29BFE" strokeWidth={1.5} dot={false} strokeDasharray="3 2" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center animate-fade-in">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="text-lg font-bold text-text">{value}</p>
    </div>
  );
}

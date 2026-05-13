"use client";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import Card from "@/components/Card";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Info, Cpu, Database, Globe, AlertTriangle, Thermometer,
  Wind, Waves, Droplets, BarChart3, Bell, Leaf, ExternalLink,
  ShieldCheck, Clock, Tag, BookOpen, Server, FlaskConical,
  Zap, CheckCircle,
} from "lucide-react";

// ── helpers ──────────────────────────────────────────────────────────────────

const VERSION_TYPE_STYLE: Record<string, { label: string; cls: string }> = {
  alpha:  { label: "Alpha",  cls: "bg-orange-100 text-orange-700 border-orange-300" },
  beta:   { label: "Bêta",   cls: "bg-blue-100 text-blue-700 border-blue-300" },
  rc:     { label: "RC",     cls: "bg-purple-100 text-purple-700 border-purple-300" },
  stable: { label: "Stable", cls: "bg-green-100 text-green-700 border-green-300" },
};

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
      <div className="text-primary">{icon}</div>
      <h2 className="text-base font-bold text-text">{title}</h2>
    </div>
  );
}

function ThresholdRow({ label, value, unit, color }: { label: string; value: number | string; unit: string; color?: string }) {
  return (
    <div className="flex items-center justify-between text-xs py-1.5 border-b border-border/40">
      <span className="text-text-muted">{label}</span>
      <span className={`font-semibold font-mono ${color || "text-text"}`}>{value} <span className="font-normal text-text-muted">{unit}</span></span>
    </div>
  );
}

function ApiCard({ name, url, description, endpoints }: { name: string; url: string; description: string; endpoints: string[] }) {
  return (
    <div className="border border-border rounded-xl p-4 bg-bg space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm text-text">{name}</p>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-primary hover:underline shrink-0">
          {url.replace("https://", "")} <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <p className="text-xs text-text-muted">{description}</p>
      <div className="flex flex-wrap gap-1 pt-1">
        {endpoints.map(e => (
          <code key={e} className="text-[10px] bg-card border border-border rounded px-1.5 py-0.5 text-text-muted">{e}</code>
        ))}
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const cfg = useApi(() => api.getConfig(), []);
  const app = cfg.data?.app;
  const country = cfg.data?.country;
  const dc = cfg.data?.data_collection;
  const ml = cfg.data?.ml;

  const vt = app?.version_type || "alpha";
  const vtStyle = VERSION_TYPE_STYLE[vt] || VERSION_TYPE_STYLE.alpha;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* ── Hero ── */}
      <div className="bg-card border border-border rounded-2xl p-6 flex items-start gap-5">
        <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          {cfg.loading ? <LoadingSpinner /> : (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-text">{app?.name || "EcoWatch Burkina"}</h1>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${vtStyle.cls}`}>
                  {vtStyle.label}
                </span>
                <span className="text-xs text-text-muted bg-bg border border-border rounded-full px-2.5 py-1 font-mono">
                  v{app?.version || "1.0.0"}
                </span>
              </div>
              <p className="text-sm text-text-secondary mt-2">{app?.description}</p>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-text-muted">
                {app?.release_date && (
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Publiée le {new Date(app.release_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                )}
                {app?.build_number && (
                  <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Build {app.build_number}</span>
                )}
                {country && (
                  <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {country.name} ({country.code}) · UTC+0</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Présentation ── */}
      <Card>
        <SectionTitle icon={<Info className="w-4.5 h-4.5" />} title="Présentation du système" />
        <div className="prose prose-sm text-text-secondary max-w-none space-y-3 text-sm">
          <p>
            <strong className="text-text">EcoWatch Burkina</strong> est un système national de surveillance environnementale en temps réel,
            couvrant <strong className="text-text">45 villes</strong> sur l'ensemble du territoire burkinabè. Il collecte, traite et
            visualise des données issues de sources satellites et de modèles numériques de référence mondiale.
          </p>
          <p>
            Le système intègre six domaines de surveillance : <strong className="text-text">météorologie</strong>,
            <strong className="text-text"> qualité de l'air</strong>, <strong className="text-text">hydrologie (inondations)</strong>,
            <strong className="text-text"> sécheresse</strong>, <strong className="text-text">climat long terme</strong>
            et <strong className="text-text">alertes automatiques</strong>. Il génère des prédictions par apprentissage automatique
            et publie des rapports exportables.
          </p>
          <p>
            Cette version <span className={`font-semibold px-1.5 py-0.5 rounded ${vtStyle.cls}`}>{vtStyle.label}</span> est
            une version de développement en cours de validation. Les données affichées proviennent exclusivement
            d'API ouvertes certifiées — aucune valeur n'est inventée ou simulée.
          </p>
        </div>
      </Card>

      {/* ── Modules ── */}
      <Card>
        <SectionTitle icon={<Cpu className="w-4.5 h-4.5" />} title="Modules fonctionnels" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: <Thermometer className="w-4 h-4 text-orange-500" />, title: "Météo", desc: "Température, humidité, vent, précipitations, pression, indice UV. Données actuelles + prévisions 16 jours + historique." },
            { icon: <Wind className="w-4 h-4 text-teal-500" />, title: "Qualité de l'air", desc: "PM2.5, PM10, NO₂, SO₂, O₃, CO, poussière. Indice AQI européen (EAQI). Données horaires." },
            { icon: <Waves className="w-4 h-4 text-blue-500" />, title: "Inondations", desc: "Débit fluvial (m³/s) et niveau de risque (GloFAS). Prévisions 92 jours. Carte de risque nationale." },
            { icon: <Droplets className="w-4 h-4 text-amber-500" />, title: "Sécheresse", desc: "SPI (Standardized Precipitation Index) WMO. Précipitations 30j/90j, évapotranspiration, humidité du sol." },
            { icon: <BarChart3 className="w-4 h-4 text-purple-500" />, title: "Climat", desc: "Tendances climatiques long terme depuis ERA5/Open-Meteo. Anomalies de température, évolution annuelle et saisonnière." },
            { icon: <Bell className="w-4 h-4 text-red-500" />, title: "Alertes", desc: "Génération automatique d'alertes quand les seuils sont dépassés. 4 niveaux : Surveillance, Avertissement, Danger, Critique." },
            { icon: <BarChart3 className="w-4 h-4 text-green-600" />, title: "Rapport", desc: "Rapport de synthèse agrégé sur toutes les villes. Export PDF (impression), CSV et JSON." },
            { icon: <Database className="w-4 h-4 text-indigo-500" />, title: "Export données", desc: "Catalogue complet de 7 jeux de données avec dictionnaire des champs, unités, normes. Prévisualisation et téléchargement." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-3 p-3 bg-bg border border-border rounded-xl">
              <div className="mt-0.5 shrink-0">{icon}</div>
              <div>
                <p className="text-sm font-semibold text-text">{title}</p>
                <p className="text-xs text-text-muted mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── APIs ── */}
      <Card>
        <SectionTitle icon={<Globe className="w-4.5 h-4.5" />} title="Sources de données (APIs)" />
        <div className="space-y-3">
          <ApiCard
            name="Open-Meteo — Météo & Prévisions"
            url="https://open-meteo.com"
            description="API météorologique open-source basée sur les modèles ECMWF, GFS et DWD. Données en temps réel et prévisions jusqu'à 16 jours. Aucune clé API requise. Résolution : ~1 km."
            endpoints={["GET /v1/forecast", "GET /v1/archive (ERA5)"]}
          />
          <ApiCard
            name="Open-Meteo — Qualité de l'air"
            url="https://open-meteo.com"
            description="Concentrations de polluants atmosphériques (Copernicus CAMS). Inclut PM2.5, PM10, NO₂, SO₂, O₃, CO, poussière saharienne. Mise à jour horaire."
            endpoints={["GET /v1/air-quality"]}
          />
          <ApiCard
            name="Open-Meteo — GloFAS (Hydrologie)"
            url="https://open-meteo.com"
            description="Débit fluvial issu du modèle Global Flood Awareness System de Copernicus/ECMWF. Prévisions de débit jusqu'à 92 jours pour les principaux bassins versants."
            endpoints={["GET /v1/flood"]}
          />
          <ApiCard
            name="ERA5 / Open-Meteo Historical"
            url="https://open-meteo.com"
            description="Réanalyse atmosphérique ERA5 de l'ECMWF. Données historiques depuis 1940. Utilisée pour les tendances climatiques long terme et le calcul du SPI."
            endpoints={["GET /v1/archive (historical)"]}
          />
        </div>
        <div className="mt-3 flex items-start gap-2 text-xs text-text-muted bg-bg border border-border rounded-lg p-3">
          <ShieldCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <span>Toutes les sources sont <strong className="text-text">gratuites, certifiées et sans clé API propriétaire</strong>. Les données respectent les licences CC BY 4.0 (Open-Meteo) et Copernicus Data License (ERA5/GloFAS).</span>
        </div>
      </Card>

      {/* ── Seuils d'alerte ── */}
      <Card>
        <SectionTitle icon={<AlertTriangle className="w-4.5 h-4.5 text-warning" />} title="Seuils d'alerte" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Inondations */}
          <div>
            <p className="text-xs font-semibold text-blue-700 flex items-center gap-1 mb-2">
              <Waves className="w-3.5 h-3.5" /> Inondations (débit)
            </p>
            <ThresholdRow label="Faible"    value="< 10"    unit="m³/s" color="text-green-600" />
            <ThresholdRow label="Modéré"    value="10 – 50" unit="m³/s" color="text-yellow-600" />
            <ThresholdRow label="Élevé"     value="50 – 100" unit="m³/s" color="text-orange-600" />
            <ThresholdRow label="Extrême"   value="> 100"   unit="m³/s" color="text-red-600" />
            <p className="text-[10px] text-text-muted mt-2">Source : percentiles GloFAS + seuils configurables</p>
          </div>

          {/* Qualité de l'air */}
          <div>
            <p className="text-xs font-semibold text-teal-700 flex items-center gap-1 mb-2">
              <Wind className="w-3.5 h-3.5" /> Qualité de l'air (AQI)
            </p>
            <ThresholdRow label="Bon"        value="0 – 20"  unit="AQI" color="text-green-600" />
            <ThresholdRow label="Acceptable" value="21 – 40" unit="AQI" color="text-lime-600" />
            <ThresholdRow label="Modéré"     value="41 – 60" unit="AQI" color="text-yellow-600" />
            <ThresholdRow label="Mauvais"    value="61 – 80" unit="AQI" color="text-orange-600" />
            <ThresholdRow label="Très mauvais" value="> 80" unit="AQI" color="text-red-600" />
            <p className="text-[10px] text-text-muted mt-2">Norme : EAQI (Agence Européenne pour l'Environnement)</p>
          </div>

          {/* Sécheresse */}
          <div>
            <p className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-2">
              <Droplets className="w-3.5 h-3.5" /> Sécheresse (SPI)
            </p>
            <ThresholdRow label="Normal"         value="≥ −0.5"         unit="SPI" color="text-green-600" />
            <ThresholdRow label="Anomalie sèche" value="−1.0 à −0.5"    unit="SPI" color="text-blue-500" />
            <ThresholdRow label="Modérée"        value="−1.5 à −1.0"    unit="SPI" color="text-yellow-600" />
            <ThresholdRow label="Sévère"         value="−2.0 à −1.5"    unit="SPI" color="text-orange-600" />
            <ThresholdRow label="Extrême"        value="< −2.0"         unit="SPI" color="text-red-600" />
            <p className="text-[10px] text-text-muted mt-2">Norme : WMO-No. 1090 (SPI)</p>
          </div>

          {/* Température */}
          <div>
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1 mb-2">
              <Thermometer className="w-3.5 h-3.5" /> Canicule (température)
            </p>
            <ThresholdRow label="Avertissement chaleur" value="> 42" unit="°C" color="text-orange-600" />
            <ThresholdRow label="Chaleur extrême"       value="> 45" unit="°C" color="text-red-600" />
            <ThresholdRow label="Avertissement froid"   value="< 10" unit="°C" color="text-blue-500" />
            <p className="text-[10px] text-text-muted mt-2">Adapté au contexte climatique du Burkina Faso</p>
          </div>
        </div>
      </Card>

      {/* ── Unités de mesure ── */}
      <Card>
        <SectionTitle icon={<BookOpen className="w-4.5 h-4.5" />} title="Unités de mesure" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
          {[
            { var: "Température",              unit: "°C (Celsius)",              note: "2 m du sol" },
            { var: "Humidité relative",        unit: "% (pourcentage)",           note: "2 m du sol" },
            { var: "Précipitations",           unit: "mm (millimètres)",          note: "Cumul sur la période" },
            { var: "Vitesse du vent",          unit: "km/h",                      note: "10 m du sol" },
            { var: "Direction du vent",        unit: "° (degrés)",                note: "0°=Nord, 90°=Est" },
            { var: "Pression atmosphérique",   unit: "hPa (hectopascals)",        note: "Niveau mer" },
            { var: "Couverture nuageuse",      unit: "% (pourcentage)",           note: "" },
            { var: "Indice UV",                unit: "Adimensionnel (0–11+)",     note: "Max journalier" },
            { var: "Évapotranspiration",       unit: "mm/jour",                   note: "ET0 FAO-56" },
            { var: "PM2.5",                    unit: "µg/m³",                     note: "Seuil OMS : 15 µg/m³/j" },
            { var: "PM10",                     unit: "µg/m³",                     note: "Seuil OMS : 45 µg/m³/j" },
            { var: "NO₂, SO₂, O₃, CO",        unit: "µg/m³",                     note: "Polluants gazeux" },
            { var: "AQI (Qualité air)",        unit: "Adimensionnel (0–100+)",    note: "Échelle EAQI" },
            { var: "Débit fluvial",            unit: "m³/s (mètres cubes/s)",     note: "GloFAS" },
            { var: "Niveau d'eau",             unit: "m (mètres)",                note: "" },
            { var: "SPI",                      unit: "Adimensionnel",             note: "Standardized Precipitation Index" },
            { var: "Humidité du sol",          unit: "m³/m³",                     note: "Fraction volumique" },
            { var: "Rayonnement solaire",      unit: "MJ/m²/jour",               note: "Rayonnement global" },
            { var: "Latitude / Longitude",     unit: "° (WGS84)",                 note: "Coordonnées géographiques" },
            { var: "Altitude",                 unit: "m (mètres)",                note: "WGS84" },
            { var: "Population",               unit: "Habitants",                 note: "Estimation" },
          ].map(({ var: v, unit, note }) => (
            <div key={v} className="flex items-start justify-between text-xs py-1.5 border-b border-border/30 gap-2">
              <span className="text-text font-medium min-w-[150px]">{v}</span>
              <span className="text-right">
                <span className="font-mono text-primary">{unit}</span>
                {note && <span className="block text-[10px] text-text-muted">{note}</span>}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Machine Learning ── */}
      <Card>
        <SectionTitle icon={<Zap className="w-4.5 h-4.5 text-yellow-500" />} title="Modèles de prédiction (ML)" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "Météo",        algo: "Gradient Boosting", horizon: "7 jours",  features: ["Temp. moy.", "Humidité", "Précip.", "Vent", "Jour de l'année", "Mois"] },
            { name: "Inondations",  algo: "Random Forest",     horizon: "30 jours", features: ["Débit fluvial", "Précip. 7j", "Précip. 30j", "Mois", "Jour de l'année"] },
            { name: "Qualité air",  algo: "Gradient Boosting", horizon: "3 jours",  features: ["PM10", "PM2.5", "Poussière", "Température", "Humidité", "Vent", "Mois"] },
            { name: "Sécheresse",   algo: "Random Forest",     horizon: "30 jours", features: ["Précip. 30j", "Précip. 90j", "Temp. moy.", "ET0", "Mois"] },
          ].map(({ name, algo, horizon, features }) => (
            <div key={name} className="border border-border rounded-xl p-4 bg-bg space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-text">{name}</p>
                <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">{algo}</span>
              </div>
              <p className="text-xs text-text-muted">Horizon : <strong className="text-text">{horizon}</strong></p>
              <div className="flex flex-wrap gap-1">
                {features.map(f => (
                  <span key={f} className="text-[10px] bg-card border border-border rounded px-1.5 py-0.5 text-text-muted">{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-text-muted bg-bg border border-border rounded-lg p-3 flex items-start gap-2">
          <FlaskConical className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
          <span>Les modèles sont entraînés localement sur les données collectées. Ré-entraînement automatique toutes les <strong className="text-text">{ml?.retrain_frequency_hours || 24}h</strong>. Jeu de test : 20 % des données. Algorithmes scikit-learn.</span>
        </div>
      </Card>

      {/* ── Stack technique ── */}
      <Card>
        <SectionTitle icon={<Server className="w-4.5 h-4.5" />} title="Architecture technique" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { layer: "Frontend", tech: "Next.js 14 (App Router)", detail: "React 18, TypeScript, TailwindCSS, Recharts, Lucide" },
            { layer: "Backend",  tech: "FastAPI (Python 3.13)",    detail: "Uvicorn, Pydantic, httpx, APScheduler, scikit-learn" },
            { layer: "Base de données", tech: "Supabase (PostgreSQL)", detail: "PostGIS, RLS, UUID v4, index spatiaux" },
            { layer: "Collecte", tech: "Scheduler asynchrone", detail: "Météo 1h, Qualité air 2h, Inondations 6h, Climat 24h" },
          ].map(({ layer, tech, detail }) => (
            <div key={layer} className="border border-border rounded-xl p-4 bg-bg">
              <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">{layer}</p>
              <p className="text-sm font-semibold text-text mt-1">{tech}</p>
              <p className="text-xs text-text-muted mt-1">{detail}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Normes et standards ── */}
      <Card>
        <SectionTitle icon={<CheckCircle className="w-4.5 h-4.5 text-green-600" />} title="Normes et standards respectés" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { std: "WMO-No. 1090",     desc: "Standardized Precipitation Index (SPI) — sécheresse" },
            { std: "ISO 19156",        desc: "Observations & Measurements — météo et climat" },
            { std: "ISO 19115",        desc: "Geographic Information Metadata — localités" },
            { std: "EAQI",            desc: "European Air Quality Index — qualité de l'air" },
            { std: "GloFAS",           desc: "Global Flood Awareness System — hydrologie" },
            { std: "CAP (ITU-T X.1303)", desc: "Common Alerting Protocol — alertes" },
            { std: "ERA5 (ECMWF)",    desc: "Réanalyse atmosphérique — données climatiques" },
            { std: "FAO-56 Penman-Monteith", desc: "Évapotranspiration de référence" },
          ].map(({ std, desc }) => (
            <div key={std} className="flex items-start gap-2 text-xs py-1.5 border-b border-border/40">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-text">{std}</span>
                <span className="text-text-muted"> — {desc}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Changelog ── */}
      {app?.changelog && app.changelog.length > 0 && (
        <Card>
          <SectionTitle icon={<Tag className="w-4.5 h-4.5" />} title="Historique des versions" />
          <div className="space-y-3">
            {app.changelog.map((entry: any) => (
              <div key={entry.version} className="flex gap-4 text-sm">
                <div className="shrink-0 text-right">
                  <p className="font-mono font-bold text-primary text-xs">{entry.version}</p>
                  <p className="text-[10px] text-text-muted">{entry.date}</p>
                </div>
                <div className="border-l-2 border-border pl-4 pb-3">
                  <p className="text-text-secondary text-xs">{entry.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Footer note ── */}
      <p className="text-[11px] text-text-muted text-center pb-4">
        {app?.name} v{app?.version}-{vt} · {app?.release_date} ·
        Données : Open-Meteo (CC BY 4.0), ERA5/GloFAS (Copernicus Data License) ·
        Système développé pour le suivi environnemental national du Burkina Faso
      </p>
    </div>
  );
}

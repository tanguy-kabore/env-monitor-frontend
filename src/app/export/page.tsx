"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import Card from "@/components/Card";
import LoadingSpinner from "@/components/LoadingSpinner";
import LocationSelect from "@/components/LocationSelect";
import {
  Database, Download, Eye, EyeOff, ChevronLeft, ChevronRight,
  Info, Table, FileJson, FileText, Search, X, Tag, BookOpen,
  Thermometer, Wind, Waves, Droplets, Bell, MapPin, BarChart3,
} from "lucide-react";

// ── types ────────────────────────────────────────────────────────────────────

interface FieldDef {
  col: string;
  label: string;
  unit: string;
  type: string;
  note: string;
}

interface DatasetMeta {
  key: string;
  label: string;
  description: string;
  source: string;
  standard: string;
  row_count: number | null;
  fields: FieldDef[];
}

// ── constants ────────────────────────────────────────────────────────────────

const DS_ICONS: Record<string, React.ReactNode> = {
  weather_data:    <Thermometer className="w-5 h-5 text-orange-500" />,
  air_quality_data:<Wind className="w-5 h-5 text-teal-500" />,
  flood_data:      <Waves className="w-5 h-5 text-blue-500" />,
  drought_data:    <Droplets className="w-5 h-5 text-amber-500" />,
  climate_data:    <BarChart3 className="w-5 h-5 text-purple-500" />,
  alerts:          <Bell className="w-5 h-5 text-red-500" />,
  locations:       <MapPin className="w-5 h-5 text-green-600" />,
};

const DS_COLOR: Record<string, string> = {
  weather_data:    "border-orange-200 bg-orange-50/40",
  air_quality_data:"border-teal-200 bg-teal-50/40",
  flood_data:      "border-blue-200 bg-blue-50/40",
  drought_data:    "border-amber-200 bg-amber-50/40",
  climate_data:    "border-purple-200 bg-purple-50/40",
  alerts:          "border-red-200 bg-red-50/40",
  locations:       "border-green-200 bg-green-50/40",
};

const TYPE_BADGE: Record<string, string> = {
  float:   "bg-blue-100 text-blue-700",
  integer: "bg-violet-100 text-violet-700",
  datetime:"bg-orange-100 text-orange-700",
  text:    "bg-gray-100 text-gray-600",
  boolean: "bg-green-100 text-green-700",
};

const DAYS_OPTIONS = [
  { value: 0,    label: "Toutes" },
  { value: 7,    label: "7 jours" },
  { value: 30,   label: "30 jours" },
  { value: 90,   label: "90 jours" },
  { value: 365,  label: "1 an" },
  { value: 1825, label: "5 ans" },
];

const PAGE_SIZES = [20, 50, 100, 200];

function fmt(v: any): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

// ── component ────────────────────────────────────────────────────────────────

export default function ExportPage() {
  const catalogue = useApi(() => api.getExportCatalogue(), []);
  const datasets: DatasetMeta[] = catalogue.data?.datasets || [];

  const [selected, setSelected] = useState<DatasetMeta | null>(null);
  const [showSchema, setShowSchema] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(0);
  const [colSearch, setColSearch] = useState("");
  const [locationId, setLocationId] = useState<string>("");
  const [exportDays, setExportDays] = useState(0);

  const hasLocationFilter = selected?.key !== "locations" && selected?.key !== "climate_data";

  const loadPreview = useCallback(async (ds: DatasetMeta, pg: number, ps: number, loc: string) => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await api.getExportPreview(ds.key, ps, pg * ps, loc || undefined);
      setPreviewData(res);
    } catch (e: any) {
      setPreviewError(e.message);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showPreview && selected) {
      loadPreview(selected, page, pageSize, locationId);
    }
  }, [showPreview, selected, page, pageSize, locationId]);

  const handleSelect = (ds: DatasetMeta) => {
    setSelected(ds);
    setShowSchema(false);
    setShowPreview(false);
    setPreviewData(null);
    setPage(0);
    setLocationId("");
    setColSearch("");
  };

  const handleDownload = (fmt: "csv" | "json") => {
    if (!selected) return;
    const url = api.getExportDownloadUrl(
      selected.key,
      fmt,
      exportDays > 0 ? exportDays : undefined,
      locationId || undefined,
    );
    window.open(url, "_blank");
  };

  // Columns to display in preview (hide heavy/internal cols)
  const HIDDEN_COLS = new Set(["id", "location_id", "raw_data", "created_at", "updated_at", "metadata"]);
  const previewCols = previewData
    ? Object.keys(previewData.rows?.[0] || {}).filter(c => !HIDDEN_COLS.has(c))
    : [];

  const filteredFields = selected?.fields.filter(f =>
    !colSearch || f.label.toLowerCase().includes(colSearch.toLowerCase()) || f.col.toLowerCase().includes(colSearch.toLowerCase())
  ) || [];

  const totalPages = previewData ? Math.ceil((previewData.total || 0) / pageSize) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="w-7 h-7 text-primary" /> Export des données
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Catalogue des jeux de données — description des champs, unités et prévisualisation
        </p>
      </div>

      {catalogue.loading && <LoadingSpinner message="Chargement du catalogue…" />}

      {!catalogue.loading && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Left: dataset list ── */}
          <div className="xl:col-span-1 space-y-3">
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">
              {datasets.length} jeux de données disponibles
            </p>
            {datasets.map((ds) => (
              <button
                key={ds.key}
                onClick={() => handleSelect(ds)}
                className={`w-full text-left rounded-xl border p-4 transition hover:shadow-sm ${
                  selected?.key === ds.key
                    ? "ring-2 ring-primary border-primary bg-primary/5"
                    : `${DS_COLOR[ds.key] || "border-border bg-card"} hover:border-primary/40`
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{DS_ICONS[ds.key]}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-text truncate">{ds.label}</p>
                    <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2">{ds.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] bg-bg border border-border rounded-full px-2 py-0.5 text-text-muted">
                        {ds.fields.length} champs
                      </span>
                      {ds.row_count !== null && (
                        <span className="text-[10px] bg-bg border border-border rounded-full px-2 py-0.5 text-text-muted">
                          {ds.row_count.toLocaleString("fr-FR")} lignes
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ── Right: detail panel ── */}
          <div className="xl:col-span-2 space-y-4">
            {!selected && (
              <Card>
                <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                  <Database className="w-12 h-12 opacity-20 mb-3" />
                  <p className="text-sm">Sélectionnez un jeu de données pour voir le détail</p>
                </div>
              </Card>
            )}

            {selected && (
              <>
                {/* Dataset header */}
                <Card className={`border-l-4 ${DS_COLOR[selected.key]?.split(" ")[0] || "border-l-primary"}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{DS_ICONS[selected.key]}</div>
                      <div>
                        <h2 className="text-lg font-bold text-text">{selected.label}</h2>
                        <p className="text-sm text-text-secondary mt-1 max-w-xl">{selected.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="flex items-center gap-1 text-xs text-text-muted bg-bg border border-border rounded-full px-2.5 py-1">
                            <BookOpen className="w-3 h-3" /> {selected.source}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-text-muted bg-bg border border-border rounded-full px-2.5 py-1">
                            <Tag className="w-3 h-3" /> {selected.standard}
                          </span>
                          {selected.row_count !== null && (
                            <span className="flex items-center gap-1 text-xs text-text-muted bg-bg border border-border rounded-full px-2.5 py-1">
                              <Table className="w-3 h-3" /> {selected.row_count.toLocaleString("fr-FR")} enregistrements
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Export controls */}
                <Card>
                  <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                    <Download className="w-4 h-4 text-primary" /> Télécharger
                  </h3>
                  <div className="flex flex-wrap items-end gap-3">
                    {/* Location filter */}
                    {hasLocationFilter && (
                      <div className="flex flex-col gap-1 min-w-[200px]">
                        <label className="text-xs text-text-muted">Filtrer par ville</label>
                        <LocationSelect
                          value={locationId}
                          onChange={(id) => setLocationId(id)}
                          className="w-full"
                        />
                        {locationId && (
                          <button
                            onClick={() => setLocationId("")}
                            className="text-[10px] text-text-muted hover:text-danger flex items-center gap-1 mt-0.5"
                          >
                            <X className="w-3 h-3" /> Effacer le filtre
                          </button>
                        )}
                      </div>
                    )}

                    {/* Time range */}
                    {selected.key !== "locations" && (
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-text-muted">Période</label>
                        <select
                          value={exportDays}
                          onChange={e => setExportDays(Number(e.target.value))}
                          className="border border-border rounded-lg px-3 py-1.5 text-sm bg-card text-text focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {DAYS_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Download buttons */}
                    <div className="flex gap-2 pb-0.5">
                      <button
                        onClick={() => handleDownload("csv")}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition"
                      >
                        <FileText className="w-4 h-4" /> CSV
                      </button>
                      <button
                        onClick={() => handleDownload("json")}
                        className="flex items-center gap-2 px-4 py-2 border border-primary text-primary text-sm rounded-lg hover:bg-primary/5 transition"
                      >
                        <FileJson className="w-4 h-4" /> JSON
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-text-muted mt-2">
                    Le fichier CSV inclut une ligne d&apos;en-tête avec les noms techniques, une ligne de libellés et une ligne d&apos;unités. Séparateur : <code>;</code> — Encodage : UTF-8 BOM (compatible Excel).
                  </p>
                </Card>

                {/* Schema / field dictionary */}
                <Card>
                  <button
                    onClick={() => setShowSchema(!showSchema)}
                    className="w-full flex items-center justify-between text-sm font-semibold text-text"
                  >
                    <span className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      Dictionnaire des champs ({selected.fields.length})
                    </span>
                    {showSchema ? <EyeOff className="w-4 h-4 text-text-muted" /> : <Eye className="w-4 h-4 text-text-muted" />}
                  </button>

                  {showSchema && (
                    <div className="mt-4 space-y-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                        <input
                          type="text"
                          placeholder="Rechercher un champ…"
                          value={colSearch}
                          onChange={e => setColSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-bg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border text-text-muted">
                              <th className="text-left py-2 pr-3 font-medium">Champ (colonne)</th>
                              <th className="text-left py-2 px-2 font-medium">Libellé</th>
                              <th className="text-left py-2 px-2 font-medium">Unité</th>
                              <th className="text-left py-2 px-2 font-medium">Type</th>
                              <th className="text-left py-2 pl-2 font-medium">Note</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredFields.map((f) => (
                              <tr key={f.col} className="border-b border-border/40 hover:bg-bg/60">
                                <td className="py-2 pr-3">
                                  <code className="bg-bg border border-border rounded px-1.5 py-0.5 text-[11px] text-primary font-mono">
                                    {f.col}
                                  </code>
                                </td>
                                <td className="py-2 px-2 text-text font-medium">{f.label}</td>
                                <td className="py-2 px-2 text-text-muted font-mono">{f.unit}</td>
                                <td className="py-2 px-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${TYPE_BADGE[f.type] || "bg-gray-100 text-gray-600"}`}>
                                    {f.type}
                                  </span>
                                </td>
                                <td className="py-2 pl-2 text-text-muted max-w-xs">{f.note || "—"}</td>
                              </tr>
                            ))}
                            {filteredFields.length === 0 && (
                              <tr>
                                <td colSpan={5} className="py-6 text-center text-text-muted">Aucun champ trouvé</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Preview */}
                <Card>
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <button
                      onClick={() => {
                        if (!showPreview) {
                          setShowPreview(true);
                          setPage(0);
                        } else {
                          setShowPreview(false);
                        }
                      }}
                      className="flex items-center gap-2 text-sm font-semibold text-text"
                    >
                      {showPreview
                        ? <><EyeOff className="w-4 h-4 text-primary" /> Masquer la prévisualisation</>
                        : <><Eye className="w-4 h-4 text-primary" /> Prévisualiser les données</>
                      }
                    </button>

                    {showPreview && (
                      <div className="flex items-center gap-3 flex-wrap">
                        {hasLocationFilter && (
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-text-muted whitespace-nowrap">Ville :</label>
                            <LocationSelect
                              value={locationId}
                              onChange={(id) => { setLocationId(id); setPage(0); }}
                              className="w-44"
                            />
                            {locationId && (
                              <button onClick={() => { setLocationId(""); setPage(0); }}>
                                <X className="w-3.5 h-3.5 text-text-muted hover:text-danger" />
                              </button>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-text-muted whitespace-nowrap">Lignes :</label>
                          <select
                            value={pageSize}
                            onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
                            className="border border-border rounded px-2 py-1 text-xs bg-card text-text focus:outline-none"
                          >
                            {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <button
                          onClick={() => loadPreview(selected, page, pageSize, locationId)}
                          className="text-xs px-2 py-1 border border-border rounded bg-bg hover:bg-border/30 transition"
                        >
                          Actualiser
                        </button>
                      </div>
                    )}
                  </div>

                  {showPreview && (
                    <>
                      {previewLoading && (
                        <div className="h-40 flex items-center justify-center text-sm text-text-muted">
                          Chargement des données…
                        </div>
                      )}
                      {previewError && (
                        <div className="text-sm text-danger p-3 bg-red-50 rounded-lg border border-red-200">
                          Erreur : {previewError}
                        </div>
                      )}
                      {!previewLoading && !previewError && previewData && (
                        <>
                          <p className="text-xs text-text-muted mb-3">
                            {previewData.total != null
                              ? `${previewData.total.toLocaleString("fr-FR")} enregistrements au total — affichage ${page * pageSize + 1}–${Math.min((page + 1) * pageSize, previewData.total)}`
                              : ""}
                          </p>

                          {previewData.rows?.length === 0 ? (
                            <div className="text-center py-10 text-text-muted text-sm">
                              Aucune donnée pour cette sélection
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs whitespace-nowrap">
                                <thead>
                                  <tr className="border-b border-border bg-bg/60">
                                    {previewCols.map(col => {
                                      const fieldDef = previewData.fields?.find((f: FieldDef) => f.col === col);
                                      return (
                                        <th key={col} className="text-left py-2 px-2 font-medium text-text-muted">
                                          <div className="flex flex-col">
                                            <span className="font-semibold text-text text-[11px]">
                                              {fieldDef?.label || col}
                                            </span>
                                            {fieldDef?.unit && fieldDef.unit !== "—" && (
                                              <span className="text-[9px] text-text-muted font-normal font-mono">{fieldDef.unit}</span>
                                            )}
                                          </div>
                                        </th>
                                      );
                                    })}
                                  </tr>
                                </thead>
                                <tbody>
                                  {previewData.rows.map((row: any, i: number) => (
                                    <tr key={i} className="border-b border-border/40 hover:bg-bg/60">
                                      {previewCols.map(col => (
                                        <td key={col} className="py-1.5 px-2 text-text max-w-[180px] truncate">
                                          {fmt(row[col])}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Pagination */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 text-xs text-text-muted">
                              <button
                                disabled={page === 0}
                                onClick={() => setPage(p => p - 1)}
                                className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-bg/60 transition"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" /> Précédent
                              </button>
                              <span>Page {page + 1} / {totalPages}</span>
                              <button
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                                className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-lg disabled:opacity-40 hover:bg-bg/60 transition"
                              >
                                Suivant <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

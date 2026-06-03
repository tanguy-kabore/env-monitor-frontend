"use client";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import Card from "@/components/Card";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatDateTime } from "@/lib/utils";
import { Settings, Database, Cpu, Clock, Play, RefreshCw, Search, ChevronDown, ChevronUp, SlidersHorizontal, Trash2, AlertOctagon, CheckCircle2, Wind, Waves, Droplets, Thermometer, Bell, Zap, Brain, CloudDownload, Activity } from "lucide-react";
import React, { useState, useEffect } from "react";

// ── Scheduled Jobs Card Component ────────────────────────────────────────────

const JOB_ICON_MAP: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  collect_weather:       { icon: <Thermometer className="w-4 h-4" />, bg: "bg-sky-100",    color: "text-sky-600" },
  collect_air_quality:   { icon: <Wind         className="w-4 h-4" />, bg: "bg-teal-100",  color: "text-teal-600" },
  collect_flood:         { icon: <Waves        className="w-4 h-4" />, bg: "bg-blue-100",  color: "text-blue-600" },
  collect_climate:       { icon: <Droplets     className="w-4 h-4" />, bg: "bg-indigo-100",color: "text-indigo-600" },
  compute_drought:       { icon: <Activity     className="w-4 h-4" />, bg: "bg-amber-100", color: "text-amber-600" },
  generate_alerts:       { icon: <Bell         className="w-4 h-4" />, bg: "bg-red-100",   color: "text-red-600" },
  retrain_models:        { icon: <Brain        className="w-4 h-4" />, bg: "bg-purple-100",color: "text-purple-600" },
  generate_predictions:  { icon: <Zap          className="w-4 h-4" />, bg: "bg-violet-100",color: "text-violet-600" },
  archive_daily_alerts:  { icon: <Database     className="w-4 h-4" />, bg: "bg-gray-100",  color: "text-gray-500" },
};

function ScheduledJobsCard({ jobs, onRefresh }: { jobs: any[]; onRefresh: () => void }) {
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const activeCount = jobs.filter(j => !j.paused).length;

  const handleRunNow = async (jobId: string) => {
    setLoading(`run-${jobId}`);
    try {
      await api.runJobNow(jobId);
      setMessage(`✓ ${jobId} exécuté`);
      setTimeout(() => onRefresh(), 1000);
    } catch (e: any) {
      setMessage(`Erreur: ${e.message}`);
    }
    setLoading(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleTogglePause = async (job: any) => {
    setLoading(`pause-${job.id}`);
    try {
      if (job.paused) {
        await api.resumeJob(job.id);
        setMessage(`▶ ${job.id} réactivé`);
      } else {
        await api.pauseJob(job.id);
        setMessage(`⏸ ${job.id} mis en pause`);
      }
      setTimeout(() => onRefresh(), 500);
    } catch (e: any) {
      setMessage(`Erreur: ${e.message}`);
    }
    setLoading(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const openEditModal = async (jobId: string) => {
    setEditingJob(jobId);
    setLoading(`details-${jobId}`);
    try {
      const details = await api.getJobDetails(jobId);
      setJobDetails(details);
    } catch (e: any) {
      setMessage(`Erreur chargement: ${e.message}`);
    }
    setLoading(null);
  };

  const handleUpdateInterval = async (jobId: string, data: { minutes?: number; hours?: number }) => {
    setLoading(`update-${jobId}`);
    try {
      await api.updateJobInterval(jobId, data);
      setMessage(`✓ Fréquence mise à jour`);
      setEditingJob(null);
      setTimeout(() => onRefresh(), 500);
    } catch (e: any) {
      setMessage(`Erreur: ${e.message}`);
    }
    setLoading(null);
    setTimeout(() => setMessage(null), 3000);
  };

  if (jobs.length === 0) return null;

  return (
    <>
      <Card
        title={<div className="flex items-center gap-2">Tâches planifiées <span className="text-xs font-normal text-text-muted">({activeCount} actives · {jobs.length - activeCount} pausées)</span></div>}
        icon={<Clock className="w-4 h-4" />}
        subtitle={message ? <span className="text-primary animate-pulse">{message}</span> : undefined}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {jobs.map((job: any) => {
            const cfg = JOB_ICON_MAP[job.id] || { icon: <Settings className="w-4 h-4" />, bg: "bg-gray-100", color: "text-gray-500" };
            const isAlert = job.id === "generate_alerts";
            const isPaused = job.paused;
            
            return (
              <div key={job.id} className={`flex items-start gap-3 p-4 rounded-xl border text-xs transition hover:shadow-sm ${isAlert ? "border-red-200 bg-red-50/20" : isPaused ? "border-gray-200 bg-gray-50/50 opacity-70" : "border-border bg-card"}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isPaused ? "bg-gray-100" : cfg.bg}`}>
                  <span className={isPaused ? "text-gray-400" : cfg.color}>{cfg.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold text-[13px] leading-tight ${isPaused ? "text-text-muted" : "text-text"}`}>
                      {job.name}
                    </p>
                    {isPaused && <span className="px-1.5 py-0.5 rounded text-[9px] bg-gray-200 text-gray-600 font-medium">PAUSE</span>}
                  </div>
                  {job.description && (
                    <p className="text-text-muted mt-0.5 text-[11px] leading-snug">{job.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <button
                      onClick={() => openEditModal(job.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium border text-[10px] transition hover:shadow-sm ${
                        isAlert ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" : 
                        isPaused ? "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200" :
                        "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100"
                      }`}
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> {job.interval_label}
                    </button>
                    {job.next_run && !isPaused && (
                      <span className="text-text-muted text-[10px] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Prochaine : <strong className="text-text">{formatDateTime(job.next_run)}</strong></span>
                      </span>
                    )}
                    {isPaused && (
                      <span className="text-text-muted text-[10px] italic">En pause — pas d'exécution planifiée</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleRunNow(job.id)}
                    disabled={loading === `run-${job.id}`}
                    title="Exécuter maintenant"
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition disabled:opacity-50"
                  >
                    {loading === `run-${job.id}` ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleTogglePause(job)}
                    disabled={loading === `pause-${job.id}`}
                    title={isPaused ? "Réactiver" : "Mettre en pause"}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg transition disabled:opacity-50 ${
                      isPaused 
                        ? "bg-green-100 text-green-600 hover:bg-green-600 hover:text-white" 
                        : "bg-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white"
                    }`}
                  >
                    {loading === `pause-${job.id}` ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 
                      isPaused ? <Play className="w-3.5 h-3.5" /> : <span className="text-sm">⏸</span>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {editingJob && jobDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setEditingJob(null)}>
          <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-sm mx-4 p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text">Modifier la fréquence</h3>
              <button onClick={() => setEditingJob(null)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-text-muted transition">×</button>
            </div>
            <p className="text-xs text-text-muted mb-4">{jobDetails.name}</p>
            {jobDetails.editable?.cron ? (
              <div className="space-y-3">
                <p className="text-xs text-text-muted">Cette tâche utilise une planification cron quotidienne.</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleUpdateInterval(editingJob, { hours: 24 })}
                    disabled={loading === `update-${editingJob}`}
                    className="flex-1 py-2 px-3 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    {loading === `update-${editingJob}` ? "..." : "Convertir en intervalle 24h"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {[30, 60, 120, 360, 720].map(mins => (
                    <button
                      key={mins}
                      onClick={() => handleUpdateInterval(editingJob, { minutes: mins })}
                      disabled={loading === `update-${editingJob}`}
                      className="flex-1 py-2 px-1 bg-bg border border-border rounded-lg text-[11px] hover:border-primary hover:text-primary transition disabled:opacity-50"
                    >
                      {mins < 60 ? `${mins}min` : `${mins/60}h`}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {[1, 2, 6, 12, 24].map(hours => (
                    <button
                      key={hours}
                      onClick={() => handleUpdateInterval(editingJob, { hours })}
                      disabled={loading === `update-${editingJob}`}
                      className="flex-1 py-2 px-1 bg-bg border border-border rounded-lg text-[11px] hover:border-primary hover:text-primary transition disabled:opacity-50"
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-text-muted text-center">Cliquez pour appliquer immédiatement</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Main System Page ───────────────────────────────────────────────────────

export default function SystemPage() {
  const status = useApi(() => api.getStatus(), [], "system-status", { staleTime: 60_000 });
  const models = useApi(() => api.getModels(500), [], "system-models", { staleTime: 5 * 60_000 });
  const logs = useApi(() => api.getCollectionLog(50), [], "system-logs", { staleTime: 60_000 });
  const cities = useApi(() => api.getCities(), [], "system-cities", { staleTime: 30 * 60_000 });
  const [actionMsg, setActionMsg] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetAllLoading, setResetAllLoading] = useState(false);
  const [resetAllResult, setResetAllResult] = useState<any>(null);

  const handleResetAll = async () => {
    setResetAllLoading(true);
    setResetAllResult(null);
    try {
      const r = await api.resetAllData();
      setResetAllResult(r);
      setShowResetConfirm(false);
      setResetConfirmText("");
      status.refetch();
      models.refetch();
      logs.refetch();
    } catch (e: any) {
      setResetAllResult({ success: false, message: e.message });
    } finally {
      setResetAllLoading(false);
    }
  };

  const citiesData = cities.data?.data;
  const cityMap = Object.fromEntries(
    (Array.isArray(citiesData) ? citiesData : []).map((c: any) => [c.id, c.name])
  );

  const triggerAction = async (action: string, label: string) => {
    setActionLoading(action);
    setActionMsg(`${label} en cours...`);
    try {
      if (action === "train") await api.triggerTrain();
      else await api.triggerCollect(action);
      setActionMsg(`✓ ${label} déclenché — en arrière-plan`);
      setTimeout(() => { status.refetch(); logs.refetch(); }, 3000);
    } catch (e: any) {
      setActionMsg(`Erreur: ${e.message}`);
    } finally {
      setActionLoading(null);
    }
    setTimeout(() => setActionMsg(""), 6000);
  };

  const statusData = status.data;
  const dataCounts = statusData?.data_counts || {};
  const totalRecords = Object.values(dataCounts).reduce((a: any, b: any) => a + b, 0);

  useEffect(() => {
    if (statusData && !statusData.initialized && (totalRecords as number) > 0 && !resetDone) {
      setResetDone(true);
      api.resetStatus()
        .then(() => new Promise(r => setTimeout(r, 1500)))
        .then(() => { status.refetch(); models.refetch(); })
        .catch(() => {});
    }
  }, [statusData?.initialized, totalRecords, resetDone]);

  const isInitialized = !!statusData?.initialized;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-7 h-7 text-text-secondary" /> Administration Système
          </h1>
          <p className="text-sm text-text-secondary mt-1">Collectes, modèles ML, tâches planifiées et état du système</p>
        </div>
        {actionMsg && (
          <span className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-full animate-fade-in border border-primary/20 font-medium">
            {actionMsg}
          </span>
        )}
      </div>

      {status.loading ? <LoadingSpinner /> : (
        <>
          {/* ── 1. STATUS KPI CARDS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Initialized */}
            <div className={`rounded-xl border p-4 flex items-center gap-4 ${isInitialized ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isInitialized ? "bg-green-100" : "bg-orange-100"}`}>
                {isInitialized
                  ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                  : <AlertOctagon className="w-5 h-5 text-orange-500" />}
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wide font-medium">Statut système</p>
                <p className={`font-bold text-sm mt-0.5 ${isInitialized ? "text-green-700" : "text-orange-600"}`}>
                  {isInitialized ? "Initialisé" : "Non initialisé"}
                </p>
              </div>
            </div>

            {/* Last historical load */}
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <CloudDownload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wide font-medium">Dernière collecte</p>
                <p className="font-semibold text-xs mt-0.5 text-text">
                  {statusData?.last_historical_load ? formatDateTime(statusData.last_historical_load) : <span className="text-text-muted italic">Jamais</span>}
                </p>
              </div>
            </div>

            {/* Last training */}
            <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wide font-medium">Dernier entraînement ML</p>
                <p className="font-semibold text-xs mt-0.5 text-text">
                  {statusData?.last_model_training ? formatDateTime(statusData.last_model_training) : <span className="text-text-muted italic">Jamais</span>}
                </p>
              </div>
            </div>
          </div>

          {/* ── 2. INIT BANNER (if not initialized) ── */}
          {!isInitialized && (
            <div className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <AlertOctagon className="w-5 h-5 text-orange-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-700">Système non initialisé</p>
                <p className="text-xs text-orange-500 mt-0.5">
                  {(totalRecords as number) > 0
                    ? "Des données existent en base — correction automatique du statut en cours…"
                    : "Lancez l'initialisation pour charger les données historiques et entraîner les modèles."}
                </p>
              </div>
              {(totalRecords as number) > 0 ? (
                <ActionButton label="Corriger le statut" onClick={async () => { setActionLoading("reset"); try { await api.resetStatus(); await status.refetch(); setActionMsg("✓ Statut corrigé"); } catch(e: any) { setActionMsg(`Erreur: ${e.message}`); } finally { setActionLoading(null); } setTimeout(() => setActionMsg(""), 4000); }} color="bg-orange-500" loading={actionLoading === "reset"} />
              ) : (
                <ActionButton label="Initialiser le système" onClick={async () => { setActionLoading("init"); setActionMsg("Initialisation en cours..."); try { await api.initialize(); setActionMsg("✓ Initialisation démarrée en arrière-plan"); setTimeout(() => status.refetch(), 5000); } catch(e: any) { setActionMsg(`Erreur: ${e.message}`); } finally { setActionLoading(null); } setTimeout(() => setActionMsg(""), 8000); }} color="bg-orange-500" loading={actionLoading === "init"} />
              )}
            </div>
          )}

          {/* ── 3. DATA COUNTS ── */}
          <Card title="Données en base" icon={<Database className="w-4 h-4" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {Object.entries(dataCounts).map(([table, count]) => {
                const isEmpty = Number(count) === 0;
                return (
                  <div key={table} className={`rounded-lg p-3 text-center border ${isEmpty ? "bg-orange-50 border-orange-100" : "bg-bg border-border"}`}
                    title={isEmpty ? "Aucune donnée — collecte ou entraînement requis" : undefined}>
                    <p className={`text-xl font-bold tabular-nums ${isEmpty ? "text-orange-400" : "text-primary"}`}>{Number(count).toLocaleString()}</p>
                    <p className="text-[10px] text-text-muted mt-1 leading-tight">{table.replace(/_/g, " ")}</p>
                    {isEmpty && <p className="text-[9px] text-orange-400 mt-0.5">Vide</p>}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ── 4. MANUAL ACTIONS ── */}
          <Card title="Actions manuelles" icon={<Play className="w-4 h-4" />}>
            <div className="space-y-4">
              {/* Collect group */}
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wide font-medium mb-2">Collecte de données</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  <ActionButton icon={<Thermometer className="w-3.5 h-3.5" />} label="Météo"           onClick={() => triggerAction("weather",     "Collecte météo")}         loading={actionLoading === "weather"} />
                  <ActionButton icon={<Wind         className="w-3.5 h-3.5" />} label="Qualité air"    onClick={() => triggerAction("air-quality", "Collecte qualité air")}   loading={actionLoading === "air-quality"} />
                  <ActionButton icon={<Waves        className="w-3.5 h-3.5" />} label="Inondations"    onClick={() => triggerAction("flood",       "Collecte inondations")}   loading={actionLoading === "flood"} />
                  <ActionButton icon={<Droplets     className="w-3.5 h-3.5" />} label="Climat"         onClick={() => triggerAction("climate",     "Collecte climat")}        loading={actionLoading === "climate"} />
                  <ActionButton icon={<Activity     className="w-3.5 h-3.5" />} label="Sécheresse"     onClick={() => triggerAction("drought",     "Calcul sécheresse")}      loading={actionLoading === "drought"} color="bg-amber-600" />
                </div>
              </div>

              <div className="border-t border-border" />

              {/* System group */}
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wide font-medium mb-2">Opérations système</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <ActionButton icon={<Zap   className="w-3.5 h-3.5" />} label="Collecter tout"   onClick={() => triggerAction("all", "Collecte complète")} loading={actionLoading === "all"} color="bg-secondary" />
                  <ActionButton icon={<Brain className="w-3.5 h-3.5" />} label="Entraîner modèles" onClick={() => triggerAction("train", "Entraînement")}   loading={actionLoading === "train"} color="bg-purple-600" />
                  <ActionButton icon={<Bell  className="w-3.5 h-3.5" />} label="Générer alertes"  onClick={async () => {
                    setActionLoading("alerts");
                    setActionMsg("Génération des alertes...");
                    try {
                      const r = await api.generateAlerts();
                      setActionMsg(`✓ ${r.created} alertes créées, ${r.resolved} résolues — ${r.active_total} actives`);
                    } catch (e: any) { setActionMsg(`Erreur: ${e.message}`); }
                    finally { setActionLoading(null); }
                    setTimeout(() => setActionMsg(""), 6000);
                  }} loading={actionLoading === "alerts"} color="bg-red-600" />
                </div>

              <div className="border-t border-border" />

              {/* Full cycle */}
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wide font-medium mb-2">Cycle complet automatique</p>
                <ActionButton
                  icon={<Zap className="w-3.5 h-3.5" />}
                  label="Collecter + Entraîner + Alertes"
                  onClick={async () => {
                    setActionLoading("full-cycle");
                    setActionMsg("Cycle complet démarré en arrière-plan (collecte → entraînement → alertes)...");
                    try {
                      await api.triggerFullCycle();
                      setActionMsg("✓ Cycle complet lancé — rafraîchissez dans quelques minutes");
                    } catch (e: any) { setActionMsg(`Erreur: ${e.message}`); }
                    finally { setActionLoading(null); }
                    setTimeout(() => setActionMsg(""), 10000);
                  }}
                  loading={actionLoading === "full-cycle"}
                  color="bg-gradient-to-r from-secondary to-purple-600"
                />
              </div>
              </div>
            </div>
          </Card>

          {/* ── 5. SCHEDULED JOBS ── */}
          <ScheduledJobsCard jobs={statusData?.scheduled_jobs || []} onRefresh={() => status.refetch()} />

          {/* ── 6. MODELS ── */}
          <ModelsCard models={models} cityMap={cityMap} onCleanup={async () => {
            setActionLoading("cleanup");
            setActionMsg("Dédoublonnage en cours...");
            try {
              const r = await api.cleanupModels();
              setActionMsg(`✓ ${r.duplicates_archived} doublons supprimés — ${r.active_remaining} modèles actifs`);
              setTimeout(() => models.refetch(), 500);
            } catch (e: any) { setActionMsg(`Erreur: ${e.message}`); }
            finally { setActionLoading(null); }
            setTimeout(() => setActionMsg(""), 6000);
          }} cleanupLoading={actionLoading === "cleanup"} />

          {/* ── 7. COLLECTION LOG ── */}
          {!logs.loading && Array.isArray(logs.data?.data) && logs.data?.data.length > 0 && (
            <CollectionLogCard logs={logs.data?.data} onCleanup={() => logs.refetch()} />
          )}

          {/* ── 8. DANGER ZONE ── */}
          <div className="rounded-xl border-2 border-dashed border-red-200 bg-red-50/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertOctagon className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold text-red-700">Zone dangereuse</h3>
            </div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <p className="text-xs text-red-500 max-w-lg">
                Supprime <strong>toutes les données collectées</strong>, modèles ML, alertes et journaux de manière <strong>irréversible</strong>.
                À utiliser uniquement pour réinitialiser complètement le système.
              </p>
              <button onClick={() => { setShowResetConfirm(true); setResetConfirmText(""); setResetAllResult(null); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition shrink-0">
                <Trash2 className="w-3.5 h-3.5" /> Vider la base de données
              </button>
            </div>
            {resetAllResult && (
              <div className={`mt-3 p-3 rounded-lg text-xs border ${
                resetAllResult.success ? "bg-green-50 border-green-200 text-green-700" : "bg-red-100 border-red-200 text-red-700"
              }`}>
                {resetAllResult.message}
                {resetAllResult.errors?.length > 0 && (
                  <ul className="mt-1 list-disc list-inside">{resetAllResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul>
                )}
              </div>
            )}
          </div>

          {/* ── Confirm modal ── */}
          {showResetConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)}>
              <div className="bg-card rounded-2xl shadow-2xl border-2 border-red-300 w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-red-600 px-5 py-4 flex items-center gap-3">
                  <AlertOctagon className="w-5 h-5 text-white" />
                  <h3 className="text-sm font-bold text-white">Confirmation requise — action irréversible</h3>
                </div>
                <div className="px-5 py-5 space-y-4">
                  <p className="text-sm text-text">Cette action va <strong>supprimer définitivement</strong> :</p>
                  <ul className="text-xs text-text-muted space-y-1.5 list-none">
                    {["Toutes les données météo, inondations, qualité de l'air, climat","Tous les modèles ML et prédictions","Toutes les alertes et leur historique","Tous les journaux de collecte"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                        <span className="text-red-500 font-bold text-base leading-none">✕</span>{item}
                      </li>
                    ))}
                  </ul>
                  <div>
                    <p className="text-xs text-text-muted mb-2">Tapez <strong className="text-red-600 font-mono">RESET</strong> pour confirmer :</p>
                    <input
                      value={resetConfirmText}
                      onChange={e => setResetConfirmText(e.target.value)}
                      placeholder="RESET"
                      className="w-full border-2 border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-border flex justify-end gap-3">
                  <button onClick={() => setShowResetConfirm(false)}
                    className="text-xs px-4 py-1.5 rounded-lg border border-border text-text hover:bg-gray-50 transition">Annuler</button>
                  <button
                    onClick={handleResetAll}
                    disabled={resetConfirmText !== "RESET" || resetAllLoading}
                    className="text-xs px-4 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                    {resetAllLoading && <span className="w-3 h-3 border-2 border-red-300 border-t-white rounded-full animate-spin" />}
                    <Trash2 className="w-3 h-3" /> Tout supprimer
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const MODEL_TYPE_COLORS: Record<string, string> = {
  flood: "bg-blue-100 text-blue-700 border-blue-200",
  weather_precipitation: "bg-cyan-100 text-cyan-700 border-cyan-200",
  weather_temperature_max: "bg-red-100 text-red-700 border-red-200",
  weather_temperature_min: "bg-indigo-100 text-indigo-700 border-indigo-200",
  air_quality: "bg-teal-100 text-teal-700 border-teal-200",
  drought: "bg-amber-100 text-amber-700 border-amber-200",
};

function ModelTypePill({ type, count, active, onClick }: { type: string; count: number; active: boolean; onClick: () => void }) {
  const color = MODEL_TYPE_COLORS[type] || "bg-gray-100 text-gray-600 border-gray-200";
  const label = type === "all" ? "Tous" : type.replace(/_/g, " ");
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
        active ? (type === "all" ? "bg-primary text-white border-primary shadow-sm" : `${color} ring-2 ring-offset-1 ring-current`) : `${type === "all" ? "bg-gray-100 text-gray-600 border-gray-200" : color} opacity-60 hover:opacity-90`
      }`}>
      <span className="capitalize">{label}</span>
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
        active ? (type === "all" ? "bg-white/30 text-white" : "bg-white/60") : "bg-white/80"
      }`}>{count}</span>
    </button>
  );
}

function ModelsCard({ models, cityMap, onCleanup, cleanupLoading }: { models: any; cityMap: Record<string, string>; onCleanup: () => void; cleanupLoading: boolean }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [algoFilter, setAlgoFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortR2, setSortR2] = useState<"desc" | "asc" | null>("desc");
  const allModels: any[] = Array.isArray(models.data?.data) ? models.data?.data : [];
  const types = ["all", ...Array.from(new Set(allModels.map((m: any) => m.model_type).filter((t: string) => t !== "all")))] as string[];
  const algos = Array.from(new Set(allModels.map((m: any) => m.model_name || m.algorithm).filter(Boolean))) as string[];

  const filtered = allModels
    .filter((m: any) => typeFilter === "all" || m.model_type === typeFilter)
    .filter((m: any) => !algoFilter || (m.model_name || m.algorithm) === algoFilter)
    .filter((m: any) => !search || cityMap[m.location_id]?.toLowerCase().includes(search.toLowerCase()) || m.model_type?.toLowerCase().includes(search.toLowerCase()))
    .sort((a: any, b: any) => {
      if (!sortR2) return 0;
      const ra = a.metrics?.r2 ?? -1; const rb = b.metrics?.r2 ?? -1;
      return sortR2 === "desc" ? rb - ra : ra - rb;
    });

  return (
    <Card title={`Modèles ML actifs (${models.data?.pagination?.total ?? allModels.length})`} icon={<Cpu className="w-5 h-5" />}>
      {models.loading ? <LoadingSpinner /> : allModels.length === 0 ? (
        <div className="text-center py-8 text-text-muted text-xs">
          <Cpu className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Aucun modèle entraîné. Cliquez sur <strong>Entraîner modèles</strong> pour démarrer.</p>
        </div>
      ) : (
        <>
          {/* Filter bar */}
          <div className="space-y-3 mb-4">
            {/* Type pills */}
            <div className="flex gap-2 flex-wrap items-center">
              {types.map((t: string) => (
                <ModelTypePill key={t} type={t}
                  count={t === "all" ? allModels.length : allModels.filter((m: any) => m.model_type === t).length}
                  active={typeFilter === t} onClick={() => setTypeFilter(t)} />
              ))}
              <button onClick={onCleanup} disabled={cleanupLoading}
                className="ml-auto inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition disabled:opacity-50">
                {cleanupLoading ? <><span className="w-3 h-3 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />Dédoublonnage...</> : <>🗑 Dédoublonner</>}
              </button>
            </div>
            {/* Search + algo filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une localité..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              {algos.length > 1 && (
                <select value={algoFilter} onChange={e => setAlgoFilter(e.target.value)}
                  className="border border-border rounded-lg px-3 py-1.5 text-xs bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Tous algorithmes</option>
                  {algos.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              )}
              <span className="text-xs text-text-muted">{filtered.length} modèle{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card border-b border-border">
                <tr className="text-left text-text-muted">
                  <th className="px-3 py-2.5 font-medium">Type</th>
                  <th className="px-3 py-2.5 font-medium">Localité</th>
                  <th className="px-3 py-2.5 font-medium">Algorithme</th>
                  <th className="px-3 py-2.5 font-medium">
                    <button className="flex items-center gap-1 hover:text-primary transition" onClick={() => setSortR2(s => s === "desc" ? "asc" : "desc")}>
                      Score R²
                      {sortR2 === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                    </button>
                  </th>
                  <th className="px-3 py-2.5 font-medium">Entraîné le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((m: any) => {
                  const r2 = m.metrics?.r2;
                  const r2Color = r2 == null ? "text-text-muted" : r2 >= 0.9 ? "text-green-600 font-semibold" : r2 >= 0.7 ? "text-amber-600" : "text-red-500";
                  return (
                    <tr key={m.id} className="text-text-secondary hover:bg-gray-50/50 transition">
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${MODEL_TYPE_COLORS[m.model_type] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {m.model_type?.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium">{cityMap[m.location_id] || m.location_id?.slice(0, 8)}</td>
                      <td className="px-3 py-2 font-mono text-[11px]">{m.model_name || m.algorithm || "—"}</td>
                      <td className={`px-3 py-2 font-mono ${r2Color}`}>{r2 != null ? Number(r2).toFixed(3) : "—"}</td>
                      <td className="px-3 py-2 text-text-muted">{m.trained_at ? formatDateTime(m.trained_at) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}

const LOG_TYPE_COLORS: Record<string, string> = {
  weather:     "bg-sky-100 text-sky-700 border-sky-200",
  flood:       "bg-blue-100 text-blue-700 border-blue-200",
  air_quality: "bg-teal-100 text-teal-700 border-teal-200",
  climate:     "bg-purple-100 text-purple-700 border-purple-200",
  drought:     "bg-amber-100 text-amber-700 border-amber-200",
};

const LOG_STATUS_CFG: Record<string, { label: string; dot: string; badge: string }> = {
  success: { label: "Succès",  dot: "bg-green-500",  badge: "bg-green-100 text-green-700 border-green-200" },
  partial: { label: "Partiel", dot: "bg-orange-400", badge: "bg-orange-100 text-orange-700 border-orange-200" },
  failed:  { label: "Échec",   dot: "bg-red-500",    badge: "bg-red-100 text-red-700 border-red-200" },
};

function FilterPill({ label, count, active, color, onClick }: { label: string; count?: number; active: boolean; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
        active ? `${color} ring-2 ring-offset-1 ring-current shadow-sm` : `${color} opacity-50 hover:opacity-80`
      }`}>
      {label}
      {count != null && (
        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/60">{count}</span>
      )}
    </button>
  );
}

function parseErrors(raw: string): { location: string; error: string }[] | null {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && "location" in parsed[0]) return parsed;
  } catch {}
  return null;
}

function ErrorDetailModal({ log, onClose }: { log: any; onClose: () => void }) {
  const errors = parseErrors(log.error_message || "");
  const typeColor = LOG_TYPE_COLORS[log.data_type] || "bg-gray-100 text-gray-600 border-gray-200";
  const statusCfg = LOG_STATUS_CFG[log.status] || { label: log.status, badge: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className={`w-2.5 h-2.5 rounded-full ${statusCfg.dot}`} />
            <div>
              <h3 className="text-sm font-semibold text-text">Détails de la collecte</h3>
              <p className="text-xs text-text-muted mt-0.5">{formatDateTime(log.created_at)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-text-muted transition text-lg leading-none">×</button>
        </div>

        {/* Summary row */}
        <div className="flex items-center gap-3 px-5 py-3 bg-gray-50/60 border-b border-border">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${typeColor}`}>
            {log.data_type?.replace(/_/g, " ")}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.badge}`}>
            {statusCfg.label}
          </span>
          <span className="ml-auto text-xs text-text-muted font-mono">{(log.records_inserted ?? 0).toLocaleString()} enregistrements</span>
        </div>

        {/* Error list */}
        <div className="px-5 py-4 max-h-80 overflow-y-auto">
          {errors && errors.length > 0 ? (
            <>
              <p className="text-xs font-medium text-text mb-3 flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold">{errors.length}</span>
                {errors.length === 1 ? "localité avec erreur" : "localités avec erreurs"}
              </p>
              <div className="space-y-2">
                {errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-orange-50/60 border border-orange-100">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text">{e.location || "Localité inconnue"}</p>
                      {e.error ? (
                        <p className="text-[11px] text-text-muted mt-0.5 break-words">{e.error}</p>
                      ) : (
                        <p className="text-[11px] text-text-muted mt-0.5 italic">Erreur non spécifiée</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-text-muted italic break-words">{log.error_message || "Aucun détail disponible"}</p>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border flex justify-end">
          <button onClick={onClose} className="text-xs px-4 py-1.5 rounded-lg bg-primary text-white hover:opacity-90 transition">Fermer</button>
        </div>
      </div>
    </div>
  );
}

function CollectionLogCard({ logs, onCleanup }: { logs: any[]; onCleanup: () => void }) {
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openLog, setOpenLog] = useState<any>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ deleted: number; cleaned_logs: number } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const partialCount = logs.filter(l => l.status === "partial" || l.status === "failed").length;

  const handleCleanup = async () => {
    setShowConfirm(false);
    setCleanupLoading(true);
    setCleanupResult(null);
    try {
      const r = await api.cleanupPartialLogs();
      setCleanupResult({ deleted: r.deleted, cleaned_logs: r.cleaned_logs });
      onCleanup();
    } catch (e: any) {
      setCleanupResult({ deleted: -1, cleaned_logs: 0 });
    } finally {
      setCleanupLoading(false);
    }
    setTimeout(() => setCleanupResult(null), 6000);
  };

  const types = Array.from(new Set(logs.map(l => l.data_type).filter(Boolean))) as string[];
  const statuses = Array.from(new Set(logs.map(l => l.status).filter(Boolean))) as string[];

  const filtered = logs
    .filter(l => !typeFilter   || l.data_type === typeFilter)
    .filter(l => !statusFilter || l.status    === statusFilter);

  return (
    <>
      {openLog && <ErrorDetailModal log={openLog} onClose={() => setOpenLog(null)} />}
      <Card title="Journal de collecte" icon={<RefreshCw className="w-5 h-5" />}>
        {/* Cleanup confirm dialog */}
        {showConfirm && (
          <div className="mb-4 p-4 rounded-xl border border-orange-200 bg-orange-50 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-800">Confirmer le nettoyage</p>
              <p className="text-xs text-orange-600 mt-0.5">
                Cela va supprimer les données insérées lors des <strong>{partialCount} collectes partielles/échouées</strong> et retirer ces entrées du journal. Cette action est irréversible.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setShowConfirm(false)}
                className="text-xs px-3 py-1.5 rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-100 transition">Annuler</button>
              <button onClick={handleCleanup}
                className="text-xs px-3 py-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition">Confirmer</button>
            </div>
          </div>
        )}
        {cleanupResult && (
          <div className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
            cleanupResult.deleted >= 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
          }`}>
            {cleanupResult.deleted >= 0
              ? `✓ ${cleanupResult.deleted.toLocaleString()} enregistrements supprimés · ${cleanupResult.cleaned_logs} entrées de log retirées`
              : "Erreur lors du nettoyage — consultez les logs serveur"}
          </div>
        )}
        {/* Filter bar */}
        <div className="space-y-2 mb-4">
          <div className="flex flex-wrap gap-2 items-center">
            <SlidersHorizontal className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <FilterPill label="Tous" count={logs.length} active={!typeFilter}
              color="bg-gray-100 text-gray-600 border-gray-200"
              onClick={() => setTypeFilter("")} />
            {types.map(t => (
              <FilterPill key={t} label={t.replace(/_/g, " ")}
                count={logs.filter(l => l.data_type === t).length}
                active={typeFilter === t}
                color={LOG_TYPE_COLORS[t] || "bg-gray-100 text-gray-600 border-gray-200"}
                onClick={() => setTypeFilter(prev => prev === t ? "" : t)} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="w-3.5 h-3.5 shrink-0" />
            {statuses.map(s => {
              const cfg = LOG_STATUS_CFG[s] || { label: s, dot: "bg-gray-400", badge: "bg-gray-100 text-gray-600 border-gray-200" };
              return (
                <FilterPill key={s} label={cfg.label}
                  count={logs.filter(l => l.status === s).length}
                  active={statusFilter === s}
                  color={cfg.badge}
                  onClick={() => setStatusFilter(prev => prev === s ? "" : s)} />
              );
            })}
            {(typeFilter || statusFilter) && (
              <button onClick={() => { setTypeFilter(""); setStatusFilter(""); }}
                className="text-xs text-text-muted hover:text-danger transition ml-1">× Réinitialiser</button>
            )}
            <div className="ml-auto flex items-center gap-3">
              {partialCount > 0 && (
                <button onClick={() => setShowConfirm(true)} disabled={cleanupLoading}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition disabled:opacity-50">
                  {cleanupLoading
                    ? <><span className="w-3 h-3 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />Nettoyage...</>
                    : <>🗑 Nettoyer les partiels ({partialCount})</>}
                </button>
              )}
              <span className="text-xs text-text-muted">{filtered.length} entrée{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>

        {/* Log rows */}
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-text-muted py-6">Aucune entrée pour ces filtres</p>
          ) : filtered.map((log: any) => {
            const statusCfg = LOG_STATUS_CFG[log.status] || { dot: "bg-gray-400", badge: "bg-gray-100 text-gray-600 border-gray-200", label: log.status };
            const typeColor = LOG_TYPE_COLORS[log.data_type] || "bg-gray-100 text-gray-600 border-gray-200";
            const errors = parseErrors(log.error_message || "");
            const hasErrors = !!log.error_message;

            return (
              <div key={log.id}
                className={`flex items-center gap-3 text-xs px-3 py-2.5 rounded-lg border transition ${hasErrors ? "border-orange-100 bg-orange-50/30 hover:bg-orange-50/60" : "border-transparent hover:bg-gray-50/60 hover:border-border"}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
                <span className="text-text-muted w-36 flex-shrink-0">{formatDateTime(log.created_at)}</span>
                <span className={`px-2 py-0.5 rounded-full font-medium border text-[10px] capitalize ${typeColor}`}>
                  {log.data_type?.replace(/_/g, " ")}
                </span>
                {log.status !== "success" && (
                  <span className={`px-2 py-0.5 rounded-full font-medium border text-[10px] ${statusCfg.badge}`}>
                    {statusCfg.label}
                  </span>
                )}
                {hasErrors && (
                  <button onClick={() => setOpenLog(log)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200 transition">
                    ⚠ {errors ? `${errors.length} erreur${errors.length > 1 ? "s" : ""}` : "Erreur"} · Détails
                  </button>
                )}
                <span className="text-text-muted ml-auto font-mono">{(log.records_inserted ?? 0).toLocaleString()} enreg.</span>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}

function ActionButton({ label, onClick, color = "bg-primary", loading = false, icon }: { label: string; onClick: () => void; color?: string; loading?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${color} text-white text-xs font-medium px-3 py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
    >
      {loading ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : icon}
      {label}
    </button>
  );
}

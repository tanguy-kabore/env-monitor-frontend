"use client";
import { Clock } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface Props {
  /** ISO timestamp string (observed_at, target_date, predicted_at…) */
  timestamp?: string | null;
  /** Prefix label shown before the date. Defaults to "Relevé le" */
  label?: string;
  className?: string;
}

function relativeTime(ts: string): string {
  const diffMs = Date.now() - new Date(ts).getTime();
  if (diffMs < 0) {
    // Future timestamp — likely a data quality issue
    const futureDays = Math.ceil(-diffMs / 86_400_000);
    return futureDays <= 1 ? "dans moins d'1j" : `dans ${futureDays}j`;
  }
  const mins  = Math.floor(diffMs / 60_000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins  <  1) return "à l'instant";
  if (mins  < 60) return `il y a ${mins} min`;
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${days}j`;
}

export default function DataTimestamp({ timestamp, label = "Relevé le", className = "" }: Props) {
  if (!timestamp) return null;
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return null;

  const formatted = formatDateTime(timestamp);
  const rel       = relativeTime(timestamp);

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-text-muted ${className}`}>
      <Clock className="w-3 h-3 shrink-0 opacity-70" />
      <span>{label}</span>
      <span className="font-medium text-text">{formatted}</span>
      <span className="opacity-50">({rel})</span>
    </span>
  );
}

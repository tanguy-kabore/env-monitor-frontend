"use client";
import { useState, useEffect } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { api } from "@/lib/api";

interface Location {
  id: string;
  external_id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface LocationSelectProps {
  value: string;
  onChange: (locationId: string, location: Location) => void;
  className?: string;
}

export default function LocationSelect({ value, onChange, className }: LocationSelectProps) {
  const [cities, setCities] = useState<Location[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.getCities().then((res: any) => setCities(res.data || [])).catch(() => {});
  }, []);

  const filtered = cities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const selected = cities.find((c) => c.external_id === value || c.id === value);

  return (
    <div className={`relative z-[1001] ${className || ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg text-sm hover:border-primary transition w-full"
      >
        <MapPin className="w-4 h-4 text-primary" />
        <span className="flex-1 text-left truncate">
          {selected?.name || "Sélectionner une ville"}
        </span>
        <ChevronDown className="w-4 h-4 text-text-muted" />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-[1000] max-h-64 overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:border-primary"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48 scrollbar-thin">
            {filtered.map((city) => (
              <button
                key={city.id}
                onClick={() => {
                  onChange(city.external_id, city);
                  setOpen(false);
                  setSearch("");
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-primary/5 transition flex items-center gap-2"
              >
                <MapPin className="w-3 h-3 text-text-muted" />
                {city.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-sm text-text-muted text-center">Aucun résultat</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

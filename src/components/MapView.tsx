"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("react-leaflet").then((mod) => mod.Tooltip),
  { ssr: false }
);

interface MapPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  value?: number;
  label?: string;
  color?: string;
  risk?: string;
}

interface MapViewProps {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  colorFn?: (point: MapPoint) => string;
  radiusFn?: (point: MapPoint) => number;
  onPointClick?: (point: MapPoint) => void;
}

export default function MapView({
  points,
  center = [12.37, -1.52],
  zoom = 7,
  height = "500px",
  colorFn,
  radiusFn,
  onPointClick,
}: MapViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ height }} className="bg-gray-100 rounded-xl flex items-center justify-center">
        <p className="text-sm text-text-muted">Chargement de la carte...</p>
      </div>
    );
  }

  const defaultColor = (p: MapPoint) => {
    if (p.risk === "extreme") return "#D63031";
    if (p.risk === "high") return "#E17055";
    if (p.risk === "moderate") return "#FDCB6E";
    return "#00B894";
  };

  const defaultRadius = (p: MapPoint) => {
    if (p.value !== undefined) return Math.max(6, Math.min(20, p.value / 5));
    return 8;
  };

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-border">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point) => (
          <CircleMarker
            key={point.id}
            center={[point.latitude, point.longitude]}
            radius={radiusFn ? radiusFn(point) : defaultRadius(point)}
            pathOptions={{
              fillColor: colorFn ? colorFn(point) : defaultColor(point),
              color: "#fff",
              weight: 2,
              fillOpacity: 0.8,
            }}
            eventHandlers={{
              click: () => onPointClick?.(point),
            }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              <div className="text-xs font-medium">{point.name}</div>
              {point.label && <div className="text-xs text-gray-500">{point.label}</div>}
            </Tooltip>
            <Popup>
              <div className="text-sm">
                <strong>{point.name}</strong>
                {point.value !== undefined && (
                  <p className="mt-1">Valeur: {point.value}</p>
                )}
                {point.risk && <p>Risque: {point.risk}</p>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

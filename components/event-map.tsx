"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "next-themes";
import { Event } from "@/lib/events";
import { ExternalLink } from "lucide-react";

const KL_CENTER: [number, number] = [3.139, 101.6869];

const SOURCE_COLORS: Record<string, string> = {
  meetup: "#f43f5e",
  eventbrite: "#f97316",
  luma: "#8b5cf6",
  allevents: "#0ea5e9",
  devpost: "#10b981",
  devfolio: "#22c55e",
  manual: "#eab308",
};

function markerIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:26px;height:26px;">
      <div style="position:absolute;inset:0;border-radius:9999px;background:${color};opacity:0.25;animation:pulse 2s infinite;"></div>
      <div style="position:absolute;inset:6px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -12],
  });
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
  }, [map, points]);
  return null;
}

export default function EventMap({ events }: { events: Event[] }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const located = useMemo(
    () => events.filter((e) => e.lat !== null && e.lon !== null),
    [events]
  );
  const points = useMemo(
    () => located.map((e) => [e.lat!, e.lon!] as [number, number]),
    [located]
  );

  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  return (
    <MapContainer
      center={KL_CENTER}
      zoom={12}
      scrollWheelZoom={false}
      className="z-0 h-full w-full"
      style={{ background: isDark ? "#18181b" : "#f4f4f5" }}
    >
      <TileLayer
        key={tileUrl}
        url={tileUrl}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <FitBounds points={points} />
      {located.map((event, i) => (
        <Marker
          key={event.link || i}
          position={[event.lat!, event.lon!]}
          icon={markerIcon(SOURCE_COLORS[event.source] || "#6366f1")}
        >
          <Popup>
            <div style={{ minWidth: 180, maxWidth: 220 }}>
              <p style={{ fontWeight: 600, margin: 0, fontSize: 13 }}>
                {event.name}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#71717a" }}>
                {event.date}
                {event.venue ? ` · ${event.venue}` : ""}
              </p>
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 6,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                View event <ExternalLink size={12} />
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

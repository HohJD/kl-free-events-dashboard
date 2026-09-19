"use client";

export interface ApproxLocation {
  lat: number;
  lon: number;
  area: string;
}

/**
 * Detect the giver's approximate location and turn it into a neighborhood
 * name via OpenStreetMap reverse geocoding.
 *
 * Privacy: coordinates are rounded to ~100 m and we only ever show/store the
 * neighborhood name + rounded point — never an exact address.
 */
export async function getApproxLocation(): Promise<ApproxLocation | null> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return null;
  }

  const position = await new Promise<GeolocationPosition | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
  if (!position) return null;

  // ~110 m precision: the pickup neighbourhood, never the giver's door.
  const lat = Math.round(position.coords.latitude * 1000) / 1000;
  const lon = Math.round(position.coords.longitude * 1000) / 1000;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=16&accept-language=en`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) throw new Error(`reverse ${res.status}`);
    const data = await res.json();
    const a = data.address || {};
    // Road, locality, city. No building or shop names: they can pinpoint a home.
    const road: string = a.road || a.pedestrian || a.residential || "";
    const locality: string =
      a.suburb ||
      a.neighbourhood ||
      a.hamlet ||
      a.village ||
      a.quarter ||
      a.city_district ||
      a.town ||
      "";
    const city: string = a.city || a.town || a.state || "";
    const parts = [road, locality, city].filter(
      (p, i, arr) => p && arr.indexOf(p) === i
    );
    if (!parts.length) return null;
    return { lat, lon, area: parts.slice(0, 3).join(", ") };
  } catch {
    return null;
  }
}

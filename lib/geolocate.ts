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

  // ~11 m precision — enough for a street-level pin, not an exact unit
  const lat = Math.round(position.coords.latitude * 10000) / 10000;
  const lon = Math.round(position.coords.longitude * 10000) / 10000;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&accept-language=en`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) throw new Error(`reverse ${res.status}`);
    const data = await res.json();
    const a = data.address || {};
    // Most-specific first: named place, road, locality, city
    const place: string =
      a.amenity || a.building || a.shop || a.leisure || a.office || "";
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
    const parts = [place, road, locality, city].filter(
      (p, i, arr) => p && arr.indexOf(p) === i
    );
    if (!parts.length) return null;
    return { lat, lon, area: parts.slice(0, 4).join(", ") };
  } catch {
    return null;
  }
}

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
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  });
  if (!position) return null;

  const lat = Math.round(position.coords.latitude * 1000) / 1000;
  const lon = Math.round(position.coords.longitude * 1000) / 1000;

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=14&accept-language=en`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) throw new Error(`reverse ${res.status}`);
    const data = await res.json();
    const a = data.address || {};
    const area: string =
      a.suburb ||
      a.neighbourhood ||
      a.quarter ||
      a.city_district ||
      a.town ||
      a.village ||
      a.city ||
      "";
    if (!area) return null;
    const city = a.city && a.city !== area ? `, ${a.city}` : "";
    return { lat, lon, area: `${area}${city}` };
  } catch {
    return null;
  }
}

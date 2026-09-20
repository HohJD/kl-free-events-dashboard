"use client";

import { SUPABASE_ANON_KEY, SUPABASE_URL, getSupabase } from "./supabase";
import type { ApproxLocation } from "./geolocate";
import type { FreeItem } from "./items";

/** Listings stay up for this many days, then vanish (and are deleted daily). */
export const LISTING_DAYS = 7;
export const PHOTO_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/item-pics/`;

interface ItemRow {
  id: string;
  name: string;
  description: string | null;
  images: string[] | null;
  condition: string;
  pickup: string;
  contact: string;
  status: FreeItem["status"];
  category: string | null;
  owner: string | null;
  pickup_lat: number | null;
  pickup_lon: number | null;
  created_at: string;
}

function toItem(row: ItemRow): FreeItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    images: (row.images || []).filter((src) => src.startsWith(PHOTO_PREFIX)),
    condition: row.condition,
    pickup: row.pickup,
    contact: row.contact,
    status: row.status,
    category: row.category || "Other",
    owner: row.owner,
    pickupLat: row.pickup_lat,
    pickupLon: row.pickup_lon,
    added: row.created_at || "",
  };
}

/** Live listings from the last LISTING_DAYS days that are not yet claimed. */
export async function fetchItems(): Promise<FreeItem[]> {
  const cutoff = new Date(Date.now() - LISTING_DAYS * 86400000).toISOString();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/free_items?select=*&status=neq.claimed&created_at=gte.${encodeURIComponent(cutoff)}&order=created_at.desc`,
    { headers: { apikey: SUPABASE_ANON_KEY } },
  );
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return ((await res.json()) as ItemRow[]).map(toItem);
}

export function daysLeft(added: string): number {
  const listed = Date.parse(added);
  if (Number.isNaN(listed)) return LISTING_DAYS;
  return Math.max(0, Math.ceil((listed + LISTING_DAYS * 86400000 - Date.now()) / 86400000));
}

/**
 * Downscale and compress a photo in the browser before upload. Uses an <img>
 * element so EXIF orientation from phone cameras is applied.
 */
export async function compressImage(file: File, maxDim = 1400): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not read that photo"))), "image/jpeg", 0.82),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function uploadPhoto(blob: Blob): Promise<string> {
  const key = `${crypto.randomUUID()}.jpg`;
  const supabase = getSupabase();
  const { error } = await supabase.storage.from("item-pics").upload(key, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return supabase.storage.from("item-pics").getPublicUrl(key).data.publicUrl;
}

/** Normalise a Malaysian phone number or WhatsApp username into a wa.me link. */
export function toWhatsAppLink(raw: string): string {
  const trimmed = raw.trim().replace(/^@/, "");
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 9) {
    const msisdn = digits.startsWith("0") ? `60${digits.slice(1)}` : digits.startsWith("60") ? digits : `60${digits}`;
    return msisdn.length < 10 || msisdn.length > 13 ? "" : `https://wa.me/${msisdn}`;
  }
  return /^[a-zA-Z][a-zA-Z0-9._]{2,29}$/.test(trimmed) ? `https://wa.me/${trimmed}` : "";
}

export function isWhatsAppLink(value: string): boolean {
  return /^https:\/\/wa\.me\/[A-Za-z0-9._]{3,30}$/.test(value);
}

export const CONDITIONS = ["Like new", "Good", "Used", "For parts"] as const;
export const MAX_PHOTOS = 3;

/**
 * Upload the photos and insert the listing. The row keeps the fields the
 * database policies were written for (owner is set by the database); the
 * pickup point is only stored when it came from location detection.
 */
export async function postItem(input: {
  name: string; photos: File[]; category: string; pickup: string; location: ApproxLocation | null; contact: string;
  description?: string; condition?: string;
}): Promise<FreeItem> {
  const urls: string[] = [];
  for (const photo of input.photos.slice(0, MAX_PHOTOS)) urls.push(await uploadPhoto(await compressImage(photo)));
  const useLocation = input.location && input.location.area === input.pickup;
  const { data, error } = await getSupabase()
    .from("free_items")
    .insert({
      name: input.name,
      images: urls,
      description: (input.description || "").trim().slice(0, 300),
      condition: input.condition || "Good",
      category: input.category,
      pickup: input.pickup,
      pickup_lat: useLocation ? input.location!.lat : null,
      pickup_lon: useLocation ? input.location!.lon : null,
      contact: input.contact,
    })
    .select()
    .single();
  if (error) throw error;
  return toItem(data as ItemRow);
}

export function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/policy|row-level|403/i.test(message)) {
    return "The listing was not accepted. Each account can have up to 10 active listings.";
  }
  if (/failed to fetch|network/i.test(message)) return "No connection. Check your internet and try again.";
  return message;
}

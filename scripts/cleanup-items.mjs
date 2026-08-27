#!/usr/bin/env node
/**
 * Hard-delete Collect-tab listings older than 7 days (or already claimed),
 * including their photos in storage. Run daily by the Hermes cron.
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";

const SUPABASE_URL = "https://rdqfibpnlizxgkqzcnee.supabase.co";
const serviceKey = readFileSync(
  `${homedir()}/.secrets/supabase-kl-service-key`,
  "utf8"
).trim();

const headers = {
  Authorization: `Bearer ${serviceKey}`,
  apikey: serviceKey,
  "Content-Type": "application/json",
};

const cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
const query = `or=(created_at.lt.${cutoff},status.eq.claimed)`;

const res = await fetch(
  `${SUPABASE_URL}/rest/v1/free_items?select=id,name,images&${query}`,
  { headers }
);
if (!res.ok) {
  console.error(`fetch expired failed: ${res.status}`);
  process.exit(1);
}
const expired = await res.json();
if (!expired.length) {
  console.log("cleanup: nothing expired");
  process.exit(0);
}

let photosDeleted = 0;
for (const item of expired) {
  for (const url of item.images || []) {
    const marker = "/storage/v1/object/public/item-pics/";
    if (!url.includes(marker)) continue;
    const key = url.split(marker)[1];
    const del = await fetch(
      `${SUPABASE_URL}/storage/v1/object/item-pics/${key}`,
      { method: "DELETE", headers }
    );
    if (del.ok) photosDeleted++;
  }
}

const delRows = await fetch(`${SUPABASE_URL}/rest/v1/free_items?${query}`, {
  method: "DELETE",
  headers,
});
if (!delRows.ok) {
  console.error(`row delete failed: ${delRows.status}`);
  process.exit(1);
}
console.log(
  `cleanup: removed ${expired.length} expired/claimed listing(s), ${photosDeleted} photo(s)`
);

#!/usr/bin/env node
/**
 * Add a free item (with photos) to the Supabase-backed Collect tab.
 * The item appears on the live site immediately — no redeploy needed.
 *
 * Usage:
 *   node scripts/add-item.mjs --name "IKEA lamp" --desc "Works great" \
 *     --pickup "Bangsar" --condition "Like new" \
 *     --contact "https://wa.me/60123456789" photo1.jpg photo2.jpg
 *
 * Requires the service key at ~/.secrets/supabase-kl-service-key
 */
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";

const SUPABASE_URL = "https://rdqfibpnlizxgkqzcnee.supabase.co";
const serviceKey = readFileSync(
  `${homedir()}/.secrets/supabase-kl-service-key`,
  "utf8"
).trim();

const args = process.argv.slice(2);
const opts = { name: "", desc: "", pickup: "", condition: "Good", contact: "" };
const photos = [];
for (let i = 0; i < args.length; i++) {
  const flag = args[i].replace(/^--/, "");
  if (args[i].startsWith("--") && flag in opts) opts[flag] = args[++i];
  else photos.push(args[i]);
}
if (!opts.name) {
  console.error("Missing --name. See usage in the file header.");
  process.exit(1);
}

const CONTENT_TYPES = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".gif": "image/gif", ".heic": "image/heic",
};

const imageUrls = [];
for (const photo of photos) {
  const ext = extname(photo).toLowerCase();
  const key = `${randomUUID()}${ext}`;
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/item-pics/${key}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
      },
      body: readFileSync(photo),
    }
  );
  if (!res.ok) {
    console.error(`Upload failed for ${photo}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  imageUrls.push(`${SUPABASE_URL}/storage/v1/object/public/item-pics/${key}`);
  console.log(`uploaded ${basename(photo)}`);
}

const insert = await fetch(`${SUPABASE_URL}/rest/v1/free_items`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  body: JSON.stringify({
    name: opts.name,
    description: opts.desc,
    images: imageUrls,
    condition: opts.condition,
    pickup: opts.pickup,
    contact: opts.contact,
    status: "available",
  }),
});
if (!insert.ok) {
  console.error(`Insert failed: ${insert.status} ${await insert.text()}`);
  process.exit(1);
}
const [row] = await insert.json();
console.log(`\nListed "${row.name}" (id ${row.id}) with ${imageUrls.length} photo(s).`);
console.log("It's live on the site now — no redeploy needed.");

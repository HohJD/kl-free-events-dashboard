"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, Check, X, Plus, Sparkles } from "lucide-react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";
import { FreeItem } from "@/lib/items";
import {
  classifyItemPhoto,
  preloadClassifier,
  ITEM_CATEGORIES,
} from "@/lib/classify";
import { cn } from "@/lib/utils";

/**
 * Downscale + compress a photo in the browser before upload.
 * Uses an <img> element (not createImageBitmap) so EXIF orientation from
 * phone cameras is applied correctly — otherwise iPhone photos upload
 * sideways on some Safari versions.
 */
async function compressImage(file: File, maxDim = 1400): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(
      1,
      maxDim / Math.max(img.naturalWidth, img.naturalHeight)
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas
      .getContext("2d")!
      .drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("compress failed"))),
        "image/jpeg",
        0.82
      )
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function uploadPhoto(blob: Blob): Promise<string> {
  const key = `${crypto.randomUUID()}.jpg`;
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/item-pics/${key}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "image/jpeg",
      },
      body: blob,
    }
  );
  if (!res.ok) throw new Error(`upload ${res.status}`);
  return `${SUPABASE_URL}/storage/v1/object/public/item-pics/${key}`;
}

async function insertItem(
  name: string,
  imageUrl: string,
  category: string
): Promise<FreeItem> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/free_items`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      name,
      images: [imageUrl],
      condition: "Good",
      category,
    }),
  });
  if (!res.ok) throw new Error(`insert ${res.status}`);
  const [row] = await res.json();
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    images: row.images,
    condition: row.condition,
    pickup: row.pickup,
    contact: row.contact,
    status: row.status,
    category: row.category || "Other",
    added: (row.created_at || "").slice(0, 10),
  };
}

export function UploadItem({ onListed }: { onListed: (item: FreeItem) => void }) {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [oneLiner, setOneLiner] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [category, setCategory] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickPhoto = (file: File | null) => {
    setPhoto(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
    setCategory(null);
    if (file) {
      // HF Transformers.js zero-shot classification, in-browser & free
      setDetecting(true);
      classifyItemPhoto(file)
        .then((c) => setCategory(c))
        .finally(() => setDetecting(false));
    }
  };

  const cycleCategory = () => {
    const labels = ITEM_CATEGORIES.map((c) => c.label);
    const idx = labels.indexOf(category ?? "Other");
    setCategory(labels[(idx + 1) % labels.length]);
  };

  const reset = () => {
    setOpen(false);
    pickPhoto(null);
    setOneLiner("");
    setState("idle");
  };

  const submit = async () => {
    if (!photo || oneLiner.trim().length < 3 || state === "busy") return;
    setState("busy");
    try {
      const blob = await compressImage(photo);
      const url = await uploadPhoto(blob);
      const item = await insertItem(oneLiner.trim(), url, category ?? "Other");
      onListed(item);
      setState("done");
      setTimeout(reset, 1600);
    } catch {
      setState("error");
    }
  };

  return (
    <div className="mb-6">
      {!open ? (
        <button
          onClick={() => {
            setOpen(true);
            preloadClassifier();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/60 px-4 py-5 font-semibold text-muted-foreground transition-all hover:-translate-y-0.5 hover:text-foreground hover:shadow-brutal"
        >
          <span className="flex size-8 items-center justify-center rounded-full border border-border bg-accent text-accent-foreground shadow-brutal-sm">
            <Plus className="size-4" />
          </span>
          Give something away — snap a photo, one line, done
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-4 shadow-brutal"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold">
              Give something away
            </h3>
            <button
              onClick={reset}
              aria-label="Close"
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            {/* Photo picker */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className={cn(
                "relative flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border transition-colors hover:border-ring sm:w-44",
                preview ? "border-solid" : "bg-muted/40"
              )}
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Item preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex flex-col items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Camera className="size-6" />
                  Snap / choose photo
                </span>
              )}
            </button>

            {/* One-liner + submit */}
            <div className="flex flex-1 flex-col gap-2.5">
              <input
                value={oneLiner}
                onChange={(e) => setOneLiner(e.target.value.slice(0, 80))}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder='One line, e.g. "IKEA lamp, works great — pickup Bangsar, DM @jd"'
                className="h-11 w-full rounded-xl border border-input bg-background px-3 text-base outline-none placeholder:text-muted-foreground focus:border-ring md:text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Tip: include pickup area + how to reach you in the line.
              </p>

              {/* AI-detected category (tap to correct) */}
              {photo ? (
                <button
                  onClick={cycleCategory}
                  disabled={detecting}
                  title="Tap to change category"
                  className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs font-semibold shadow-brutal-sm transition-all hover:-translate-y-px disabled:opacity-70"
                >
                  <Sparkles className="size-3.5 text-rose-500" />
                  {detecting ? "Detecting category…" : category ?? "Other"}
                  {!detecting ? (
                    <span className="text-muted-foreground">· tap to change</span>
                  ) : null}
                </button>
              ) : null}
              <button
                onClick={submit}
                disabled={!photo || oneLiner.trim().length < 3 || state === "busy"}
                className="mt-auto inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border bg-primary font-mono text-xs font-bold uppercase text-primary-foreground shadow-brutal-sm transition-all hover:-translate-y-px active:translate-y-0.5 active:shadow-none disabled:opacity-40 sm:w-40"
              >
                {state === "busy" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Listing…
                  </>
                ) : (
                  "List it free"
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {state === "done" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 flex items-center gap-1.5 text-sm font-medium text-green-600"
              >
                <Check className="size-4" /> Listed! It&apos;s live now.
              </motion.p>
            )}
            {state === "error" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-sm font-medium text-destructive"
              >
                Something went wrong — try again in a moment.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

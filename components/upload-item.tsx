"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Loader2, Check, X, Plus, Sparkles, LogOut, UserRound, MapPin } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";
import { getApproxLocation, ApproxLocation } from "@/lib/geolocate";
import { FreeItem } from "@/lib/items";
import {
  classifyItemPhoto,
  classifyText,
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
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from("item-pics")
    .upload(key, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return supabase.storage.from("item-pics").getPublicUrl(key).data.publicUrl;
}

/** Normalize a Malaysian phone number OR WhatsApp username into a wa.me link. */
export function toWhatsAppLink(raw: string): string {
  const trimmed = raw.trim().replace(/^@/, "");
  if (!trimmed) return "";
  const digits = trimmed.replace(/\D/g, "");
  // Phone number path (9+ digits)
  if (digits.length >= 9) {
    const msisdn = digits.startsWith("0")
      ? `60${digits.slice(1)}`
      : digits.startsWith("60")
        ? digits
        : `60${digits}`;
    if (msisdn.length < 10 || msisdn.length > 13) return "";
    return `https://wa.me/${msisdn}`;
  }
  // Username path (letters, digits, dot/underscore, 3-30 chars)
  if (/^[a-zA-Z][a-zA-Z0-9._]{2,29}$/.test(trimmed)) {
    return `https://wa.me/${trimmed}`;
  }
  return "";
}

async function insertItem(
  name: string,
  imageUrl: string,
  category: string,
  location: ApproxLocation | null,
  contact: string
): Promise<FreeItem> {
  const { data, error } = await getSupabase()
    .from("free_items")
    .insert({
      name,
      images: [imageUrl],
      condition: "Good",
      category,
      pickup: location?.area ?? "",
      pickup_lat: location?.lat ?? null,
      pickup_lon: location?.lon ?? null,
      contact,
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    images: data.images,
    condition: data.condition,
    pickup: data.pickup,
    contact: data.contact,
    status: data.status,
    category: data.category || "Other",
    added: (data.created_at || "").slice(0, 10),
    owner: data.owner ?? null,
    pickupLat: data.pickup_lat ?? null,
    pickupLon: data.pickup_lon ?? null,
  };
}

function AuthGate() {
  const { signInOrUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.includes("@") || password.length < 6 || busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await signInOrUp(email, password);
    if (err) setError(err);
    setBusy(false);
  };

  return (
    <div className="mt-3">
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <UserRound className="size-4" />
        Quick account so you can manage your listings — no email verification
        needed.
      </p>
      <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="h-11 flex-1 rounded-xl border border-input bg-background px-3 text-base outline-none placeholder:text-muted-foreground focus:border-ring md:text-sm"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Password (6+ chars)"
          className="h-11 flex-1 rounded-xl border border-input bg-background px-3 text-base outline-none placeholder:text-muted-foreground focus:border-ring md:text-sm"
        />
        <button
          onClick={submit}
          disabled={!email.includes("@") || password.length < 6 || busy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-primary px-4 font-mono text-xs font-bold uppercase text-primary-foreground shadow-brutal-sm transition-all hover:-translate-y-px active:translate-y-0.5 active:shadow-none disabled:opacity-40"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Sign in / up"}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-sm font-medium text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

export function UploadItem({ onListed }: { onListed: (item: FreeItem) => void }) {
  const { user, ready, signOut } = useAuth();
  const [whatsapp, setWhatsapp] = useState("");
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [oneLiner, setOneLiner] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  // Category priority: manual pick > text match > image AI
  const [manualCat, setManualCat] = useState<string | null>(null);
  const [imageCat, setImageCat] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [location, setLocation] = useState<ApproxLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Prefill WhatsApp from the account (asked once, remembered forever)
  useEffect(() => {
    const saved = user?.user_metadata?.whatsapp;
    if (typeof saved === "string" && saved) setWhatsapp(saved);
  }, [user]);

  const pickPhoto = (file: File | null) => {
    setPhoto(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
    setManualCat(null);
    setImageCat(null);
    if (file) {
      // HF Transformers.js zero-shot classification, in-browser & free
      setDetecting(true);
      classifyItemPhoto(file)
        .then((c) => setImageCat(c))
        .finally(() => setDetecting(false));
      // Auto-detect pickup area (browser asks permission once)
      if (!location && !locating) {
        setLocating(true);
        getApproxLocation()
          .then((loc) => setLocation(loc))
          .finally(() => setLocating(false));
      }
    }
  };

  // Live text detection from the one-liner beats the image guess
  const textCat = classifyText(oneLiner);
  const category = manualCat ?? textCat ?? imageCat;

  const cycleCategory = () => {
    const labels = ITEM_CATEGORIES.map((c) => c.label);
    const idx = labels.indexOf(category ?? "Other");
    setManualCat(labels[(idx + 1) % labels.length]);
  };

  const reset = () => {
    setOpen(false);
    pickPhoto(null);
    setOneLiner("");
    setLocation(null);
    setState("idle");
  };

  const contactLink = toWhatsAppLink(whatsapp);
  const canSubmit =
    !!photo && oneLiner.trim().length >= 3 && !!contactLink && state !== "busy";

  const submit = async () => {
    if (!canSubmit) return;
    setState("busy");
    try {
      const contact = contactLink;
      const blob = await compressImage(photo);
      const url = await uploadPhoto(blob);
      const item = await insertItem(
        oneLiner.trim(),
        url,
        category ?? "Other",
        location,
        contact
      );
      // Remember the number on the account for next time
      if (whatsapp && whatsapp !== user?.user_metadata?.whatsapp) {
        getSupabase()
          .auth.updateUser({ data: { whatsapp } })
          .then(() => {}, () => {});
      }
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
            <div className="flex items-center gap-2">
              {user ? (
                <button
                  onClick={() => signOut()}
                  title="Sign out"
                  className="flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <UserRound className="size-3.5" />
                  {user.email?.split("@")[0]}
                  <LogOut className="size-3" />
                </button>
              ) : null}
              <button
                onClick={reset}
                aria-label="Close"
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {ready && !user ? (
            <AuthGate />
          ) : (
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
              <input
                type="text"
                inputMode="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.slice(0, 30))}
                placeholder="Your WhatsApp number or username — required"
                className={cn(
                  "h-11 w-full rounded-xl border bg-background px-3 text-base outline-none placeholder:text-muted-foreground focus:border-ring md:text-sm",
                  whatsapp && !contactLink
                    ? "border-destructive"
                    : "border-input"
                )}
              />
              <p
                className={cn(
                  "text-xs",
                  whatsapp && !contactLink
                    ? "font-medium text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {whatsapp && !contactLink
                  ? "That doesn't look right — try 0123456789, +6012…, or your WhatsApp username."
                  : "Interested people tap \u201cClaim on WhatsApp\u201d and land straight in your chat to arrange pickup. Saved for next time. Listings auto-delete after 7 days."}
              </p>

              {/* Auto-detected chips: category + pickup area */}
              {photo ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={cycleCategory}
                    title="Tap to change category"
                    className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs font-semibold shadow-brutal-sm transition-all hover:-translate-y-px"
                  >
                    <Sparkles className="size-3.5 text-rose-500" />
                    {category ?? (detecting ? "Detecting category…" : "Other")}
                    <span className="text-muted-foreground">· tap to change</span>
                  </button>

                  {locating ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs font-semibold opacity-70">
                      <MapPin className="size-3.5 text-sky-500" />
                      Detecting area…
                    </span>
                  ) : location ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs font-semibold shadow-brutal-sm">
                      <MapPin className="size-3.5 text-sky-500" />
                      {location.area}
                      <button
                        onClick={() => setLocation(null)}
                        aria-label="Remove location"
                        title="Remove location"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ) : null}
                </div>
              ) : null}
              <button
                onClick={submit}
                disabled={!canSubmit}
                title={!contactLink ? "Add your WhatsApp so people can claim" : undefined}
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
          )}

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

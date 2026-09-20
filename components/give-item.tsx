"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, ChevronDown, Loader2, LocateFixed, LogOut, Sparkles, Trash2, UserRound, X } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";
import { getApproxLocation, type ApproxLocation } from "@/lib/geolocate";
import { ITEM_CATEGORIES, aiAllowed, classifyItemPhoto, classifyText, preloadClassifier } from "@/lib/classify";
import { CONDITIONS, LISTING_DAYS, MAX_PHOTOS, friendlyError, postItem, toWhatsAppLink } from "@/lib/free-items";
import type { FreeItem } from "@/lib/items";
import { cn } from "@/lib/utils";

const input = "h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-base outline-none placeholder:text-muted-foreground focus:border-ring md:text-sm";

function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-semibold">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {hint ? <span className="mt-1 block text-xs leading-5 text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function SignIn() {
  const { signInOrUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = email.includes("@") && password.length >= 6 && !busy;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    const { error: problem } = await signInOrUp(email.trim(), password);
    if (problem) setError(problem);
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
        <UserRound className="mt-0.5 size-4 shrink-0" aria-hidden />
        Step 1 of 2: sign in so you can mark your items as claimed or delete them later. New here? The same form creates your account.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Email"><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={input} /></Field>
        <Field label="Password"><input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6 or more characters" className={input} /></Field>
      </div>
      {error ? <p className="text-sm font-medium text-destructive" role="alert">{error}</p> : null}
      <button type="submit" disabled={!ready}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-brutal-sm disabled:opacity-40">
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Continue
      </button>
    </form>
  );
}

/** "Give something away": sign in, then photo, name, category, pickup, WhatsApp. */
export function GiveItem({ open, onClose, onListed }: { open: boolean; onClose: () => void; onListed: (item: FreeItem) => void }) {
  const { user, ready, signOut } = useAuth();
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [pickedCategory, setPickedCategory] = useState<string | null>(null);
  const [photoCategory, setPhotoCategory] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<string>("Good");
  const [showDetails, setShowDetails] = useState(false);
  const [pickup, setPickup] = useState("");
  const [location, setLocation] = useState<ApproxLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateFailed, setLocateFailed] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = user?.user_metadata?.whatsapp;
    if (typeof saved === "string" && saved && !whatsapp) setWhatsapp(saved);
  }, [user, whatsapp]);
  useEffect(() => {
    if (!open) return;
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    preloadClassifier();  // warms the ~25 MB model; skipped on 2G/data saver
  }, [open]);
  useEffect(() => () => { previews.forEach((url) => URL.revokeObjectURL(url)); }, [previews]);

  const suggested = classifyText(name);
  const category = pickedCategory ?? suggested ?? photoCategory ?? "Other";
  const contact = toWhatsAppLink(whatsapp);
  const missing = [!photos.length && "a photo", name.trim().length < 3 && "what it is", !contact && "your WhatsApp"].filter(Boolean) as string[];

  const addPhotos = (files: File[]) => {
    const room = MAX_PHOTOS - photos.length;
    const next = files.slice(0, Math.max(0, room));
    if (!next.length) return;
    setPhotos((previous) => [...previous, ...next]);
    setPreviews((previous) => [...previous, ...next.map((file) => URL.createObjectURL(file))]);
    // Categorise from the first photo, in the browser, when the name hasn't said enough.
    if (!photos.length && aiAllowed()) {
      setDetecting(true);
      classifyItemPhoto(next[0]).then((found) => setPhotoCategory(found)).finally(() => setDetecting(false));
    }
  };
  const removePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPhotos((previous) => previous.filter((_, i) => i !== index));
    setPreviews((previous) => previous.filter((_, i) => i !== index));
  };
  const locate = async () => {
    setLocating(true);
    setLocateFailed(false);
    const found = await getApproxLocation();
    setLocating(false);
    if (found) { setLocation(found); setPickup(found.area); } else setLocateFailed(true);
  };
  const reset = () => {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPhotos([]); setPreviews([]); setPhotoCategory(null);
    setName(""); setPickedCategory(null); setPickup(""); setLocation(null); setDescription(""); setCondition("Good");
    setShowDetails(false); setStatus("idle"); setError("");
    onClose();
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (missing.length || !photos.length || status === "busy") return;
    setStatus("busy");
    setError("");
    try {
      const item = await postItem({ name: name.trim(), photos, category, pickup: pickup.trim(), location, contact, description, condition });
      if (whatsapp !== user?.user_metadata?.whatsapp) getSupabase().auth.updateUser({ data: { whatsapp } }).then(() => {}, () => {});
      onListed(item);
      setStatus("done");
      setTimeout(reset, 1800);
    } catch (problem) {
      setError(friendlyError(problem));
      setStatus("idle");
    }
  };

  if (!open) return null;
  return (
    <div ref={panelRef} className="scroll-mt-20 rounded-2xl border border-border bg-card p-4 shadow-brutal sm:p-6">
      <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-3">
        <div>
          <h2 className="font-display text-xl font-bold">Give something away</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Free to post. Your listing stays up for {LISTING_DAYS} days.</p>
        </div>
        <div className="flex items-center gap-1">
          {user ? (
            <button type="button" onClick={() => signOut()} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
              <span className="max-w-[120px] truncate">{user.email}</span> <LogOut className="size-3.5" aria-hidden /><span className="sr-only">Sign out</span>
            </button>
          ) : null}
          <button type="button" onClick={reset} aria-label="Close" className="flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" /></button>
        </div>
      </div>

      <div className="mt-4">
        {!ready ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !user ? (
          <SignIn />
        ) : status === "done" ? (
          <p className="flex items-center gap-2 py-6 text-base font-semibold" role="status"><Check className="size-5 text-green-600" aria-hidden /> Posted! It&apos;s now at the top of the list.</p>
        ) : (
          <form onSubmit={submit} className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple className="hidden"
                onChange={(e) => { addPhotos(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
              {previews.length ? (
                <div className="grid grid-cols-3 gap-2 md:grid-cols-2">
                  {previews.map((src, index) => (
                    <div key={src} className={cn("relative overflow-hidden rounded-xl border border-border", index === 0 && "col-span-3 md:col-span-2")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Photo ${index + 1}`} className={cn("w-full object-cover", index === 0 ? "aspect-[4/3]" : "aspect-square")} />
                      <button type="button" onClick={() => removePhoto(index)} aria-label={`Remove photo ${index + 1}`}
                        className="absolute right-1 top-1 flex size-9 items-center justify-center rounded-full bg-black/60 text-white">
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  ))}
                  {photos.length < MAX_PHOTOS ? (
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border text-xs font-medium text-muted-foreground hover:border-ring">
                      <Camera className="mr-1 size-4" aria-hidden /> Add
                    </button>
                  ) : null}
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 hover:border-ring">
                  <span className="flex flex-col items-center gap-1.5 text-sm font-medium text-muted-foreground"><Camera className="size-7" aria-hidden /> Add a photo</span>
                </button>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {photos.length ? `${photos.length} of ${MAX_PHOTOS} photos. The first one is the cover.` : `Up to ${MAX_PHOTOS} photos. The first one is the cover.`}
              </p>
            </div>
            <div className="min-w-0 space-y-4">
              <Field label="What is it?">
                <input value={name} onChange={(e) => setName(e.target.value.slice(0, 80))} placeholder="e.g. IKEA desk lamp, works well" className={input} />
              </Field>
              <div>
                <span className="text-sm font-semibold">Category</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="Category">
                  {ITEM_CATEGORIES.map((item) => (
                    <button key={item.label} type="button" onClick={() => setPickedCategory(item.label)} aria-pressed={category === item.label}
                      className={cn("min-h-9 rounded-full border px-3 text-xs font-medium", category === item.label ? "border-border bg-accent font-semibold text-accent-foreground" : "border-border/50 text-muted-foreground hover:text-foreground")}>
                      {item.label}
                    </button>
                  ))}
                </div>
                {detecting ? (
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" aria-hidden /> Looking at your photo…</span>
                ) : !pickedCategory && (suggested || photoCategory) ? (
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Sparkles className="size-3.5" aria-hidden /> Suggested from {suggested ? "the name" : "your photo"}. Tap another to change.
                  </span>
                ) : null}
              </div>
              <Field label="Pickup area" hint={locateFailed ? "Couldn't get your location. Type the area instead." : "Neighbourhood only, e.g. SS15 Subang Jaya. Never your full address."}>
                <span className="flex gap-2">
                  <input value={pickup} onChange={(e) => setPickup(e.target.value.slice(0, 120))} placeholder="Area or neighbourhood" className={input} />
                  <button type="button" onClick={locate} disabled={locating}
                    className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-input px-3 text-sm font-medium hover:bg-muted disabled:opacity-50">
                    {locating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LocateFixed className="size-4" aria-hidden />}
                    <span className="hidden sm:inline">Use my location</span><span className="sr-only sm:hidden">Use my location</span>
                  </button>
                </span>
              </Field>
              <div>
                <button type="button" onClick={() => setShowDetails(!showDetails)} aria-expanded={showDetails}
                  className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
                  <ChevronDown className={cn("size-4 transition-transform", showDetails && "rotate-180")} aria-hidden /> Add details (optional)
                </button>
                {showDetails ? (
                  <div className="mt-3 space-y-4">
                    <Field label="Condition">
                      <span className="flex flex-wrap gap-1.5">
                        {CONDITIONS.map((value) => (
                          <button key={value} type="button" onClick={() => setCondition(value)} aria-pressed={condition === value}
                            className={cn("min-h-9 rounded-full border px-3 text-xs font-medium", condition === value ? "border-border bg-accent font-semibold text-accent-foreground" : "border-border/50 text-muted-foreground hover:text-foreground")}>
                            {value}
                          </button>
                        ))}
                      </span>
                    </Field>
                    <Field label="Anything else?" hint={`${description.length}/300 characters. Size, faults, what's included.`}>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 300))} rows={3}
                        placeholder="e.g. 120 cm wide, small scratch on the left side, bulb included"
                        className="w-full rounded-xl border border-input bg-background p-3 text-base outline-none placeholder:text-muted-foreground focus:border-ring md:text-sm" />
                    </Field>
                  </div>
                ) : null}
              </div>
              <Field label="Your WhatsApp" hint={whatsapp && !contact ? <span className="font-medium text-destructive">Try 0123456789, +6012… or your WhatsApp username.</span> : "People tap “Claim on WhatsApp” to message you. Saved for next time."}>
                <input type="text" inputMode="tel" autoComplete="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value.slice(0, 30))} placeholder="Phone number or username"
                  className={cn(input, whatsapp && !contact && "border-destructive")} />
              </Field>
              {error ? <p className="text-sm font-medium text-destructive" role="alert">{error}</p> : null}
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={!!missing.length || status === "busy"}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-brutal-sm disabled:opacity-40">
                  {status === "busy" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Post it for free
                </button>
                {missing.length ? <span className="text-xs text-muted-foreground">Still need {missing.join(", ")}.</span> : null}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

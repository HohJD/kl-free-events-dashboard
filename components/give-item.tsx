"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, LocateFixed, LogOut, UserRound, X } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";
import { getApproxLocation, type ApproxLocation } from "@/lib/geolocate";
import { ITEM_CATEGORIES, classifyText } from "@/lib/classify";
import { LISTING_DAYS, friendlyError, postItem, toWhatsAppLink } from "@/lib/free-items";
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
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [name, setName] = useState("");
  const [pickedCategory, setPickedCategory] = useState<string | null>(null);
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
  useEffect(() => { if (open) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [open]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const suggested = classifyText(name);
  const category = pickedCategory ?? suggested ?? "Other";
  const contact = toWhatsAppLink(whatsapp);
  const missing = [!photo && "a photo", name.trim().length < 3 && "what it is", !contact && "your WhatsApp"].filter(Boolean) as string[];

  const choosePhoto = (file: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : "");
  };
  const locate = async () => {
    setLocating(true);
    setLocateFailed(false);
    const found = await getApproxLocation();
    setLocating(false);
    if (found) { setLocation(found); setPickup(found.area); } else setLocateFailed(true);
  };
  const reset = () => {
    choosePhoto(null);
    setName(""); setPickedCategory(null); setPickup(""); setLocation(null); setStatus("idle"); setError("");
    onClose();
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (missing.length || !photo || status === "busy") return;
    setStatus("busy");
    setError("");
    try {
      const item = await postItem({ name: name.trim(), photo, category, pickup: pickup.trim(), location, contact });
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
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => choosePhoto(e.target.files?.[0] ?? null)} />
              <button type="button" onClick={() => fileRef.current?.click()}
                className={cn("relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border hover:border-ring", preview ? "border-solid" : "bg-muted/40")}>
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="Your photo" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-1.5 text-sm font-medium text-muted-foreground"><Camera className="size-7" aria-hidden /> Add a photo</span>
                )}
              </button>
              {preview ? <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 text-xs font-semibold underline underline-offset-2">Change photo</button> : null}
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
                {!pickedCategory && suggested ? <span className="mt-1 block text-xs text-muted-foreground">Suggested from the name. Tap another to change.</span> : null}
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

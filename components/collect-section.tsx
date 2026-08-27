"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, MessageCircle, Package, Clock, CheckCircle2, Trash2 } from "lucide-react";
import { FreeItem } from "@/lib/items";
import { SUPABASE_URL, SUPABASE_ANON_KEY, getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/use-auth";
import { UploadItem } from "./upload-item";
import { cn } from "@/lib/utils";

interface SupabaseItemRow {
  id: string;
  name: string;
  description: string;
  images: string[];
  condition: string;
  pickup: string;
  contact: string;
  status: FreeItem["status"];
  category: string | null;
  owner: string | null;
  created_at: string;
}

async function fetchItems(): Promise<FreeItem[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/free_items?select=*&status=neq.claimed&order=created_at.desc`,
    { headers: { apikey: SUPABASE_ANON_KEY } }
  );
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  const rows: SupabaseItemRow[] = await res.json();
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    images: (r.images || []).filter((s) => s.startsWith("https://")),
    condition: r.condition,
    pickup: r.pickup,
    contact: r.contact,
    status: r.status,
    category: r.category || "Other",
    owner: r.owner,
    added: (r.created_at || "").slice(0, 10),
  }));
}

interface ItemCardProps {
  item: FreeItem;
  index: number;
  isOwner: boolean;
  onChanged: (id: string, status: FreeItem["status"] | "deleted") => void;
}

function ItemCard({ item, index, isOwner, onChanged }: ItemCardProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [busy, setBusy] = useState(false);
  const images = item.images.length ? item.images : [];

  const markClaimed = async () => {
    setBusy(true);
    const { error } = await getSupabase()
      .from("free_items")
      .update({ status: "claimed" })
      .eq("id", item.id);
    if (!error) onChanged(item.id, "deleted"); // claimed items disappear
    setBusy(false);
  };

  const remove = async () => {
    if (!confirm("Delete this listing?")) return;
    setBusy(true);
    const { error } = await getSupabase()
      .from("free_items")
      .delete()
      .eq("id", item.id);
    if (!error) onChanged(item.id, "deleted");
    setBusy(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min((index % 6) * 0.04, 0.2) }}
      className="h-full"
    >
      <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-brutal transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg">
        <div className="relative h-52 w-full overflow-hidden bg-muted">
          {images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[activeImage]}
              alt={item.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="size-10 text-muted-foreground" />
            </div>
          )}

          <span
            className={cn(
              "absolute right-3 top-3 rounded-full border border-border px-2.5 py-1 font-mono text-[11px] font-semibold",
              item.status === "available"
                ? "bg-[#86efac] text-black"
                : "bg-muted text-muted-foreground"
            )}
          >
            {item.status === "available" ? "Available" : "Pending pickup"}
          </span>

          {images.length > 1 ? (
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  aria-label={`Photo ${i + 1}`}
                  className={cn(
                    "size-2.5 rounded-full border border-border transition-colors",
                    i === activeImage ? "bg-accent" : "bg-white/80"
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <p className="font-mono text-xs text-muted-foreground">
            {item.category}
            <span className="mx-1.5 opacity-40">/</span>
            {item.condition}
            {item.added ? (
              <>
                <span className="mx-1.5 opacity-40">/</span>
                <Clock className="mb-0.5 inline size-3" /> listed {item.added}
              </>
            ) : null}
          </p>

          <h3 className="mt-1.5 line-clamp-2 font-display text-base font-bold leading-snug md:text-lg">
            {item.name}
          </h3>

          {item.pickup ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="line-clamp-1">Pickup: {item.pickup}</span>
            </p>
          ) : null}

          {item.description ? (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          ) : null}

          {isOwner ? (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={markClaimed}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-[#86efac] px-2.5 py-1 font-mono text-[11px] font-bold text-black shadow-brutal-sm transition-all hover:-translate-y-px disabled:opacity-50"
              >
                <CheckCircle2 className="size-3.5" /> Mark claimed
              </button>
              <button
                onClick={remove}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[11px] font-bold text-destructive shadow-brutal-sm transition-all hover:-translate-y-px disabled:opacity-50"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            </div>
          ) : null}

          <div className="mt-auto pt-4">
            {item.contact ? (
              <a
                href={item.contact}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-brutal-sm transition-all hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <MessageCircle className="size-3.5" /> Claim it
              </a>
            ) : (
              <span className="font-mono text-xs text-muted-foreground">
                First come, first served
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function CollectSection({ items: initialItems }: { items: FreeItem[] }) {
  const { user } = useAuth();
  const [items, setItems] = useState<FreeItem[]>(initialItems);
  const [loaded, setLoaded] = useState(false);

  const handleChanged = (id: string, status: FreeItem["status"] | "deleted") => {
    setItems((prev) =>
      status === "deleted"
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, status } : i))
    );
  };

  // Live data from Supabase; falls back to build-time items on failure
  useEffect(() => {
    fetchItems()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div>
      <section className="border-b border-border/50 px-4 pb-8 pt-12 md:pt-16">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="font-mono text-xs text-muted-foreground">
              {items.length} item{items.length === 1 ? "" : "s"} up for grabs ·
              all free · first come, first served
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl md:text-6xl">
              Free things to{" "}
              <span className="marker-highlight whitespace-nowrap">collect</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
              Good stuff looking for a new home. Grab it before someone else
              does.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 py-8 pb-16">
        <UploadItem onListed={(item) => setItems((prev) => [item, ...prev])} />
        {items.length === 0 && !loaded ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl border border-border bg-muted/50"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-input bg-muted/30 px-6 py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-accent">
              <Package className="size-7 text-accent-foreground" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold">
              Nothing up for grabs right now
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Check back soon — new items get listed here when they need a new
              home.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <ItemCard
                key={item.id}
                item={item}
                index={i}
                isOwner={!!user && item.owner === user.id}
                onChanged={handleChanged}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

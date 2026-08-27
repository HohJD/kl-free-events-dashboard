"use client";

/**
 * In-browser item category detection using Hugging Face Transformers.js
 * (zero-shot CLIP). Free, no API key, runs entirely on the visitor's device.
 * The model (~25 MB quantized) is lazy-loaded the first time a photo is
 * picked, and cached by the browser afterwards.
 */

export const ITEM_CATEGORIES: { label: string; prompt: string }[] = [
  { label: "Furniture", prompt: "a photo of furniture, like a chair, table, shelf or sofa" },
  { label: "Electronics", prompt: "a photo of an electronic device or appliance" },
  { label: "Kitchen", prompt: "a photo of kitchenware, cookware, plates or utensils" },
  { label: "Books & Media", prompt: "a photo of books, magazines, CDs or board games" },
  { label: "Clothes", prompt: "a photo of clothing, shoes, bags or accessories" },
  { label: "Kids & Toys", prompt: "a photo of children's toys or baby items" },
  { label: "Decor", prompt: "a photo of home decor, art, frames, vases or ornaments" },
  { label: "Plants", prompt: "a photo of a plant or gardening items" },
  { label: "Sports", prompt: "a photo of sports or fitness equipment" },
  { label: "Other", prompt: "a photo of a miscellaneous household object" },
];

// Loaded from CDN at runtime — keeps the site bundle small and avoids
// bundling Node-only dependencies into a static export.
const TRANSFORMERS_CDN =
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipePromise: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPipeline(): Promise<any> {
  if (!pipePromise) {
    pipePromise = import(
      /* webpackIgnore: true */ TRANSFORMERS_CDN
    ).then(({ pipeline }) =>
      pipeline("zero-shot-image-classification", "Xenova/clip-vit-base-patch32")
    );
  }
  return pipePromise;
}

/**
 * Respect users on metered/slow connections — the model is ~25 MB, so skip
 * AI detection entirely when Data Saver is on or the connection is 2G.
 */
export function aiAllowed(): boolean {
  if (typeof navigator === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection;
  if (conn?.saveData) return false;
  if (typeof conn?.effectiveType === "string" && conn.effectiveType.includes("2g"))
    return false;
  return true;
}

/** Warm the model download in the background (call when the form opens). */
export function preloadClassifier(): void {
  if (!aiAllowed()) return;
  getPipeline().catch(() => {});
}

export async function classifyItemPhoto(file: File): Promise<string> {
  if (!aiAllowed()) return "Other";
  const url = URL.createObjectURL(file);
  try {
    const run = (async () => {
      const classify = await getPipeline();
      const results: { label: string; score: number }[] = await classify(
        url,
        ITEM_CATEGORIES.map((c) => c.prompt)
      );
      const top = results[0];
      if (!top || top.score < 0.2) return "Other";
      const match = ITEM_CATEGORIES.find((c) => c.prompt === top.label);
      return match?.label ?? "Other";
    })();
    // Never leave the user staring at "Detecting…" on a slow connection
    const timeout = new Promise<string>((resolve) =>
      setTimeout(() => resolve("Other"), 25000)
    );
    return await Promise.race([run, timeout]);
  } catch {
    return "Other";
  } finally {
    URL.revokeObjectURL(url);
  }
}

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

/**
 * Instant text-based category detection from the one-liner (EN + BM).
 * This runs on every keystroke and beats the image model when it matches —
 * "IKEA lamp" is a stronger signal than any pixel.
 */
const TEXT_RULES: { category: string; pattern: RegExp }[] = [
  { category: "Furniture", pattern: /\b(chair|table|sofa|couch|shelf|shelves|lamp|desk|cupboard|wardrobe|mattress|bed(frame)?|drawer|rack|stool|bench|cabinet|dresser|kerusi|meja|almari|katil|rak|tilam)\b/i },
  { category: "Electronics", pattern: /\b(phone|iphone|laptop|macbook|tv|television|monitor|charger|cable|keyboard|mouse|speaker|headphone|earphone|fan|aircond|kettle|iron|rice ?cooker|microwave|oven|printer|router|modem|camera|console|playstation|xbox|nintendo|radio|vacuum|kipas|cerek|peti)\b/i },
  { category: "Kitchen", pattern: /\b(pot|pan|wok|plate|bowl|mug|cup|glass(es)?|utensil|cutlery|tupperware|blender|knife|knives|chopping|tray|periuk|kuali|pinggan|mangkuk|cawan|sudu)\b/i },
  { category: "Books & Media", pattern: /\b(book|novel|textbook|magazine|comic|manga|cd|dvd|vinyl|record|board ?game|puzzle|encyclopedia|buku|majalah|kamus)\b/i },
  { category: "Clothes", pattern: /\b(shirt|t-?shirt|tee|dress|pants|jeans|shorts|skirt|shoe|shoes|sneaker|heels|sandal|bag|handbag|backpack|jacket|hoodie|scarf|belt|cap|hat|baju|kasut|seluar|tudung|beg|topi)\b/i },
  { category: "Kids & Toys", pattern: /\b(toy|toys|lego|doll|stroller|pram|crib|cot|baby|kids?|children|plush(ie)?|teddy|mainan|anak|bayi)\b/i },
  { category: "Decor", pattern: /\b(frame|vase|painting|poster|print|mirror|rug|carpet|curtain|clock|candle|ornament|sticker|stickers|fairy ?lights?|decor(ation)?|hiasan|cermin|langsir|jam)\b/i },
  { category: "Plants", pattern: /\b(plants?|cactus|succulent|monstera|garden(ing)?|seeds?|planter|flower ?pot|pasu|pokok|bunga)\b/i },
  { category: "Sports", pattern: /\b(bicycle|bike|racket|racquet|ball|dumbbell|weights?|yoga ?mat|treadmill|helmet|skateboard|rollerblade|golf|tennis|badminton|futsal|basikal|bola)\b/i },
];

export function classifyText(text: string): string | null {
  for (const rule of TEXT_RULES) {
    if (rule.pattern.test(text)) return rule.category;
  }
  return null;
}

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

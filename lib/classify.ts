"use client";

/**
 * Item categories and instant keyword detection (English and Malay) for the
 * free-items form. The giver can always change the suggested category.
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

/** Keyword match on the item name; runs on every keystroke. */
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

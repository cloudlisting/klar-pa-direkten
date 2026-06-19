const IMAGES = {
  waste: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=400&q=80",
  errands: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80",
  moving: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&q=80",
  assembly: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80",
  handyman: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&q=80",
  cleaning: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80",
  gardening: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80",
  tech: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&q=80",
  pets: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&q=80",
  other: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&q=80",
} as const;

// Exact category names (Swedish labels used in CATEGORIES)
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  "Avfall & återvinning": IMAGES.waste,
  "Inköp & ärenden": IMAGES.errands,
  "Flytt & transport": IMAGES.moving,
  Möbelmontering: IMAGES.assembly,
  "Småfix i hemmet": IMAGES.handyman,
  Städning: IMAGES.cleaning,
  "Trädgård & utemiljö": IMAGES.gardening,
  "IT- & teknikhjälp": IMAGES.tech,
  Djur: IMAGES.pets,
  Övrigt: IMAGES.other,
};

// Keyword fallback for free-text categories ("Leverans") or to better match the title
const KEYWORD_IMAGE_MAP: Array<{ keywords: string[]; image: string }> = [
  { keywords: ["återvinn", "sopor", "skräp", "grovsopor", "avfall"], image: IMAGES.waste },
  { keywords: ["handla", "ärende", "inköp", "paket", "hämta", "lämna"], image: IMAGES.errands },
  { keywords: ["flytt", "transport", "leverans", "bärhjälp", "frakt", "kör", "skjuts"], image: IMAGES.moving },
  { keywords: ["montera", "montering", "ikea", "möbel", "ihopsätt"], image: IMAGES.assembly },
  { keywords: ["fixa", "reparation", "handyman", "lampa", "hylla", "tavla", "el-"], image: IMAGES.handyman },
  { keywords: ["städ", "rent", "fönsterputs", "tvätt"], image: IMAGES.cleaning },
  { keywords: ["trädgård", "gräs", "ogräs", "snö", "klipp"], image: IMAGES.gardening },
  { keywords: ["dator", "telefon", "wifi", "teknik", "router", "mjukvara"], image: IMAGES.tech },
  { keywords: ["hund", "katt", "djur", "promenad", "husdjur"], image: IMAGES.pets },
];

const matchKeyword = (text: string) => {
  const lower = text.toLowerCase();
  for (const { keywords, image } of KEYWORD_IMAGE_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return image;
  }
  return null;
};

export const getCategoryFallbackImage = (category?: string | null, title?: string | null) => {
  // 1. Try to match the task title first — it's the most specific signal
  if (title) {
    const byTitle = matchKeyword(title);
    if (byTitle) return byTitle;
  }
  // 2. Exact category label match
  if (category && CATEGORY_FALLBACK_IMAGES[category]) return CATEGORY_FALLBACK_IMAGES[category];
  // 3. Free-text category match (e.g. "Leverans")
  if (category) {
    const byCategory = matchKeyword(category);
    if (byCategory) return byCategory;
  }
  // 4. Give up — generic placeholder
  return IMAGES.other;
};

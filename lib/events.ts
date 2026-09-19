import fs from 'fs';
import path from 'path';

export interface RawEvent {
  source: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  link: string;
  image?: string;
  lat?: number | null;
  lon?: number | null;
  state?: string;
  checked_at?: string;
  stale?: boolean;
  quality_version?: number;
  free_evidence?: string;
  end_date?: string;
  end_time?: string;
  registration_status?: 'open' | 'closed' | 'not_open' | 'check_source';
  eligibility?: string;
  event_format?: string;
  date_kind?: string;
  quality_score?: number;
  topics?: string[];
  admission_note?: string;
  also_listed_on?: { source: string; link: string }[];
}

export interface EventData {
  generated_at: string;
  count: number;
  events: RawEvent[];
}

export interface Event extends RawEvent {
  category: string;
  image: string;
  lat: number | null;
  lon: number | null;
}

const CATEGORY_GRADIENTS: Record<string, { from: string; to: string }> = {
  Hackathon: { from: '#f43f5e', to: '#f97316' },
  Tech: { from: '#6366f1', to: '#a855f7' },
  Business: { from: '#0ea5e9', to: '#06b6d4' },
  Careers: { from: '#15803d', to: '#65a30d' },
  'Expo & Fair': { from: '#f59e0b', to: '#f97316' },
  Learning: { from: '#3b82f6', to: '#6366f1' },
  Sports: { from: '#22c55e', to: '#14b8a6' },
  Wellness: { from: '#10b981', to: '#84cc16' },
  'Arts & Culture': { from: '#ec4899', to: '#8b5cf6' },
  Social: { from: '#f43f5e', to: '#fbbf24' },
  Other: { from: '#64748b', to: '#94a3b8' },
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function categoryImage(category: string, name: string): string {
  const colors = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS.Other;
  const h = hashString(name) % 360;
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">',
    '<defs>',
    `<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">`,
    `<stop offset="0%" stop-color="${colors.from}"/>`,
    `<stop offset="100%" stop-color="${colors.to}"/>`,
    '</linearGradient>',
    '</defs>',
    `<rect width="640" height="360" fill="url(#g)"/>`,
    `<circle cx="${120 + (hashString(name + 'a') % 400)}" cy="${80 + (hashString(name + 'b') % 200)}" r="120" fill="hsla(${h},70%,60%,0.25)"/>`,
    `<circle cx="${80 + (hashString(name + 'c') % 480)}" cy="${180 + (hashString(name + 'd') % 120)}" r="90" fill="rgba(255,255,255,0.08)"/>`,
    '</svg>',
  ].join('');
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * MECE taxonomy. Every event lands in exactly one category, chosen by a
 * weighted keyword score (name matches count double). Matching is
 * word-boundary based so e.g. "ai" never matches inside "fair" or "nail".
 *
 * - Hackathon      build-a-thing competitions (always wins if matched)
 * - Tech           developer/IT/AI talks, meetups, summits
 * - Business       startup, entrepreneurship, finance, career, ESG forums
 * - Expo & Fair    trade shows, exhibitions, industry expos, award shows
 * - Learning       workshops, classes, seminars, academic conferences
 * - Sports         runs, workouts, active sports clubs
 * - Wellness       yoga, meditation, mental health, spirituality, self-development
 * - Arts & Culture music, performances, heritage walks, festivals, faith events
 * - Social         mixers, drinks, language exchange, parties, nightlife
 * - Other          nothing matched
 */
const CATEGORY_RULES: { category: string; weight: number; patterns: RegExp[] }[] = [
  {
    category: 'Hackathon',
    weight: 10,
    patterns: [
      /hackathon|hackfest|datathon|ideathon|codefest|hack\s?(day|night)/,
    ],
  },
  {
    category: 'Tech',
    weight: 2,
    patterns: [
      /\btech\b|technology|\bit\b(?=\s(summit|conference|architecture))|\bict\b/,
      /\bai\b|artificial intelligence|machine learning|blockchain|crypto|web3/,
      /developer|coding|programming|software|cloud native|kubernetes|devops|kafka|cyber ?security|data (science|engineering)|\bapi\b|\bsaas\b/,
      /claude|chatgpt|openai|\baws\b|google cloud|azure/,
    ],
  },
  {
    category: 'Business',
    weight: 2,
    patterns: [
      /startup|entrepreneur|founder|investor|venture|pitch/,
      /\bbusiness\b|\bsme\b|\bb2b\b|marketing|e ?commerce|finance|investment|property|real estate/,
      /\besg\b|sustainability|career|hiring|job fair|\bhr\b|human resources/,
      /green (development|engineering|building)|net ?zero|energy efficien|building solutions|construction|engineering/,
    ],
  },
  {
    category: 'Expo & Fair',
    weight: 3,
    patterns: [
      /\bexpo\b|exhibition|trade show|travel fair|\bfair\b|showcase|\bshow\b(?!er)/,
      /award|gala/,
    ],
  },
  {
    category: 'Learning',
    weight: 1,
    patterns: [
      /workshop|masterclass|seminar|symposium|conference|\bcourse\b|\bclass(es)?\b|training|bootcamp/,
      /\btalk\b|lecture|research|academic|university|info(rmation)? (day|evening|session)|open house/,
    ],
  },
  {
    category: 'Sports',
    weight: 3,
    patterns: [
      /\brun\b|running|marathon|jog|hike|hiking|cycling|climb/,
      /workout|gym|football|badminton|basketball|swim|sports?\b/,
    ],
  },
  {
    category: 'Wellness',
    weight: 3,
    patterns: [
      /yoga|meditation|mindful|breathwork|wellbeing|well-being|wellness/,
      /mental health|self-?(love|care|sabotage|development|esteem)|healing|manifest|spiritual|men'?s circle|women'?s circle/,
      /loving relationship|personal growth|life meaningful|living with purpose|philosophy|gratitude|易经|冥想|静心|灵性|智慧/,
    ],
  },
  {
    category: 'Arts & Culture',
    weight: 2,
    patterns: [
      /music|concert|gig|open mic|\bband\b|\bdj\b|karaoke|ballet|theatre|theater|comedy|stand-?up/,
      /\bart\b|gallery|museum|paint|craft|poetry|film|movie|screening/,
      /cultural|heritage|walk in kuala lumpur|festival|celebration|merdeka|deepavali|raya|cny|mid-autumn/,
      /church|worship|prophetic|revival|temple|mosque/,
    ],
  },
  {
    category: 'Social',
    weight: 2,
    patterns: [
      /\bsocial\b|mixer|networking (drinks|night)|nomad|expat|make (new )?friends/,
      /language exchange|drinks?\b|\bbar\b|party|parties|nightlife|singles|dating|\bsip\b/,
      /meetup|gathering|hangout|chill|lepak|potluck|brunch|supper club/,
      /聚会|fan (meet|gathering|club)|argument club|board ?games?|trivia|quiz night|matcha|coffee (meet|morning|chat)/,
    ],
  },
];

/** Strip styled unicode (𝗕𝗢𝗟𝗗 etc.) down to plain ASCII so keywords match. */
function normalizeText(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function categorize(name: string, description: string, source: string): string {
  if (source === 'devpost' || source === 'devfolio') return 'Hackathon';
  if (source === 'mlh') return 'Tech';

  const nameText = normalizeText(name);
  const descText = normalizeText(description).slice(0, 600);
  if (/\b(hackathon|datathon|ideathon|hackfest|codefest)\b/.test(nameText)) return 'Hackathon';
  if (/\b(careers?|resume|cv|internships?|graduate (programmes?|programs?|fair)|job fair|hiring|kerjaya|temuduga|fresh grad(?:uate)?s?)\b/.test(nameText)) return 'Careers';

  let best = 'Other';
  let bestScore = 0;
  for (const rule of CATEGORY_RULES) {
    let score = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(nameText)) score += rule.weight * 2; // name is authoritative
      else if (pattern.test(descText)) score += rule.weight;
    }
    if (score > bestScore) {
      bestScore = score;
      best = rule.category;
    }
  }

  if (best === 'Other' && source === 'meetup') return 'Social';
  return best;
}

function safeUrl(url: unknown): string {
  if (typeof url !== 'string') return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return url;
  } catch {
    return '';
  }
  return '';
}

export function getEvents(): { events: Event[]; generatedAt: Date; count: number; sources: string[] } {
  const filePath = path.join(process.cwd(), 'events.json');
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data: EventData = JSON.parse(raw);
    const events = data.events.filter((e) => e.quality_version === 2 && !!e.free_evidence && !!safeUrl(e.link)).map((e) => {
      e.link = safeUrl(e.link);
      e.image = safeUrl(e.image);
      const category = categorize(e.name, e.description, e.source);
      const hasRemoteImage = e.image && e.image.startsWith("http");
      return {
        ...e,
        category,
        image: hasRemoteImage ? e.image! : categoryImage(category, e.name),
        lat: typeof e.lat === "number" ? e.lat : null,
        lon: typeof e.lon === "number" ? e.lon : null,
      };
    });
    const sources = Array.from(new Set(events.map((e) => e.source)));
    return { events, generatedAt: new Date(data.generated_at), count: events.length, sources };
  } catch (err) {
    console.error('Error reading events.json:', err);
    return { events: [], generatedAt: new Date(), count: 0, sources: [] };
  }
}

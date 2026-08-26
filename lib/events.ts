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
  Social: { from: '#f43f5e', to: '#fbbf24' },
  Lifestyle: { from: '#22c55e', to: '#14b8a6' },
  Arts: { from: '#ec4899', to: '#8b5cf6' },
  Health: { from: '#10b981', to: '#84cc16' },
  Education: { from: '#3b82f6', to: '#6366f1' },
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

function categorize(name: string, description: string, source: string): string {
  const text = `${name} ${description}`.toLowerCase();
  const keywords: Record<string, string[]> = {
    Hackathon: ['hackathon', 'hackfest', 'datathon', 'ideathon', 'codefest', 'hack day', 'hack night', 'devpost'],
    Tech: ['tech', 'cloud', 'kafka', 'developer', 'coding', 'software', 'data', 'ai', 'machine learning', 'web', 'app', 'api', 'database', 'devops'],
    Business: ['business', 'startup', 'entrepreneur', 'networking', 'career', 'investor'],
    Social: ['social', 'drink', 'party', 'meetup', 'friends', 'lounge', 'nomad', 'language exchange', 'chill', 'networking'],
    Lifestyle: ['lifestyle', 'food', 'travel', 'wellness', 'yoga', 'fitness', 'fashion', 'hobby'],
    Arts: ['art', 'music', 'paint', 'concert', 'exhibition', 'theatre', 'dance', 'design', 'festival'],
    Health: ['health', 'yoga', 'run', 'fitness', 'wellness', 'meditation', 'sports'],
    Education: ['learn', 'workshop', 'course', 'class', 'education', 'training', 'seminar'],
  };
  if (source === 'devpost') return 'Hackathon';
  for (const [category, words] of Object.entries(keywords)) {
    if (words.some((w) => text.includes(w))) return category;
  }
  return source === 'meetup' ? 'Social' : 'Other';
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
    const events = data.events.map((e) => {
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
    return { events, generatedAt: new Date(data.generated_at), count: data.count, sources };
  } catch (err) {
    console.error('Error reading events.json:', err);
    return { events: [], generatedAt: new Date(), count: 0, sources: [] };
  }
}

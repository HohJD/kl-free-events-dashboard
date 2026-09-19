import fs from 'fs';
import path from 'path';
import { RESOURCE_KINDS, type Resource } from './resources';

const KINDS = new Set<string>(RESOURCE_KINDS.map((kind) => kind.value));

function httpsUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  try {
    return new URL(value).protocol === 'https:' ? value : '';
  } catch {
    return '';
  }
}

/** Reads resources.json written by the scraper. Missing or invalid data
 * yields an empty list so the page still builds. */
export function getResources(): { resources: Resource[]; generatedAt: Date | null } {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'resources.json'), 'utf8'));
    const resources = (Array.isArray(raw.resources) ? raw.resources : [])
      .filter((row: Resource) => row && KINDS.has(row.kind) && typeof row.title === 'string' && httpsUrl(row.link))
      .map((row: Resource) => ({
        ...row,
        link: httpsUrl(row.link),
        apply_link: httpsUrl(row.apply_link),
        image: httpsUrl(row.image),
        topics: Array.isArray(row.topics) ? row.topics : [],
      }));
    return { resources, generatedAt: raw.generated_at ? new Date(raw.generated_at) : null };
  } catch {
    return { resources: [], generatedAt: null };
  }
}

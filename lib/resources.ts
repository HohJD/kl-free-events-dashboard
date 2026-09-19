export type ResourceKind = 'scholarship' | 'internship' | 'tool';

export interface Resource {
  kind: ResourceKind;
  source: string;
  title: string;
  organization: string;
  link: string;
  apply_link?: string;
  deadline: string;
  always_open: boolean;
  posted_at?: string;
  location: string;
  state?: string;
  amount: string;
  eligibility: string;
  fields?: string;
  summary: string;
  image: string;
  topics: string[];
  quality_score?: number;
  verified?: boolean;
}

export const RESOURCE_KINDS: { value: ResourceKind; label: string }[] = [
  { value: 'scholarship', label: 'Scholarships' },
  { value: 'internship', label: 'Internships' },
  { value: 'tool', label: 'Free tools & learning' },
];

/** Open resources for a given Malaysia calendar day, filtered and in page order. */
export function filterResources(rows: Resource[], kind: ResourceKind | 'all', techOnly: boolean, query: string, today: string): Resource[] {
  const q = query.trim().normalize('NFKC').toLowerCase();
  return rows
    .filter((row) => row.always_open || !row.deadline || row.deadline >= today)
    .filter((row) => kind === 'all' || row.kind === kind)
    .filter((row) => !techOnly || row.topics.includes('tech'))
    .filter((row) => !q || `${row.title} ${row.organization} ${row.fields || ''} ${row.summary} ${row.location}`.normalize('NFKC').toLowerCase().includes(q));
}

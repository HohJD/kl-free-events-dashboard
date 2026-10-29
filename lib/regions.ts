import type { Event } from './events';

export const REGIONS: Record<string, string> = {
  'kuala-lumpur': 'Kuala Lumpur',
  selangor: 'Selangor',
  penang: 'Penang',
  johor: 'Johor',
  perak: 'Perak',
  melaka: 'Melaka',
  'negeri-sembilan': 'Negeri Sembilan',
  pahang: 'Pahang',
  kedah: 'Kedah',
  kelantan: 'Kelantan',
  terengganu: 'Terengganu',
  perlis: 'Perlis',
  sabah: 'Sabah',
  sarawak: 'Sarawak',
  putrajaya: 'Putrajaya',
  labuan: 'Labuan',
  'united-kingdom': 'United Kingdom',
  london: 'London',
  oxford: 'Oxford',
  online: 'Online',
  unknown: 'Location unconfirmed',
};

/** Location dropdown slugs per edition (REGIONS is the shared label map). */
export const REGION_SLUGS: Record<string, string[]> = {
  my: ['kuala-lumpur', 'selangor', 'penang', 'johor', 'perak', 'melaka', 'negeri-sembilan', 'pahang', 'kedah', 'kelantan', 'terengganu', 'perlis', 'sabah', 'sarawak', 'putrajaya', 'labuan', 'online'],
  uk: ['london', 'oxford', 'online'],
};

export function eventRegion(event: Pick<Event, 'state'>): string {
  return event.state && Object.hasOwn(REGIONS, event.state) ? event.state : 'unknown';
}

export function filterRegion(events: Event[], region: string): Event[] {
  return region === 'all' ? events : events.filter((event) => eventRegion(event) === region);
}

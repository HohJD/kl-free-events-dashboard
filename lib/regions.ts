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
  online: 'Online',
  unknown: 'Location unconfirmed',
};

export function eventRegion(event: Pick<Event, 'state'>): string {
  return event.state && Object.hasOwn(REGIONS, event.state) ? event.state : 'unknown';
}

export function filterRegion(events: Event[], region: string): Event[] {
  return region === 'all' ? events : events.filter((event) => eventRegion(event) === region);
}

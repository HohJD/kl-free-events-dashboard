import assert from 'node:assert/strict';
import { filterOpportunities, fromEvent, type OpportunityFilters } from '../lib/opportunities';
import { forStudents } from '../lib/event-discovery';
import { localDay } from '../lib/filter-events';
import { reminderUrl } from '../lib/calendar';
import { trackEntry } from '../components/opportunity-card';
import type { Event } from '../lib/events';

const event: Event = { name: 'Public poetry lecture', date: '2026-10-29', time: '18:00', venue: 'Oxford', state: 'oxford', category: 'Arts & Culture', source: 'test', description: '', image: '', link: 'https://example.com/lecture', lat: null, lon: null };
assert.equal(forStudents(event, 'uk'), true);
assert.equal(forStudents(event, 'my'), false);
assert.equal(forStudents({ ...event, name: 'Workshop for toddlers' }, 'uk'), false);
const local = { ...fromEvent(event), timeZone: 'Europe/London' };
const online = { ...local, id: 'online', state: 'online' };
const unknown = { ...local, id: 'unknown', state: 'unknown' };
const job = { ...local, id: 'job', kind: 'internship' as const, date: '2026-11-12', isDeadline: true };
const filters: OpportunityFilters = { kind: 'all', query: '', region: 'all', dateRange: 'upcoming', sort: 'soonest', source: 'all' };
assert.deepEqual(filterOpportunities([local, online, unknown], { ...filters, focus: 'local' }, '2026-10-29').map(row => row.id), [local.id]);
assert.deepEqual(filterOpportunities([local, online, unknown], { ...filters, focus: 'online' }, '2026-10-29').map(row => row.id), ['online']);
assert.deepEqual(filterOpportunities([local, job, { ...job, id: 'rolling', alwaysOpen: true }, { ...job, id: 'undated', date: '' }, { ...job, id: 'late', date: '2026-11-13' }], { ...filters, focus: 'closing' }, '2026-10-29').map(row => row.id), ['job']);
for (const date of ['2026-07-01', '2026-12-01']) {
  const url = new URL(reminderUrl({ title: 'Oxford lecture', date, time: '18:00', link: local.link, timeZone: local.timeZone })!);
  assert.equal(url.searchParams.get('ctz'), 'Europe/London');
  assert.match(url.searchParams.get('dates')!, /T180000/);
}
assert.equal(trackEntry(local, '2026-10-29').timeZone, 'Europe/London');
assert.equal(localDay(new Date('2026-10-29T18:00:00Z'), 'Europe/London'), '2026-10-29');
assert.equal(localDay(new Date('2026-10-29T18:00:00Z'), 'Asia/Kuala_Lumpur'), '2026-10-30');
console.log('Oxford collections, audience scope and UK reminder timezone checks passed.');

import assert from 'node:assert/strict';
import { filterEvents, malaysiaDay } from '../lib/filter-events';
import { filterRegion, eventRegion } from '../lib/regions';
import { googleCalendarUrl } from '../lib/calendar';
import { categorize, type Event } from '../lib/events';
import { focusEvents } from '../lib/event-discovery';
import { filterResources, type Resource } from '../lib/resources';
import { addDays, bookingOutlook, daysBetween, median, money, nearbyCheaper, priceStep, stayLabel, toDays, type Calendar } from '../lib/flights';

const now = new Date('2026-09-07T16:30:00Z');
const event = (name: string, date: string, state?: string): Event => ({
  name, date, state, time: '', venue: 'Community hall', source: 'test',
  description: '', link: 'https://example.com', category: 'Social', image: '', lat: null, lon: null,
});
const events = [event('Penang meetup', '2026-09-08', 'penang'), event('KL meetup', '2026-09-08', 'kuala-lumpur'), event('Online', '2026-09-09', 'online'), event('Unconfirmed', '2026-09-08'), event('Old', '2026-09-07', 'penang'), event('Undated', '', 'penang'), event('Invalid', '2026-02-30', 'penang')];
assert.equal(malaysiaDay(now), '2026-09-08');
assert.equal(eventRegion(events[3]), 'unknown');
assert.equal(eventRegion(event('Invalid state', '2026-09-08', 'toString')), 'unknown');
const upcoming = filterEvents(events, '', 'all', 'all', 'upcoming', now);
assert.equal(upcoming.length, 4);
assert.deepEqual(filterRegion(upcoming, 'penang').map(e => e.name), ['Penang meetup']);
assert.equal(filterRegion(upcoming, 'online').length, 1);
assert.equal(filterRegion(upcoming, 'johor').length, 0);
assert.equal(filterEvents(events, '', 'all', 'all', 'today', now).length, 3);
assert.equal(filterEvents(events, '', 'all', 'all', 'tomorrow', now)[0].name, 'Online');
assert.equal(filterEvents(events, '', 'all', 'all', 'week', now).length, 4);
assert.equal(filterEvents(events, '', 'all', 'all', 'month', now).length, 4);
assert.equal(filterEvents(events, '', 'all', 'all', 'past', now).length, 1);
assert.equal(filterEvents(events, '', 'all', 'all', 'all', now).length, 6);
assert.equal(new URL(googleCalendarUrl(events[0])!).searchParams.get('location'), 'Community hall, Penang');
assert.equal(new URL(googleCalendarUrl(events[2])!).searchParams.get('location'), 'Online');
const stale = { ...events[0], stale: true, checked_at: '2026-09-05T16:29:00Z' };
assert.equal(filterEvents([stale], '', 'all', 'all', 'upcoming', now).length, 0);
assert.equal(filterEvents([{ ...stale, checked_at: '2026-09-06T16:30:00Z' }], '', 'all', 'all', 'upcoming', now).length, 1);
assert.equal(categorize('Graduate career fair', '', 'eventbrite'), 'Careers');
assert.equal(categorize('AI Hackathon for fresh graduates', '', 'luma'), 'Hackathon');
assert.equal(categorize('Community badminton match', '', 'eventbrite'), 'Sports');
const mixed = [{ ...events[0], category: 'Tech' }, { ...events[1], category: 'Social' }, { ...events[2], category: 'Careers' }];
assert.equal(focusEvents(mixed, true).length, 2);
assert.equal(focusEvents(mixed, false).length, 3);
const scored = [
  { ...events[0], name: 'Soon general', quality_score: 45 },
  { ...events[2], name: 'Later hackathon', quality_score: 88 },
  { ...events[1], name: 'Soon tech', quality_score: 82 },
  { ...events[1], name: 'Unscored', quality_score: undefined },
];
assert.deepEqual(filterEvents(scored, '', 'all', 'all', 'upcoming', now, 'recommended').map(e => e.name), ['Soon tech', 'Later hackathon', 'Unscored', 'Soon general']);
assert.deepEqual(filterEvents(scored, '', 'all', 'all', 'upcoming', now), filterEvents(scored, '', 'all', 'all', 'upcoming', now, 'soonest'));
assert.equal(filterEvents(scored, '', 'all', 'all', 'upcoming', now, 'soonest').at(-1)!.name, 'Later hackathon');
const resource = (title: string, kind: Resource['kind'], deadline: string, topics: string[] = [], always_open = false): Resource => ({
  kind, title, deadline, always_open, topics, source: 'test', organization: 'Org', link: 'https://example.com',
  location: 'Malaysia', amount: '', eligibility: '', summary: '', image: '',
});
const resources = [resource('Closed scholarship', 'scholarship', '2026-09-07'), resource('Tech scholarship', 'scholarship', '2026-09-30', ['tech']),
  resource('Rolling fund', 'scholarship', '', [], true), resource('Data intern', 'internship', '', ['tech']), resource('Spa intern', 'internship', '')];
assert.deepEqual(filterResources(resources, 'all', false, '', '2026-09-08').map(r => r.title), ['Tech scholarship', 'Rolling fund', 'Data intern', 'Spa intern']);
assert.deepEqual(filterResources(resources, 'internship', true, '', '2026-09-08').map(r => r.title), ['Data intern']);
assert.deepEqual(filterResources(resources, 'all', false, 'rolling', '2026-09-08').map(r => r.title), ['Rolling fund']);
assert.equal(median([3, 1, 2]), 2);
assert.equal(median([4, 1, 2, 3]), 2.5);
assert.equal(addDays('2026-12-25', 14), '2027-01-08');
assert.equal(daysBetween('2026-10-28', '2026-11-11'), 14);
assert.equal(stayLabel(14), '2 weeks');
assert.equal(stayLabel(10), '10 days');
assert.equal(stayLabel(null), 'One-way');
assert.equal(money(2230.4), 'RM 2,230');
assert.equal(priceStep(2230, [2230, 3000, 4115]), 0);
assert.equal(priceStep(4115, [2230, 3000, 4115]), 6);
const cal: Calendar = { id: 'kul-lon|return-14', route: 'kul-lon', stay: 14, fresh: true, index: [],
  days: [['2026-10-26', 2600, null, 2600, 1, 'T'], ['2026-10-27', 2400, null, 2400, 1, 'T'], ['2026-10-28', 2230, null, 2230, 1, 'B'], ['2026-10-29', 2500, null, 2500, 1, 'T'], ['2026-11-05', 2000, null, 2000, 1, 'B']] };
const calDays = toDays(cal);
assert.equal(calDays[2].returnDate, '2026-11-11');
assert.equal(nearbyCheaper(calDays, '2026-10-26')?.date, '2026-10-28');
assert.equal(nearbyCheaper(calDays, '2026-10-28'), null);
assert.equal(bookingOutlook(calDays, []).advice, 'B');
const rising: [string, number, number][] = Array.from({ length: 7 }, (_, i) => [`2026-09-${20 + i}`, 3000 + i * 40, 2200]);
assert.equal(bookingOutlook(calDays, rising).headline, 'Fares are rising');
const falling: [string, number, number][] = Array.from({ length: 7 }, (_, i) => [`2026-09-${20 + i}`, 3000 - i * 40, 2200]);
assert.equal(bookingOutlook(calDays, falling).advice, 'W');
assert.equal(bookingOutlook([], []).headline, 'No fares yet');
// Merged list: events and resources filter together.
import { filterOpportunities, fromResource, KIND_LABELS, type Opportunity } from '../lib/opportunities';
const scholarship = fromResource({ kind: 'scholarship', source: 'afterschool', title: 'Yayasan KLK', organization: 'klk.com.my',
  link: 'https://afterschool.my/scholarship/klk', deadline: '2026-09-30', always_open: false, location: 'Malaysia', state: 'malaysia',
  amount: 'Tuition', eligibility: 'Malaysian', summary: '', image: '', topics: ['student'], quality_score: 60 } as never);
const internship = fromResource({ kind: 'internship', source: 'hiredly', title: 'Data intern', organization: 'Enzee',
  link: 'https://my.hiredly.com/jobs/data', deadline: '', always_open: false, location: 'Kuala Lumpur', state: 'kuala-lumpur',
  amount: 'RM 1000', eligibility: 'Internship', summary: '', image: '', topics: ['tech'], quality_score: 70 } as never);
const eventRow: Opportunity = { id: 'e1', kind: 'event', title: 'AI meetup', org: 'luma', date: '2026-09-09', isDeadline: false,
  place: 'KL', state: 'kuala-lumpur', link: 'https://luma.com/e1', summary: '', topics: ['tech'], score: 80, source: 'luma' };
const pool = [eventRow, scholarship, internship];
const base = { kind: 'all' as const, query: '', region: 'all', dateRange: 'upcoming' as const, sort: 'recommended' as const, source: 'all' };
assert.equal(filterOpportunities(pool, base, '2026-09-08').length, 3);
assert.deepEqual(filterOpportunities(pool, { ...base, kind: 'internship' }, '2026-09-08').map(r => r.title), ['Data intern']);
assert.equal(filterOpportunities(pool, { ...base, region: 'penang' }, '2026-09-08').length, 1, 'nationwide scholarships survive a state filter');
assert.equal(filterOpportunities(pool, { ...base, dateRange: 'today' }, '2026-09-08').length, 1, 'rolling roles count as open');
assert.equal(filterOpportunities(pool, { ...base, query: 'yayasan' }, '2026-09-08').length, 1);
assert.equal(KIND_LABELS.graduate.many, 'Graduate roles');
console.log('Focus/category, state, calendar, stale expiry and Malaysia-date regression tests passed.');

import assert from 'node:assert/strict';
import { filterEvents, malaysiaDay } from '../lib/filter-events';
import { filterRegion, eventRegion } from '../lib/regions';
import { googleCalendarUrl } from '../lib/calendar';
import { categorize, type Event } from '../lib/events';
import { focusEvents } from '../lib/event-discovery';
import { filterResources, type Resource } from '../lib/resources';
import { columnLetter, scalePosition, tripLabel, money } from '../lib/flights';

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
assert.deepEqual([0, 25, 26, 27, 701].map(columnLetter), ['A', 'Z', 'AA', 'AB', 'ZZ']);
assert.equal(scalePosition(2000, [2000, 3000, 4000]), 0);
assert.equal(scalePosition(4000, [2000, 3000, 4000]), 1);
assert.equal(scalePosition(3000, [3000]), 0);
assert.equal(tripLabel('return-14'), 'Return · 2 weeks');
assert.equal(money(2450.4), 'RM 2,450');
assert.equal(money(null), '');
console.log('Focus/category, state, calendar, stale expiry and Malaysia-date regression tests passed.');

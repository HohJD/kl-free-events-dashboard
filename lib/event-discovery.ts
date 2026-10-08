import type { Event } from './events';

export const FOCUS_CATEGORIES = ['Tech', 'Business', 'Careers', 'Hackathon'];
export const CATEGORY_ORDER = [...FOCUS_CATEGORIES, 'Learning', 'Social', 'Expo & Fair', 'Arts & Culture', 'Sports', 'Wellness', 'Other'];

export function focusEvents(events: Event[], focused: boolean): Event[] {
  return focused ? events.filter(event => FOCUS_CATEGORIES.includes(event.category)) : events;
}

// Things aimed at parents, homeowners, retirees or schoolkids rather than uni students.
const NOT_FOR_STUDENTS = /\b(mm2h|my second home|retire(e|ment)|homestay|property|home living|home expo|parenting|toddler|kids?\b|children|primary school|international school|school fair|schools show|bar\b|wine)/i;
const UNDER_18_ONLY = /ages? \d+ to (1[0-7])\b/i;

/** Events a uni student would actually go to: focus categories, minus the obvious misfits. */
export function forStudents(event: Event): boolean {
  if (!FOCUS_CATEGORIES.includes(event.category)) return false;
  if (UNDER_18_ONLY.test(event.eligibility || "")) return false;
  return !NOT_FOR_STUDENTS.test(event.name);
}

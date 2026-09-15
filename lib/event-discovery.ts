import type { Event } from './events';

export const FOCUS_CATEGORIES = ['Tech', 'Business', 'Careers', 'Hackathon'];
export const CATEGORY_ORDER = [...FOCUS_CATEGORIES, 'Learning', 'Social', 'Expo & Fair', 'Arts & Culture', 'Sports', 'Wellness', 'Other'];

export function focusEvents(events: Event[], focused: boolean): Event[] {
  return focused ? events.filter(event => FOCUS_CATEGORIES.includes(event.category)) : events;
}

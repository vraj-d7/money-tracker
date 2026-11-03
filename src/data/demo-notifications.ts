// Sample notifications from the designs. Which ones are read is kept in the browser ("notifications:read").
import { routes } from '../lib/routes';

export type NotificationKind = 'money' | 'renew' | 'pf' | 'coach';

export interface AppNotification {
  id: string;
  group: 'Today' | 'This week';
  kind: NotificationKind;
  title: string;
  body: string;
  time: string;
  cta: string;
  href: string;
  icon: string;
  tile: string;
  /** Unread until the user opens it or marks all as read */
  unread: boolean;
}

export const NOTIFICATIONS: AppNotification[] = [
  { id: 'pf', group: 'Today', kind: 'pf', title: 'September’s PF deposit is missing', body: '₹6,000 was cut from your salary but hasn’t reached your PF account.', time: '9:10 AM', cta: 'Draft email to HR', href: routes.hrEmail, icon: 'M12 8v5M12 16.5v.5M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z', tile: '#FF6B5B', unread: true },
  { id: 'ott', group: 'Today', kind: 'renew', title: 'OTT renews tomorrow · ₹149', body: 'Still watching? Keep it, or cancel before it charges.', time: '8:00 AM', cta: 'Review it', href: `${routes.scan}?results`, icon: 'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5', tile: '#FFE4E0', unread: true },
  { id: 'sun', group: 'This week', kind: 'coach', title: 'Your Sunday recap is ready', body: 'You spent ₹3,240, ₹600 under plan. 6-week streak!', time: 'Sun', cta: 'Open recap', href: routes.sunday, icon: 'M4 5h16v11H9l-5 4z', tile: '#B9A6FF', unread: false },
  { id: 'pay', group: 'This week', kind: 'money', title: 'Payday in 5 days', body: 'Your salary-day plan is ready: ₹85,395 into five jars.', time: 'Sat', cta: 'See plan', href: routes.plan, icon: 'M7 5h10M7 9h10M7 5c4 0 5 2 5 4s-1 4-5 4l8 7', tile: '#FFB21E', unread: false },
  { id: 'goa', group: 'This week', kind: 'money', title: 'Goa trip is 92% there', body: '₹2,000 to go. Two more “Add ₹1,000” taps.', time: 'Thu', cta: 'Add to goal', href: routes.plan, icon: 'M3 13l18-8-6 16-3-7zM12 14l-9-1', tile: '#2ED3A0', unread: false },
];

export function unreadCount(read: string[]): number {
  return NOTIFICATIONS.filter((n) => n.unread && !read.includes(n.id)).length;
}

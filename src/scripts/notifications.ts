// What needs the user's attention right now, worked out from their own data and their
// notification settings. These show inside the app; nothing is sent to phones or email yet.
import { routes } from '../lib/routes';
import { weekKey } from '../lib/streaks';
import { readLocal } from './local-state';
import { loadProfile, monthlyInhand, paydayCycle } from './profile-store';
import { realRenewals, realWeek } from './scan-store';

export type NotificationKind = 'money' | 'renew' | 'coach';

export interface AppNotification {
  id: string;
  group: 'Today' | 'This week';
  kind: NotificationKind;
  title: string;
  body: string;
  cta: string;
  href: string;
  icon: string;
  tile: string;
}

const ICON = {
  money: 'M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  renew: 'M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5',
  coach: 'M4 5h16v11H9l-5 4z',
};

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

export function buildNotifications(today = new Date()): AppNotification[] {
  const profile = loadProfile();
  const on = profile.notifications;
  const out: AppNotification[] = [];

  if (on.payday) {
    const { next, daysLeft } = paydayCycle(profile, today);
    if (daysLeft <= 7) {
      out.push({
        id: `pay-${next.toDateString()}`,
        group: daysLeft <= 1 ? 'Today' : 'This week',
        kind: 'money',
        title: daysLeft === 0 ? 'It’s payday!' : daysLeft === 1 ? 'Payday tomorrow' : `Payday in ${daysLeft} days`,
        body: `Your salary-day plan is ready: ${inr(monthlyInhand(profile))} into your jars.`,
        cta: 'See plan',
        href: routes.plan,
        icon: ICON.money,
        tile: '#FFB21E',
      });
    }
  }

  if (on.renew) {
    for (const r of realRenewals()?.items ?? []) {
      if (r.daysLeft > 7) continue;
      out.push({
        id: `renew-${r.label}-${r.note.replace(/^(Today|Tomorrow), /, '')}`,
        group: r.daysLeft <= 1 ? 'Today' : 'This week',
        kind: 'renew',
        title: `${r.label} renews soon · ${inr(r.amount)}`,
        body: `Expected ${r.note}, going by your last statement. Keep it, or cancel before it charges.`,
        cta: 'Review it',
        href: `${routes.scan}?results`,
        icon: ICON.renew,
        tile: '#FFE4E0',
      });
    }
  }

  // The recap is ready on Sunday and Monday, until it's been opened
  if (on.sunday && [0, 1].includes(today.getDay())) {
    const thisWeek = weekKey(today.getDay() === 1 ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1) : today);
    if (!readLocal<string[]>('checkins', []).includes(thisWeek)) {
      const week = realWeek();
      out.push({
        id: `sun-${thisWeek}`,
        group: 'Today',
        kind: 'coach',
        title: 'Your Sunday recap is ready',
        body: week ? `${week.title}: you spent ${inr(week.spent)} of your ${inr(week.plan)} plan.` : 'Take a minute to look back at your week.',
        cta: 'Open recap',
        href: routes.sunday,
        icon: ICON.coach,
        tile: '#B9A6FF',
      });
    }
  }
  return out;
}

export function unreadCount(read: string[], today = new Date()): number {
  return buildNotifications(today).filter((n) => !read.includes(n.id)).length;
}

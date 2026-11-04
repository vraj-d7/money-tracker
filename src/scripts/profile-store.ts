// What sign-up, onboarding and the Me screens know about the user. Kept in this browser and synced to the account when signed in.
import type { CoachMode } from '../lib/coach';
import { noteChange } from './local-state';
import { compareRegimes } from '../lib/salary';

export type { CoachMode };

const KEY = 'inhandy:profile';

export type NotificationKey = 'sunday' | 'renew' | 'pf' | 'payday';

export interface TaxDetails {
  /** Basic pay as % of CTC */
  basicPct: number;
  /** HRA received, per month */
  hra: number;
  /** Rent paid, per month */
  rent: number;
  /** 80C investments on top of PF, per year */
  c80: number;
  /** Health insurance premium (80D), per year */
  d80: number;
  /** Professional tax, per year */
  pt: number;
  metro: boolean;
}

export interface Profile {
  name: string;
  lastName: string;
  email: string;
  /** 10 digits, shown as "98765 43210" */
  phone: string;
  /** CTC in lakhs per year */
  ctc: number;
  city: string;
  /** Day of the month salary arrives, or 'last' for the last working day */
  payday: number | 'last';
  /** When payday falls on a weekend: paid the working day before or after */
  paydayShift: 'before' | 'after';
  coachMode: CoachMode;
  notifications: Record<NotificationKey, boolean>;
  tax: TaxDetails;
}

export const DEFAULT_PROFILE: Profile = {
  name: '',
  lastName: '',
  email: '',
  phone: '',
  ctc: 12,
  city: 'Bengaluru',
  payday: 7,
  paydayShift: 'before',
  coachMode: 'honest',
  notifications: { sunday: true, renew: true, pf: true, payday: false },
  tax: { basicPct: 50, hra: 24000, rent: 25000, c80: 0, d80: 0, pt: 2400, metro: false },
};

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_PROFILE);
    const saved = JSON.parse(raw) as Partial<Profile>;
    // Older saves copied in the old sample person's details; those were never the user's own
    if (saved.name === 'Aarav' && saved.lastName === 'R.') {
      saved.name = '';
      saved.lastName = '';
    }
    if (saved.email === 'aarav@example.com') saved.email = '';
    if (saved.phone === '98765 43210') saved.phone = '';
    return {
      ...DEFAULT_PROFILE,
      ...saved,
      notifications: { ...DEFAULT_PROFILE.notifications, ...saved.notifications },
      tax: { ...DEFAULT_PROFILE.tax, ...saved.tax },
    };
  } catch {
    return structuredClone(DEFAULT_PROFILE);
  }
}

export function saveProfile(patch: Partial<Profile>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...loadProfile(), ...patch }));
    noteChange();
  } catch {
    // Storage blocked: the flow still works, it just won't remember
  }
}

export function initials(p: Pick<Profile, 'name' | 'lastName'>): string {
  return ((p.name[0] ?? '') + (p.lastName[0] ?? '')).toUpperCase() || '🙂';
}

export function displayName(p: Pick<Profile, 'name' | 'lastName'>): string {
  return [p.name, p.lastName].filter(Boolean).join(' ') || 'You';
}

/** The salary date for month `m` of year `y` (m may run past 0–11), moved off weekends */
function paydayIn(y: number, m: number, payday: Profile['payday'], shift: Profile['paydayShift']): Date {
  const last = new Date(y, m + 1, 0).getDate();
  const d = new Date(y, m, payday === 'last' ? last : Math.min(payday, last));
  // Weekend: last working day always steps back; a fixed date follows the user's choice
  const step = payday === 'last' || shift === 'before' ? -1 : 1;
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + step);
  return d;
}

/** Next salary date on or after today */
export function nextPayday(payday: Profile['payday'], today = new Date(), shift: Profile['paydayShift'] = 'before'): Date {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  // A weekend shift can move a salary day into the next or previous month, so look one month either side
  for (let m = start.getMonth() - 1; ; m++) {
    const d = paydayIn(start.getFullYear(), m, payday, shift);
    if (d >= start) return d;
  }
}

/** Last salary date before the given day */
function previousPayday(payday: Profile['payday'], before: Date, shift: Profile['paydayShift']): Date {
  for (let m = before.getMonth() + 1; ; m--) {
    const d = paydayIn(before.getFullYear(), m, payday, shift);
    if (d < before) return d;
  }
}

export function daysUntil(date: Date, today = new Date()): number {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((date.getTime() - start.getTime()) / 86400000);
}

/** Where today sits between the last salary day and the next one */
export function paydayCycle(p: Pick<Profile, 'payday' | 'paydayShift'>, today = new Date()) {
  const next = nextPayday(p.payday, today, p.paydayShift);
  const prev = previousPayday(p.payday, next, p.paydayShift);
  return { next, daysLeft: daysUntil(next, today), cycleDays: Math.max(1, daysUntil(next, prev)) };
}

/** Monthly take-home for the saved CTC, under whichever tax regime leaves more */
export function monthlyInhand(p: Pick<Profile, 'ctc'>): number {
  const cmp = compareRegimes(p.ctc);
  return Math.round(cmp[cmp.winner].inhand / 12);
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LONG_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LONG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "Sat, 7 Nov" */
export function shortDate(d: Date): string {
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Saturday, 7 November" */
export function longDate(d: Date): string {
  return `${LONG_DAYS[d.getDay()]}, ${d.getDate()} ${LONG_MONTHS[d.getMonth()]}`;
}

/** "Sat, 7 Nov (4 days)" */
export function describeNextPayday(p: Pick<Profile, 'payday' | 'paydayShift'>, today = new Date()): string {
  const d = nextPayday(p.payday, today, p.paydayShift);
  const n = daysUntil(d, today);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} (${n === 0 ? 'today' : n === 1 ? '1 day' : `${n} days`})`;
}

/** "7th of every month" / "Last working day of the month" */
export function describePayday(payday: Profile['payday']): string {
  if (payday === 'last') return 'Last working day of the month';
  const n = payday;
  const suffix = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th';
  return `${n}${suffix} of every month`;
}

// Coach plan status, kept in this browser. Checkout runs in test mode (no payment provider yet),
// so this only records what the user chose; no money moves.
import { readLocal, writeLocal } from './local-state';

export const PLAN_PRICE = 19;
/** GST included in the weekly price (18%) */
export const PLAN_GST = Math.round(((PLAN_PRICE * 18) / 118) * 100) / 100;

export interface Subscription {
  status: 'free' | 'active' | 'cancelled';
  /** ISO dates */
  since?: string;
  cancelledOn?: string;
  method?: 'app' | 'id';
  upiId?: string;
  /** Receipts, newest last */
  payments: { date: string; amount: number }[];
}

const KEY = 'subscription';

export function loadSubscription(): Subscription {
  return readLocal<Subscription>(KEY, { status: 'free', payments: [] });
}

export function saveSubscription(s: Subscription): void {
  writeLocal(KEY, s);
}

/** On the plan (including a cancelled plan that runs to the end of the paid week) */
export function hasCoachPlan(s: Subscription, today = new Date()): boolean {
  if (s.status === 'active') return true;
  return s.status === 'cancelled' && today <= accessUntil(s);
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Weekly charges land on Mondays: the next Monday after today */
export function nextCharge(today = new Date()): Date {
  const d = startOfDay(today);
  d.setDate(d.getDate() + (((8 - d.getDay()) % 7) || 7));
  return d;
}

/** A paid week runs to the Sunday before the next charge */
export function accessUntil(s: Subscription, today = new Date()): Date {
  const from = s.cancelledOn ? new Date(s.cancelledOn) : today;
  const d = nextCharge(from);
  d.setDate(d.getDate() - 1);
  return d;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Mon, 9 Nov" (or "Sunday, 8 Nov" with long = true) */
export function shortDate(d: Date, long = false): string {
  const day = long ? DAYS[d.getDay()] : DAYS[d.getDay()].slice(0, 3);
  return `${day}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "2 Nov 2026" */
export function fullDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function isValidUpiId(v: string): boolean {
  return /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(v.trim());
}

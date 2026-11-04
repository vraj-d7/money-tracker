// Turns statement transactions into the week's spends and upcoming renewals.
// Pure functions, like statement.ts; `today` is passed in so they're easy to test.
import { merchantOf, type Txn } from './statement';

export type SpendCategory = 'Food' | 'Travel' | 'Fun' | 'Other';
export type SpendMethod = 'UPI' | 'Card' | 'Cash' | 'Bank' | 'Added by you';

export const CATEGORIES: SpendCategory[] = ['Food', 'Travel', 'Fun', 'Other'];
/** The ways to pay someone can pick when adding a spend by hand */
export const ADD_METHODS = ['UPI', 'Cash', 'Card'] as const;

export interface Spend {
  /** Only on spends the user added themselves, so they can be removed */
  id?: string;
  what: string;
  category: SpendCategory;
  method: SpendMethod;
  amount: number;
}

/** A spend the user typed in themselves */
export interface AddedSpend {
  id: string;
  /** yyyy-mm-dd */
  date: string;
  amount: number;
  what: string;
  category: SpendCategory;
  /** Missing on spends added before this was asked */
  method?: (typeof ADD_METHODS)[number];
}

export interface SpendWeek {
  range: string;
  shortRange: string;
  /** True when the week is the current one, not just the latest in the statement */
  current: boolean;
  days: { label: string; spends: Spend[] }[];
  spent: number;
  byCategory: { category: SpendCategory; amount: number }[];
}

const FOOD = /swiggy|zomato|blinkit|zepto|instamart|bigbasket|dominos|domino|pizza|mcdonald|kfc|starbucks|cafe|restaurant|bakery|chai|food|grocer|supermarket|dmart|d-mart|bazaar/i;
const TRAVEL = /uber|\bola\b|rapido|metro|irctc|redbus|makemytrip|goibibo|indigo|air\s?india|petrol|fuel|\bhpcl\b|\bbpcl\b|\biocl\b|fastag|\bauto\b|\bcab\b|parking/i;
const FUN = /netflix|spotify|hotstar|prime|youtube|bookmyshow|pvr|inox|movie|steam|playstation|sonyliv|zee5|gaming|\bclub\b|\bbar\b|\bpub\b/i;

export function categorize(desc: string): SpendCategory {
  if (FOOD.test(desc)) return 'Food';
  if (TRAVEL.test(desc)) return 'Travel';
  if (FUN.test(desc)) return 'Fun';
  return 'Other';
}

export function methodOf(desc: string): SpendMethod {
  if (/\bupi\b/i.test(desc)) return 'UPI';
  if (/\batm\b|\bcash\b/i.test(desc)) return 'Cash';
  if (/\bneft\b|\bimps\b|\brtgs\b|\bnach\b|\bach\b|mandate/i.test(desc)) return 'Bank';
  return 'Card';
}

/** Day-to-day money: leaves out what the jars already cover (rent, SIPs, EMIs, insurance, bills) */
function isEveryday(t: Txn): boolean {
  return t.type === 'debit' && !merchantOf(t.desc).known?.keep;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Dates as plain local days, so time zones can't move them */
const toDate = (iso: string) => new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
export const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayMonth = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
const dayLabel = (d: Date) => `${DAYS[d.getDay()]}, ${dayMonth(d)}`;
const sameDay = (a: Date, b: Date) => toIso(a) === toIso(b);

/**
 * Added spends a statement hasn't already covered. A debit of the same amount within a day counts as
 * the same spend, so scanning later doesn't double it. Cash never shows on a statement, so it never matches.
 */
export function unmatchedSpends(added: AddedSpend[], txns: Txn[]): AddedSpend[] {
  const debits = txns.filter((t) => t.type === 'debit');
  const used = new Set<Txn>();
  return added.filter((a) => {
    if (a.method === 'Cash') return true;
    const match = debits.find(
      (t) =>
        !used.has(t) &&
        Math.round(t.amount) === Math.round(a.amount) &&
        Math.abs(toDate(t.date).getTime() - toDate(a.date).getTime()) <= 86400000 * 1.5,
    );
    if (match) used.add(match);
    return !match;
  });
}

/** The Monday-to-Sunday week holding the latest day-to-day spend; null when there are none */
export function latestWeek(txns: Txn[], today = new Date(), added: AddedSpend[] = []): SpendWeek | null {
  const everyday = txns.filter(isEveryday);
  const extra = unmatchedSpends(added, txns);
  const spendDates = [...everyday.map((t) => t.date), ...extra.map((a) => a.date)];
  if (!spendDates.length) return null;
  const allDates = [...txns.map((t) => t.date), ...extra.map((a) => a.date)];
  const latest = (list: string[]) => list.reduce((max, d) => (d > max ? d : max), list[0]);
  const mondayOf = (iso: string) => {
    const d = toDate(iso);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  };
  const sundayOf = (m: Date) => new Date(m.getFullYear(), m.getMonth(), m.getDate() + 6);

  let monday = mondayOf(latest(spendDates));
  // A statement often ends mid-week. That stub would look like a very cheap week, so use the last
  // full one instead (unless it's the week we're in now, which is meant to be partial).
  const todayIso = toIso(today);
  const inProgress = todayIso >= toIso(monday) && todayIso <= toIso(sundayOf(monday));
  if (!inProgress && latest(allDates) < toIso(sundayOf(monday))) {
    const earlier = spendDates.filter((d) => d < toIso(monday));
    if (earlier.length) monday = mondayOf(latest(earlier));
  }
  const sunday = sundayOf(monday);
  const from = toIso(monday);
  const to = toIso(sunday);

  const byDay = new Map<string, Spend[]>();
  for (const t of everyday) {
    if (t.date < from || t.date > to) continue;
    const list = byDay.get(t.date) ?? [];
    list.push({
      what: merchantOf(t.desc).label || 'Payment',
      category: categorize(t.desc),
      method: methodOf(t.desc),
      amount: Math.round(t.amount),
    });
    byDay.set(t.date, list);
  }
  for (const a of extra) {
    if (a.date < from || a.date > to) continue;
    const list = byDay.get(a.date) ?? [];
    list.push({ id: a.id, what: a.what, category: a.category, method: a.method ?? 'Added by you', amount: Math.round(a.amount) });
    byDay.set(a.date, list);
  }

  const days = [...byDay.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([iso, spends]) => ({ label: dayLabel(toDate(iso)), spends }));
  const all = days.flatMap((d) => d.spends);

  return {
    range: `Mon ${dayMonth(monday)} – Sun ${dayMonth(sunday)}`,
    shortRange: `${dayMonth(monday)} – ${dayMonth(sunday)}`,
    current: todayIso >= from && todayIso <= to,
    days,
    spent: all.reduce((s, x) => s + x.amount, 0),
    byCategory: CATEGORIES.map((category) => ({
      category,
      amount: all.filter((x) => x.category === category).reduce((s, x) => s + x.amount, 0),
    })),
  };
}

/** The week's budget: what's left after the jars, spread over about 4.3 weeks a month */
export function weeklyPlan(monthlyInhand: number, jarPct: number): number {
  return Math.round((monthlyInhand * Math.max(0, 100 - jarPct)) / 100 / (52 / 12));
}

export interface Renewal {
  label: string;
  amount: number;
  flag: boolean;
  /** "Tomorrow, Thu 5 Nov" */
  note: string;
  short: string;
  daysLeft: number;
}

/** Subscriptions by next expected charge, assuming each repeats monthly on the same date. Soonest first. */
export function upcomingRenewals(
  subs: { label: string; monthly: number; flag?: boolean; keep?: boolean; lastCharged?: string }[],
  today = new Date(),
): Renewal[] {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const out: Renewal[] = [];
  for (const s of subs) {
    if (s.keep || !s.lastCharged) continue;
    const last = toDate(s.lastCharged);
    let next = last;
    for (let m = 1; next < start || sameDay(next, last); m++) {
      // Keep to the same date; a short month uses its last day
      const end = new Date(last.getFullYear(), last.getMonth() + m + 1, 0).getDate();
      next = new Date(last.getFullYear(), last.getMonth() + m, Math.min(last.getDate(), end));
    }
    const daysLeft = Math.round((next.getTime() - start.getTime()) / 86400000);
    const short = `${DAYS[next.getDay()]} ${dayMonth(next)}`;
    out.push({
      label: s.label,
      amount: s.monthly,
      flag: !!s.flag,
      note: daysLeft === 0 ? `Today, ${short}` : daysLeft === 1 ? `Tomorrow, ${short}` : short,
      short: DAYS[next.getDay()],
      daysLeft,
    });
  }
  return out.sort((a, b) => a.daysLeft - b.daysLeft);
}

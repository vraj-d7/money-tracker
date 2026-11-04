// What the last statement scan found. The autopay list (small) is saved with the account;
// the full transaction list stays on this device only and is never synced.
// Spends the user types in themselves are saved with the account too.
import { DEFAULT_CUT, SCAN_RESULTS, type Subscription } from '../data/demo-tools';
import { latestWeek, toIso, upcomingRenewals, weeklyPlan, type AddedSpend, type Renewal, type SpendWeek } from '../lib/spending';
import type { Txn } from '../lib/statement';
import { noteChange, readLocal, writeLocal } from './local-state';
import { loadPlan } from './plan-store';
import { daysUntil, loadProfile, monthlyInhand, paydayCycle } from './profile-store';

/** Outside the `inhandy:` prefix on purpose, so sync.ts never sends it anywhere */
export const STATEMENT_KEY = 'inhandy-device:statement';

/** The autopays to show: from the user's own statement, or the sample list if they haven't scanned one */
export function scanResults(): { subs: Subscription[]; sample: boolean } {
  const subs = readLocal<Subscription[] | null>('scan:subs', null);
  return subs ? { subs, sample: false } : { subs: SCAN_RESULTS, sample: true };
}

/** After reading a real statement: new results, nothing picked or cancelled yet */
export function saveScan(subs: Subscription[], txns: Txn[]) {
  writeLocal('scan:subs', subs);
  writeLocal('scan:cut', []);
  writeLocal('cancel:done', []);
  writeLocal('scan:done', true);
  writeLocal('scan:at', new Date().toISOString());
  try {
    localStorage.setItem(STATEMENT_KEY, JSON.stringify({ scannedAt: new Date().toISOString(), txns }));
  } catch {
    // Too big or storage blocked: the autopay list above still works
  }
}

/** "Scan a sample statement": back to the example results */
export function useSample() {
  try {
    localStorage.removeItem('inhandy:scan:subs');
    localStorage.removeItem(STATEMENT_KEY);
  } catch {
    // Storage blocked
  }
  noteChange();
  writeLocal('scan:cut', DEFAULT_CUT);
  writeLocal('cancel:done', []);
  writeLocal('scan:done', true);
}

/** Transactions from the last statement scanned on this device (for spends; empty if none) */
export function loadTransactions(): Txn[] {
  try {
    return (JSON.parse(localStorage.getItem(STATEMENT_KEY) ?? 'null')?.txns as Txn[]) ?? [];
  } catch {
    return [];
  }
}

export function loadAddedSpends(): AddedSpend[] {
  return readLocal<AddedSpend[]>('spends', []);
}

/** Only recent ones are kept: the app shows one week at a time, and this is saved with the account */
export function addSpend(spend: Omit<AddedSpend, 'id'>) {
  const cutoff = toIso(new Date(Date.now() - 120 * 86400000));
  const kept = loadAddedSpends().filter((s) => s.date >= cutoff);
  writeLocal('spends', [...kept, { ...spend, id: `spend-${Date.now()}` }]);
}

export function removeSpend(id: string) {
  writeLocal('spends', loadAddedSpends().filter((s) => s.id !== id));
}

/** The latest week of the user's own spends (scanned or added) with their weekly budget; null if there are none */
export function realWeek(): (SpendWeek & { plan: number; title: string }) | null {
  const week = latestWeek(loadTransactions(), new Date(), loadAddedSpends());
  if (!week) return null;
  const jarPct = Object.values(loadPlan().jars).reduce((s, p) => s + p, 0);
  return {
    ...week,
    plan: weeklyPlan(monthlyInhand(loadProfile()), jarPct),
    title: week.current ? 'This week' : `Week of ${week.shortRange.split(' – ')[0]}`,
  };
}

/** When a statement was last scanned: saved with the account, or this device's record for older scans */
function lastScanAt(): Date | null {
  const saved = readLocal<string | null>('scan:at', null);
  if (saved) return new Date(saved);
  try {
    const at = JSON.parse(localStorage.getItem(STATEMENT_KEY) ?? 'null')?.scannedAt;
    return at ? new Date(at) : null;
  } catch {
    return null;
  }
}

/**
 * The monthly nudge: for a week after salary day, unless a statement has been scanned since.
 * Returns that salary day, or null when there's nothing to ask.
 */
export function scanReminder(today = new Date()): Date | null {
  const profile = loadProfile();
  if (!profile.notifications.scan || !profile.payConfirmed) return null;
  const { next, daysLeft, cycleDays } = paydayCycle(profile, today);
  const salaryDay = daysLeft === 0 ? next : new Date(next.getFullYear(), next.getMonth(), next.getDate() - cycleDays);
  if (daysUntil(today, salaryDay) > 7) return null;
  const scanned = lastScanAt();
  return scanned && scanned >= salaryDay ? null : salaryDay;
}

/** Upcoming charges from a real scan (synced, so this works on other devices too); null with sample results */
export function realRenewals(): { items: Renewal[]; monthTotal: number } | null {
  const { subs, sample } = scanResults();
  if (sample) return null;
  const items = upcomingRenewals(subs);
  return { items, monthTotal: items.reduce((s, r) => s + r.amount, 0) };
}

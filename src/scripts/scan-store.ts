// What the last statement scan found. The autopay list (small) is saved with the account;
// the full transaction list stays on this device only and is never synced.
import { DEFAULT_CUT, SCAN_RESULTS, type Subscription } from '../data/demo-tools';
import type { Txn } from '../lib/statement';
import { noteChange, readLocal, writeLocal } from './local-state';

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

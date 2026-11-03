// Starting jar split, plus values used to pre-render the plan pages before the saved profile loads.
// Edits are saved by scripts/plan-store.ts.
import type { GoalIcon } from '../lib/goal-icons';

export const MONTHLY_INHAND = 85395;

export interface Jar {
  id: string;
  label: string;
  color: string;
  /** Share of monthly in-hand, in % */
  pct: number;
}

export const DEFAULT_JARS: Jar[] = [
  { id: 'rent', label: 'Rent', color: '#5AB8FF', pct: 30 },
  { id: 'home', label: 'Home', color: '#FFB21E', pct: 15 },
  { id: 'sip', label: 'SIP', color: '#2ED3A0', pct: 10 },
  { id: 'emer', label: 'Emergency', color: '#9BE8CE', pct: 10 },
  { id: 'fun', label: 'Fun', color: '#FF7EC8', pct: 15 },
];

export interface Goal {
  id: string;
  label: string;
  sub: string;
  icon: GoalIcon;
  target: number;
  saved: number;
}

export const nextPayday = { label: 'Sat, 7 Nov', short: '7 Nov' };
export const paydayStreak = 4;

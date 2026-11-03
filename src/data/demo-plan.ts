// Starting salary-day plan from the designs. Edits made in the app are kept in the browser (scripts/plan-store.ts).
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

export const DEFAULT_GOALS: Goal[] = [
  { id: 'emer', label: 'Emergency fund', sub: '3 months of expenses · on track for Jun 2027', icon: 'shield', target: 120000, saved: 42000 },
  { id: 'trip', label: 'Goa trip with the gang', sub: 'Two taps away. Tap “Add ₹1,000”!', icon: 'plane', target: 25000, saved: 23000 },
];

export const nextPayday = { label: 'Sat, 7 Nov', short: '7 Nov' };
export const paydayStreak = 4;

// Sample numbers for the Home screen, matching the designs (as if today were Mon 2 Nov).
// Swap for real data once salary, spends and renewals are tracked.
import { WEEK, weekByCategory, weekSpent } from './demo-week';

export const demoHome = {
  today: { long: 'Monday, 2 November', short: 'Mon, 2 Nov' },
  payday: {
    daysLeft: 5,
    cycleDays: 30,
    date: 'Sat, 7 Nov',
    expected: 85395,
  },
  week: {
    spent: weekSpent,
    plan: WEEK.plan,
    categories: weekByCategory.map((c) => ({ label: c.category, amount: c.amount })),
  },
  renewals: {
    monthTotal: 1267,
    items: [
      { label: 'OTT', note: 'Tomorrow, Tue 3 Nov', amount: 149, icon: 'tv', warn: false },
      { label: 'Music app', note: 'Fri 6 Nov', amount: 119, icon: 'music', warn: false },
      { label: 'Gym pass', note: 'Sat 14 Nov · unused 41 days', amount: 999, icon: 'gym', warn: true },
    ],
  },
  coachPrompts: ['Can I afford a ₹12,000 phone?', 'Where did my salary go?', 'Start my first SIP'],
} as const;

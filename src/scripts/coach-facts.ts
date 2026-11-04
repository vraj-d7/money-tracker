// Gathers what Handy knows about this user for the coach's replies and side panel.
import type { CoachFacts } from '../lib/coach';
import { DEFAULT_JARS } from '../data/demo-plan';
import { loadPlan } from './plan-store';
import { loadProfile, monthlyInhand, paydayCycle, shortDate } from './profile-store';
import { realWeek } from './scan-store';

export function coachFacts(): CoachFacts {
  const profile = loadProfile();
  const { jars } = loadPlan();
  const inhand = monthlyInhand(profile);
  const jar = (id: string) => jars[id] ?? DEFAULT_JARS.find((j) => j.id === id)?.pct ?? 0;
  const cycle = paydayCycle(profile);
  const week = realWeek();
  const top = week ? [...week.byCategory].sort((a, b) => b.amount - a.amount)[0] : null;
  return {
    name: profile.name,
    inhand,
    funJar: Math.round((inhand * jar('fun')) / 100),
    sipJar: Math.round((inhand * jar('sip')) / 100),
    savePct: Math.round(jar('sip') + jar('emer')),
    daysLeft: cycle.daysLeft,
    payday: shortDate(cycle.next),
    week: week && top ? { title: week.title, spent: week.spent, plan: week.plan, top: top.category, topAmount: top.amount } : null,
  };
}

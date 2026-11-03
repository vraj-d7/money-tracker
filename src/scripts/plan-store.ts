// Keeps the user's plan (jar split + goals) in this browser, synced to the account when signed in.
import { DEFAULT_GOALS, DEFAULT_JARS, type Goal } from '../data/demo-plan';
import { noteChange } from './local-state';

const KEY = 'inhandy:plan';

export interface PlanState {
  /** Jar id → % of in-hand */
  jars: Record<string, number>;
  goals: Goal[];
}

function defaults(): PlanState {
  return {
    jars: Object.fromEntries(DEFAULT_JARS.map((j) => [j.id, j.pct])),
    goals: DEFAULT_GOALS.map((g) => ({ ...g })),
  };
}

export function loadPlan(): PlanState {
  const base = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<PlanState>;
    return {
      jars: { ...base.jars, ...saved.jars },
      goals: Array.isArray(saved.goals) ? saved.goals : base.goals,
    };
  } catch {
    return base;
  }
}

export function savePlan(state: PlanState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    noteChange();
  } catch {
    // Storage blocked (private mode etc.): changes just won't persist
  }
}

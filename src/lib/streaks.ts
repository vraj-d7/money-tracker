// Streaks from what the user actually did. Pure functions; `today` is passed in for testing.
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The Monday of a date's week, as YYYY-MM-DD: identifies a week */
export function weekKey(d: Date): string {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return iso(monday);
}

const weeksBack = (today: Date, n: number) => {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - n * 7);
  return weekKey(d);
};

/** Weeks in a row with a check-in, ending this week, or last week if this one isn't done yet */
export function checkinStreak(weeks: string[], today = new Date()): number {
  const done = new Set(weeks);
  let n = done.has(weeksBack(today, 0)) ? 0 : 1;
  let count = 0;
  while (done.has(weeksBack(today, n))) {
    count++;
    n++;
  }
  return count;
}

/** The last `size` weeks, oldest first: whether each had a check-in */
export function recentWeeks(weeks: string[], today = new Date(), size = 7): boolean[] {
  const done = new Set(weeks);
  return Array.from({ length: size }, (_, i) => done.has(weeksBack(today, size - 1 - i)));
}

/** A date's month, as YYYY-MM */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/** Months in a row with jars filled, ending this month, or last month if this one isn't done yet */
export function paydayStreak(months: string[], today = new Date()): number {
  const done = new Set(months);
  const back = (n: number) => monthKey(new Date(today.getFullYear(), today.getMonth() - n, 1));
  let n = done.has(back(0)) ? 0 : 1;
  let count = 0;
  while (done.has(back(n))) {
    count++;
    n++;
  }
  return count;
}

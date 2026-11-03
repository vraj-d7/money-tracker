// Data and maths for the landing page (src/pages/index.astro + components/landing/*).
import { calcSalary, type SalaryBreakdown } from './salary';
import { inr } from './format';
import type { HandyMood } from './handy';

export const lakhLabel = (l: number) => (l >= 100 ? '₹1Cr' : `₹${Math.round(l * 10) / 10}L`);

/** The four slices the hero chart shows, per year */
export function heroSplit(lakhs: number) {
  const b: SalaryBreakdown = calcSalary(lakhs, 'new');
  return { ctc: b.ctc, inhand: b.inhand, tax: b.tax, pf: b.erPF + b.eePF, other: b.grat + b.pt };
}

export type HeroSplit = ReturnType<typeof heroSplit>;

/** Ribbon paths from the CTC bar (left) to four stacked bars (right) in a 640×340 SVG */
export function flowPaths(s: HeroSplit) {
  const usable = 264;
  const gap = 12;
  let yl = 38;
  let yr = 20;
  const f = (n: number) => n.toFixed(1);
  return (['inhand', 'tax', 'pf', 'other'] as const).map((k) => {
    const h = (s[k] / s.ctc) * usable;
    const g = { yl0: yl, yl1: yl + h, yr0: yr, yr1: yr + h };
    yl += h;
    yr += h + gap;
    return {
      d: `M46 ${f(g.yl0)} C320 ${f(g.yl0)} 320 ${f(g.yr0)} 596 ${f(g.yr0)} L596 ${f(g.yr1)} C320 ${f(g.yr1)} 320 ${f(g.yl1)} 46 ${f(g.yl1)} Z`,
      ry: f(g.yr0),
      rh: f(Math.max(0, h)),
    };
  });
}

export function heroMood(lakhs: number, s: HeroSplit): HandyMood {
  if (s.tax === 0 && lakhs >= 7) return 'cheer';
  if (lakhs < 5) return 'chill';
  if (lakhs >= 25) return 'gasp';
  return 'happy';
}

export function heroBubble(mood: HandyMood, s: HeroSplit): string {
  const monthly = inr(s.inhand / 12);
  switch (mood) {
    case 'cheer':
      return `Zero tax! Rebate ki jai. ${monthly} lands every month.`;
    case 'chill':
      return `Chill, every rupee counts. Let’s make ${monthly} work hard.`;
    case 'gasp':
      return `Arre! ${inr(s.tax / 12)}/month goes to tax. Let’s be smart about it.`;
    default:
      return `Salary aa gayi! ${monthly} lands in your account.`;
  }
}

export const LANDING_JARS = [
  { k: 'rent', label: 'Rent', color: '#5AB8FF', start: 30 },
  { k: 'home', label: 'Sent home', color: '#FFB21E', start: 15 },
  { k: 'sip', label: 'SIP', color: '#2ED3A0', start: 15 },
  { k: 'emer', label: 'Emergency', color: '#9BE8CE', start: 10 },
  { k: 'fun', label: 'Fun money', color: '#FF7EC8', start: 15 },
];

export function jarPlanMessage(total: number, monthlyInhand: number) {
  const left = (monthlyInhand * (100 - total)) / 100;
  if (total > 100)
    return { msg: `Over by ${inr(-left)}. Trim a jar?`, sub: 'You’ve planned more than lands in your account. Fun money is usually the easiest to squeeze.', mood: 'gasp' as HandyMood, tone: 'bad' };
  if (total === 100) return { msg: 'Every rupee has a job. Shabaash!', sub: 'A zero-based plan. Handy approves.', mood: 'cheer' as HandyMood, tone: 'good' };
  return { msg: `${inr(left)} still unplanned`, sub: 'Park it in your emergency jar, or let it ride as a buffer till payday.', mood: 'happy' as HandyMood, tone: 'good' };
}

export const GRAVEYARD = [
  { id: 'ott', label: 'OTT', kind: 'Streaming plan', monthly: 149, renew: 'Renews Tuesday', icon: 'M3 9a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM8 21h8M10 10.5v3l3-1.5z', delay: '0s' },
  { id: 'music', label: 'Music', kind: 'Music app', monthly: 119, renew: 'Renews Friday', icon: 'M9 18V5l11-2v13M6.5 15.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM17.5 13.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z', delay: '-0.8s' },
  { id: 'gym', label: 'Gym pass', kind: 'Last check-in 41 days ago', monthly: 999, renew: 'Renews on the 14th', icon: 'M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12', delay: '-1.6s' },
  { id: 'food', label: 'Food pass', kind: 'Delivery membership', monthly: 99, renew: 'Renews in 9 days', icon: 'M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0', delay: '-2.2s' },
  { id: 'cloud', label: 'Cloud storage', kind: 'Using 3% of 100 GB', monthly: 130, renew: 'Renews on the 2nd', icon: 'M7 18h10a4 4 0 0 0 .6-8A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7z', delay: '-0.4s' },
  { id: 'news', label: 'News app', kind: 'Free trial ended', monthly: 79, renew: 'Renews tomorrow', icon: 'M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM8 9h8M8 13h8M8 17h5', delay: '-1.2s' },
];

export const GRAVEYARD_YEARLY = GRAVEYARD.reduce((s, x) => s + x.monthly * 12, 0);

export const SUNDAY_MESSAGE = 'Sunday recap: you spent ₹3,240 this week, ₹600 under plan. OTT renews on Tuesday (₹149). You’re on track for payday.';

export const LANDING_MODES = {
  hype: { label: 'Hype', name: 'Hype mode', mood: 'cheer' as HandyMood, msg: 'Arre waah! ₹600 UNDER plan this week. Food, travel, fun, all handled like a pro. Payday in 5 days and you’re cruising. Keep going, superstar!' },
  honest: { label: 'Honest', name: 'Honest mode', mood: 'happy' as HandyMood, msg: 'You spent ₹3,240 this week, ₹600 under your ₹3,840 plan. Food delivery was ₹840, about a quarter of it. One renewal on Tuesday: OTT, ₹149.' },
  mom: { label: 'Mom', name: 'Mom mode', mood: 'sus' as HandyMood, msg: 'Beta, ₹840 on food delivery AGAIN? Ghar ka khana kya bura hai? …Theek hai, ₹600 under plan, so I’m a little proud. Only a little. Ab kuch healthy khao.' },
};

export type LandingMode = keyof typeof LANDING_MODES;

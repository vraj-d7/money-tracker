// Offer face-off maths, ported from designs/OfferDesktop.dc.html. New tax regime only.
import { calcSalary, newTax } from './salary';

export type OfferId = 'A' | 'B';

export interface Offer {
  /** Fixed pay in lakhs per year */
  fixed: number;
  /** Variable pay as % of fixed (counted at 100%) */
  varPct: number;
  /** One-time joining bonus in lakhs */
  bonus: number;
}

export interface OfferResult {
  monthly: number;
  year1: number;
  fixed: number;
  extra: number;
  tax: number;
  inhand: number;
}

export function calcOffer(o: Offer): OfferResult {
  const c = calcSalary(o.fixed, 'new');
  const extra = (o.fixed * 100000 * o.varPct) / 100 + o.bonus * 100000;
  // Variable + bonus are taxed at the margin on top of the fixed salary
  const extraTax = newTax(c.gross + extra) - c.tax;
  return {
    monthly: c.inhand / 12,
    year1: c.inhand + extra - extraTax,
    fixed: o.fixed * 100000,
    extra,
    tax: c.tax,
    inhand: c.inhand,
  };
}

export interface OfferField {
  key: keyof Offer;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
}

export const OFFER_FIELDS: OfferField[] = [
  { key: 'fixed', label: 'Fixed pay', hint: 'per year', min: 2, max: 100, step: 0.5 },
  { key: 'varPct', label: 'Variable', hint: 'of fixed', min: 0, max: 30, step: 1 },
  { key: 'bonus', label: 'Joining bonus', hint: 'one-time', min: 0, max: 3, step: 0.25 },
];

export function fieldValueLabel(key: keyof Offer, v: number, inr: (n: number) => string): string {
  if (key === 'fixed') return v >= 100 ? '₹1Cr' : `₹${Math.round(v * 10) / 10}L`;
  if (key === 'varPct') return `${v}%`;
  return inr(v * 100000);
}

export interface FaceOff {
  a: OfferResult;
  b: OfferResult;
  winner: OfferId;
  loser: OfferId;
  monthlyGap: number;
  verdict: string;
  verdictSub: string;
}

export function faceOff(A: Offer, B: Offer, inr: (n: number) => string): FaceOff {
  const a = calcOffer(A);
  const b = calcOffer(B);
  const winner: OfferId = b.monthly > a.monthly ? 'B' : 'A';
  const loser: OfferId = winner === 'A' ? 'B' : 'A';
  const monthlyGap = Math.abs(b.monthly - a.monthly);
  const yearDiff = b.year1 - a.year1;
  const yearWinner: OfferId = yearDiff > 0 ? 'B' : 'A';

  const verdict =
    monthlyGap < 50 ? 'It’s a tie on monthly pay.' : `Offer ${winner} gives you ${inr(monthlyGap)} more every month.`;
  const verdictSub =
    yearWinner === winner
      ? `It stays ahead in year one too, by ${inr(Math.abs(yearDiff))}.`
      : `But with variable pay and joining bonus, Offer ${loser} pays ${inr(Math.abs(yearDiff))} more in year one. Variable isn’t guaranteed, so weigh that.`;

  return { a, b, winner, loser, monthlyGap, verdict, verdictSub };
}

export interface TableRow {
  label: string;
  a: number;
  b: number;
  bold: boolean;
  /** Which side to highlight green, if any */
  best: 'a' | 'b' | null;
}

// "Side by side" table. higherWins: null = no highlight, true = more is better, false = less is better
export function sideBySide(a: OfferResult, b: OfferResult): TableRow[] {
  const row = (label: string, va: number, vb: number, higherWins: boolean | null, bold = false): TableRow => ({
    label,
    a: va,
    b: vb,
    bold,
    best: higherWins === null || Math.abs(va - vb) < 1 ? null : va > vb === higherWins ? 'a' : 'b',
  });
  return [
    row('Fixed pay', a.fixed, b.fixed, null),
    row('Variable + bonus', a.extra, b.extra, null),
    row('Income tax (on fixed)', a.tax, b.tax, false),
    row('In-hand from fixed', a.inhand, b.inhand, true, true),
    row('Year-1 total in-hand', a.year1, b.year1, true, true),
  ];
}

// CTC → in-hand estimate, ported from designs/SalaryDesktop.dc.html.
// Assumes basic = 50% of CTC, PF at 12% of basic, gratuity at 4.81% of basic and ₹2,400 professional tax.
// Runs on the server (first render) and in the browser (slider, regime toggle).

export type Regime = 'new' | 'old';

export interface SalaryBreakdown {
  ctc: number;
  erPF: number;
  grat: number;
  gross: number;
  eePF: number;
  pt: number;
  tax: number;
  inhand: number;
}

type Slab = [cap: number, rate: number];

function slabTax(x: number, slabs: Slab[]): number {
  let tax = 0;
  let prev = 0;
  for (const [cap, rate] of slabs) {
    if (x > prev) tax += (Math.min(x, cap) - prev) * rate;
    prev = cap;
  }
  return tax;
}

/** New-regime income tax (incl. 4% cess) on a gross salary in ₹ */
export function newTax(gross: number): number {
  const taxable = Math.max(0, gross - 75000);
  if (taxable <= 1200000) return 0;
  let tax = slabTax(taxable, [
    [400000, 0],
    [800000, 0.05],
    [1200000, 0.1],
    [1600000, 0.15],
    [2000000, 0.2],
    [2400000, 0.25],
    [Infinity, 0.3],
  ]);
  // Marginal relief just above the ₹12L rebate line
  tax = Math.min(tax, taxable - 1200000);
  if (taxable > 5000000) tax *= 1.1;
  return tax * 1.04;
}

function oldTax(gross: number, eePF: number, pt: number): number {
  return oldTaxOnTaxable(Math.max(0, gross - 50000 - pt - Math.min(150000, eePF)));
}

function oldTaxOnTaxable(taxable: number): number {
  if (taxable <= 500000) return 0;
  let tax = slabTax(taxable, [
    [250000, 0],
    [500000, 0.05],
    [1000000, 0.2],
    [Infinity, 0.3],
  ]);
  if (taxable > 5000000) tax *= 1.1;
  return tax * 1.04;
}

/** @param lakhs CTC in lakhs per year (12 = ₹12,00,000) */
export function calcSalary(lakhs: number, regime: Regime): SalaryBreakdown {
  const ctc = lakhs * 100000;
  const basic = ctc * 0.5;
  const erPF = basic * 0.12;
  const grat = basic * 0.0481;
  const gross = ctc - erPF - grat;
  const eePF = basic * 0.12;
  const pt = 2400;
  const tax = regime === 'old' ? oldTax(gross, eePF, pt) : newTax(gross);
  return { ctc, erPF, grat, gross, eePF, pt, tax, inhand: gross - eePF - pt - tax };
}

/** Slider stops in lakhs: ₹2L–20L in 0.5L steps, then 1L steps to 50L, then 2L steps to ₹1Cr */
export const CTC_STEPS: number[] = (() => {
  const a: number[] = [];
  for (let x = 2; x <= 20; x += 0.5) a.push(x);
  for (let x = 21; x <= 50; x++) a.push(x);
  for (let x = 52; x <= 100; x += 2) a.push(x);
  return a;
})();

export function stepIndexOf(lakhs: number): number {
  let best = 0;
  for (let i = 1; i < CTC_STEPS.length; i++) {
    if (Math.abs(CTC_STEPS[i] - lakhs) < Math.abs(CTC_STEPS[best] - lakhs)) best = i;
  }
  return best;
}

export function taxExplainer(regime: Regime): string {
  return regime === 'new'
    ? 'Under the new regime, income up to ₹12L (after a ₹75,000 standard deduction) pays zero tax thanks to a rebate. Above that, slabs start at 5% and climb slowly.'
    : 'The old regime has steeper slabs but lets you subtract things like 80C investments (your PF counts) and HRA. Worth it mainly if you have big deductions.';
}

export interface FlowRow {
  id: string;
  label: string;
  sign: '₹' | '−' | '=';
  color: string;
  total?: boolean;
  explain: string;
  value: (b: SalaryBreakdown) => number;
}

// The "From CTC to your bank" rows, top to bottom. Values are signed: deductions are negative.
export const FLOW_ROWS: FlowRow[] = [
  { id: 'ctc', label: 'CTC', sign: '₹', color: '#FFB21E', value: (b) => b.ctc, explain: 'Cost to Company: everything your company spends on you in a year, including money you never see in your monthly salary.' },
  { id: 'erpf', label: 'Employer PF', sign: '−', color: '#B9A6FF', value: (b) => -b.erPF, explain: 'Your company puts 12% of your basic pay into your PF account. It’s still your money, just saved for later.' },
  { id: 'grat', label: 'Gratuity', sign: '−', color: '#D8C9A3', value: (b) => -b.grat, explain: 'A thank-you payout you get only if you stay 5+ years. It sits in your CTC but not in your monthly pay.' },
  { id: 'gross', label: 'Gross salary', sign: '=', color: '#FFD27A', total: true, value: (b) => b.gross, explain: 'Your salary before your own deductions. This is the number on top of your payslip.' },
  { id: 'eepf', label: 'Your PF', sign: '−', color: '#B9A6FF', value: (b) => -b.eePF, explain: '12% of your basic, saved in your name. It earns interest and you can withdraw it for big life stuff or when you leave.' },
  { id: 'pt', label: 'Professional tax', sign: '−', color: '#D8C9A3', value: (b) => -b.pt, explain: 'A small state tax, at most ₹2,500 a year. Some states don’t charge it at all.' },
  { id: 'tax', label: 'Income tax', sign: '−', color: '#FF6B5B', value: (b) => -b.tax, explain: '' },
  { id: 'inhand', label: 'In-hand (yearly)', sign: '=', color: '#2ED3A0', total: true, value: (b) => b.inhand, explain: 'What actually lands in your bank account over the year. Divide by 12 for your monthly salary.' },
];

export interface TaxInputs {
  basicPct: number;
  /** HRA received and rent paid, per month */
  hra: number;
  rent: number;
  /** Extra 80C on top of PF, health insurance (80D) and professional tax, per year */
  c80: number;
  d80: number;
  pt: number;
  metro: boolean;
}

/**
 * Old vs new regime yearly tax using the user's own deductions (Salary and tax details screen).
 * HRA exemption = least of HRA received, rent − 10% of basic, and 50% (metro) / 40% of basic.
 */
export function regimesWithDetails(lakhs: number, d: TaxInputs) {
  const ctc = lakhs * 100000;
  const basic = (ctc * d.basicPct) / 100;
  const gross = ctc - basic * 0.12 - basic * 0.0481;
  const hraExempt = Math.max(0, Math.min(d.hra * 12, d.rent * 12 - basic * 0.1, basic * (d.metro ? 0.5 : 0.4)));
  const c80Used = Math.min(150000, basic * 0.12 + d.c80);
  const d80Used = Math.min(25000, d.d80);
  const old = oldTaxOnTaxable(Math.max(0, gross - 50000 - d.pt - hraExempt - c80Used - d80Used));
  return { hraExempt, c80Used, oldTax: old, newTax: newTax(gross) };
}

/** Which regime puts more in hand, and by how much per month */
export function compareRegimes(lakhs: number) {
  const n = calcSalary(lakhs, 'new');
  const o = calcSalary(lakhs, 'old');
  const winner: Regime = n.inhand >= o.inhand ? 'new' : 'old';
  return { new: n, old: o, winner, monthlyGap: Math.abs(n.inhand - o.inhand) / 12 };
}

export function regimeLine(winner: Regime, monthlyGap: number, inr: (n: number) => string): string {
  if (monthlyGap < 1) return 'Both regimes land the same for you.';
  return `${winner === 'new' ? 'New regime' : 'Old regime'} puts ${inr(monthlyGap)} more in your account every month.`;
}

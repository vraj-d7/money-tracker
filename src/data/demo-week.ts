// Sample spends for "this week" (Mon 26 Oct – Sun 1 Nov), as if read from a statement scan.
export type SpendCategory = 'Food' | 'Travel' | 'Fun' | 'Other';

export const CATEGORY_COLORS: Record<SpendCategory, string> = {
  Food: '#FFB21E',
  Travel: '#5AB8FF',
  Fun: '#FF7EC8',
  Other: '#D8C9A3',
};

export interface Spend {
  what: string;
  category: SpendCategory;
  method: 'UPI' | 'Card' | 'Cash';
  amount: number;
}

export const WEEK = {
  range: 'Mon 26 Oct – Sun 1 Nov',
  shortRange: '26 Oct – 1 Nov',
  plan: 3840,
  days: [
    { label: 'Sun, 1 Nov', spends: [
      { what: 'Movie tickets', category: 'Fun', method: 'UPI', amount: 520 },
      { what: 'Dinner delivery', category: 'Food', method: 'UPI', amount: 340 },
    ] },
    { label: 'Sat, 31 Oct', spends: [
      { what: 'Metro card top-up', category: 'Travel', method: 'UPI', amount: 300 },
      { what: 'Groceries', category: 'Other', method: 'Card', amount: 640 },
      { what: 'Café with friends', category: 'Fun', method: 'UPI', amount: 460 },
    ] },
    { label: 'Thu, 29 Oct', spends: [
      { what: 'Lunch delivery', category: 'Food', method: 'UPI', amount: 280 },
      { what: 'Auto ride', category: 'Travel', method: 'UPI', amount: 320 },
    ] },
    { label: 'Mon, 26 Oct', spends: [
      { what: 'Breakfast + chai', category: 'Food', method: 'Cash', amount: 220 },
      { what: 'Phone accessories', category: 'Other', method: 'UPI', amount: 160 },
    ] },
  ] as { label: string; spends: Spend[] }[],
};

const ALL = WEEK.days.flatMap((d) => d.spends);

export const weekSpent = ALL.reduce((s, x) => s + x.amount, 0);

export const weekByCategory = (['Food', 'Travel', 'Fun', 'Other'] as SpendCategory[]).map((category) => ({
  category,
  amount: ALL.filter((x) => x.category === category).reduce((s, x) => s + x.amount, 0),
}));

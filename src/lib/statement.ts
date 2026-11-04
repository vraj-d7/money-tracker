// Understands bank statement text: finds the transaction rows, then the charges that repeat.
// Pure functions (no browser APIs) so they're easy to test. The PDF side is scripts/statement-read.ts.

/** One piece of text on a line, with its horizontal position (PDF points from the left edge) */
export interface Cell {
  x: number;
  w: number;
  text: string;
}

export interface Txn {
  /** YYYY-MM-DD */
  date: string;
  desc: string;
  amount: number;
  type: 'debit' | 'credit';
}

export interface FoundAutopay {
  id: string;
  label: string;
  monthly: number;
  note: string;
  flag?: boolean;
  why: string;
  where: string;
  /** Usually worth keeping (bills, investments, loans, rent) */
  keep?: boolean;
  /** YYYY-MM-DD of the latest charge */
  lastCharged?: string;
}

// ---------- Dates and amounts ----------

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

const pad = (n: number) => String(n).padStart(2, '0');
const fullYear = (y: number) => (y < 100 ? 2000 + y : y);

/** "05/10/2026", "05-10-26", "05.10.2026", "05 Oct 2026", "05-Oct-26", "2026-10-05" → "2026-10-05" */
export function parseDate(s: string): string | null {
  const t = s.trim();
  let m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
  if (m) {
    const d = +m[1], mo = +m[2], y = fullYear(+m[3]);
    return valid(y, mo, d);
  }
  m = t.match(/^(\d{1,2})[\s-]([A-Za-z]{3,4})[a-z]*[\s,-]+(\d{2}|\d{4})$/);
  if (m && MONTHS[m[2].toLowerCase()]) return valid(fullYear(+m[3]), MONTHS[m[2].toLowerCase()], +m[1]);
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return valid(+m[1], +m[2], +m[3]);
  return null;
}

function valid(y: number, mo: number, d: number): string | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return null;
  return `${y}-${pad(mo)}-${pad(d)}`;
}

/** "1,23,456.78", "₹ 999.00", "450.00 Cr", "-120.50" → { value, side } */
export function parseAmount(s: string): { value: number; side?: 'debit' | 'credit' } | null {
  const m = s
    .trim()
    .replace(/^(₹|rs\.?|inr)\s*/i, '')
    .match(/^(-)?([\d,]+\.\d{2})\s*(cr|dr)?\.?$/i);
  if (!m) return null;
  const value = parseFloat(m[2].replace(/,/g, ''));
  if (!isFinite(value)) return null;
  const tag = m[3]?.toLowerCase();
  return { value, side: tag === 'cr' ? 'credit' : tag === 'dr' ? 'debit' : m[1] ? 'debit' : undefined };
}

// ---------- Transaction rows ----------

type Column = 'debit' | 'credit' | 'balance' | 'amount';

/** Finds the column headings ("Withdrawal", "Deposit", "Balance"…) and where they sit */
function readHeader(cells: Cell[]): Map<Column, number> | null {
  const cols = new Map<Column, number>();
  for (const c of cells) {
    const t = c.text.toLowerCase();
    const right = c.x + c.w;
    if (/withdraw|debit|\bdr\b|paid out/.test(t)) cols.set('debit', right);
    else if (/deposit|credit|\bcr\b|paid in/.test(t)) cols.set('credit', right);
    else if (/balance/.test(t)) cols.set('balance', right);
    else if (/^(txn |transaction )?amount/.test(t)) cols.set('amount', right);
  }
  const hasDate = cells.some((c) => /date/i.test(c.text));
  return hasDate && cols.has('balance') && (cols.has('debit') || cols.has('amount')) ? cols : null;
}

/** Which heading an amount sits under, by its right edge (numbers are right-aligned) */
function nearestColumn(cell: Cell, cols: Map<Column, number>): Column {
  let best: Column = 'amount';
  let gap = Infinity;
  for (const [col, right] of cols) {
    const g = Math.abs(cell.x + cell.w - right);
    if (g < gap) {
      gap = g;
      best = col;
    }
  }
  return best;
}

const REF_NO = /^[A-Z]{0,4}\d{4,}$/i;
const CREDIT_WORDS =/salary|\bsal\b|refund|reversal|interest|cashback|\bcr\b|credited|dividend/i;
const NOISE_LINE = /opening balance|closing balance|page \d+|statement of account|generated on|^total\b|carried forward|brought forward/i;

/**
 * Turns the lines of a statement (each a list of cells, left to right) into transactions.
 * Works out money in vs out from the column headings, a Cr/Dr tag, or the running balance.
 */
export function parseTransactions(lines: Cell[][]): Txn[] {
  const out: (Txn & { balance?: number })[] = [];
  let cols: Map<Column, number> | null = null;
  let prevBalance: number | undefined;

  for (const line of lines) {
    if (!line.length) continue;
    const header = readHeader(line);
    if (header) {
      cols = header;
      continue;
    }
    const whole = line.map((c) => c.text).join(' ');
    const opening = /opening balance/i.test(whole) ? line.map((c) => parseAmount(c.text)).filter(Boolean).pop() : null;
    if (opening) prevBalance = opening.value;

    // A row starts with a date in its first or second cell (some banks put a serial number first)
    const dateIdx = line.slice(0, 2).findIndex((c) => parseDate(c.text));
    if (dateIdx === -1 || NOISE_LINE.test(whole)) {
      // A line with no date continues the previous row's description
      const last = out[out.length - 1];
      const words = line.filter((c) => !parseAmount(c.text)).map((c) => c.text).join(' ').trim();
      if (last && words && !NOISE_LINE.test(whole) && !readHeader(line) && last.desc.length < 120) last.desc += ' ' + words;
      continue;
    }

    const date = parseDate(line[dateIdx].text)!;
    const amounts: { cell: Cell; value: number; side?: 'debit' | 'credit' }[] = [];
    const words: string[] = [];
    let tag: 'debit' | 'credit' | undefined;
    for (const c of line.slice(dateIdx + 1)) {
      const a = parseAmount(c.text);
      if (a) amounts.push({ cell: c, ...a });
      else if (/^(cr|dr)\.?$/i.test(c.text.trim())) tag = /^cr/i.test(c.text.trim()) ? 'credit' : 'debit';
      // Skip value dates and bare reference numbers; keep the words that say who it was
      else if (!parseDate(c.text) && !REF_NO.test(c.text.trim())) words.push(c.text);
    }
    if (!amounts.length) continue;

    let amount: number | undefined;
    let type: 'debit' | 'credit' | undefined;
    let balance: number | undefined;

    if (cols) {
      for (const a of amounts) {
        const col = nearestColumn(a.cell, cols);
        if (col === 'balance') balance = a.value;
        else if (col === 'debit' && a.value > 0) [amount, type] = [a.value, 'debit'];
        else if (col === 'credit' && a.value > 0) [amount, type] = [a.value, 'credit'];
        else if (col === 'amount') [amount, type] = [a.value, a.side ?? tag];
      }
    } else {
      // No headings found: the last number is the balance when there are two or more
      if (amounts.length >= 2) balance = amounts[amounts.length - 1].value;
      const a = amounts.length >= 2 ? amounts[amounts.length - 2] : amounts[0];
      [amount, type] = [a.value, a.side ?? tag];
    }
    if (amount === undefined || amount <= 0) continue;

    // Still unsure which way the money went: the running balance tells us
    if (!type && balance !== undefined && prevBalance !== undefined) {
      if (Math.abs(prevBalance - amount - balance) < 0.02) type = 'debit';
      else if (Math.abs(prevBalance + amount - balance) < 0.02) type = 'credit';
    }
    const desc = words.join(' ').replace(/\s+/g, ' ').trim();
    if (!type) type = CREDIT_WORDS.test(desc) ? 'credit' : 'debit';
    if (balance !== undefined) prevBalance = balance;
    out.push({ date, desc, amount: Math.round(amount * 100) / 100, type, balance });
  }
  return out.map(({ balance: _b, ...t }) => ({ ...t, desc: t.desc.slice(0, 140) }));
}

// ---------- Who the money went to ----------

interface Known {
  match: RegExp;
  label: string;
  where: string;
  /** Usually worth keeping (bills, investments, loans) */
  keep?: boolean;
}

const KNOWN: Known[] = [
  { match: /netflix/i, label: 'Netflix', where: 'Netflix → Account → Cancel membership' },
  { match: /spotify/i, label: 'Spotify', where: 'Spotify → Account → Manage your plan' },
  { match: /jio\s?hotstar|hotstar/i, label: 'JioHotstar', where: 'the JioHotstar app → My Space → Subscription' },
  { match: /prime\s?video|amazon\s?prime|primevideo/i, label: 'Amazon Prime', where: 'Amazon → Your Account → Prime membership' },
  { match: /youtube|google\s?\*?youtube/i, label: 'YouTube Premium', where: 'YouTube → Purchases and memberships' },
  { match: /google\s?one|google\s?storage/i, label: 'Google One', where: 'the Google One app → Settings → Cancel membership' },
  { match: /google\s?play|play\s?store/i, label: 'Google Play subscription', where: 'Play Store → Payments & subscriptions → Subscriptions' },
  { match: /apple|itunes|icloud/i, label: 'Apple subscription', where: 'iPhone Settings → your name → Subscriptions' },
  { match: /sony\s?liv|sonyliv/i, label: 'SonyLIV', where: 'the SonyLIV app → Account → Subscription' },
  { match: /zee5/i, label: 'ZEE5', where: 'the ZEE5 app → My Account → Subscriptions' },
  { match: /swiggy\s?one/i, label: 'Swiggy One', where: 'Swiggy → Account → Swiggy One' },
  { match: /zomato\s?(gold|pro)/i, label: 'Zomato Gold', where: 'Zomato → Profile → Gold membership' },
  { match: /cult\.?fit|cultfit|curefit/i, label: 'cult.fit', where: 'the cult.fit app → Profile → Memberships' },
  { match: /linkedin/i, label: 'LinkedIn Premium', where: 'LinkedIn → Me → Premium features → Cancel' },
  { match: /chatgpt|openai/i, label: 'ChatGPT', where: 'ChatGPT → Settings → Subscription' },
  { match: /claude|anthropic/i, label: 'Claude', where: 'Claude → Settings → Billing' },
  { match: /adobe/i, label: 'Adobe', where: 'adobe.com → Plans and payment' },
  { match: /microsoft|xbox|office\s?365/i, label: 'Microsoft subscription', where: 'account.microsoft.com → Services & subscriptions' },
  { match: /audible/i, label: 'Audible', where: 'Audible website → Account details → Cancel membership' },
  { match: /\bjio\b|reliance\s?jio/i, label: 'Jio', where: 'the MyJio app', keep: true },
  { match: /airtel/i, label: 'Airtel', where: 'the Airtel Thanks app', keep: true },
  { match: /vodafone|\bvi\b|vodaidea/i, label: 'Vi', where: 'the Vi app', keep: true },
  { match: /act\s?fibernet|hathway|excitel|broadband/i, label: 'Broadband', where: 'your broadband provider’s app', keep: true },
  { match: /\blic\b|insurance|policybazaar|hdfc\s?life|icici\s?pru|star\s?health/i, label: 'Insurance', where: 'your insurer’s app or website', keep: true },
  { match: /mutual\s?fund|\bsip\b|zerodha|groww|kuvera|coin\b|\bbse\b|\bamc\b/i, label: 'SIP / mutual fund', where: 'your investing app', keep: true },
  { match: /\bemi\b|loan|bajaj\s?fin/i, label: 'Loan EMI', where: 'your lender’s app', keep: true },
  { match: /\brent\b|landlord|nobroker|housing\.com/i, label: 'Rent', where: 'your landlord', keep: true },
  // Everyday brands: mainly so spends get a clean name (a one-off order isn't an autopay)
  ...[
    'Swiggy', 'Zomato', 'Blinkit', 'Zepto', 'BigBasket', 'Dominos', 'Uber', 'Rapido', 'IRCTC', 'BookMyShow', 'Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Nykaa',
  ].map((label) => ({ match: new RegExp(label, 'i'), label, where: `the ${label} app` })),
  { match: /\bola\b|olacabs/i, label: 'Ola', where: 'the Ola app' },
];

const MANDATE = /\bnach\b|\bach\b|e-?mandate|mandate|autopay|auto\s?pay|\bsi\b|standing instruction|recurring/i;
const STOP = new Set([
  'upi', 'neft', 'imps', 'rtgs', 'ach', 'nach', 'pos', 'ecom', 'txn', 'ref', 'payment', 'to', 'from', 'by', 'for', 'the', 'and',
  'mandate', 'autopay', 'debit', 'credit', 'dr', 'cr', 'bil', 'onl', 'inb', 'mb', 'vps', 'ipay', 'paid', 'via', 'pvt', 'ltd',
  'limited', 'private', 'india', 'payu', 'razorpay', 'billdesk', 'cashfree', 'ccavenue', 'paytm', 'phonepe', 'gpay', 'okaxis',
  'okhdfcbank', 'okicici', 'oksbi', 'ybl', 'ibl', 'axl', 'sbi', 'hdfc', 'icici', 'axis', 'kotak', 'bank', 'collect', 'request',
  'subscription', 'monthly', 'charges', 'renewal', 'trf', 'transfer',
]);

/** A stable "who" for a transaction: a known brand, or the first two meaningful words */
export function merchantOf(desc: string): { key: string; label: string; known?: Known } {
  const known = KNOWN.find((k) => k.match.test(desc));
  if (known) return { key: known.label.toLowerCase(), label: known.label, known };
  const words = desc
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w, i, all) => w.length >= 3 && !STOP.has(w) && all.indexOf(w) === i);
  const key = words.slice(0, 2).join(' ');
  const label = key.replace(/\b\w/g, (c) => c.toUpperCase());
  return { key, label };
}

// ---------- Charges that repeat ----------

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayMonth = (iso: string) => `${+iso.slice(8, 10)} ${SHORT_MONTHS[+iso.slice(5, 7) - 1]}`;
const monthName = (iso: string) => SHORT_MONTHS[+iso.slice(5, 7) - 1];
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

/**
 * Debits that look like subscriptions or autopays: the same payee in two or more different months
 * at a similar amount, or anything marked as a mandate/autopay. Biggest first.
 */
export function findAutopays(txns: Txn[]): FoundAutopay[] {
  const groups = new Map<string, { label: string; known?: Known; items: Txn[]; mandate: boolean }>();
  for (const t of txns) {
    if (t.type !== 'debit') continue;
    const m = merchantOf(t.desc);
    if (!m.key) continue;
    const g = groups.get(m.key) ?? { label: m.label, known: m.known, items: [], mandate: false };
    g.items.push(t);
    g.mandate ||= MANDATE.test(t.desc);
    groups.set(m.key, g);
  }

  const found: FoundAutopay[] = [];
  for (const [key, g] of groups) {
    const items = [...g.items].sort((a, b) => a.date.localeCompare(b.date));
    const months = new Set(items.map((t) => t.date.slice(0, 7)));
    const mid = median(items.map((t) => t.amount));
    // A subscription charges (almost) the same amount each time; everyday spends at one shop vary a lot
    const same = items.filter((t) => Math.abs(t.amount - mid) <= Math.max(5, mid * 0.05));
    const sameMonths = new Set(same.map((t) => t.date.slice(0, 7)));
    // …and only once or twice a month (rides and food orders are many small, frequent payments)
    const repeats = sameMonths.size >= 2 && same.length <= sameMonths.size + 1 && items.length <= months.size * 2;
    if (!repeats && !(g.mandate && items.length <= 3)) continue;

    // Once it's clearly a subscription, nearby amounts count too, so a price rise shows up
    const pool = repeats ? items.filter((t) => Math.abs(t.amount - mid) <= mid * 0.4) : items;
    const last = pool[pool.length - 1];
    const prev = pool[pool.length - 2];
    const rise = prev ? Math.round(last.amount - prev.amount) : 0;
    const keep = g.known?.keep;

    let note = `Monthly · last charged ${dayMonth(last.date)}`;
    let why = `It came out of your account in ${months.size} ${months.size === 1 ? 'month' : 'different months'}.`;
    let flag = false;
    if (rise >= 10) {
      note = `Price went up ₹${rise} in ${monthName(last.date)}`;
      why = `The price went up ₹${rise} in ${monthName(last.date)}.`;
      flag = true;
    } else if (!repeats) {
      note = `Autopay set up · charged ${dayMonth(last.date)}`;
      why = 'An autopay mandate is set up for this. It can keep charging until you cancel it.';
      flag = true;
    } else if (keep) {
      note = `Monthly · usually worth keeping`;
    }

    found.push({
      id: key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'autopay',
      label: g.label,
      monthly: Math.round(last.amount),
      note,
      flag: flag || undefined,
      why,
      where: g.known?.where ?? `the ${g.label} app or website, or your UPI app’s Autopay list`,
      keep: keep || undefined,
      lastCharged: last.date,
    });
  }
  return found.sort((a, b) => b.monthly - a.monthly).slice(0, 20);
}

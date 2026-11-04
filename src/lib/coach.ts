// Handy's built-in replies, in each coach voice, using the user's own numbers. Stand-in until the coach
// is backed by a real AI service: a question is matched to an intent by keywords.
import type { HandyMood } from './handy';

export type CoachMode = 'hype' | 'honest' | 'mom';

export const COACH_MODES: { id: CoachMode; label: string; mood: HandyMood }[] = [
  { id: 'hype', label: 'Hype', mood: 'cheer' },
  { id: 'honest', label: 'Honest', mood: 'happy' },
  { id: 'mom', label: 'Mom', mood: 'sus' },
];

export type Intent = 'hello' | 'where' | 'afford' | 'salary' | 'sip' | 'pf' | 'save' | 'fun' | 'help-save' | 'thanks' | 'fallback';

/** What Handy knows about this user, worked out from their profile, plan and last statement */
export interface CoachFacts {
  name: string;
  inhand: number;
  /** Monthly amounts from the jar split */
  funJar: number;
  sipJar: number;
  /** % of take-home going to SIP and emergency jars */
  savePct: number;
  daysLeft: number;
  payday: string;
  /** Latest week from a scanned statement; null until there is one */
  week: { title: string; spent: number; plan: number; top: string; topAmount: number } | null;
}

/** The thing being asked about, carried across messages */
export interface AffordAsk {
  item: string;
  price?: number;
}

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
const days = (n: number) => (n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`);
const the = (item: string) => (item === 'it' ? 'it' : `the ${item}`);

/** Months of fun jar needed for a price, at least 1 */
export function monthsOfFun(price: number, funJar: number): number {
  return funJar > 0 ? Math.max(1, Math.ceil(price / funJar)) : Infinity;
}

function affordText(ask: AffordAsk, f: CoachFacts, mode: CoachMode): string {
  const item = the(ask.item);
  if (!ask.price) {
    return {
      hype: `Ooh, ${item}! Love the ambition. How much does it cost? Type something like ₹80,000.`,
      honest: `I can work that out. How much does ${item} cost? Type something like ₹80,000.`,
      mom: `Pehle daam batao, beta. Kitne ka hai ${item}? Likho jaise ₹80,000.`,
    }[mode];
  }
  const price = inr(ask.price);
  if (f.funJar <= 0) {
    return {
      hype: `${price} for ${item}! Your plan has no fun money yet, so open Edit plan and make some room.`,
      honest: `${price} for ${item}, but your plan leaves nothing in the fun jar. Change your jars in Edit plan first.`,
      mom: `${price}?! Fun jar mein kuch hai hi nahi. Pehle plan theek karo.`,
    }[mode];
  }
  const months = monthsOfFun(ask.price, f.funJar);
  if (months === 1) {
    return {
      hype: `Yes! At ${price}, ${item} fits inside your ${inr(f.funJar)} monthly fun jar. Go get it, guilt-free!`,
      honest: `Yes, if your fun jar hasn’t been spent this month: ${price} fits inside your ${inr(f.funJar)} monthly fun money.`,
      mom: `${price}? Theek hai, fun jar mein ${inr(f.funJar)} hai. Par pehle dekh lo, sach mein chahiye?`,
    }[mode];
  }
  return {
    hype: `${item === 'it' ? 'It' : 'The ' + ask.item} is yours in about ${months} months! ${price} over ${months} months of your ${inr(f.funJar)} fun jar. Start now and it’s guilt-free.`,
    honest: `Not from one month’s fun money. ${price} is about ${months} months of your ${inr(f.funJar)} fun jar. Save towards it, or wait and buy it without touching your savings.`,
    mom: `${price}?! Beta, yeh ${months} mahine ka fun jar hai. Thoda ruko, jodo, phir lena. Udhaar mat lena.`,
  }[mode];
}

function helpSaveText(ask: AffordAsk | null, f: CoachFacts, mode: CoachMode): string {
  if (!ask?.price) {
    return {
      hype: 'Let’s do it! What are we saving for, and how much? Try “Can I afford a bike for ₹80,000?”',
      honest: 'Tell me what it is and the price first. Try “Can I afford a bike for ₹80,000?”',
      mom: 'Kiske liye bachana hai? Pehle batao: “Can I afford a bike for ₹80,000?”',
    }[mode];
  }
  const months = monthsOfFun(ask.price, f.funJar);
  if (!isFinite(months)) return affordText(ask, f, mode);
  const perMonth = inr(ask.price / months);
  const price = inr(ask.price);
  return {
    hype: `Let’s goooo! ${price} over ${months} ${months === 1 ? 'month' : 'months'} is ${perMonth} a month from your fun jar. Add it as a goal in Plan & goals!`,
    honest: `Make it a goal: ${price} over ${months} ${months === 1 ? 'month' : 'months'} is ${perMonth} a month, which fits your fun jar. Add it in Plan & goals.`,
    mom: `Theek hai, goal bana lo. ${perMonth} mahina, ${months} mahine. Plan & goals mein daal do. Aur bahar khana kam.`,
  }[mode];
}

/** The reply text for an intent, in the chosen voice, with this user's numbers */
export function replyText(intent: Intent, mode: CoachMode, f: CoachFacts, ask: AffordAsk | null = null): string {
  switch (intent) {
    case 'hello': {
      const name = f.name ? ` ${f.name}` : '';
      return {
        hype: `Hey${name}! Ask me anything about your money. Can you afford something? Where did it go? I’ve got you.`,
        honest: `Hi${name}. Ask me about your salary, spends, SIPs, PF, or whether you can afford something.`,
        mom: `Aa gaye${name}? Khana khaya? Chalo, paise ke baare mein poocho.`,
      }[mode];
    }
    case 'where': {
      if (!f.week) {
        return {
          hype: 'I can’t see your spends yet! Scan a bank statement in Autopay scan and I’ll tell you exactly where it went.',
          honest: 'I can’t see your spending yet. Scan a bank statement in Autopay scan and I can tell you.',
          mom: 'Mujhe kaise pata hoga, statement toh dikhao! Autopay scan mein daalo.',
        }[mode];
      }
      const w = f.week;
      const left = w.plan - w.spent;
      const status = left >= 0 ? `${inr(left)} under plan` : `${inr(-left)} over plan`;
      return {
        hype: `${w.title}: ${inr(w.spent)} spent, ${status}! ${w.top} was the big one at ${inr(w.topAmount)}.`,
        honest: `${w.title}: ${inr(w.spent)} of your ${inr(w.plan)} plan, so ${status}. Biggest category: ${w.top}, ${inr(w.topAmount)}. Rent, SIPs and bills aren’t counted here.`,
        mom: `${w.top} pe ${inr(w.topAmount)}?! ${w.title} mein kul ${inr(w.spent)} gaye, ${status}. Hisaab se, beta.`,
      }[mode];
    }
    case 'afford':
      return affordText(ask ?? { item: 'it' }, f, mode);
    case 'help-save':
      return helpSaveText(ask, f, mode);
    case 'salary':
      return {
        hype: `About ${inr(f.inhand)} lands in your account ${days(f.daysLeft)}, on ${f.payday}. Salary aa rahi hai!`,
        honest: `Your take-home is about ${inr(f.inhand)} a month. Next payday: ${f.payday}, ${days(f.daysLeft)}. See Salary for the full breakdown.`,
        mom: `${f.payday} ko ${inr(f.inhand)} aayenge. Aate hi ghar pe phone karna.`,
      }[mode];
    case 'sip':
      return {
        hype: `Future-you is already proud! Your SIP jar sets aside ${inr(f.sipJar)} a month. Put it in a direct index fund, dated right after payday, and let compounding work.`,
        honest: `Your SIP jar is ${inr(f.sipJar)} a month. A direct, low-cost index fund dated 2–3 days after payday is a common way to start. See Start my first SIP in your plan.`,
        mom: `Finally! ${inr(f.sipJar)} ka jar hai tumhara. Salary ke do din baad ka SIP lagao. Bas bandh mat karna.`,
      }[mode];
    case 'pf':
      return {
        hype: 'PF is free money, basically! 12% of your basic goes in, your company adds the same, and it earns about 8% a year. Silent wealth mode.',
        honest: 'PF (Provident Fund) takes 12% of your basic pay each month and your employer adds a matching amount. It earns about 8% a year and is for retirement, though you can withdraw for big needs.',
        mom: 'Woh kat-ta nahi, bachta hai! 12% tumhara, 12% company ka, aur byaaj bhi milta hai. Retirement ke liye. Haath mat lagana.',
      }[mode];
    case 'save':
      return {
        hype: `Your plan saves ${f.savePct}% of your pay: SIP plus emergency fund. ${f.savePct >= 20 ? 'That’s top-tier!' : 'Let’s nudge it to 20%!'}`,
        honest: `A common target is 20% of take-home. Your SIP and emergency jars come to ${f.savePct}%${f.savePct >= 20 ? ', so you’re there' : ', a little under that'}. Next step: 3 months of expenses saved.`,
        mom: `${f.savePct}% bacha rahe ho. ${f.savePct >= 20 ? 'Shabaash.' : 'Thoda aur bachao, 20% tak.'} Delivery wala app kam kholo.`,
      }[mode];
    case 'fun':
      return {
        hype: `Your fun jar is ${inr(f.funJar)} a month. Main-character budget! Next top-up on ${f.payday}.`,
        honest: `Your fun jar is ${inr(f.funJar)} a month, about ${inr(f.funJar / 30)} a day. It fills again on ${f.payday}.`,
        mom: `${inr(f.funJar)} hai fun ke liye, poore mahine ka. Hisaab se.`,
      }[mode];
    case 'thanks':
      return {
        hype: 'Anytime, legend! I’m here whenever money gets confusing.',
        honest: 'You’re welcome. Ask me anything about your salary, spends or savings.',
        mom: 'Arre, thank you kya. Khana khaya?',
      }[mode];
    case 'fallback':
      return {
        hype: 'Great question! I can’t answer that one yet, but I’m learning fast. Try asking about your salary, spends, PF or saving.',
        honest: 'I can’t answer that one yet. For now I know about your salary, spends, PF, SIPs, saving goals and what you can afford.',
        mom: 'Yeh toh mujhe bhi nahi pata, beta. Salary, kharcha, PF ya bachat ke baare mein poocho.',
      }[mode];
  }
}

// Keyword rules, checked in order
const RULES: [Intent, RegExp][] = [
  ['help-save', /help me save|save for it/i],
  ['afford', /afford|\bbuy\b|purchase|can i get|\b(phone|laptop|bike|car|scooter|iphone)\b/i],
  ['where', /where.*(salary|money)|spend|spent|\bgo(ne)?\b/i],
  ['sip', /\bsip\b|mutual fund|invest/i],
  ['pf', /\bpf\b|provident|epf/i],
  ['save', /how much.*save|saving/i],
  ['fun', /fun jar|fun money/i],
  ['salary', /salary|in-?hand|take-?home|payday/i],
  ['thanks', /thank|thx|shukriya|dhanyavaad/i],
];

export function matchIntent(question: string): Intent {
  return RULES.find(([, re]) => re.test(question))?.[0] ?? 'fallback';
}

const AMOUNT = /(?:₹|\brs\.?|\binr)\s*(\d[\d,]*(?:\.\d+)?)\s*(k|lakhs?|lacs?|l|cr|crores?)?\b|\b(\d[\d,]*(?:\.\d+)?)\s*(k|lakhs?|lacs?|l|cr|crores?|rupees|rs)\b|\b(\d{1,3}(?:,\d{2,3})+|\d{3,})\b/i;

/** "₹1.2 lakh", "80k", "12,000", "Rs 500" → rupees */
export function parseAmount(text: string): number | undefined {
  const m = text.match(AMOUNT);
  if (!m) return undefined;
  const value = parseFloat((m[1] ?? m[3] ?? m[5]).replace(/,/g, ''));
  const unit = (m[2] ?? m[4] ?? '').toLowerCase();
  const scale = unit === 'k' ? 1e3 : /^(l|lac|lakh)/.test(unit) ? 1e5 : /^cr/.test(unit) ? 1e7 : 1;
  const rupees = value * scale;
  return rupees > 0 ? rupees : undefined;
}

/** What's being bought and for how much: "Can I buy a bike for 80k?" → { item: 'bike', price: 80000 } */
export function parseAfford(question: string): AffordAsk {
  const rest = question.replace(AMOUNT, ' ');
  const after = rest.match(/\b(?:afford|buy|purchase|get)\s+(?:to\s+buy\s+)?(?:(?:a|an|the|this|that|my|new|second[- ]hand|used)\s+)*([a-z][a-z -]*)/i)?.[1];
  const keyword = rest.match(/\b(iphone|phone|laptop|bike|scooter|car)\b/i)?.[1];
  const words = (after ?? keyword ?? '')
    .toLowerCase()
    .split(/\b(?:for|at|worth|of|under|now|today|tomorrow|this|next|on|with|in|from|if|or|and)\b/)[0]
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(' ');
  return { item: words || 'it', price: parseAmount(question) };
}

export const COACH_CHIPS = ['Where did my money go?', 'How much should I save?', 'Show my fun jar', 'Thanks!'];

// Handy's built-in replies, in each coach voice. Stand-in until the coach is backed by a real AI service:
// a question is matched to an intent by keywords, and the intent's reply is shown in the chosen voice.
import type { HandyMood } from './handy';

export type CoachMode = 'hype' | 'honest' | 'mom';

export const COACH_MODES: { id: CoachMode; label: string; mood: HandyMood }[] = [
  { id: 'hype', label: 'Hype', mood: 'cheer' },
  { id: 'honest', label: 'Honest', mood: 'happy' },
  { id: 'mom', label: 'Mom', mood: 'sus' },
];

export type Intent = 'where' | 'afford' | 'sip' | 'pf' | 'save' | 'fun' | 'help-save' | 'thanks' | 'fallback';

/** Optional card shown under a reply */
export type Attachment = 'spend-chart' | 'afford-card';

export const REPLIES: Record<Intent, { text: Record<CoachMode, string>; attach?: Attachment }> = {
  where: {
    attach: 'spend-chart',
    text: {
      hype: 'You crushed it! ₹21,395 still in the bank with 5 days to go. Rent, home and SIP paid first. Legend behaviour.',
      honest: '₹64,000 spent so far. Rent and money home are 43% of your in-hand. Food is ₹9,400, your biggest flexible spend.',
      mom: '₹9,400 on food?! Itna toh shaadi mein khilate hain. Baaki sab theek hai, ghar paise bheje, good. ₹21,395 bacha hai, sambhal ke.',
    },
  },
  afford: {
    attach: 'afford-card',
    text: {
      hype: 'Ooh, new-phone energy! You’ve got ₹6,609 in fun money. Wait 5 days for payday, use next month’s fun jar, and it’s yours guilt-free.',
      honest: 'Not today without touching savings. Fun money left: ₹6,609, so you’re ₹5,391 short. Wait for payday on the 7th, or split it over two months.',
      mom: 'Beta, phone toh abhi chal raha hai na? ₹5,391 kam hai. Payday tak ruk jao. Aur purana phone mummy ko de dena.',
    },
  },
  sip: {
    text: {
      hype: 'Future-you is already proud! Start with ₹2,000 a month in a direct index fund, set it for the 10th, and let compounding do the heavy lifting.',
      honest: 'Start small: ₹2,000 a month into a direct, low-cost index fund, dated 2–3 days after payday. Your SIP jar already has ₹8,540 set aside.',
      mom: 'Finally! Sharma ji ka beta toh 22 se SIP kar raha hai. ₹2,000 se shuru karo, 10 tareekh ko. Bas bandh mat karna.',
    },
  },
  pf: {
    text: {
      hype: 'PF is free money, basically! 12% of your basic goes in, your company adds the same, and it earns about 8% a year. Silent wealth mode.',
      honest: 'PF (Provident Fund) takes 12% of your basic pay each month and your employer adds a matching amount. It earns about 8% a year and is for retirement, though you can withdraw for big needs.',
      mom: 'Woh kat-ta nahi, bachta hai! 12% tumhara, 12% company ka, aur byaaj bhi milta hai. Retirement ke liye. Haath mat lagana.',
    },
  },
  save: {
    text: {
      hype: 'Your plan already saves 20%: SIP plus emergency fund. That’s top-tier for a first job. Keep the streak going!',
      honest: 'A good start is 20% of in-hand. Your jars put 10% into SIP and 10% into your emergency fund, so you’re there. Next step: 3 months of expenses saved.',
      mom: '20% bachao, baaki kharch karo. Tumhare jars mein already 20% hai, shabaash. Bas delivery wala app kam kholo.',
    },
  },
  fun: {
    text: {
      hype: 'Your fun jar has ₹6,609 for the next 5 days. Main-character budget!',
      honest: 'Fun jar: ₹6,609 left until payday on the 7th. That’s about ₹1,300 a day if you spread it out.',
      mom: '₹6,609 hai fun ke liye. Paanch din hai. Hisaab se.',
    },
  },
  'help-save': {
    text: {
      hype: 'Let’s goooo! Make it a goal: ₹12,000 over 2 months is ₹6,000 a month from your fun jar. Phone secured.',
      honest: 'Make it a goal: ₹12,000 over 2 months is ₹6,000 a month. That fits inside your fun jar if you skip a couple of dinners out.',
      mom: 'Theek hai, goal bana lo. ₹6,000 mahina, do mahine. Aur haan, bahar khana kam.',
    },
  },
  thanks: {
    text: {
      hype: 'Anytime, legend! I’m here whenever money gets confusing.',
      honest: 'You’re welcome. Ask me anything about your salary, spends or savings.',
      mom: 'Arre, thank you kya. Khana khaya?',
    },
  },
  fallback: {
    text: {
      hype: 'Great question! I can’t answer that one yet, but I’m learning fast. Try asking about your salary, spends, PF or saving.',
      honest: 'I can’t answer that one yet. For now I know about your salary, spends, PF, SIPs and saving goals.',
      mom: 'Yeh toh mujhe bhi nahi pata, beta. Salary, kharcha, PF ya bachat ke baare mein poocho.',
    },
  },
};

// Keyword rules, checked in order
const RULES: [Intent, RegExp][] = [
  ['help-save', /help me save|save for it/i],
  ['afford', /afford|buy|phone|laptop/i],
  ['where', /where.*(salary|money)|spend|spent|go(ne)?\b/i],
  ['sip', /\bsip\b|mutual fund|invest/i],
  ['pf', /\bpf\b|provident|epf/i],
  ['save', /how much.*save|saving/i],
  ['fun', /fun jar|fun money/i],
  ['thanks', /thank|thx|shukriya|dhanyavaad/i],
];

export function matchIntent(question: string): Intent {
  return RULES.find(([, re]) => re.test(question))?.[0] ?? 'fallback';
}

// Data behind the chat cards and the "What Handy can see" panel (sample numbers from the designs)
export const coachData = {
  daysToPayday: 5,
  payday: 'Sat, 7 Nov',
  inhand: 85395,
  spent: 64000,
  left: 21395,
  spend: [
    { label: 'Rent', amount: 25000, color: '#5AB8FF' },
    { label: 'Sent home', amount: 12000, color: '#FFB21E' },
    { label: 'Food + other', amount: 15800, color: '#D8C9A3' },
    { label: 'Fun', amount: 6200, color: '#FF7EC8' },
    { label: 'SIP', amount: 5000, color: '#2ED3A0' },
  ],
  afford: { price: 12000, funLeft: 6609 },
  jars: [
    { label: 'Emergency fund', amount: 42000, color: '#9BE8CE' },
    { label: 'Fun jar', amount: 6609, color: '#FF7EC8' },
    { label: 'Goa trip', amount: 23000, color: '#2ED3A0' },
  ],
  chips: ['Help me save for it', 'Show my fun jar', 'Thanks!'],
};

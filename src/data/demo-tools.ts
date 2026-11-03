// Sample data for the Autopays, ITR and PF screens, from the designs.

export interface Subscription {
  id: string;
  label: string;
  monthly: number;
  note: string;
  /** Show the note in red: something looks off */
  flag?: boolean;
  /** Why to cancel, and where (for the cancel guide) */
  why: string;
  where: string;
}

// What a statement scan "finds" until real statement reading exists
export const SCAN_RESULTS: Subscription[] = [
  { id: 'gym', label: 'Gym pass', monthly: 999, note: 'Not used in 41 days', flag: true, why: 'Not used in 41 days. Renews on 14 Nov.', where: 'the gym’s app or front desk' },
  { id: 'ott', label: 'OTT streaming', monthly: 149, note: 'Monthly · last charged 4 Oct', why: 'You watched 2 shows last month.', where: 'the app’s account settings' },
  { id: 'music', label: 'Music app', monthly: 119, note: 'Price went up ₹20 in Sep', flag: true, why: 'The price went up ₹20 in September.', where: 'the app’s account settings' },
  { id: 'cloud', label: 'Cloud storage', monthly: 130, note: 'Using 3% of 100 GB', flag: true, why: 'You’re using 3% of what you pay for.', where: 'your phone’s storage settings' },
  { id: 'food', label: 'Food pass', monthly: 99, note: '2 orders last month', why: 'Only 2 orders last month; the pass saved you ₹40.', where: 'the delivery app’s membership page' },
  { id: 'news', label: 'News app', monthly: 79, note: 'Free trial turned paid', flag: true, why: 'A free trial that quietly turned paid.', where: 'the app’s account settings' },
  { id: 'phone', label: 'Phone plan', monthly: 299, note: 'Monthly · keep this one', why: 'Your phone plan.', where: 'your telecom app' },
];

/** Picked for cancelling before the user changes anything */
export const DEFAULT_CUT = ['gym', 'news', 'food'];

export const SCAN_STATUS = [
  'Reading 214 transactions…',
  'Spotting things that repeat…',
  'Checking for sneaky price hikes…',
  'Adding it all up…',
];

export const ITR_STEPS = [
  { title: 'Get Form 16 from HR', body: 'Employers usually share it by mid-June. Ask HR if it hasn’t landed in your inbox.' },
  { title: 'Download AIS and Form 26AS', body: 'From the income-tax portal. Check the tax your employer cut (TDS) matches Form 16.' },
  { title: 'Pick your tax regime', body: 'We already compared both for you.', regimeTag: true },
  { title: 'Choose ITR-1 (Sahaj)', body: 'The simple form for salary, one house and interest income, if your total income is up to ₹50L.' },
  { title: 'Check the pre-filled details', body: 'Most numbers come pre-filled. Match them to Form 16 and add any bank interest.' },
  { title: 'Submit and e-verify', body: 'Verify within 30 days, quickest with an Aadhaar OTP. Not verified means not filed.' },
];

export const FORM16_LINES = [
  { code: '1', label: 'Gross salary', amount: 1099140, explain: 'Your salary before any deductions, as per section 17(1). Your CTC minus the employer’s PF and gratuity.' },
  { code: '2', label: 'Exempt allowances', amount: 0, explain: 'Allowances like HRA that are partly tax-free under section 10. Under the new regime most of these don’t apply.' },
  { code: '4(a)', label: 'Standard deduction', amount: 75000, explain: 'A flat amount everyone with a salary gets to subtract. No receipts needed.' },
  { code: '6', label: 'Income from salary', amount: 1021740, explain: 'Salary after the standard deduction and professional tax. This is what tax is worked out on.' },
  { code: '12', label: 'Tax on total income', amount: 0, explain: 'Below ₹12L under the new regime, a rebate (section 87A) brings your tax to zero.' },
  { code: '19', label: 'Tax deducted (TDS)', amount: 0, explain: 'Tax your employer already cut and paid for you. If this is more than what you owe, you get a refund.' },
];

export const PF = {
  balance: 88420,
  parts: { you: 48000, employer: 38000, interest: 2420 },
  missing: { month: 'September 2026', short: 'Sep', yourShare: 6000, employerShare: 6000, dueBy: '15 Oct 2026', uan: '1009 8765 4321' },
  passbook: [
    { month: 'Jul', you: 6000, er: 4750, eps: 1250, note: 'Deposited 12 Aug', kind: 'ok' },
    { month: 'Aug', you: 6000, er: 4750, eps: 1250, note: 'Deposited 14 Sep', kind: 'ok' },
    { month: 'Sep', you: 6000, er: 4750, eps: 1250, note: 'Missing · due 15 Oct', kind: 'miss', sortedNote: 'Deposited 3 Nov' },
    { month: 'Oct', you: 0, er: 0, eps: 0, note: 'Due by 15 Nov', kind: 'wait' },
  ],
  terms: {
    you: { label: 'You', text: 'Your 12% of basic pay, cut from your salary every month. It’s saved in your name and earns interest.' },
    er: { label: 'Employer', text: 'Your company’s share. Of its 12%, ₹1,250 goes to pension and the rest (₹4,750 here) to your PF.' },
    eps: { label: 'Pension', text: 'EPS, the Employees’ Pension Scheme. You can’t withdraw it like PF; it pays a pension later or a lump sum if you leave early.' },
  },
  move: [
    { title: 'Your UAN stays the same', body: 'UAN is your lifelong PF number. Give it to your new employer; don’t let them create a new one.' },
    { title: 'Check your KYC', body: 'Aadhaar, PAN and bank account should be linked and verified on the EPFO member portal.' },
    { title: 'Request the transfer online', body: 'On the member portal, choose “One member, one EPF account” and pick your old account.' },
    { title: 'Employer approves', body: 'Your old or new employer approves it online. Nudge HR if it sits for more than a week.' },
    { title: 'Track until it lands', body: 'We’ll watch your passbook and ping you when the money shows up.' },
  ],
};

export const PF_TRANSFER_STEPS = [
  { title: 'Log in to the EPFO member portal', body: 'Use your UAN and password. First time? Activate your UAN with your Aadhaar-linked mobile.' },
  { title: 'Check KYC is verified', body: 'Under Manage → KYC, Aadhaar, PAN and bank should all show “verified”. Fix this first or the transfer gets stuck.' },
  { title: 'Make sure your exit date is filled', body: 'Your old employer marks it. If it’s blank, ask their HR to update the “date of exit”.' },
  { title: 'Request the transfer', body: 'Online Services → One member, one EPF account. Pick the old account and choose which employer approves it.' },
  { title: 'Sign and send Form 13 if asked', body: 'Some requests need the PDF signed and given to the approving employer within 10 days.' },
  { title: 'Track it until it lands', body: 'Track Claim Status shows progress. Handy checks your passbook and tells you when the money arrives.' },
];

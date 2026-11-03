// One place for every URL in the app, so links don't drift as screens get built.
export const routes = {
  landing: '/',
  auth: '/login',
  emailAuth: '/login/email',
  onboarding: '/welcome',
  firstDay: '/app/first-day',
  paydaySettings: '/app/me/payday',
  sunday: '/app/sunday',
  legal: '/legal',
  home: '/app',
  week: '/app/week',
  salary: '/app/salary',
  offer: '/app/offer',
  plan: '/app/plan',
  planEdit: '/app/plan/edit',
  newGoal: '/app/plan/new-goal',
  startSip: '/app/plan/sip',
  coach: '/app/coach',
  scan: '/app/scan',
  cancelGuide: '/app/scan/cancel',
  itr: '/app/itr',
  pf: '/app/pf',
  pfTransfer: '/app/pf/transfer',
  hrEmail: '/app/pf/email-hr',
  notifications: '/app/notifications',
  me: '/app/me',
  editProfile: '/app/me/edit',
  salaryDetails: '/app/me/salary-details',
  help: '/app/me/help',
  logout: '/app/me/logout',
  deleteStatements: '/app/me/delete-statements',
  deleteAccount: '/app/me/delete-account',
  paywall: '/app/coach-plan',
  share: '/app/share',
  brand: '/brand',
} as const;

export type AppSection =
  | 'home'
  | 'salary'
  | 'offer'
  | 'plan'
  | 'coach'
  | 'scan'
  | 'itr'
  | 'pf'
  | 'notifications'
  | 'me';

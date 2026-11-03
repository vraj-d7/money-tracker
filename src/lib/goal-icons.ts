// 24×24 stroke icons for goals, from designs/NewGoal.dc.html
export const GOAL_ICONS = {
  phone: { label: 'Phone', d: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2' },
  plane: { label: 'Trip', d: 'M3 13l18-8-6 16-3-7zM12 14l-9-1' },
  gift: { label: 'Gift', d: 'M4 10h16v4H4zM6 14h12v7H6zM12 10v11M12 10c-2-4-6-4-6-1s6 1 6 1zM12 10c2-4 6-4 6-1s-6 1-6 1z' },
  home: { label: 'Home', d: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' },
  shield: { label: 'Safety net', d: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z' },
  sprout: { label: 'Investing', d: 'M12 21v-9M12 12c0-4 3-7 8-7 0 4-3 7-8 7zM12 14c0-3-2.5-5-7-5 0 3 2.5 5 7 5z' },
} as const;

export type GoalIcon = keyof typeof GOAL_ICONS;

export const CATEGORIES = [
  'Sort',
  'Set in Order',
  'Shine',
  'Standardize',
  'Sustain',
  'Safety',
] as const

export type Category = (typeof CATEGORIES)[number]

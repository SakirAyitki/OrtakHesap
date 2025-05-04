export const EXPENSE_CATEGORIES = [
  'Yemek',
  'Market',
  'Ulaşım',
  'Eğlence',
  'Alışveriş',
  'Kira',
  'Faturalar',
  'Sağlık',
  'Eğitim',
  'Diğer',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]; 
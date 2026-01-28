// constants.ts
import { FinancialYear, Quarter, MonthIndex } from './types';

export const FINANCIAL_YEARS: FinancialYear[] = [
  { label: 'FY 25-26', startYear: 2025 },
  { label: 'FY 26-27', startYear: 2026 },
  { label: 'FY 27-28', startYear: 2027 },
];

export const QUARTERS: Quarter[] = [
  { label: 'Q1', months: [4, 5, 6] },
  { label: 'Q2', months: [7, 8, 9] },
  { label: 'Q3', months: [10, 11, 12] },
  { label: 'Q4', months: [1, 2, 3] },
];

export const MONTH_LABELS: Record<MonthIndex, string> = {
  4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10', 11: '11', 12: '12', 1: '1', 2: '2', 3: '3'
};

export const SPECIAL_VALUES = ['Deadline NM', 'Deadline AM'];

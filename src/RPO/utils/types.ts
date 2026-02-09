// types.ts
export type MonthIndex = 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 1 | 2 | 3;

export interface FinancialYear {
  label: string;
  startYear: number;
}

export interface Quarter {
  label: string;
  months: MonthIndex[];
}

export type CellValue = string; // A, B, C, Deadline NM, Deadline AM, etc.

export interface PlanData {
  // Key format: "regId|year|month" -> Value
  // We'll store a list of strings per cell to allow multiple models in one month
  regulationCells: Record<string, string[]>;
  regOrder?: string[];
  customModels?: string[];
  customRegulations?: string[];
  layout?: {
    colWidths: Record<string, number>;
    rowHeights: Record<string, number>;
  };
}

export interface Draft {
  id: string;
  name: string;
  updatedAt: number;
  data: PlanData;
}

export type ViewMode = 'Regulation' | 'Model';
export type NavTab = 'Final' | 'Draft';

export type FinalPlanResponse = {
  publishedAt: number;
  publishedBy?: string;
  data: PlanData;
  missingByReg?: Record<string, string[]>;
};

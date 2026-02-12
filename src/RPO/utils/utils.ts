// utils.ts
import { PlanData } from './types';
import { SPECIAL_VALUES } from './constants';

export const getCellKey = (rowId: string, year: string, month: number) => `${rowId}|${year}|${month}`;

export const parseCellKey = (key: string) => {
  const [rowId, year, month] = key.split('|');
  return { rowId, year, month: parseInt(month, 10) };
};

// Helper: value is a model if it exists and isn't a special keyword
export const isModel = (val: string) => val && val.trim().length > 0 && !SPECIAL_VALUES.includes(val);

/**
 * Generates a unique color for a given string (Model/Regulation).
 * Uses a hash to pick from a set of visually distinct colors.
 */
export const stringToColor = (str: string): string => {
  if (!str) return "#E5E7EB"; // gray-200
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use HSL for better uniqueness:
  // Hue: 0-360 based on hash
  // Saturation: 70-90% (vibrant)
  // Lightness: 80-90% (pastel/light for readability with dark text)

  const h = Math.abs(hash) % 360;
  const s = 70 + (Math.abs(hash >> 8) % 20);
  const l = 80 + (Math.abs(hash >> 16) % 10);

  return `hsl(${h}, ${s}%, ${l}%)`;
};


/**
 * Derives the Model-centric table data from the Regulation-centric table data
 * ✅ Only includes models that exist in the backend model list (allowedModels)
 */
export const deriveModelData = (
  planData: PlanData,
  allowedModels: string[] = []
): Record<string, string[]> => {
  const modelData: Record<string, string[]> = {};

  // Normalize allowed models (case-sensitive by default; change to .toLowerCase() if you want case-insensitive)
  const allowed = new Set(
    (allowedModels || [])
      .map((m) => (m || "").trim())
      .filter(Boolean)
  );

  const cells = planData?.regulationCells || {};

  Object.entries(cells).forEach(([key, values]) => {
    if (!Array.isArray(values)) return;

    const { rowId: regId, year, month } = parseCellKey(key);

    values.forEach((val) => {
      const v = String(val || "").trim();
      if (!isModel(v)) return;

      // only count if in user-created list
      if (!allowed.has(v)) return;

      const modelKey = getCellKey(v, year, month);
      if (!modelData[modelKey]) modelData[modelKey] = [];
      if (!modelData[modelKey].includes(regId)) modelData[modelKey].push(regId);
    });
  });

  return modelData;
};

/**
 * ✅ Compliance: for each regulation, check which backend models are missing
 */
export const validatePlanning = (
  planData: PlanData,
  regulations: string[],
  allModels: string[]
) => {
  const missingByReg: Record<string, string[]> = {};

  if (!allModels || allModels.length === 0) return missingByReg;

  const allowed = new Set(allModels.map(m => m.trim()));

  regulations.forEach(regId => {
    const plannedModelsInReg = new Set<string>();

    Object.entries(planData.regulationCells).forEach(([key, values]) => {
      if (key.startsWith(`${regId}|`)) {
        values.forEach(v => {
          const vv = (v || "").trim();
          if (isModel(vv) && allowed.has(vv)) plannedModelsInReg.add(vv);
        });
      }
    });

    const missing = allModels.filter(m => !plannedModelsInReg.has(m));
    if (missing.length > 0) missingByReg[regId] = missing;
  });

  return missingByReg;
};

/**
 * Calculates current and next 2 financial years based on current date.
 * If current month is Jan-Mar (1-3), we are in the FY starting prev year.
 * If current month is Apr-Dec (4-12), we are in the FY starting current year.
 */
export const getCurrentFinancialYears = (): { label: string; startYear: number }[] => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // If Jan-Mar, the FY started in previous year
  // Example: Feb 2026 -> FY 25-26 (Start 2025)
  // Example: May 2026 -> FY 26-27 (Start 2026)
  let baseStartYear = currentMonth < 4 ? currentYear - 1 : currentYear;

  const years = [];
  for (let i = 0; i < 3; i++) {
    const y = baseStartYear + i;
    const shortCurrent = y % 100;
    const shortNext = (y + 1) % 100;
    years.push({
      label: `FY ${shortCurrent}-${shortNext}`,
      startYear: y
    });
  }
  return years;
};

export const getUniqueModels = (planData: PlanData): string[] => {
  const models = new Set<string>();
  Object.values(planData.regulationCells).forEach(values => {
    values.forEach(v => {
      if (isModel(v)) models.add(v.trim());
    });
  });
  return Array.from(models).sort();
};

export const getDraftRegList = (plan: PlanData): string[] => {
  const regsFromCells = new Set<string>();
  Object.keys(plan.regulationCells || {}).forEach((k) => {
    const [reg] = k.split("|");
    if (reg) regsFromCells.add(reg);
  });

  const order = plan.regOrder || []; // include all ordered regs
  const missing = Array.from(regsFromCells).filter((r) => !order.includes(r)).sort();

  return [...order, ...missing];
};

export const getDraftModelList = (plan: PlanData): string[] => {
  const modelsFromCells = new Set<string>();
  Object.values(plan.regulationCells || {}).forEach((vals) => {
    (vals || []).forEach(v => {
      if (isModel(v)) modelsFromCells.add(v.trim());
    });
  });

  const order = plan.modelOrder || [];
  const missing = Array.from(modelsFromCells).filter((m) => !order.includes(m)).sort();

  return [...order, ...missing];
};

export const normalizeRegOrder = (plan: PlanData): PlanData => {
  const list = getDraftRegList(plan);
  return { ...plan, regOrder: list };
};

export const normalizeModelOrder = (plan: PlanData): PlanData => {
  const list = getDraftModelList(plan);
  return { ...plan, modelOrder: list };
};

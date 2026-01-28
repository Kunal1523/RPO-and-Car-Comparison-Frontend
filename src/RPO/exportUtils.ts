import * as XLSX from 'xlsx';
import { FinancialYear, ViewMode } from './utils/types';
import { QUARTERS, MONTH_LABELS } from './utils/constants';
import { getCellKey } from './utils/utils';

export const exportToExcel = (
  viewMode: ViewMode,
  rowIds: string[],
  cellData: Record<string, string[]>,
  financialYears: FinancialYear[],
  filename: string,
  layout?: { colWidths: Record<string, number>; rowHeights: Record<string, number> }
) => {
  const wb = XLSX.utils.book_new();
  const wsData: any[][] = [];

  // --- Header Construction ---

  // Row 1: Main Headers
  const row1 = [viewMode === 'Regulation' ? 'Regulation' : 'Model'];
  // Row 2: Quarters
  const row2 = [''];
  // Row 3: Months
  const row3 = [''];

  // Merges configuration
  const merges: XLSX.Range[] = [
    { s: { r: 0, c: 0 }, e: { r: 2, c: 0 } }, // The "Regulation/Model" column spanning 3 rows
  ];

  let colIndex = 1;

  financialYears.forEach((fy) => {
    // Year Header
    row1.push(fy.label);
    merges.push({ s: { r: 0, c: colIndex }, e: { r: 0, c: colIndex + 11 } }); // Span 12 months (4 quarters * 3 months)

    // Fill empty cells for the merged year block
    for (let k = 0; k < 11; k++) row1.push('');

    QUARTERS.forEach((q) => {
      // Quarter Header
      row2.push(q.label);
      merges.push({ s: { r: 1, c: colIndex }, e: { r: 1, c: colIndex + 2 } }); // Span 3 months

      // Fill empty cells for merged quarter
      for (let k = 0; k < 2; k++) row2.push('');

      q.months.forEach((m) => {
        // Month Header
        row3.push(MONTH_LABELS[m]);
        // Fill corresponding empty cells in upper rows? No, we just pushed/skipped.
        // Actually, in AOA, we rely on the value being in the top-left of the merge.
        // So we just push empty strings for the other cells in the merge range if we want "correct" array length, 
        // but for merges to work, the top-left cell must have the value.
        // My push logic above for Year/Quarter pushes the value then N empty strings. This is correct.

        colIndex++;
      });
    });
  });

  wsData.push(row1);
  wsData.push(row2);
  wsData.push(row3);

  // --- Data Rows ---
  rowIds.forEach((rowId) => {
    const row = [rowId];

    financialYears.forEach((fy) => {
      QUARTERS.forEach((q) => {
        q.months.forEach((m) => {
          const key = getCellKey(rowId, fy.label, m);
          const values = cellData[key] || [];
          row.push(values.join(', '));
        });
      });
    });

    wsData.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!merges'] = merges;

  // Auto-width attempt (basic)
  // Auto-width attempt (basic)
  const colWidths: XLSX.ColInfo[] = [];

  // First Col
  const firstColPx = layout?.colWidths['first-col'] || 180;
  // Convert pixels to character width approx (pixels / 7 is a rough estimate for Excel)
  colWidths.push({ wch: Math.round(firstColPx / 7) });

  financialYears.forEach((fy) => {
    QUARTERS.forEach((q) => {
      q.months.forEach((m) => {
        const key = `${fy.label}-${m}`;
        const wPx = layout?.colWidths[key] || 72; // default min width
        colWidths.push({ wch: Math.round(wPx / 7) });
      });
    });
  });

  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Planning');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

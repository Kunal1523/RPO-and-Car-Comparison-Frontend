import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

interface PricingData {
    variant_id: string;
    variant_name: string;
    ex_showroom_price: number;
    currency: string;
    fuel_type: string | null;
    engine_type: string | null;
    transmission_type: string | null;
    paint_type: string | null;
    edition: string | null;
}

interface CarExportData {
    brand: string;
    model: string;
    data: PricingData[];
}

interface DownloadExcelButtonProps {
    carsData: CarExportData[];
    fileName?: string;
    chartRef?: React.RefObject<HTMLDivElement | null>;
}

const DownloadExcelButton: React.FC<DownloadExcelButtonProps> = ({ carsData, fileName = 'Car_Comparison_Data.xlsx', chartRef }) => {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        if (carsData.length === 0 || carsData.every(c => c.data.length === 0)) {
            alert("No data to download. Please select vehicles and apply filters.");
            return;
        }

        setLoading(true);

        try {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Comparison Data');

            // --- Styled Header ---
            const headers = ['Car Model', 'Variant', 'Price (₹)', 'Fuel', 'Trans', 'Engine', 'Paint', 'Edition'];
            const headerRow = ws.addRow(headers);

            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
            headerRow.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF1E293B' } // Dark Slate
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });

            // --- Add Data ---
            carsData.forEach(car => {
                car.data.forEach(p => {
                    const row = ws.addRow([
                        `${car.brand} ${car.model}`,
                        p.variant_name,
                        p.ex_showroom_price,
                        p.fuel_type || 'N/A',
                        p.transmission_type || 'N/A',
                        p.engine_type || 'N/A',
                        p.paint_type || 'N/A',
                        p.edition || 'N/A'
                    ]);

                    // Format Price Cell
                    row.getCell(3).numFmt = '"₹"#,##0';
                    row.eachCell((cell) => {
                        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                    });
                });
            });

            // --- Auto-Width Columns ---
            ws.columns.forEach(column => {
                let maxLength = 0;
                column["eachCell"]!({ includeEmpty: true }, (cell) => {
                    const columnLength = cell.value ? cell.value.toString().length : 10;
                    if (columnLength > maxLength) {
                        maxLength = columnLength;
                    }
                });
                column.width = maxLength < 10 ? 10 : maxLength + 2;
            });

            // --- Capture Chart Image ---
            if (chartRef && chartRef.current) {
                try {
                    const canvas = await html2canvas(chartRef.current, { scale: 2 });
                    const imageBuffer = canvas.toDataURL('image/png');

                    // Add image to workbook
                    const imageId = wb.addImage({
                        base64: imageBuffer,
                        extension: 'png',
                    });

                    // Embed image next to data table (e.g., column J, row 2)
                    ws.addImage(imageId, {
                        tl: { col: 9, row: 1 },
                        ext: { width: 800, height: 500 }
                    });
                } catch (err) {
                    console.error("Failed to capture chart image", err);
                }
            }

            // --- Export ---
            const buffer = await wb.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), fileName);

        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to export Excel file.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold text-slate-500 hover:text-green-600 transition-colors disabled:opacity-50"
            title="Download Filtered Data + Chart"
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span className="hidden sm:inline">{loading ? 'Exporting...' : 'Download Excel'}</span>
        </button>
    );
};

export default DownloadExcelButton;

import React from 'react';
import { Download } from 'lucide-react';
import { utils, writeFile } from 'xlsx';

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
    // Add other fields if needed for export
}

interface CarExportData {
    brand: string;
    model: string;
    data: PricingData[];
}

interface DownloadExcelButtonProps {
    carsData: CarExportData[];
    fileName?: string;
}

const DownloadExcelButton: React.FC<DownloadExcelButtonProps> = ({ carsData, fileName = 'Car_Comparison_Data.xlsx' }) => {

    const handleDownload = () => {
        if (carsData.length === 0 || carsData.every(c => c.data.length === 0)) {
            alert("No data to download. Please select vehicles and apply filters.");
            return;
        }

        // 1. Prepare data for Excel
        // We want a format that is easy to chart: 
        // Row 1: Headers
        // Rows 2+: Data
        // We'll separate cars or put them in one list with a "Car Model" column?
        // One list is better for Pivot tables, but separate columns might be easier for some charts.
        // However, basic Scatter/Line charts often expect data in columns. 
        // Let's stick to a flat list format which is standard for Excel data sources.

        const rows = carsData.flatMap(car =>
            car.data.map(p => ({
                "Car Model": `${car.brand} ${car.model}`,
                "Variant": p.variant_name,
                "Price (₹)": p.ex_showroom_price,
                "Fuel Type": p.fuel_type || 'N/A',
                "Transmission": p.transmission_type || 'N/A',
                "Engine": p.engine_type || 'N/A',
                "Paint": p.paint_type,
                "Edition": p.edition
            }))
        );

        // 2. Create Workbook
        const wb = utils.book_new();
        const ws = utils.json_to_sheet(rows);

        // 3. Auto-width columns (basic heuristic)
        const colWidths = [
            { wch: 25 }, // Car Model
            { wch: 30 }, // Variant
            { wch: 15 }, // Price
            { wch: 15 }, // Fuel
            { wch: 15 }, // Trans
            { wch: 20 }, // Engine
            { wch: 15 }, // Paint
            { wch: 15 }  // Edition
        ];
        ws['!cols'] = colWidths;

        // 4. Append sheet
        utils.book_append_sheet(wb, ws, "Comparison Data");

        // 5. Download
        writeFile(wb, fileName);
    };

    return (
        <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold text-slate-500 hover:text-green-600 transition-colors"
            title="Download Filtered Data (Insert Chart in Excel manually)"
        >
            <Download size={16} />
            <span className="hidden sm:inline">Download Excel</span>
        </button>
    );
};

export default DownloadExcelButton;

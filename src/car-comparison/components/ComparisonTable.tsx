// // src/components/ComparisonTable.tsx
// import React, { useMemo, useState, useEffect } from 'react';
// import { ComparisonResponse, FeatureGroup, GroupedFeature } from '../types';
// import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

// interface ComparisonTableProps {
//   data: ComparisonResponse | null;
// }

// const ComparisonTable: React.FC<ComparisonTableProps> = ({ data }) => {
//   const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
//   const NO_INFO = 'No information Available';

//   const groups: FeatureGroup[] = useMemo(() => {
//     if (!data) return [];

//     const groupMap: Record<string, GroupedFeature[]> = {};
//     const priceGroup: GroupedFeature[] = [];
//     const additionalGroup: GroupedFeature[] = [];

//     const variants = data.columns.slice(1); // dynamic columns (N cars)

//     data.data.forEach((row) => {
//       const featureText = row.feature;
//       const values: { [key: string]: string } = {};

//       variants.forEach((v) => {
//         const val = row[v];
//         values[v] = val && String(val).trim() !== '' ? String(val) : NO_INFO;
//       });

//       const hasAnyInfo = Object.values(values).some((val) => val !== NO_INFO);
//       if (!hasAnyInfo) return;

//       const ftLower = featureText.trim().toLowerCase();

//       // Merge price/basics at top
//       if (ftLower.startsWith('price value') || ftLower.startsWith('variant launched')) {
//         priceGroup.push({ featureName: featureText, values });
//         return;
//       }

//       const separatorIndex = featureText.indexOf(' - ');
//       if (separatorIndex !== -1) {
//         const category = featureText.substring(0, separatorIndex).trim();
//         const featureName = featureText.substring(separatorIndex + 3).trim();

//         if (!groupMap[category]) groupMap[category] = [];
//         groupMap[category].push({ featureName, values });
//       } else {
//         additionalGroup.push({ featureName: featureText, values });
//       }
//     });

//     const result: FeatureGroup[] = [];

//     if (priceGroup.length > 0) {
//       result.push({ groupName: 'Price & Basic Info', items: priceGroup });
//     }

//     Object.keys(groupMap).forEach((key) => {
//       result.push({ groupName: key, items: groupMap[key] });
//     });

//     if (additionalGroup.length > 0) {
//       result.push({ groupName: 'Additional Features', items: additionalGroup });
//     }

//     return result;
//   }, [data]);

//   // ✅ useEffect (not useMemo) for setting state
//   useEffect(() => {
//     if (groups.length > 0) {
//       const initialOpenState: Record<string, boolean> = {};
//       groups.forEach((g) => (initialOpenState[g.groupName] = true));
//       setOpenGroups(initialOpenState);
//     }
//   }, [groups]);

//   const toggleGroup = (groupName: string) => {
//     setOpenGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
//   };

//   if (!data) {
//     return (
//       <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-white rounded-xl border-2 border-dashed border-slate-200 p-10">
//         <div className="bg-blue-100 p-4 rounded-full mb-4">
//           <AlertCircle size={40} className="text-blue-500" />
//         </div>
//         <h3 className="text-lg font-semibold text-slate-800">No comparison generated yet</h3>
//         <p className="mt-2 text-center max-w-sm text-sm">
//           Please select vehicles from the left panel and click &quot;Compare Now&quot; to view detailed comparison.
//         </p>
//       </div>
//     );
//   }

//   const variants = data.columns.slice(1);

//   // ✅ Dynamic grid columns (Feature + N vehicles)
//   const gridColsStyle: React.CSSProperties = {
//     gridTemplateColumns: `minmax(220px, 1.2fr) repeat(${variants.length}, minmax(220px, 1fr))`,
//   };

//   // Keep your existing header colors for first 4; rest repeat sky
//   const variantBg = (idx: number) => {
//     if (idx === 0) return 'bg-blue-600 text-white';
//     if (idx === 1) return 'bg-emerald-600 text-white';
//     if (idx === 2) return 'bg-violet-600 text-white';
//     return 'bg-sky-600 text-white';
//   };

//   return (
//     <div className="bg-white shadow-md rounded-2xl overflow-hidden border border-slate-200">
//       {/* Colourful header row */}
//       <div className="grid border-b border-slate-200" style={gridColsStyle}>
//         <div className="p-4 font-semibold uppercase tracking-[0.08em] text-xs md:text-sm flex items-center bg-slate-900 text-white">
//           Feature
//         </div>

//         {variants.map((v, idx) => (
//           <div
//             key={idx}
//             className={`p-4 font-semibold text-sm md:text-base border-l border-white flex items-center ${variantBg(idx)}`}
//             title={v}
//           >
//             <span className="truncate">{v}</span>
//           </div>
//         ))}
//       </div>

//       {/* Table Body */}
//       <div className="divide-y divide-slate-100">
//         {groups.map((group) => {
//           const isOpen = openGroups[group.groupName] ?? true;

//           return (
//             <div key={group.groupName} className="bg-white">
//               {/* Group Header */}
//               <button
//                 onClick={() => toggleGroup(group.groupName)}
//                 className="w-full flex items-center justify-between px-4 py-3 bg-sky-50 hover:bg-sky-100 transition-colors text-left focus:outline-none border-b border-slate-100"
//               >
//                 <span className="font-semibold text-slate-900 flex items-center gap-2 text-sm md:text-base">
//                   <span className="inline-block w-1.5 h-6 rounded-full bg-blue-500" />
//                   {group.groupName}
//                   <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
//                     {group.items.length} items
//                   </span>
//                 </span>

//                 {isOpen ? (
//                   <ChevronUp size={18} className="text-slate-500" />
//                 ) : (
//                   <ChevronDown size={18} className="text-slate-500" />
//                 )}
//               </button>

//               {/* Group Content */}
//               {isOpen && (
//                 <div className="divide-y divide-slate-50">
//                   {group.items.map((item, idx) => {
//                     const isPriceRow = item.featureName === 'Price Value';

//                     // detect if row differs across variants
//                     const variantValues = variants.map((v) => item.values[v]);
//                     const nonNoInfoValues = variantValues.filter((val) => val !== NO_INFO);
//                     const uniqueVals = Array.from(new Set(nonNoInfoValues));
//                     const isDifferent = uniqueVals.length > 1;

//                     const rowBgClasses = isPriceRow
//                       ? 'bg-green-100'
//                       : isDifferent
//                       ? 'bg-amber-50 hover:bg-amber-100'
//                       : 'hover:bg-slate-50';

//                     return (
//                       <div
//                         key={idx}
//                         className={`grid transition-colors ${rowBgClasses}`}
//                         style={gridColsStyle}
//                       >
//                         <div className="p-4 text-xs md:text-sm font-medium text-slate-700 border-r border-slate-100 flex items-center justify-between gap-2">
//                           <span>{item.featureName}</span>
//                           {isDifferent && !isPriceRow && (
//                             <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wide">
//                               Differs
//                             </span>
//                           )}
//                         </div>

//                         {variants.map((v, vIdx) => (
//                           <div
//                             key={vIdx}
//                             className={`p-4 text-xs md:text-sm border-l border-slate-100 flex items-center ${
//                               item.values[v] === NO_INFO ? 'text-slate-400 italic' : 'text-slate-900'
//                             } ${isPriceRow ? 'font-semibold text-base md:text-lg' : ''}`}
//                           >
//                             {item.values[v]}
//                           </div>
//                         ))}
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default ComparisonTable;






















// import React, { useMemo, useState, useEffect } from 'react';
// import { ChevronDown, ChevronUp, AlertCircle, Info, Download, Plus, Minus } from 'lucide-react';
// import * as XLSX from 'xlsx';

// // Types
// interface PriceDetail {
//   type: string;
//   currency: string;
//   ex_showroom_price: number;
//   price_display: string;
// }

// interface VariantPriceData {
//   variant_id: string;
//   variant_name: string;
//   prices: PriceDetail[];
//   avg_price: {
//     value: number;
//     display: string;
//   };
// }

// interface ComparisonResponse {
//   columns: string[];
//   data: Array<{ feature: string;[key: string]: any }>;
//   variant_pricing?: { [variantName: string]: VariantPriceData };
// }

// interface GroupedFeature {
//   featureName: string;
//   values: { [key: string]: string };
// }

// interface FeatureGroup {
//   groupName: string;
//   items: GroupedFeature[];
//   hasDifferences: boolean;
// }

// interface ComparisonTableProps {
//   data: ComparisonResponse | null;
// }

// // Price Hover Tooltip Component - Modal Style
// const PriceTooltip: React.FC<{ variantData: VariantPriceData; onClose: () => void }> = ({ variantData, onClose }) => {
//   return (
//     <>
//       {/* Backdrop */}
//       <div
//         className="fixed inset-0 bg-black bg-opacity-40 z-[9998]"
//         onClick={onClose}
//       />

//       {/* Modal */}
//       <div
//         className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-2xl w-[90%] max-w-[500px]"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Header */}
//         <div className="flex items-center justify-between p-4 text-white">
//           <div>
//             <h3 className="font-bold text-lg">{variantData.variant_name}</h3>
//             <p className="text-blue-100 text-xs mt-0.5">Full Pricing Details</p>
//           </div>
//           <button
//             onClick={onClose}
//             className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
//           >
//             <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
//               <path d="M15 5L5 15M5 5l10 10" />
//             </svg>
//           </button>
//         </div>

//         {/* Content */}
//         <div className="bg-white rounded-b-xl p-4">
//           {variantData.prices && variantData.prices.length > 0 ? (
//             <>
//               {/* Table Header */}
//               <div className="grid grid-cols-[2fr,1fr,1fr] gap-2 mb-2 pb-2 border-b border-slate-200">
//                 <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">TYPE</div>
//                 <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide text-right">PRICE</div>
//                 <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide text-right">Δ VS AVG</div>
//               </div>

//               {/* Price Rows */}
//               <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
//                 {variantData.prices.map((price, idx) => {
//                   // Calculate percentage difference from average
//                   const avgPrice = variantData.avg_price?.value || 0;
//                   const priceDiff = avgPrice > 0 ? ((price.ex_showroom_price - avgPrice) / avgPrice) * 100 : 0;
//                   const diffDisplay = Math.abs(priceDiff).toFixed(1);
//                   const isHigher = priceDiff > 0;

//                   return (
//                     <div key={idx} className="grid grid-cols-[2fr,1fr,1fr] gap-2 items-center py-2 px-2.5 bg-slate-50 rounded-md hover:bg-slate-100 transition-colors">
//                       <div className="text-xs font-medium text-slate-800 leading-tight">
//                         {price.type}
//                       </div>
//                       <div className="text-xs font-bold text-slate-900 text-right">
//                         {price.display}
//                       </div>
//                       <div className={`text-xs font-bold text-right flex items-center justify-end gap-0.5 ${isHigher ? 'text-red-600' : 'text-green-600'
//                         }`}>
//                         {isHigher ? '▲' : '▼'} {diffDisplay}%
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>

//               {/* Average Price Footer */}
//               {variantData.avg_price && variantData.prices.length > 1 && (
//                 <div className="mt-3 pt-3 border-t border-slate-200">
//                   <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 flex justify-between items-center">
//                     <span className="text-xs font-bold text-slate-800">Average Price</span>
//                     <span className="text-lg font-bold text-green-700">
//                       {variantData.avg_price.display}
//                     </span>
//                   </div>
//                 </div>
//               )}
//             </>
//           ) : (
//             <div className="text-slate-500 text-center py-6 text-xs">No pricing data available</div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// };

// const ComparisonTable: React.FC<ComparisonTableProps> = ({ data }) => {
//   const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
//   const [hoveredVariant, setHoveredVariant] = useState<string | null>(null);
//   const [openPriceModal, setOpenPriceModal] = useState<string | null>(null);

//   // 🔹 NEW — toggle differs-only
//   const [showDiffOnly, setShowDiffOnly] = useState(false);

//   const NO_INFO = 'No information Available';

//   // Helper
//   const getPricingKey = (columnName: string, variantPricing: { [key: string]: VariantPriceData }) => {
//     if (!variantPricing) return columnName;
//     if (variantPricing[columnName]) return columnName;

//     const parts = columnName.split(' - ');
//     if (parts.length > 1) {
//       const variantName = parts[parts.length - 1].trim();
//       if (variantPricing[variantName]) return variantName;
//     }

//     const matchingKey = Object.keys(variantPricing).find(key =>
//       variantPricing[key]?.variant_name && columnName.includes(variantPricing[key].variant_name)
//     );

//     return matchingKey || columnName;
//   };

//   const groups: FeatureGroup[] = useMemo(() => {
//     if (!data) return [];

//     const groupMap: Record<string, GroupedFeature[]> = {};
//     const priceGroup: GroupedFeature[] = [];
//     const additionalGroup: GroupedFeature[] = [];

//     const variants = data.columns.slice(1);

//     data.data.forEach((row) => {
//       const featureText = row.feature;
//       const ftLower = featureText.trim().toLowerCase();

//       const values: { [key: string]: string } = {};
//       const isPriceRow = ftLower === 'price value';

//       variants.forEach((v) => {
//         const val = row[v];

//         // Handle Price Value with nested pricing object
//         if (isPriceRow && typeof val === 'object' && val !== null && 'display' in val) {
//           values[v] = val.display;
//         } else if (typeof val === 'string') {
//           values[v] = val && val.trim() !== '' ? val : NO_INFO;
//         } else {
//           values[v] = NO_INFO;
//         }
//       });

//       const hasAnyInfo = Object.values(values).some((val) => val !== NO_INFO);
//       if (!hasAnyInfo) return;

//       // Add Price Value and Variant Launched to price group
//       if (isPriceRow || ftLower.startsWith('variant launched')) {
//         priceGroup.push({ featureName: featureText, values });
//         return;
//       }

//       const separatorIndex = featureText.indexOf(' - ');
//       if (separatorIndex !== -1) {
//         const category = featureText.substring(0, separatorIndex).trim();
//         const featureName = featureText.substring(separatorIndex + 3).trim();

//         if (!groupMap[category]) groupMap[category] = [];
//         groupMap[category].push({ featureName, values });
//       } else {
//         additionalGroup.push({ featureName: featureText, values });
//       }
//     });

//     const result: FeatureGroup[] = [];
//     if (priceGroup.length > 0) result.push({ groupName: 'Price & Basic Info', items: priceGroup, hasDifferences: true }); // Price group always considered relevant

//     Object.keys(groupMap).forEach((key) => {
//       const items = groupMap[key];
//       // Check if group has any differences
//       const hasDifferences = items.some(item => {
//         const variantValues = variants.map(v => item.values[v]);
//         const nonNoInfoValues = variantValues.filter(v => v !== NO_INFO);
//         const uniqueVals = new Set(nonNoInfoValues);
//         return uniqueVals.size > 1;
//       });

//       result.push({ groupName: key, items, hasDifferences });
//     });

//     if (additionalGroup.length > 0) {
//       const hasDifferences = additionalGroup.some(item => {
//         const variantValues = variants.map(v => item.values[v]);
//         const nonNoInfoValues = variantValues.filter(v => v !== NO_INFO);
//         const uniqueVals = new Set(nonNoInfoValues);
//         return uniqueVals.size > 1;
//       });
//       result.push({ groupName: 'Additional Features', items: additionalGroup, hasDifferences });
//     }

//     return result;
//   }, [data]);

//   // 🔹 DEFAULT — ALL CLOSED
//   useEffect(() => {
//     if (groups.length > 0) {
//       const s: Record<string, boolean> = {};
//       groups.forEach(g => s[g.groupName] = false);
//       setOpenGroups(s);
//     }
//   }, [groups]);

//   const toggleGroup = (groupName: string) =>
//     setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));

//   // 🔹 Excel Export Function
//   const exportToExcel = () => {
//     if (!data) return;

//     const variants = data.columns.slice(1);

//     // Prepare data for Excel
//     const excelData: any[] = [];

//     // Add header row
//     excelData.push(['Feature', ...variants]);

//     // Add all groups and their items
//     groups.forEach(group => {
//       // Add group header row
//       excelData.push([`${group.groupName}`, '', '', '']); // Empty cells for variant columns

//       // Add all items in the group (no filtering - include all rows)
//       group.items.forEach(item => {
//         const row = [item.featureName];
//         variants.forEach(v => {
//           row.push(item.values[v] || NO_INFO);
//         });
//         excelData.push(row);
//       });

//       // Add empty row between groups for readability
//       excelData.push([]);
//     });

//     // Create worksheet
//     const ws = XLSX.utils.aoa_to_sheet(excelData);

//     // Set column widths
//     const colWidths = [
//       { wch: 40 }, // Feature column
//       ...variants.map(() => ({ wch: 30 })) // Variant columns
//     ];
//     ws['!cols'] = colWidths;

//     // Style the header row (first row)
//     const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
//     for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
//       const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
//       if (!ws[cellAddress]) continue;
//       ws[cellAddress].s = {
//         font: { bold: true, color: { rgb: "FFFFFF" } },
//         fill: { fgColor: { rgb: "1E293B" } },
//         alignment: { horizontal: "center", vertical: "center" }
//       };
//     }

//     // Create workbook
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Comparison');

//     // Generate filename with selected variants
//     const variantNames = variants.map(v => v.split(' - ').pop()).join('_vs_');
//     const filename = `Comparison_${variantNames}_${new Date().toISOString().split('T')[0]}.xlsx`;

//     // Download
//     XLSX.writeFile(wb, filename);
//   };

//   if (!data) {
//     return (
//       <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-white rounded-xl border-2 border-dashed border-slate-200 p-10">
//         <div className="bg-blue-100 p-4 rounded-full mb-4">
//           <AlertCircle size={40} className="text-blue-500" />
//         </div>
//         <h3 className="text-lg font-semibold text-slate-800">No comparison generated yet</h3>
//         <p className="mt-2 text-center max-w-sm text-sm">
//           Please select vehicles from the left panel and click "Compare Now" to view detailed comparison.
//         </p>
//       </div>
//     );
//   }

//   const variants = data.columns.slice(1);

//   // 🔹 Responsive grid columns based on number of vehicles
//   const getGridColumns = () => {
//     if (variants.length <= 3) {
//       return `minmax(180px, 1fr) repeat(${variants.length}, minmax(180px, 1fr))`;
//     } else if (variants.length === 4) {
//       return `minmax(160px, 0.9fr) repeat(${variants.length}, minmax(160px, 1fr))`;
//     } else {
//       return `minmax(140px, 0.8fr) repeat(${variants.length}, minmax(140px, 1fr))`;
//     }
//   };

//   const gridColsStyle: React.CSSProperties = {
//     gridTemplateColumns: getGridColumns(),
//   };

//   const variantBg = (idx: number) => {
//     const colors = [
//       'bg-blue-600 text-white',
//       'bg-emerald-600 text-white',
//       'bg-violet-600 text-white',
//       'bg-orange-600 text-white',
//       'bg-sky-600 text-white'
//     ];
//     return colors[idx % colors.length];
//   };

//   // 🔹 Responsive font sizes
//   const getFontSize = () => {
//     if (variants.length <= 3) return 'text-sm';
//     if (variants.length === 4) return 'text-xs';
//     return 'text-[11px]';
//   };

//   const getHeaderFontSize = () => {
//     if (variants.length <= 3) return 'text-sm md:text-base';
//     if (variants.length === 4) return 'text-xs md:text-sm';
//     return 'text-[11px] md:text-xs';
//   };

//   return (
//     <div className="bg-white shadow-md rounded-2xl overflow-hidden border border-slate-200">

//       {/* 🔹 Differs Toggle & Download Button */}
//       <div className="flex items-center justify-between gap-4 px-4 py-3 border-b bg-gradient-to-r from-slate-50 to-blue-50">
//         <div className="flex items-center gap-2">
//           <input
//             type="checkbox"
//             checked={showDiffOnly}
//             onChange={() => setShowDiffOnly(prev => !prev)}
//             className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
//           />
//           <span className="text-sm font-medium text-slate-700">Show only differing rows</span>
//         </div>

//         <button
//           onClick={exportToExcel}
//           className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
//         >
//           <Download size={18} />
//           <span className="text-sm">Download Excel</span>
//         </button>
//       </div>

//       {/* 🔹 Horizontal scroll wrapper */}
//       <div className="overflow-x-auto w-full">

//         {/* Header row */}
//         <div className="grid border-b-2 border-slate-300" style={gridColsStyle}>
//           <div className={`p-3 font-semibold uppercase tracking-[0.08em] ${getFontSize()} flex items-center bg-slate-900 text-white border-r border-slate-700`}>
//             Feature
//           </div>

//           {variants.map((v, idx) => (
//             <div
//               key={idx}
//               className={`p-3 font-semibold ${getHeaderFontSize()} border-l border-white flex items-center ${variantBg(idx)}`}
//               title={v}
//             >
//               <span className="truncate">{v}</span>
//             </div>
//           ))}
//         </div>

//         {/* Table Body */}
//         <div className="divide-y divide-slate-200">
//           {groups.map((group) => {
//             const isOpen = openGroups[group.groupName] ?? false;

//             return (
//               <div key={group.groupName} className="bg-white">

//                 {/* Group Header */}
//                 <button
//                   onClick={() => toggleGroup(group.groupName)}
//                   disabled={showDiffOnly && !group.hasDifferences}
//                   className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors text-left border-b border-slate-200 ${showDiffOnly && !group.hasDifferences
//                     ? 'bg-slate-50 text-slate-400 cursor-default'
//                     : 'bg-sky-50 hover:bg-sky-100 text-slate-900'
//                     }`}
//                 >
//                   <span className={`font-semibold flex items-center gap-2 ${getFontSize()}`}>
//                     <span className={`inline-block w-1.5 h-5 rounded-full ${showDiffOnly && !group.hasDifferences ? 'bg-slate-300' : 'bg-blue-500'}`} />
//                     {group.groupName}
//                     {showDiffOnly && !group.hasDifferences && (
//                       <span className="ml-2 text-[10px] font-medium bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
//                         No Differences
//                       </span>
//                     )}
//                   </span>

//                   {isOpen && !(showDiffOnly && !group.hasDifferences) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
//                 </button>

//                 {/* Group Content */}
//                 {isOpen && (
//                   <div className="divide-y divide-slate-200">
//                     {group.items.map((item, idx) => {

//                       const isPriceRow = item.featureName.toLowerCase().trim() === 'price value';

//                       const variantValues = variants.map(v => item.values[v]);
//                       const nonNoInfoValues = variantValues.filter(v => v !== NO_INFO);
//                       const uniqueVals = Array.from(new Set(nonNoInfoValues));
//                       const isDifferent = uniqueVals.length > 1;

//                       // 🔹 filter when toggle enabled
//                       if (showDiffOnly && !isDifferent && !isPriceRow) return null;

//                       return (
//                         <div
//                           key={idx}
//                           className={`grid ${isDifferent && !isPriceRow ? 'bg-yellow-50' : ''}`}
//                           style={gridColsStyle}
//                         >

//                           <div className={`p-3 ${getFontSize()} font-medium text-slate-700 bg-slate-50 border-r border-slate-200 flex items-center justify-between gap-2`}>
//                             <span className={isPriceRow ? 'font-bold text-slate-900' : ''}>
//                               {item.featureName}
//                             </span>

//                             {isDifferent && !isPriceRow && (
//                               <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-800 border border-amber-300 whitespace-nowrap">
//                                 Differs
//                               </span>
//                             )}
//                           </div>

//                           {variants.map((v, vIdx) => {
//                             const hoverId = `${idx}-${vIdx}`;
//                             const hasPriceData = isPriceRow;

//                             // Get pricing data from the row value
//                             let variantPriceData = null;
//                             if (isPriceRow && data?.data) {
//                               const priceRow = data.data.find(r => r.feature.toLowerCase().trim() === 'price value');
//                               if (priceRow && priceRow[v] && typeof priceRow[v] === 'object' && 'pricing' in priceRow[v]) {
//                                 const pricingObj = priceRow[v].pricing;
//                                 variantPriceData = {
//                                   variant_id: '',
//                                   variant_name: v,
//                                   prices: pricingObj.prices || [],
//                                   avg_price: pricingObj.avg_price || { value: 0, display: '' }
//                                 };
//                               }
//                             }

//                             const priceFontSize = variants.length <= 3 ? 'text-base md:text-lg' : variants.length === 4 ? 'text-sm md:text-base' : 'text-xs md:text-sm';

//                             return (
//                               <div
//                                 key={vIdx}
//                                 className={`relative p-3 ${getFontSize()} border-l border-slate-200 ${item.values[v] === NO_INFO ? 'text-slate-400 italic' : 'text-slate-900'
//                                   } ${isPriceRow ? `font-bold ${priceFontSize} text-green-700` : ''}`}
//                               >
//                                 {isPriceRow && variantPriceData && variantPriceData.prices.length > 0 ? (
//                                   <>
//                                     <div
//                                       className="inline-flex items-center gap-1.5 cursor-pointer group hover:text-green-800"
//                                       onClick={() => setOpenPriceModal(hoverId)}
//                                     >
//                                       <span>{item.values[v]} <span className="text-xs text-slate-500 font-normal">(Avg)</span></span>
//                                       <Info size={14} className="text-blue-500 group-hover:text-blue-600" />
//                                     </div>

//                                     {/* Price Details Modal */}
//                                     {openPriceModal === hoverId && (
//                                       <PriceTooltip
//                                         variantData={variantPriceData}
//                                         onClose={() => setOpenPriceModal(null)}
//                                       />
//                                     )}
//                                   </>
//                                 ) : (
//                                   item.values[v]
//                                 )}
//                               </div>
//                             );
//                           })}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}

//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ComparisonTable;



































import React, { useMemo, useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Download, Plus, Minus, Loader2, Edit2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import TableSearch from './TableSearch';

import { ComparisonResponse, FeatureGroup, GroupedFeature, VariantPriceData, PriceDetail } from '../types';

interface ComparisonTableProps {
  data: ComparisonResponse | null;
}

const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight || !highlight.trim()) {
    return <>{text}</>;
  }
  // Escape special regex characters
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedHighlight})`, 'gi');

  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? <span key={i} className="bg-yellow-300 text-slate-900 font-bold rounded-sm px-0.5">{part}</span> : part
      )}
    </>
  );
};

const ComparisonTable: React.FC<ComparisonTableProps> = ({ data }) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [showDiffOnly, setShowDiffOnly] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hiddenVehicles, setHiddenVehicles] = useState<Set<number>>(new Set());
  const [isEditingEnabled, setIsEditingEnabled] = useState(true);

  // Mock Edit Handler
  const handleEditClick = (featureName: string, variant: string, currentValue: string) => {
    // TODO: Replace with actual API call
    console.log(`[MOCK API] Edit requested for Feature: "${featureName}", Variant: "${variant}", Current Value: "${currentValue}"`);
    alert(`Edit Feature: ${featureName}\nVariant: ${variant}\nCurrent Value: ${currentValue}\n\n(Backend functionality under construction)`);
  };

  const NO_INFO = 'No information Available';

  const groups: FeatureGroup[] = useMemo(() => {
    if (!data) return [];
    // ... feature group items ...
    const groupMap: Record<string, GroupedFeature[]> = {};
    const priceGroup: GroupedFeature[] = [];
    const additionalGroup: GroupedFeature[] = [];

    const variants = data.columns.slice(1);

    data.data.forEach((row) => {
      const featureText = row.feature;
      const ftLower = featureText.trim().toLowerCase();

      const values: { [key: string]: string } = {};
      const isPriceRow = ftLower === 'price value';

      variants.forEach((v) => {
        const val = row[v];

        // Handle Price Value with nested pricing object
        if (isPriceRow && typeof val === 'object' && val !== null && 'pricing' in val) {
          // Store the entire pricing object for later rendering
          values[v] = val;
        } else if (typeof val === 'string') {
          values[v] = val && val.trim() !== '' ? val : NO_INFO;
        } else {
          values[v] = NO_INFO;
        }
      });

      const hasAnyInfo = Object.values(values).some((val) => val !== NO_INFO);
      if (!hasAnyInfo) return;

      // Add Price Value and Variant Launched to price group
      if (isPriceRow || ftLower.startsWith('variant launched')) {
        priceGroup.push({ featureName: featureText, values });
        return;
      }

      const separatorIndex = featureText.indexOf(' - ');
      if (separatorIndex !== -1) {
        const category = featureText.substring(0, separatorIndex).trim();
        const featureName = featureText.substring(separatorIndex + 3).trim();

        if (!groupMap[category]) groupMap[category] = [];
        groupMap[category].push({ featureName, values });
      } else {
        additionalGroup.push({ featureName: featureText, values });
      }
    });

    const result: FeatureGroup[] = [];
    if (priceGroup.length > 0) result.push({ groupName: 'Price & Basic Info', items: priceGroup, hasDifferences: true });

    Object.keys(groupMap).forEach((key) => {
      const items = groupMap[key];
      const hasDifferences = items.some(item => {
        const variantValues = variants.map(v => item.values[v]);
        const nonNoInfoValues = variantValues.filter(v => v !== NO_INFO);
        const uniqueVals = new Set(nonNoInfoValues);
        return uniqueVals.size > 1;
      });

      result.push({ groupName: key, items, hasDifferences });
    });

    if (additionalGroup.length > 0) {
      const hasDifferences = additionalGroup.some(item => {
        const variantValues = variants.map(v => item.values[v]);
        const nonNoInfoValues = variantValues.filter(v => v !== NO_INFO);
        const uniqueVals = new Set(nonNoInfoValues);
        return uniqueVals.size > 1;
      });
      result.push({ groupName: 'Additional Features', items: additionalGroup, hasDifferences });
    }

    const CATEGORY_ORDER = [
      'Price & Basic Info',
      'Brake', 'Brakes',
      'Dimension', 'Dimensions',
      'Engine',
      'Fuel',
      'Transmission',
      'Suspension', 'Suspensions',
      'Tyre', 'Tyres',
      'Exterior',
      'Interior',
      'Safety',
      'Infotainment', 'Infotainemt',
      'Comfort and Convenience',
      'Audio and Entertainment',
      'Connected Car Technology'
    ];

    result.sort((a, b) => {
      const getIndex = (name: string) => {
        const lowerName = name.toLowerCase();
        // Check for exact match or includes to be safe, but exact is better for order list
        const idx = CATEGORY_ORDER.findIndex(cat =>
          cat.toLowerCase() === lowerName || lowerName.includes(cat.toLowerCase())
        );
        return idx === -1 ? 999 : idx;
      };

      const idxA = getIndex(a.groupName);
      const idxB = getIndex(b.groupName);

      return idxA - idxB;
    });

    return result;
  }, [data]);

  // Add original indices to groups and items for numbering retention
  const groupsWithIndices = useMemo(() => {
    return groups.map((group, groupIdx) => ({
      ...group,
      originalGroupIndex: groupIdx,
      items: group.items.map((item, itemIdx) => ({
        ...item,
        originalItemIndex: itemIdx
      }))
    }));
  }, [groups]);

  // Filter groups based on search term and hidden vehicles
  const filteredGroups = useMemo(() => {
    if (!data) return [];
    const variants = data.columns.slice(1);

    // If no search and no hidden vehicles, return original groups
    if (!searchTerm.trim() && hiddenVehicles.size === 0) return groupsWithIndices;

    const lowerTerm = searchTerm.toLowerCase();

    return groupsWithIndices.map(group => {
      let filteredItems = group.items;

      // 1. Search Filter
      if (searchTerm.trim()) {
        const groupMatches = group.groupName.toLowerCase().includes(lowerTerm);
        if (!groupMatches) {
          filteredItems = group.items.filter(item =>
            item.featureName.toLowerCase().includes(lowerTerm)
          );
        }
      }

      if (filteredItems.length === 0) return null;

      // 2. Recalculate hasDifferences for the subset of items AND visible columns
      const hasDifferences = filteredItems.some(item => {
        const variantValues = variants
          .filter((_, idx) => !hiddenVehicles.has(idx))
          .map(v => item.values[v]);

        const nonNoInfoValues = variantValues.filter(v => v !== NO_INFO);
        const uniqueVals = new Set(nonNoInfoValues);
        return uniqueVals.size > 1;
      });

      return { ...group, items: filteredItems, hasDifferences };
    }).filter(Boolean) as any[];
  }, [groupsWithIndices, searchTerm, data, hiddenVehicles]);

  // Apply "Differs Only" filter to groups
  const displayGroups = useMemo(() => {
    if (!showDiffOnly) return filteredGroups;
    return filteredGroups.filter(g => g.hasDifferences);
  }, [filteredGroups, showDiffOnly]);

  // When search is active, default to expanded view
  useEffect(() => {
    if (searchTerm) {
      setExpandAll(true);
    }
  }, [searchTerm]);

  // Sync openGroups with displayGroups and expandAll state
  useEffect(() => {
    const s: Record<string, boolean> = {};
    displayGroups.forEach(g => s[g.groupName] = expandAll);
    setOpenGroups(s);
  }, [displayGroups, expandAll]);

  const toggleGroup = (groupName: string) =>
    setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));

  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async () => {
    if (!data) return;

    setIsExporting(true);

    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Comparison');
      const variants = data.columns.slice(1);
      const exportVariants = variants.filter((_, idx) => !hiddenVehicles.has(idx));

      // --- Setup Columns ---
      // Feature column + 1 column per visible variant
      const columns = [
        { header: 'Feature', key: 'feature', width: 40 },
        ...exportVariants.map(v => ({ header: v, key: v, width: 30 }))
      ];
      ws.columns = columns;

      // --- Style Header Row ---
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      // --- Add Data ---
      // Navigate through groups (use original 'groups' but apply filters)

      const categoryOrder = [
        'Price & Basic Info', 'Brake', 'Dimension', 'Engine', 'Fuel', 'Transmission',
        'Suspension', 'Tyre', 'Exterior', 'Interior', 'Safety', 'Infotainment',
        'Comfort', 'Audio', 'Connected'
      ]; // Simplified logic for sorting if needed, but 'groups' is already sorted?
      // Actually 'groups' variable is sorted in useMemo. We use 'groupsWithIndices' to get original indices.

      let currentRowIndex = 2; // Start after header

      groupsWithIndices.forEach((group: any) => {
        // Filter logic identical to UI
        const itemsToExport = group.items.filter((item: any) => {
          const isPriceRow = item.featureName.toLowerCase().trim() === 'price value';
          // Check diff on VISIBLE columns
          const visibleValues = variants
            .map((v, i) => !hiddenVehicles.has(i) ? item.values[v] : null)
            .filter(v => v !== null) as string[];
          const nonNoInfoValues = visibleValues.filter(v => v !== NO_INFO);
          const uniqueVals = new Set(nonNoInfoValues);
          const isDifferent = uniqueVals.size > 1;

          if (showDiffOnly && !isDifferent && !isPriceRow) return false;

          // Search filter
          if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            const groupMatches = group.groupName.toLowerCase().includes(lowerTerm);
            if (!groupMatches && !item.featureName.toLowerCase().includes(lowerTerm)) {
              return false;
            }
          }

          return true;
        });

        if (itemsToExport.length === 0 && (showDiffOnly || searchTerm.trim())) return;

        // Group Header Row
        const groupHeaderRow = ws.addRow([
          `${group.originalGroupIndex + 1}. ${group.groupName}`,
          ...Array(exportVariants.length).fill('')
        ]);
        groupHeaderRow.font = { bold: true };
        groupHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } }; // Sky-50
        groupHeaderRow.getCell(1).alignment = { horizontal: 'left' };

        // Merge group header cells
        ws.mergeCells(currentRowIndex, 1, currentRowIndex, exportVariants.length + 1);
        currentRowIndex++;

        itemsToExport.forEach((item: any) => {
          const isPriceRow = item.featureName.toLowerCase().trim() === 'price value';

          // Check diff (for coloring)
          const visibleValues = variants
            .map((v, i) => !hiddenVehicles.has(i) ? item.values[v] : null)
            .filter(v => v !== null) as string[];

          const nonNoInfoValues = visibleValues.filter(v => v !== NO_INFO);
          const isDifferent = new Set(nonNoInfoValues).size > 1;

          const rowData = [
            `${group.originalGroupIndex + 1}.${item.originalItemIndex + 1}  ${item.featureName}`
          ];

          exportVariants.forEach(v => {
            const val = item.values[v];
            // Handle complex object
            if (typeof val === 'object' && val !== null && 'pricing' in val) {
              const prices = (val.pricing.prices || []).map((p: any) => {
                const label = [p.fuel_type, p.transmission_type].filter(Boolean).join(' ');
                return `${label ? label + ': ' : ''}₹${p.ex_showroom_price}`;
              }).join('\n');
              rowData.push(prices || '₹' + val.pricing.avg_price?.value);
            } else {
              rowData.push(val || NO_INFO);
            }
          });

          const dataRow = ws.addRow(rowData);

          // Row styling
          if (isDifferent && !isPriceRow) {
            // Amber-100
            dataRow.eachCell({ includeEmpty: true }, (cell) => {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
            });
          }
          if (isPriceRow) {
            dataRow.font = { bold: true, color: { argb: 'FF15803D' } }; // Green text 
            dataRow.eachCell((cell) => cell.alignment = { wrapText: true, vertical: 'top' });
          }

          // Borders
          dataRow.eachCell({ includeEmpty: true }, (cell) => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            if (!isPriceRow) cell.alignment = { wrapText: true, vertical: 'top' };
          });

          currentRowIndex++;
        });

        // Add spacer row?
        // currentRowIndex++;
      });

      // Generate Filename
      const variantNames = exportVariants.map(v => v.split(' - ').pop()).join('_vs_');
      const filename = `Comparison_${variantNames}_${new Date().toISOString().split('T')[0]}.xlsx`;

      const buffer = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), filename);
    } catch (e) {
      console.error(e);
      alert("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-white rounded-xl border-2 border-dashed border-slate-200 p-10">
        <div className="bg-blue-100 p-4 rounded-full mb-4">
          <AlertCircle size={40} className="text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">No comparison generated yet</h3>
        <p className="mt-2 text-center max-w-sm text-sm">
          Please select vehicles from the left panel and click "Compare Now" to view detailed comparison.
        </p>
      </div>
    );
  }

  const variants = data.columns.slice(1);

  // Filter out hidden vehicles
  const visibleVariants = variants.filter((_, idx) => !hiddenVehicles.has(idx));

  const toggleVehicleVisibility = (index: number) => {
    setHiddenVehicles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        // Don't allow hiding all vehicles
        if (newSet.size < variants.length - 1) {
          newSet.add(index);
        } else {
          alert('At least one vehicle must remain visible');
        }
      }
      return newSet;
    });
  };

  const getGridColumns = () => {
    const visibleCount = visibleVariants.length;
    if (visibleCount <= 3) {
      return `minmax(160px, 1fr) repeat(${visibleCount}, minmax(160px, 1fr))`;
    } else if (visibleCount === 4) {
      return `minmax(140px, 0.9fr) repeat(${visibleCount}, minmax(140px, 1fr))`;
    } else {
      return `minmax(110px, 0.8fr) repeat(${visibleCount}, minmax(110px, 1fr))`;
    }
  };

  const gridColsStyle: React.CSSProperties = {
    gridTemplateColumns: getGridColumns(),
  };

  const variantBg = (idx: number) => {
    const colors = [
      'bg-blue-600 text-white',
      'bg-emerald-600 text-white',
      'bg-violet-600 text-white',
      'bg-orange-600 text-white',
      'bg-sky-600 text-white'
    ];
    return colors[idx % colors.length];
  };

  const getFontSize = () => {
    const visibleCount = visibleVariants.length;
    if (visibleCount <= 3) return 'text-sm';
    if (visibleCount === 4) return 'text-xs';
    return 'text-[11px]';
  };

  const getHeaderFontSize = () => {
    const visibleCount = visibleVariants.length;
    if (visibleCount <= 3) return 'text-sm md:text-base';
    if (visibleCount === 4) return 'text-xs md:text-sm';
    return 'text-[11px] md:text-xs';
  };

  return (
    <div className="h-full flex flex-col bg-white">

      <div className="flex-shrink-0 flex items-center justify-between gap-4 px-4 py-2 border-b bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex items-center gap-4">
          <TableSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

          <div className="hidden md:block h-6 w-px bg-slate-300" />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showDiffOnly}
              onChange={() => setShowDiffOnly(prev => !prev)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Differs only</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={expandAll}
              onChange={() => setExpandAll(prev => !prev)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Expand all</span>
          </div>

          <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
            <input
              type="checkbox"
              checked={false}
              disabled={true}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-not-allowed"
            />
            <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Unofficial</span>
          </div>

          {/* Enable Editing Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isEditingEnabled}
              onChange={() => setIsEditingEnabled(prev => !prev)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Enable Editing</span>
          </div>

          {/* Hidden Vehicles Dropdown */}
          {hiddenVehicles.size > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg border border-amber-300 text-xs font-semibold transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
                <span>{hiddenVehicles.size} Hidden</span>
              </button>

              <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30">
                <div className="text-xs font-bold text-slate-600 mb-2 px-2">Hidden Vehicles</div>
                <div className="space-y-1">
                  {variants.map((v, idx) => {
                    if (!hiddenVehicles.has(idx)) return null;
                    return (
                      <button
                        key={idx}
                        onClick={() => toggleVehicleVisibility(idx)}
                        className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center justify-between group/item"
                      >
                        <span className="truncate flex-1">Veh {idx + 1}: {v}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0 ml-2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isExporting}
        >
          {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          <span className="text-sm">{isExporting ? 'Exporting...' : 'Download Excel'}</span>
        </button>
      </div>

      <div
        className="flex-1 overflow-x-auto w-full"
      >

        <div className="grid border-b-2 border-slate-300 sticky top-0 z-20 shadow-sm" style={gridColsStyle}>
          <div className={`p-2 font-semibold uppercase tracking-[0.08em] text-[10px] md:text-xs flex items-center bg-slate-900 text-white border-r border-slate-700`}>
            Feature
          </div>

          {variants.map((v, idx) => {
            const isHidden = hiddenVehicles.has(idx);
            if (isHidden) return null;

            return (
              <div
                key={idx}
                className={`p-2 font-semibold text-[10px] md:text-xs border-l border-white flex flex-col items-start justify-center relative group ${variantBg(idx)}`}
                title={v}
              >
                <button
                  onClick={() => toggleVehicleVisibility(idx)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/30 rounded p-0.5"
                  title="Hide this vehicle"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                </button>
                <div className="text-[9px] opacity-80 uppercase tracking-tighter">Veh {idx + 1}</div>
                <span className="truncate w-full">{v}</span>
              </div>
            );
          })}
        </div>

        <div className="divide-y divide-slate-200">
          {displayGroups.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {searchTerm
                ? `No features match your search "${searchTerm}"${showDiffOnly ? ' (with differences)' : ''}`
                : (showDiffOnly ? "No differing features found across selected vehicles." : "No data available.")
              }
            </div>
          ) : displayGroups.map((group, groupIdx) => {
            const isOpen = openGroups[group.groupName] ?? false;

            return (
              <div key={group.groupName} className="bg-white">

                <button
                  onClick={() => toggleGroup(group.groupName)}
                  disabled={showDiffOnly && !group.hasDifferences}
                  className={`w-full flex items-center justify-between px-3 py-1.5 transition-colors text-left border-b border-slate-100 ${showDiffOnly && !group.hasDifferences
                    ? 'bg-slate-50 text-slate-400 cursor-default'
                    : 'bg-sky-50 hover:bg-sky-100 text-slate-900 sticky top-[33px] z-10'  // Sticky group header
                    }`}
                >
                  <span className="font-semibold flex items-center gap-2 text-[11px]">

                    {/* Toggle Icon instead of Blue Bar */}
                    <span className="mr-1 text-blue-600">
                      {isOpen && !(showDiffOnly && !group.hasDifferences) ? <Minus size={12} /> : <Plus size={12} />}
                    </span>

                    {/* Numbering 1, 2, 3... - Use original index */}
                    <span>{(group as any).originalGroupIndex + 1}. {group.groupName}</span>

                    {showDiffOnly && !group.hasDifferences && (
                      <span className="ml-2 text-[9px] font-medium bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        No Differences
                      </span>
                    )}
                  </span>

                  {/* Removed end Chevron as requested to use start icon */}
                </button>

                {isOpen && (
                  <div className="divide-y divide-slate-100 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    {group.items.map((item: any, idx: number) => {

                      const ftLower = item.featureName.toLowerCase().trim();
                      const isBrand = ftLower === 'brand';
                      const isCar = ftLower === 'car';
                      const isVar = ftLower === 'variant';
                      const isDate = ftLower === 'variant launched';
                      const isPriceRow = ftLower === 'price value';

                      const variantValues = variants
                        .filter((_, vIdx) => !hiddenVehicles.has(vIdx))
                        .map(v => item.values[v]);

                      const nonNoInfoValues = variantValues.filter(v => v !== NO_INFO);
                      const uniqueVals = Array.from(new Set(nonNoInfoValues));
                      const isDifferent = uniqueVals.length > 1;

                      if (showDiffOnly && !isDifferent && !isPriceRow && !isBrand && !isCar && !isVar && !isDate) return null;

                      // Custom row background based on type
                      let rowBg = 'hover:bg-slate-50';
                      if (isBrand) rowBg = 'bg-blue-50 hover:bg-blue-100/80';
                      else if (isCar) rowBg = 'bg-indigo-50 hover:bg-indigo-100/80';
                      else if (isVar) rowBg = 'bg-violet-50 hover:bg-violet-100/80';
                      else if (isDate) rowBg = 'bg-emerald-50 hover:bg-emerald-100/80';
                      else if (isPriceRow) rowBg = 'bg-slate-50';
                      else if (isDifferent) rowBg = 'bg-amber-100 hover:bg-amber-300/80'; // Increased strength and removed diff tag logic below

                      return (
                        <div
                          key={idx}
                          className={`grid transition-colors ${rowBg}`}
                          style={gridColsStyle}
                        >

                          <div className={`p-1 pl-6 pr-2 text-[10px] font-medium border-r border-slate-200 flex items-start justify-start text-left gap-1.5 ${isBrand || isCar || isVar || isDate ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>
                            <span className="text-slate-500 inline-block min-w-[30px] text-right">
                              {(group as any).originalGroupIndex + 1}.{(item as any).originalItemIndex + 1}
                            </span>
                            <span className={`flex-1 break-words ${isBrand || isCar || isVar || isDate ? 'uppercase tracking-tight text-[9px]' : ''}`}>
                              <HighlightText text={item.featureName} highlight={searchTerm} />
                            </span>
                          </div>

                          {variants.map((v, vIdx) => {
                            // Skip hidden vehicles
                            if (hiddenVehicles.has(vIdx)) return null;

                            const value = item.values[v];
                            const isPriceCell = isPriceRow && value && typeof value === 'object' && value !== null && 'pricing' in (value as object);

                            return (
                              <div
                                key={vIdx}
                                className={`relative p-1 px-2 text-[10px] border-l border-slate-200 ${item.values[v] === NO_INFO ? 'text-slate-400 italic' : 'text-slate-900'
                                  }`}
                              >
                                {isPriceCell ? (
                                  <div className="space-y-1">
                                    {((item.values[v] as any)?.pricing?.prices || [])
                                      .map((price: any) => {
                                        const parts = [
                                          price.fuel_type,
                                          price.engine_type,
                                          price.transmission_type,
                                          price.paint_type,
                                          price.edition
                                        ].filter(Boolean);

                                        const label = parts.join(' ') || 'Standard';

                                        return { price, label };
                                      })
                                      .sort((a: { price: any; label: string }, b: { price: any; label: string }) => a.label.localeCompare(b.label))
                                      .map(({ price, label }: { price: any; label: string }, pIdx: number) => {
                                        const formattedPrice = new Intl.NumberFormat('en-IN', {
                                          style: 'currency',
                                          currency: price.currency || 'INR',
                                          maximumFractionDigits: 0
                                        }).format(price.ex_showroom_price);

                                        return (
                                          <div key={pIdx} className="flex flex-col xl:flex-row xl:items-center xl:justify-between border-b border-slate-200 pb-1 last:border-0 last:pb-0 gap-0.5">
                                            <span className="text-[9px] text-slate-600 font-medium uppercase tracking-wide break-words">
                                              <HighlightText text={label} highlight={searchTerm} />
                                            </span>
                                            <span className="text-xs font-bold text-green-700 whitespace-nowrap">
                                              <HighlightText text={formattedPrice} highlight={searchTerm} />
                                            </span>
                                          </div>
                                        );
                                      })}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-1 group/edit min-h-[20px]">
                                    <span className="flex-1">
                                      <HighlightText text={String(item.values[v])} highlight={searchTerm} />
                                    </span>
                                    {isEditingEnabled && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditClick(item.featureName, v, String(item.values[v]));
                                        }}
                                        className="p-1 text-slate-400 hover:text-blue-600 rounded-full hover:bg-slate-100 transition-colors opacity-0 group-hover/edit:opacity-100 focus:opacity-100 flex-shrink-0"
                                        title="Edit Value"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;
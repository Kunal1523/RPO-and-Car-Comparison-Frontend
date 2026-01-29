
// import React, { useEffect, useState } from 'react';
// import { X, TrendingUp, List, LayoutGrid, Download } from 'lucide-react';
// import { utils, writeFile } from 'xlsx';
// import ChartView from '../components/ChartView';
// import TableView from '../components/TableView';

// /* ================= TYPES & HELPERS ================= */
// interface CatalogBrand { brand_id: string; brand_name: string; cars: { car_id: string; car_name: string }[]; }
// interface PricingData {
//   variant_id: string;
//   variant_name: string;
//   pricing_id: string;
//   ex_showroom_price: number;
//   currency: string;
//   fuel_type: string | null;
//   engine_type: string | null;
//   transmission_type: string | null;
//   paint_type: string | null;
//   edition: string | null;
//   pricing_version: number;
//   created_at: string;
// }
// interface GroupedVariant { variant_id: string; variant_name: string; avg_price: number; min_price: number; max_price: number; types: { type: string; price: number }[]; }
// interface SelectedCar { id: string; brand: string; model: string; pricing?: PricingData[]; }

// const groupByVariant = (pricing: PricingData[]): GroupedVariant[] => {
//   const grouped = new Map<string, GroupedVariant>();
//   pricing.forEach(p => {
//     if (!grouped.has(p.variant_id)) {
//       grouped.set(p.variant_id, { variant_id: p.variant_id, variant_name: p.variant_name, avg_price: 0, min_price: p.ex_showroom_price, max_price: p.ex_showroom_price, types: [] });
//     }
//     const variant = grouped.get(p.variant_id)!;
//     // Create type label from fuel_type, engine_type, and transmission_type
//     const typeLabel = [p.fuel_type, p.engine_type, p.transmission_type].filter(Boolean).join(' ');
//     variant.types.push({ type: typeLabel || 'Standard', price: p.ex_showroom_price });
//     variant.min_price = Math.min(variant.min_price, p.ex_showroom_price);
//     variant.max_price = Math.max(variant.max_price, p.ex_showroom_price);
//   });
//   return Array.from(grouped.values()).map(v => ({
//     ...v,
//     avg_price: v.types.reduce((sum, t) => sum + t.price, 0) / v.types.length
//   })).sort((a, b) => a.avg_price - b.avg_price);
// };

// const formatPrice = (p: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);
// const formatPriceShort = (p: number) => {
//   if (p >= 10000000) return `₹${(p / 10000000).toFixed(1)}Cr`;
//   if (p >= 100000) return `₹${(p / 100000).toFixed(1)}L`;
//   return `₹${(p / 1000).toFixed(0)}K`;
// };

// /* ================= SHARED COMPONENTS ================= */

// export const CustomTooltip = ({ active, payload }: any) => {
//   if (!active || !payload || !payload.length) return null;

//   const raw = payload[0]?.payload;

//   if (!raw || !raw.variant_name || !Array.isArray(raw.types)) {
//     return null;
//   }

//   const data = raw as GroupedVariant;

//   return (
//     <div className="bg-white border-2 border-slate-300 rounded-lg shadow-xl p-3 max-w-xs pointer-events-none text-xs text-slate-800">
//       <p className="font-bold mb-2">{data.variant_name}</p>

//       <div className="flex justify-between">
//         <span className="text-slate-500">Price Range:</span>
//         <span className="font-bold text-blue-600">
//           {formatPrice(data.min_price)} - {formatPrice(data.max_price)}
//         </span>
//       </div>

//       <div className="flex justify-between mt-1">
//         <span className="text-slate-500">Configurations:</span>
//         <span className="font-bold">{data.types.length}</span>
//       </div>

//       <div className="text-slate-400 text-[10px] mt-2 pt-2 border-t">
//         Click to see all configurations
//       </div>
//     </div>
//   );
// };

// const VariantModal = ({
//   variant,
//   onClose,
//   brandColor
// }: {
//   variant: GroupedVariant | null;
//   onClose: () => void;
//   brandColor: string;
// }) => {
//   if (!variant) return null;

//   return (
//     <div
//       className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
//       onClick={onClose}
//     >
//       <div
//         className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className={`${brandColor} text-white p-5 flex items-start justify-between shrink-0`}>
//           <div>
//             <h3 className="font-bold text-xl">{variant.variant_name}</h3>
//             <p className="text-sm opacity-80">{variant.types.length} Configuration{variant.types.length > 1 ? 's' : ''}</p>
//           </div>
//           <button
//             onClick={onClose}
//             className="hover:bg-white/20 rounded-full p-2 transition-colors"
//           >
//             <X size={20} />
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto">
//           <table className="w-full text-sm">
//             <thead className="sticky top-0 bg-slate-50 border-b">
//               <tr>
//                 <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">
//                   Configuration
//                 </th>
//                 <th className="p-3 text-right text-xs font-bold text-slate-500 uppercase">
//                   Price
//                 </th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-slate-100">
//               {variant.types.map((t, i) => {
//                 return (
//                   <tr key={i} className="hover:bg-slate-50 transition-colors">
//                     <td className="p-3 text-slate-700 font-medium">
//                       {t.type}
//                     </td>

//                     <td className="p-3 text-right font-bold text-slate-900">
//                       {formatPrice(t.price)}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>

//       </div>
//     </div>
//   );
// };

// /* ================= MAIN COMPONENT ================= */

// const PriceComparisonPage = () => {
//   const [catalog, setCatalog] = useState<CatalogBrand[]>([]);
//   const [globalViewMode, setGlobalViewMode] = useState<'chart' | 'table'>('chart');
//   const [cars, setCars] = useState<SelectedCar[]>([
//     { id: '1', brand: 'Maruti', model: 'Grand Vitara' },
//     { id: '2', brand: '', model: '' }
//   ]);
//   const [selectedVariant, setSelectedVariant] = useState<{ variant: GroupedVariant; carId: string } | null>(null);

//   const carColors = { '1': 'bg-blue-600', '2': 'bg-red-600' };

//   useEffect(() => {
//     fetch('http://localhost:8000/api/catalog')
//       .then(r => r.json()).then(d => setCatalog(d.brands))
//       .catch(err => console.error('Catalog Error:', err));
//   }, []);

//   const fetchPricing = async (car: SelectedCar) => {
//     try {
//       const res = await fetch(`http://localhost:8000/v1/pricing?brand_name=${encodeURIComponent(car.brand)}&car_name=${encodeURIComponent(car.model)}`);
//       const data = await res.json();
//       if (data.success && data.pricing) {
//         setCars(p => p.map(c => (c.id === car.id ? { ...c, pricing: data.pricing } : c)));
//       }
//     } catch (err) { console.error('Pricing Error:', err); }
//   };

//   // Auto-fetch pricing for prefilled cars
//   useEffect(() => {
//     if (catalog.length > 0) {
//       cars.forEach(car => {
//         if (car.brand && car.model && !car.pricing) {
//           fetchPricing(car);
//         }
//       });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [catalog, cars.length]);

//   // Auto-prefill vehicle 2 when catalog loads
//   useEffect(() => {
//     if (catalog.length > 0 && cars[1].brand === '' && cars[1].model === '') {
//       // Find a different brand/car for vehicle 2 (not the same as vehicle 1)
//       const vehicle2Brand = catalog.find(b => b.brand_name !== cars[0].brand) || catalog[0];
//       const vehicle2Car = vehicle2Brand?.cars[0];

//       if (vehicle2Brand && vehicle2Car) {
//         setCars(prev => prev.map(c =>
//           c.id === '2'
//             ? { ...c, brand: vehicle2Brand.brand_name, model: vehicle2Car.car_name }
//             : c
//         ));
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [catalog]);

//   const updateCar = (id: string, key: 'brand' | 'model', value: string) => {
//     setCars(p => p.map(c => {
//       if (c.id !== id) return c;
//       const updated = { ...c, [key]: value, ...(key === 'brand' && { model: '', pricing: undefined }) };
//       if (key === 'model' && updated.brand && value) fetchPricing(updated);
//       return updated;
//     }));
//   };

//   const handleDownloadExcel = () => {
//     // 1. Flatten Data
//     const rows: any[] = [];

//     cars.forEach(car => {
//       if (car.pricing) {
//         car.pricing.forEach(p => {
//           rows.push({
//             Brand: car.brand,
//             Model: car.model,
//             Variant: p.variant_name,
//             'Fuel Type': p.fuel_type || '-',
//             'Engine Type': p.engine_type || '-',
//             'Transmission': p.transmission_type || '-',
//             'Paint Type': p.paint_type || '-',
//             Edition: p.edition || '-',
//             Price: p.ex_showroom_price,
//             Currency: p.currency || 'INR'
//           });
//         });
//       }
//     });

//     if (rows.length === 0) {
//       alert("No pricing data to download. Please select a car model first.");
//       return;
//     }

//     // 2. Create Workbook & Worksheet
//     const worksheet = utils.json_to_sheet(rows);
//     const workbook = utils.book_new();
//     utils.book_append_sheet(workbook, worksheet, "Pricing Data");

//     // 3. Trigger Download
//     const filename = `Car_Prices_${new Date().toISOString().slice(0, 10)}.xlsx`;
//     writeFile(workbook, filename);
//   };

//   // Filter state for each car
//   interface CarFilters {
//     selectedFuelTypes: Set<string>;
//     selectedTransmissions: Set<string>;
//     selectedVariants: Set<string>;
//   }

//   const [carFilters, setCarFilters] = useState<Record<string, CarFilters>>({
//     '1': { selectedFuelTypes: new Set<string>(), selectedTransmissions: new Set<string>(), selectedVariants: new Set<string>() },
//     '2': { selectedFuelTypes: new Set<string>(), selectedTransmissions: new Set<string>(), selectedVariants: new Set<string>() }
//   });

//   // Initialize filters when pricing data is loaded
//   React.useEffect(() => {
//     cars.forEach(car => {
//       if (car.pricing && car.pricing.length > 0) {
//         const uniqueFuelTypes = Array.from(new Set(car.pricing.map(p => p.fuel_type).filter(Boolean)));
//         const uniqueTransmissions = Array.from(new Set(car.pricing.map(p => p.transmission_type).filter(Boolean)));
//         const uniqueVariants = Array.from(new Set(car.pricing.map(p => p.variant_id)));

//         setCarFilters(prev => ({
//           ...prev,
//           [car.id]: {
//             selectedFuelTypes: new Set(uniqueFuelTypes as string[]),
//             selectedTransmissions: new Set(uniqueTransmissions as string[]),
//             selectedVariants: new Set(uniqueVariants)
//           }
//         }));
//       }
//     });
//   }, [cars.map(c => c.pricing?.length).join(',')]);

//   // Toggle a single filter value
//   const toggleCarFilter = (carId: string, filterType: keyof CarFilters, value: string) => {
//     setCarFilters(prev => {
//       const carFilter = prev[carId];
//       const filterSet = new Set(carFilter[filterType]);

//       if (filterSet.has(value)) {
//         filterSet.delete(value);
//       } else {
//         filterSet.add(value);
//       }

//       return {
//         ...prev,
//         [carId]: {
//           ...carFilter,
//           [filterType]: filterSet
//         }
//       };
//     });
//   };

//   // Update entire filter set
//   const updateCarFilter = (carId: string, filterType: keyof CarFilters, newSet: Set<string>) => {
//     setCarFilters(prev => ({
//       ...prev,
//       [carId]: {
//         ...prev[carId],
//         [filterType]: newSet
//       }
//     }));
//   };

//   // Get filtered pricing for a car
//   const getFilteredPricingForCar = (carId: string): PricingData[] => {
//     const car = cars.find(c => c.id === carId);
//     if (!car || !car.pricing) return [];

//     const filters = carFilters[carId];
//     if (!filters) return car.pricing;

//     return car.pricing.filter(p => {
//       const fuelMatch = !p.fuel_type || filters.selectedFuelTypes.has(p.fuel_type);
//       const transmissionMatch = !p.transmission_type || filters.selectedTransmissions.has(p.transmission_type);
//       const variantMatch = filters.selectedVariants.has(p.variant_id);
//       return fuelMatch && transmissionMatch && variantMatch;
//     });
//   };

//   // Check if we should show combined stacked bar - auto-detect based on loaded cars
//   const carsWithPricing = cars.filter(c => c.pricing && c.pricing.length > 0);
//   const bothCarsLoaded = carsWithPricing.length === 2;
//   const showCombinedView = bothCarsLoaded && globalViewMode === 'chart';

//   return (
//     <div className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-col">
//       {/* TOP NAV */}
//       <div className="h-14 flex items-center justify-between px-6 bg-white border-b z-10">

//         <div className="flex bg-slate-100 p-1 rounded-xl border">
//           <button
//             onClick={() => setGlobalViewMode('chart')}
//             className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${globalViewMode === 'chart' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
//           >
//             <TrendingUp size={16} /> Chart
//           </button>
//           <button
//             onClick={() => setGlobalViewMode('table')}
//             className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${globalViewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
//           >
//             <List size={16} /> Table
//           </button>
//           <div className="w-px h-6 bg-slate-200 mx-1"></div>
//           <button
//             onClick={handleDownloadExcel}
//             className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold text-slate-500 hover:text-green-600 transition-colors"
//             title="Download Excel"
//           >
//             <Download size={16} /> <span className="hidden sm:inline">Download</span>
//           </button>
//         </div>
//       </div>

//       <div className="flex-1 flex overflow-hidden">
//         {/* SIDEBAR */}
//         <div className="w-80 bg-white border-r p-6 space-y-6 overflow-y-auto">
//           <div className="space-y-4">
//             <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Vehicle Selection</p>
//             {cars.map((c, idx) => {
//               const brand = catalog.find(b => b.brand_name === c.brand);

//               return (
//                 <div key={c.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
//                   <div className="flex items-center gap-2 mb-2">
//                     <div className={`w-6 h-6 ${carColors[c.id as '1' | '2']} rounded-md flex items-center justify-center text-white font-bold text-[10px]`}>{idx + 1}</div>
//                     <span className="font-bold text-slate-800 text-sm">Vehicle {idx + 1}</span>
//                   </div>

//                   {/* Brand Selection */}
//                   <select
//                     className="w-full bg-white border rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
//                     value={c.brand}
//                     onChange={e => updateCar(c.id, 'brand', e.target.value)}
//                   >
//                     <option value="">Select Brand</option>
//                     {catalog.map(b => <option key={b.brand_id} value={b.brand_name}>{b.brand_name}</option>)}
//                   </select>

//                   {/* Model Selection */}
//                   <select
//                     className="w-full bg-white border rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
//                     value={c.model}
//                     disabled={!c.brand}
//                     onChange={e => updateCar(c.id, 'model', e.target.value)}
//                   >
//                     <option value="">Select Model</option>
//                     {brand?.cars.map(m => <option key={m.car_id} value={m.car_name}>{m.car_name}</option>)}
//                   </select>

//                   {/* Status indicator */}
//                   {c.pricing && c.pricing.length > 0 && (
//                     <div className="pt-3 border-t text-xs text-green-600 flex items-center gap-2">
//                       <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//                       <span className="font-medium">{c.pricing.length} prices loaded</span>
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* MAIN VIEW AREA */}
//         {carsWithPricing.length === 2 && globalViewMode === 'chart' ? (
//           // COMBINED MODE - Both cars on same axis
//           <div className="flex-1 bg-white overflow-hidden flex flex-col">
//             <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-md z-10">
//               <div className="flex items-center gap-4 justify-center">
//                 <h3 className="font-bold uppercase tracking-tight">{cars[0].brand} {cars[0].model}</h3>
//                 <span className="text-white/60">vs</span>
//                 <h3 className="font-bold uppercase tracking-tight">{cars[1].brand} {cars[1].model}</h3>
//               </div>
//             </div>

//             {/* Combined Filters */}
//             <div className="p-3 bg-slate-50 border-b">
//               <div className="grid grid-cols-2 gap-4">
//                 {cars.map(c => {
//                   if (!c.pricing) return null;

//                   const uniqueFuelTypes = Array.from(new Set(c.pricing.map(p => p.fuel_type).filter(Boolean))).sort();
//                   const uniqueTransmissions = Array.from(new Set(c.pricing.map(p => p.transmission_type).filter(Boolean))).sort();
//                   const uniqueVariants = Array.from(new Map(c.pricing.map(p => [p.variant_id, p.variant_name])).entries()).map(([id, name]) => ({ id, name: name as string })).sort((a, b) => a.name.localeCompare(b.name));

//                   return (
//                     <div key={c.id} className="space-y-2">
//                       <p className="text-xs font-bold text-slate-700 uppercase">{c.brand} {c.model} Filters</p>

//                       {/* All filters in one row */}
//                       <div className="grid grid-cols-3 gap-2">
//                         {/* Variant Filter - Checkboxes */}
//                         {uniqueVariants.length > 0 && (
//                           <div>
//                             <div className="flex items-center justify-between mb-1">
//                               <label className="block text-xs font-semibold text-slate-600">Variants</label>
//                               <button
//                                 onClick={() => {
//                                   const allSelected = carFilters[c.id]?.selectedVariants.size === uniqueVariants.length;
//                                   updateCarFilter(c.id, 'selectedVariants', allSelected ? new Set() : new Set(uniqueVariants.map(v => v.id)));
//                                 }}
//                                 className="text-[10px] px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
//                               >
//                                 {carFilters[c.id]?.selectedVariants.size === uniqueVariants.length ? 'Deselect' : 'Select All'}
//                               </button>
//                             </div>
//                             <div className="space-y-0.5 max-h-20 overflow-y-auto border rounded-lg p-1.5 bg-white">
//                               {uniqueVariants.map(v => (
//                                 <label key={v.id} className="flex items-center gap-1 text-xs cursor-pointer hover:bg-slate-50 px-1 rounded">
//                                   <input
//                                     type="checkbox"
//                                     checked={carFilters[c.id]?.selectedVariants.has(v.id)}
//                                     onChange={() => toggleCarFilter(c.id, 'selectedVariants', v.id)}
//                                     className="rounded border-slate-300 w-3 h-3"
//                                   />
//                                   <span className={carFilters[c.id]?.selectedVariants.has(v.id) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                     {v.name}
//                                   </span>
//                                 </label>
//                               ))}
//                             </div>
//                           </div>
//                         )}

//                         {/* Fuel Type */}
//                         {uniqueFuelTypes.length > 0 && (
//                           <div>
//                             <label className="block text-xs font-semibold text-slate-600 mb-1">Fuel</label>
//                             <div className="space-y-0.5">
//                               {uniqueFuelTypes.map(fuel => (
//                                 <label key={fuel} className="flex items-center gap-1 text-xs cursor-pointer">
//                                   <input
//                                     type="checkbox"
//                                     checked={carFilters[c.id]?.selectedFuelTypes.has(fuel)}
//                                     onChange={() => toggleCarFilter(c.id, 'selectedFuelTypes', fuel)}
//                                     className="rounded border-slate-300 w-3 h-3"
//                                   />
//                                   <span className={carFilters[c.id]?.selectedFuelTypes.has(fuel) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                     {fuel}
//                                   </span>
//                                 </label>
//                               ))}
//                             </div>
//                           </div>
//                         )}

//                         {/* Transmission */}
//                         {uniqueTransmissions.length > 0 && (
//                           <div>
//                             <label className="block text-xs font-semibold text-slate-600 mb-1">Transmission</label>
//                             <div className="space-y-0.5">
//                               {uniqueTransmissions.map(transmission => (
//                                 <label key={transmission} className="flex items-center gap-1 text-xs cursor-pointer">
//                                   <input
//                                     type="checkbox"
//                                     checked={carFilters[c.id]?.selectedTransmissions.has(transmission)}
//                                     onChange={() => toggleCarFilter(c.id, 'selectedTransmissions', transmission)}
//                                     className="rounded border-slate-300 w-3 h-3"
//                                   />
//                                   <span className={carFilters[c.id]?.selectedTransmissions.has(transmission) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                     {transmission}
//                                   </span>
//                                 </label>
//                               ))}
//                             </div>
//                           </div>
//                         )}
//                       </div>

//                       <div className="text-[10px] text-slate-500">
//                         {getFilteredPricingForCar(c.id).length} of {c.pricing.length} shown
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>

//             {/* Combined Chart */}
//             <div className="flex-1 p-6">
//               <ChartView
//                 rawPricing={[]} // Not used in combined mode
//                 chartColor="#6366f1"
//                 formatPriceShort={formatPriceShort}
//                 onPricingClick={(p) => {
//                   const carId = cars[0].pricing?.some(cp => cp.pricing_id === p.pricing_id) ? '1' : '2';
//                   const grouped = groupByVariant(cars[carId === '1' ? 0 : 1].pricing || []);
//                   const variant = grouped.find(v => v.variant_id === p.variant_id);
//                   if (variant) {
//                     setSelectedVariant({ variant, carId });
//                   }
//                 }}
//                 carId="combined"
//                 carName="Combined View"
//                 isCombinedMode={true}
//                 allCarsData={[
//                   { carId: '1', carName: `${cars[0].brand} ${cars[0].model}`, pricing: getFilteredPricingForCar('1'), color: '#2563eb' },
//                   { carId: '2', carName: `${cars[1].brand} ${cars[1].model}`, pricing: getFilteredPricingForCar('2'), color: '#dc2626' }
//                 ]}
//               />
//             </div>
//           </div>
//         ) : (
//           // INDIVIDUAL MODE - Separate views for each car
//           <div className={`flex-1 grid ${carsWithPricing.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-px bg-slate-200 overflow-hidden`}>
//             {cars.map(car => {
//               const filteredPricing = getFilteredPricingForCar(car.id);
//               const chartColor = car.id === '1' ? '#2563eb' : '#dc2626';

//               if (!car.pricing || car.pricing.length === 0) {
//                 return (
//                   <div key={car.id} className="bg-white flex flex-col items-center justify-center text-slate-300 p-10 text-center">
//                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
//                       <LayoutGrid size={32} />
//                     </div>
//                     <p className="font-medium">Configure vehicle {car.id} to view data</p>
//                   </div>
//                 );
//               }

//               const uniqueFuelTypes = Array.from(new Set(car.pricing.map(p => p.fuel_type).filter(Boolean))).sort();
//               const uniqueTransmissions = Array.from(new Set(car.pricing.map(p => p.transmission_type).filter(Boolean))).sort();
//               const uniqueVariants = Array.from(new Map(car.pricing.map(p => [p.variant_id, p.variant_name])).entries()).map(([id, name]) => ({ id, name: name as string })).sort((a, b) => a.name.localeCompare(b.name));

//               return (
//                 <div key={car.id} className="flex flex-col bg-white overflow-hidden">
//                   <div className={`${carColors[car.id as '1' | '2']} text-white p-4 shadow-md z-10`}>
//                     <h3 className="font-bold uppercase tracking-tight">{car.brand} {car.model}</h3>
//                   </div>

//                   {/* Filters above chart */}
//                   <div className="p-3 bg-slate-50 border-b">
//                     <p className="text-xs font-bold text-slate-700 uppercase mb-2">Filters</p>

//                     {/* All filters in one row */}
//                     <div className="grid grid-cols-3 gap-2">
//                       {/* Variant Filter - Checkboxes */}
//                       {uniqueVariants.length > 0 && (
//                         <div>
//                           <div className="flex items-center justify-between mb-1">
//                             <label className="block text-xs font-semibold text-slate-600">Variants</label>
//                             <button
//                               onClick={() => {
//                                 const allSelected = carFilters[car.id]?.selectedVariants.size === uniqueVariants.length;
//                                 updateCarFilter(car.id, 'selectedVariants', allSelected ? new Set() : new Set(uniqueVariants.map(v => v.id)));
//                               }}
//                               className="text-[10px] px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
//                             >
//                               {carFilters[car.id]?.selectedVariants.size === uniqueVariants.length ? 'Deselect' : 'Select All'}
//                             </button>
//                           </div>
//                           <div className="space-y-0.5 max-h-20 overflow-y-auto border rounded-lg p-1.5 bg-white">
//                             {uniqueVariants.map(v => (
//                               <label key={v.id} className="flex items-center gap-1 text-xs cursor-pointer hover:bg-slate-50 px-1 rounded">
//                                 <input
//                                   type="checkbox"
//                                   checked={carFilters[car.id]?.selectedVariants.has(v.id)}
//                                   onChange={() => toggleCarFilter(car.id, 'selectedVariants', v.id)}
//                                   className="rounded border-slate-300 w-3 h-3"
//                                 />
//                                 <span className={carFilters[car.id]?.selectedVariants.has(v.id) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                   {v.name}
//                                 </span>
//                               </label>
//                             ))}
//                           </div>
//                         </div>
//                       )}

//                       {/* Fuel Type */}
//                       {uniqueFuelTypes.length > 0 && (
//                         <div>
//                           <label className="block text-xs font-semibold text-slate-600 mb-1">Fuel Type</label>
//                           <div className="space-y-0.5">
//                             {uniqueFuelTypes.map(fuel => (
//                               <label key={fuel} className="flex items-center gap-1 text-xs cursor-pointer">
//                                 <input
//                                   type="checkbox"
//                                   checked={carFilters[car.id]?.selectedFuelTypes.has(fuel)}
//                                   onChange={() => toggleCarFilter(car.id, 'selectedFuelTypes', fuel)}
//                                   className="rounded border-slate-300 w-3 h-3"
//                                 />
//                                 <span className={carFilters[car.id]?.selectedFuelTypes.has(fuel) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                   {fuel}
//                                 </span>
//                               </label>
//                             ))}
//                           </div>
//                         </div>
//                       )}

//                       {/* Transmission */}
//                       {uniqueTransmissions.length > 0 && (
//                         <div>
//                           <label className="block text-xs font-semibold text-slate-600 mb-1">Transmission</label>
//                           <div className="space-y-0.5">
//                             {uniqueTransmissions.map(transmission => (
//                               <label key={transmission} className="flex items-center gap-1 text-xs cursor-pointer">
//                                 <input
//                                   type="checkbox"
//                                   checked={carFilters[car.id]?.selectedTransmissions.has(transmission)}
//                                   onChange={() => toggleCarFilter(car.id, 'selectedTransmissions', transmission)}
//                                   className="rounded border-slate-300 w-3 h-3"
//                                 />
//                                 <span className={carFilters[car.id]?.selectedTransmissions.has(transmission) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                   {transmission}
//                                 </span>
//                               </label>
//                             ))}
//                           </div>
//                         </div>
//                       )}
//                     </div>

//                     <div className="text-[10px] text-slate-500 mt-2">
//                       {filteredPricing.length} of {car.pricing.length} prices shown
//                     </div>
//                   </div>

//                   <div className="flex-1 overflow-hidden flex flex-col">
//                     {globalViewMode === 'chart' ? (
//                       <div className="flex-1 p-6">
//                         <ChartView
//                           rawPricing={filteredPricing}
//                           chartColor={chartColor}
//                           formatPriceShort={formatPriceShort}
//                           onPricingClick={(p) => {
//                             const grouped = groupByVariant(car.pricing || []);
//                             const variant = grouped.find(v => v.variant_id === p.variant_id);
//                             if (variant) {
//                               setSelectedVariant({ variant, carId: car.id });
//                             }
//                           }}
//                           carId={car.id}
//                           carName={`${car.brand} ${car.model}`}
//                         />
//                       </div>
//                     ) : (
//                       <div className="flex-1 overflow-y-auto">
//                         <TableView
//                           rawPricing={filteredPricing}
//                           formatPrice={formatPrice}
//                           onPricingClick={(p) => {
//                             const grouped = groupByVariant(car.pricing || []);
//                             const variant = grouped.find(v => v.variant_id === p.variant_id);
//                             if (variant) {
//                               setSelectedVariant({ variant, carId: car.id });
//                             }
//                           }}
//                         />
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {selectedVariant && (
//         <VariantModal
//           variant={selectedVariant.variant}
//           brandColor={carColors[selectedVariant.carId as '1' | '2']}
//           onClose={() => setSelectedVariant(null)}
//         />
//       )}
//     </div>
//   );
// };

// export default PriceComparisonPage;

















// import React, { useEffect, useState } from 'react';
// import { X, TrendingUp, List, LayoutGrid } from 'lucide-react';
// import ChartView from '../components/ChartView';
// import TableView from '../components/TableView';
// import DownloadExcelButton from '../components/DownloadExcelButton';
// import DraggableChartView from '../components/DraggableChartView';

// /* ================= TYPES & HELPERS ================= */
// interface CatalogBrand { brand_id: string; brand_name: string; cars: { car_id: string; car_name: string }[]; }
// interface PricingData {
//   variant_id: string;
//   variant_name: string;
//   pricing_id: string;
//   ex_showroom_price: number;
//   currency: string;
//   fuel_type: string | null;
//   engine_type: string | null;
//   transmission_type: string | null;
//   paint_type: string | null;
//   edition: string | null;
//   pricing_version: number;
//   created_at: string;
// }
// interface GroupedVariant { variant_id: string; variant_name: string; avg_price: number; min_price: number; max_price: number; types: { type: string; price: number }[]; }
// interface SelectedCar { id: string; brand: string; model: string; pricing?: PricingData[]; }

// const groupByVariant = (pricing: PricingData[]): GroupedVariant[] => {
//   const grouped = new Map<string, GroupedVariant>();
//   pricing.forEach(p => {
//     if (!grouped.has(p.variant_id)) {
//       grouped.set(p.variant_id, { variant_id: p.variant_id, variant_name: p.variant_name, avg_price: 0, min_price: p.ex_showroom_price, max_price: p.ex_showroom_price, types: [] });
//     }
//     const variant = grouped.get(p.variant_id)!;
//     // Create type label from fuel_type, engine_type, and transmission_type
//     const typeLabel = [p.fuel_type, p.engine_type, p.transmission_type].filter(Boolean).join(' ');
//     variant.types.push({ type: typeLabel || 'Standard', price: p.ex_showroom_price });
//     variant.min_price = Math.min(variant.min_price, p.ex_showroom_price);
//     variant.max_price = Math.max(variant.max_price, p.ex_showroom_price);
//   });
//   return Array.from(grouped.values()).map(v => ({
//     ...v,
//     avg_price: v.types.reduce((sum, t) => sum + t.price, 0) / v.types.length
//   })).sort((a, b) => a.avg_price - b.avg_price);
// };

// const formatPrice = (p: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);
// const formatPriceShort = (p: number) => {
//   if (p >= 10000000) return `₹${(p / 10000000).toFixed(1)}Cr`;
//   if (p >= 100000) return `₹${(p / 100000).toFixed(1)}L`;
//   return `₹${(p / 1000).toFixed(0)}K`;
// };

// /* ================= SHARED COMPONENTS ================= */

// export const CustomTooltip = ({ active, payload }: any) => {
//   if (!active || !payload || !payload.length) return null;

//   const raw = payload[0]?.payload;

//   if (!raw || !raw.variant_name || !Array.isArray(raw.types)) {
//     return null;
//   }

//   const data = raw as GroupedVariant;

//   return (
//     <div className="bg-white border-2 border-slate-300 rounded-lg shadow-xl p-3 max-w-xs pointer-events-none text-xs text-slate-800">
//       <p className="font-bold mb-2">{data.variant_name}</p>

//       <div className="flex justify-between">
//         <span className="text-slate-500">Price Range:</span>
//         <span className="font-bold text-blue-600">
//           {formatPrice(data.min_price)} - {formatPrice(data.max_price)}
//         </span>
//       </div>

//       <div className="flex justify-between mt-1">
//         <span className="text-slate-500">Configurations:</span>
//         <span className="font-bold">{data.types.length}</span>
//       </div>

//       <div className="text-slate-400 text-[10px] mt-2 pt-2 border-t">
//         Click to see all configurations
//       </div>
//     </div>
//   );
// };

// const VariantModal = ({
//   variant,
//   onClose,
//   brandColor
// }: {
//   variant: GroupedVariant | null;
//   onClose: () => void;
//   brandColor: string;
// }) => {
//   if (!variant) return null;

//   return (
//     <div
//       className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
//       onClick={onClose}
//     >
//       <div
//         className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className={`${brandColor} text-white p-5 flex items-start justify-between shrink-0`}>
//           <div>
//             <h3 className="font-bold text-xl">{variant.variant_name}</h3>
//             <p className="text-sm opacity-80">{variant.types.length} Configuration{variant.types.length > 1 ? 's' : ''}</p>
//           </div>
//           <button
//             onClick={onClose}
//             className="hover:bg-white/20 rounded-full p-2 transition-colors"
//           >
//             <X size={20} />
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto">
//           <table className="w-full text-sm">
//             <thead className="sticky top-0 bg-slate-50 border-b">
//               <tr>
//                 <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">
//                   Configuration
//                 </th>
//                 <th className="p-3 text-right text-xs font-bold text-slate-500 uppercase">
//                   Price
//                 </th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-slate-100">
//               {variant.types.map((t, i) => {
//                 return (
//                   <tr key={i} className="hover:bg-slate-50 transition-colors">
//                     <td className="p-3 text-slate-700 font-medium">
//                       {t.type}
//                     </td>

//                     <td className="p-3 text-right font-bold text-slate-900">
//                       {formatPrice(t.price)}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>

//       </div>
//     </div>
//   );
// };

// /* ================= MAIN COMPONENT ================= */

// const PriceComparisonPage = () => {
//   const [catalog, setCatalog] = useState<CatalogBrand[]>([]);
//   const [globalViewMode, setGlobalViewMode] = useState<'chart' | 'table'>('chart');
//   const [cars, setCars] = useState<SelectedCar[]>([
//     { id: '1', brand: 'Maruti', model: 'Grand Vitara' },
//     { id: '2', brand: '', model: '' }
//   ]);
//   const [selectedVariant, setSelectedVariant] = useState<{ variant: GroupedVariant; carId: string } | null>(null);

//   const carColors = { '1': 'bg-blue-600', '2': 'bg-red-600' };

//   useEffect(() => {
//     fetch('http://localhost:8000/api/catalog')
//       .then(r => r.json()).then(d => setCatalog(d.brands))
//       .catch(err => console.error('Catalog Error:', err));
//   }, []);

//   const fetchPricing = async (car: SelectedCar) => {
//     try {
//       const res = await fetch(`http://localhost:8000/v1/pricing?brand_name=${encodeURIComponent(car.brand)}&car_name=${encodeURIComponent(car.model)}`);
//       const data = await res.json();
//       if (data.success && data.pricing) {
//         setCars(p => p.map(c => (c.id === car.id ? { ...c, pricing: data.pricing } : c)));
//       }
//     } catch (err) { console.error('Pricing Error:', err); }
//   };

//   // Auto-fetch pricing for prefilled cars
//   useEffect(() => {
//     if (catalog.length > 0) {
//       cars.forEach(car => {
//         if (car.brand && car.model && !car.pricing) {
//           fetchPricing(car);
//         }
//       });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [catalog, cars.length]);

//   // Auto-prefill vehicle 2 when catalog loads
//   useEffect(() => {
//     if (catalog.length > 0 && cars[1].brand === '' && cars[1].model === '') {
//       // Find a different brand/car for vehicle 2 (not the same as vehicle 1)
//       const vehicle2Brand = catalog.find(b => b.brand_name !== cars[0].brand) || catalog[0];
//       const vehicle2Car = vehicle2Brand?.cars[0];

//       if (vehicle2Brand && vehicle2Car) {
//         setCars(prev => prev.map(c =>
//           c.id === '2'
//             ? { ...c, brand: vehicle2Brand.brand_name, model: vehicle2Car.car_name }
//             : c
//         ));
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [catalog]);

//   const updateCar = (id: string, key: 'brand' | 'model', value: string) => {
//     setCars(p => p.map(c => {
//       if (c.id !== id) return c;
//       const updated = { ...c, [key]: value, ...(key === 'brand' && { model: '', pricing: undefined }) };
//       if (key === 'model' && updated.brand && value) fetchPricing(updated);
//       return updated;
//     }));
//   };

//   // Filter state for each car
//   interface CarFilters {
//     selectedFuelTypes: Set<string>;
//     selectedTransmissions: Set<string>;
//     selectedVariants: Set<string>;
//     selectedPaintTypes: Set<string>;  // ADD THIS
//     selectedEditions: Set<string>;
//   }

//   const [carFilters, setCarFilters] = useState<Record<string, CarFilters>>({
//     '1': { selectedFuelTypes: new Set<string>(), selectedTransmissions: new Set<string>(), selectedVariants: new Set<string>(), selectedPaintTypes: new Set<string>(), selectedEditions: new Set<string>() },
//     '2': { selectedFuelTypes: new Set<string>(), selectedTransmissions: new Set<string>(), selectedVariants: new Set<string>(), selectedPaintTypes: new Set<string>(), selectedEditions: new Set<string>() }
//   });

//   // Initialize filters when pricing data is loaded
//   React.useEffect(() => {
//     cars.forEach(car => {
//       if (car.pricing && car.pricing.length > 0) {
//         const uniqueFuelTypes = Array.from(new Set(car.pricing.map(p => p.fuel_type).filter(Boolean)));
//         const uniqueTransmissions = Array.from(new Set(car.pricing.map(p => p.transmission_type).filter(Boolean)));
//         const uniqueVariants = Array.from(new Set(car.pricing.map(p => p.variant_id)));
//         const uniquePaintTypes = Array.from(new Set(car.pricing.map(p => p.paint_type).filter(Boolean)));
//         const uniqueEditions = Array.from(new Set(car.pricing.map(p => p.edition).filter(Boolean)));
//         setCarFilters(prev => ({
//           ...prev,
//           [car.id]: {
//             selectedFuelTypes: new Set(uniqueFuelTypes as string[]),
//             selectedTransmissions: new Set(uniqueTransmissions as string[]),
//             selectedVariants: new Set(uniqueVariants),
//             selectedPaintTypes: new Set(uniquePaintTypes),
//             selectedEditions: new Set(uniqueEditions)
//           }
//         }));
//       }
//     });
//   }, [cars.map(c => c.pricing?.length).join(',')]);

//   // Toggle a single filter value
//   const toggleCarFilter = (carId: string, filterType: keyof CarFilters, value: string) => {
//     setCarFilters(prev => {
//       const carFilter = prev[carId];
//       const filterSet = new Set(carFilter[filterType]);

//       if (filterSet.has(value)) {
//         filterSet.delete(value);
//       } else {
//         filterSet.add(value);
//       }

//       return {
//         ...prev,
//         [carId]: {
//           ...carFilter,
//           [filterType]: filterSet
//         }
//       };
//     });
//   };

//   // Update entire filter set
//   const updateCarFilter = (carId: string, filterType: keyof CarFilters, newSet: Set<string>) => {
//     setCarFilters(prev => ({
//       ...prev,
//       [carId]: {
//         ...prev[carId],
//         [filterType]: newSet
//       }
//     }));
//   };

//   // Get filtered pricing for a car
//   const getFilteredPricingForCar = (carId: string): PricingData[] => {
//     const car = cars.find(c => c.id === carId);
//     if (!car || !car.pricing) return [];

//     const filters = carFilters[carId];
//     if (!filters) return car.pricing;

//     return car.pricing.filter(p => {
//       const fuelMatch = !p.fuel_type || filters.selectedFuelTypes.has(p.fuel_type);
//       const transmissionMatch = !p.transmission_type || filters.selectedTransmissions.has(p.transmission_type);
//       const variantMatch = filters.selectedVariants.has(p.variant_id);
//       const paintMatch = !p.paint_type || filters.selectedPaintTypes.has(p.paint_type);
//       const editionMatch = !p.edition || filters.selectedEditions.has(p.edition);
//       return fuelMatch && transmissionMatch && variantMatch && paintMatch && editionMatch;
//     });
//   };

//   // Check if we should show combined stacked bar - auto-detect based on loaded cars
//   const carsWithPricing = cars.filter(c => c.pricing && c.pricing.length > 0);
//   const bothCarsLoaded = carsWithPricing.length === 2;
//   const showCombinedView = bothCarsLoaded && globalViewMode === 'chart';

//   return (
//     <div className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-col">
//       {/* TOP NAV */}
//       <div className="h-14 flex items-center justify-between px-6 bg-white border-b z-10">

//         <div className="flex bg-slate-100 p-1 rounded-xl border">
//           <button
//             onClick={() => setGlobalViewMode('chart')}
//             className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${globalViewMode === 'chart' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
//           >
//             <TrendingUp size={16} /> Chart
//           </button>
//           <button
//             onClick={() => setGlobalViewMode('table')}
//             className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${globalViewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
//           >
//             <List size={16} /> Table
//           </button>
//           <div className="w-px h-6 bg-slate-200 mx-1"></div>
//           <DownloadExcelButton
//             carsData={cars
//               .filter(c => c.brand && c.model && c.pricing && c.pricing.length > 0)
//               .map(c => ({
//                 brand: c.brand,
//                 model: c.model,
//                 data: getFilteredPricingForCar(c.id)
//               }))
//             }
//           />
//         </div>
//       </div>

//       <div className="flex-1 flex overflow-hidden">
//         {/* SIDEBAR */}
//         <div className="w-80 bg-white border-r p-6 space-y-6 overflow-y-auto">
//           <div className="space-y-4">
//             <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Vehicle Selection</p>
//             {cars.map((c, idx) => {
//               const brand = catalog.find(b => b.brand_name === c.brand);

//               return (
//                 <div key={c.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
//                   <div className="flex items-center gap-2 mb-2">
//                     <div className={`w-6 h-6 ${carColors[c.id as '1' | '2']} rounded-md flex items-center justify-center text-white font-bold text-[10px]`}>{idx + 1}</div>
//                     <span className="font-bold text-slate-800 text-sm">Vehicle {idx + 1}</span>
//                   </div>

//                   {/* Brand Selection */}
//                   <select
//                     className="w-full bg-white border rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
//                     value={c.brand}
//                     onChange={e => updateCar(c.id, 'brand', e.target.value)}
//                   >
//                     <option value="">Select Brand</option>
//                     {catalog.map(b => <option key={b.brand_id} value={b.brand_name}>{b.brand_name}</option>)}
//                   </select>

//                   {/* Model Selection */}
//                   <select
//                     className="w-full bg-white border rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
//                     value={c.model}
//                     disabled={!c.brand}
//                     onChange={e => updateCar(c.id, 'model', e.target.value)}
//                   >
//                     <option value="">Select Model</option>
//                     {brand?.cars.map(m => <option key={m.car_id} value={m.car_name}>{m.car_name}</option>)}
//                   </select>

//                   {/* Status indicator */}
//                   {c.pricing && c.pricing.length > 0 && (
//                     <div className="pt-3 border-t text-xs text-green-600 flex items-center gap-2">
//                       <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
//                       <span className="font-medium">{c.pricing.length} prices loaded</span>
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* MAIN VIEW AREA */}
//         {carsWithPricing.length === 2 && globalViewMode === 'chart' ? (
//           // COMBINED MODE - Both cars on same axis
//           <div className="flex-1 bg-white overflow-hidden flex flex-col">
//             <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-md z-10">
//               <div className="flex items-center gap-4 justify-center">
//                 <h3 className="font-bold uppercase tracking-tight">{cars[0].brand} {cars[0].model}</h3>
//                 <span className="text-white/60">vs</span>
//                 <h3 className="font-bold uppercase tracking-tight">{cars[1].brand} {cars[1].model}</h3>
//               </div>
//             </div>

//             {/* Combined Filters */}
//             <div className="p-2 bg-slate-50 border-b">
//               <div className="grid grid-cols-2 gap-4">
//                 {cars.map(c => {
//                   if (!c.pricing) return null;

//                   const uniqueFuelTypes = Array.from(new Set(c.pricing.map(p => p.fuel_type).filter(Boolean))).sort();
//                   const uniqueTransmissions = Array.from(new Set(c.pricing.map(p => p.transmission_type).filter(Boolean))).sort();
//                   const uniqueVariants = Array.from(new Map(c.pricing.map(p => [p.variant_id, p.variant_name])).entries()).map(([id, name]) => ({ id, name: name as string })).sort((a, b) => a.name.localeCompare(b.name));
//                   const uniquePaintTypes = Array.from(new Set(c.pricing.map(p => p.paint_type).filter(Boolean))).sort();
//                   const uniqueEditions = Array.from(new Set(c.pricing.map(p => p.edition).filter(Boolean))).sort();

//                   return (
//                     <div key={c.id} className="space-y-2">
//                       <p className="text-xs font-bold text-slate-700 uppercase">{c.brand} {c.model} Filters</p>

//                       {/* All filters in one row */}
//                       <div className="grid grid-cols-5 gap-1.5">
//                         {/* Variant Filter - Checkboxes */}
//                         {uniqueVariants.length > 0 && (
//                           <div>
//                             <div className="flex items-center justify-between mb-1">
//                               <label className="block text-xs font-semibold text-slate-600">Variants</label>
//                               <button
//                                 onClick={() => {
//                                   const allSelected = carFilters[c.id]?.selectedVariants.size === uniqueVariants.length;
//                                   updateCarFilter(c.id, 'selectedVariants', allSelected ? new Set() : new Set(uniqueVariants.map(v => v.id)));
//                                 }}
//                                 className="text-[10px] px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
//                               >
//                                 {carFilters[c.id]?.selectedVariants.size === uniqueVariants.length ? 'Deselect' : 'Select All'}
//                               </button>
//                             </div>
//                             <div className="space-y-0.5 max-h-16 overflow-y-auto border rounded-lg p-1 bg-white">
//                               {uniqueVariants.map(v => (
//                                 <label key={v.id} className="flex items-center gap-1 text-xs cursor-pointer hover:bg-slate-50 px-1 rounded">
//                                   <input
//                                     type="checkbox"
//                                     checked={carFilters[c.id]?.selectedVariants.has(v.id)}
//                                     onChange={() => toggleCarFilter(c.id, 'selectedVariants', v.id)}
//                                     className="rounded border-slate-300 w-3 h-3"
//                                   />
//                                   <span className={carFilters[c.id]?.selectedVariants.has(v.id) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                     {v.name}
//                                   </span>
//                                 </label>
//                               ))}
//                             </div>
//                           </div>
//                         )}

//                         {/* Fuel Type */}
//                         {uniqueFuelTypes.length > 0 && (
//                           <div>
//                             <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Fuel</label>
//                             <div className="space-y-0.5">
//                               {uniqueFuelTypes.map(fuel => (
//                                 <label key={fuel} className="flex items-center gap-1 text-xs cursor-pointer">
//                                   <input
//                                     type="checkbox"
//                                     checked={carFilters[c.id]?.selectedFuelTypes.has(fuel)}
//                                     onChange={() => toggleCarFilter(c.id, 'selectedFuelTypes', fuel)}
//                                     className="rounded border-slate-300 w-3 h-3"
//                                   />
//                                   <span className={carFilters[c.id]?.selectedFuelTypes.has(fuel) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                     {fuel}
//                                   </span>
//                                 </label>
//                               ))}
//                             </div>
//                           </div>
//                         )}

//                         {/* Transmission */}
//                         {uniqueTransmissions.length > 0 && (
//                           <div>
//                             <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Transmission</label>
//                             <div className="space-y-0.5">
//                               {uniqueTransmissions.map(transmission => (
//                                 <label key={transmission} className="flex items-center gap-1 text-xs cursor-pointer">
//                                   <input
//                                     type="checkbox"
//                                     checked={carFilters[c.id]?.selectedTransmissions.has(transmission)}
//                                     onChange={() => toggleCarFilter(c.id, 'selectedTransmissions', transmission)}
//                                     className="rounded border-slate-300 w-3 h-3"
//                                   />
//                                   <span className={carFilters[c.id]?.selectedTransmissions.has(transmission) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                     {transmission}
//                                   </span>
//                                 </label>
//                               ))}
//                             </div>
//                           </div>
//                         )}

//                         {/* Paint Type */}
//                         {uniquePaintTypes.length > 0 && (
//                           <div>
//                             <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Paint</label>
//                             <div className="space-y-0.5">
//                               {uniquePaintTypes.map(paint => (
//                                 <label key={paint} className="flex items-center gap-1 text-xs cursor-pointer">
//                                   <input
//                                     type="checkbox"
//                                     checked={carFilters[c.id]?.selectedPaintTypes.has(paint)}
//                                     onChange={() => toggleCarFilter(c.id, 'selectedPaintTypes', paint)}
//                                     className="rounded border-slate-300 w-3 h-3"
//                                   />
//                                   <span className={carFilters[c.id]?.selectedPaintTypes.has(paint) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                     {paint}
//                                   </span>
//                                 </label>
//                               ))}
//                             </div>
//                           </div>
//                         )}

//                         {/* Edition */}
//                         {uniqueEditions.length > 0 && (
//                           <div>
//                             <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Edition</label>
//                             <div className="space-y-0.5">
//                               {uniqueEditions.map(edition => (
//                                 <label key={edition} className="flex items-center gap-1 text-xs cursor-pointer">
//                                   <input
//                                     type="checkbox"
//                                     checked={carFilters[c.id]?.selectedEditions.has(edition)}
//                                     onChange={() => toggleCarFilter(c.id, 'selectedEditions', edition)}
//                                     className="rounded border-slate-300 w-3 h-3"
//                                   />
//                                   <span className={carFilters[c.id]?.selectedEditions.has(edition) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                     {edition}
//                                   </span>
//                                 </label>
//                               ))}
//                             </div>
//                           </div>
//                         )}
//                       </div>

//                       <div className="text-[10px] text-slate-500">
//                         {getFilteredPricingForCar(c.id).length} of {c.pricing.length} shown
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>

//             {/* Combined Chart with Drag & Drop */}
//             <div className="flex-1 p-6">
//               <ChartView
//                 rawPricing={getFilteredPricingForCar('1')}
//                 chartColor="#2563eb"
//                 formatPriceShort={formatPriceShort}
//                 onPricingClick={(p) => {
//                   const carId = cars[0].pricing?.some(cp => cp.pricing_id === p.pricing_id) ? '1' : '2';
//                   const grouped = groupByVariant(cars[carId === '1' ? 0 : 1].pricing || []);
//                   const variant = grouped.find(v => v.variant_id === p.variant_id);
//                   if (variant) {
//                     setSelectedVariant({ variant, carId });
//                   }
//                 }}
//                 carId="1"
//                 carName={`${cars[0].brand} ${cars[0].model}`}
//                 isCombinedMode={true}
//                 allCarsData={[
//                   { carId: '1', carName: `${cars[0].brand} ${cars[0].model}`, pricing: getFilteredPricingForCar('1'), color: '#2563eb' },
//                   { carId: '2', carName: `${cars[1].brand} ${cars[1].model}`, pricing: getFilteredPricingForCar('2'), color: '#dc2626' }
//                 ]}
//                 onOrderChange={(newOrder) => {
//                   console.log('New car order:', newOrder);
//                 }}
//               />
//             </div>
//           </div>
//         ) : (
//           // INDIVIDUAL MODE - Separate views for each car
//           <div className={`flex-1 grid ${carsWithPricing.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-px bg-slate-200 overflow-hidden`}>
//             {cars.map(car => {
//               const filteredPricing = getFilteredPricingForCar(car.id);
//               const chartColor = car.id === '1' ? '#2563eb' : '#dc2626';

//               if (!car.pricing || car.pricing.length === 0) {
//                 return (
//                   <div key={car.id} className="bg-white flex flex-col items-center justify-center text-slate-300 p-10 text-center">
//                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
//                       <LayoutGrid size={32} />
//                     </div>
//                     <p className="font-medium">Configure vehicle {car.id} to view data</p>
//                   </div>
//                 );
//               }

//               const uniqueFuelTypes = Array.from(new Set(car.pricing.map(p => p.fuel_type).filter(Boolean))).sort();
//               const uniqueTransmissions = Array.from(new Set(car.pricing.map(p => p.transmission_type).filter(Boolean))).sort();
//               const uniqueVariants = Array.from(new Map(car.pricing.map(p => [p.variant_id, p.variant_name])).entries()).map(([id, name]) => ({ id, name: name as string })).sort((a, b) => a.name.localeCompare(b.name));
//               const uniquePaintTypes = Array.from(new Set(car.pricing.map(p => p.paint_type).filter(Boolean))).sort();  // ADD THIS
//               const uniqueEditions = Array.from(new Set(car.pricing.map(p => p.edition).filter(Boolean))).sort();      // ADD THIS
//               return (
//                 <div key={car.id} className="flex flex-col bg-white overflow-hidden">
//                   <div className={`${carColors[car.id as '1' | '2']} text-white p-4 shadow-md z-10`}>
//                     <h3 className="font-bold uppercase tracking-tight">{car.brand} {car.model}</h3>
//                   </div>

//                   {/* Filters above chart */}
//                   <div className="p-3 bg-slate-50 border-b">
//                     <p className="text-xs font-bold text-slate-700 uppercase mb-2">Filters</p>

//                     {/* All filters in one row */}
//                     <div className="grid grid-cols-5 gap-2">
//                       {/* Variant Filter - Checkboxes */}
//                       {uniqueVariants.length > 0 && (
//                         <div>
//                           <div className="flex items-center justify-between mb-1">
//                             <label className="block text-xs font-semibold text-slate-600">Variants</label>
//                             <button
//                               onClick={() => {
//                                 const allSelected = carFilters[car.id]?.selectedVariants.size === uniqueVariants.length;
//                                 updateCarFilter(car.id, 'selectedVariants', allSelected ? new Set() : new Set(uniqueVariants.map(v => v.id)));
//                               }}
//                               className="text-[10px] px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
//                             >
//                               {carFilters[car.id]?.selectedVariants.size === uniqueVariants.length ? 'Deselect' : 'Select All'}
//                             </button>
//                           </div>
//                           <div className="space-y-0.5 max-h-20 overflow-y-auto border rounded-lg p-1.5 bg-white">
//                             {uniqueVariants.map(v => (
//                               <label key={v.id} className="flex items-center gap-1 text-xs cursor-pointer hover:bg-slate-50 px-1 rounded">
//                                 <input
//                                   type="checkbox"
//                                   checked={carFilters[car.id]?.selectedVariants.has(v.id)}
//                                   onChange={() => toggleCarFilter(car.id, 'selectedVariants', v.id)}
//                                   className="rounded border-slate-300 w-3 h-3"
//                                 />
//                                 <span className={carFilters[car.id]?.selectedVariants.has(v.id) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                   {v.name}
//                                 </span>
//                               </label>
//                             ))}
//                           </div>
//                         </div>
//                       )}

//                       {/* Fuel Type */}
//                       {uniqueFuelTypes.length > 0 && (
//                         <div>
//                           <label className="block text-xs font-semibold text-slate-600 mb-1">Fuel Type</label>
//                           <div className="space-y-0.5">
//                             {uniqueFuelTypes.map(fuel => (
//                               <label key={fuel} className="flex items-center gap-1 text-xs cursor-pointer">
//                                 <input
//                                   type="checkbox"
//                                   checked={carFilters[car.id]?.selectedFuelTypes.has(fuel)}
//                                   onChange={() => toggleCarFilter(car.id, 'selectedFuelTypes', fuel)}
//                                   className="rounded border-slate-300 w-3 h-3"
//                                 />
//                                 <span className={carFilters[car.id]?.selectedFuelTypes.has(fuel) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                   {fuel}
//                                 </span>
//                               </label>
//                             ))}
//                           </div>
//                         </div>
//                       )}

//                       {/* Transmission */}
//                       {uniqueTransmissions.length > 0 && (
//                         <div>
//                           <label className="block text-xs font-semibold text-slate-600 mb-1">Transmission</label>
//                           <div className="space-y-0.5">
//                             {uniqueTransmissions.map(transmission => (
//                               <label key={transmission} className="flex items-center gap-1 text-xs cursor-pointer">
//                                 <input
//                                   type="checkbox"
//                                   checked={carFilters[car.id]?.selectedTransmissions.has(transmission)}
//                                   onChange={() => toggleCarFilter(car.id, 'selectedTransmissions', transmission)}
//                                   className="rounded border-slate-300 w-3 h-3"
//                                 />
//                                 <span className={carFilters[car.id]?.selectedTransmissions.has(transmission) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                   {transmission}
//                                 </span>
//                               </label>
//                             ))}
//                           </div>
//                         </div>
//                       )}
//                       {/* Paint Type */}
//                       {uniquePaintTypes.length > 0 && (
//                         <div>
//                           <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Paint</label>
//                           <div className="space-y-0.5">
//                             {uniquePaintTypes.map(paint => (
//                               <label key={paint} className="flex items-center gap-1 text-xs cursor-pointer">
//                                 <input
//                                   type="checkbox"
//                                   checked={carFilters[car.id]?.selectedPaintTypes.has(paint)}
//                                   onChange={() => toggleCarFilter(car.id, 'selectedPaintTypes', paint)}
//                                   className="rounded border-slate-300 w-3 h-3"
//                                 />
//                                 <span className={carFilters[car.id]?.selectedPaintTypes.has(paint) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                   {paint}
//                                 </span>
//                               </label>
//                             ))}
//                           </div>
//                         </div>
//                       )}

//                       {/* Edition */}
//                       {uniqueEditions.length > 0 && (
//                         <div>
//                           <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Edition</label>
//                           <div className="space-y-0.5">
//                             {uniqueEditions.map(edition => (
//                               <label key={edition} className="flex items-center gap-1 text-xs cursor-pointer">
//                                 <input
//                                   type="checkbox"
//                                   checked={carFilters[car.id]?.selectedEditions.has(edition)}
//                                   onChange={() => toggleCarFilter(car.id, 'selectedEditions', edition)}
//                                   className="rounded border-slate-300 w-3 h-3"
//                                 />
//                                 <span className={carFilters[car.id]?.selectedEditions.has(edition) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                   {edition}
//                                 </span>
//                               </label>
//                             ))}
//                           </div>
//                         </div>
//                       )}
//                     </div>

//                     <div className="text-[10px] text-slate-500 mt-2">
//                       {filteredPricing.length} of {car.pricing.length} prices shown
//                     </div>
//                   </div>

//                   <div className="flex-1 overflow-hidden flex flex-col">
//                     {globalViewMode === 'chart' ? (
//                       <div className="flex-1 p-6">
//                         <ChartView
//                           rawPricing={filteredPricing}
//                           chartColor={chartColor}
//                           formatPriceShort={formatPriceShort}
//                           onPricingClick={(p) => {
//                             const grouped = groupByVariant(car.pricing || []);
//                             const variant = grouped.find(v => v.variant_id === p.variant_id);
//                             if (variant) {
//                               setSelectedVariant({ variant, carId: car.id });
//                             }
//                           }}
//                           carId={car.id}
//                           carName={`${car.brand} ${car.model}`}
//                         />
//                       </div>
//                     ) : (
//                       <div className="flex-1 overflow-y-auto">
//                         <TableView
//                           rawPricing={filteredPricing}
//                           formatPrice={formatPrice}
//                           onPricingClick={(p) => {
//                             const grouped = groupByVariant(car.pricing || []);
//                             const variant = grouped.find(v => v.variant_id === p.variant_id);
//                             if (variant) {
//                               setSelectedVariant({ variant, carId: car.id });
//                             }
//                           }}
//                         />
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>

//       {selectedVariant && (
//         <VariantModal
//           variant={selectedVariant.variant}
//           brandColor={carColors[selectedVariant.carId as '1' | '2']}
//           onClose={() => setSelectedVariant(null)}
//         />
//       )}
//     </div>
//   );
// };

// export default PriceComparisonPage;


import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp, List, LayoutGrid, ChevronDown } from 'lucide-react';
import ChartView from '../components/ChartView';
import TableView from '../components/TableView';
import DownloadExcelButton from '../components/DownloadExcelButton';
import DraggableChartView from '../components/DraggableChartView';

/* ================= TYPES & HELPERS ================= */
interface CatalogBrand { brand_id: string; brand_name: string; cars: { car_id: string; car_name: string }[]; }
interface PricingData {
  variant_id: string;
  variant_name: string;
  pricing_id: string;
  ex_showroom_price: number;
  currency: string;
  fuel_type: string | null;
  engine_type: string | null;
  transmission_type: string | null;
  paint_type: string | null;
  edition: string | null;
  pricing_version: number;
  created_at: string;
}
interface GroupedVariant { variant_id: string; variant_name: string; avg_price: number; min_price: number; max_price: number; types: { type: string; price: number }[]; }
interface SelectedCar { id: string; brand: string; model: string; pricing?: PricingData[]; }

// FIX 1: Use environment variable or relative API URL instead of localhost
const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;
const groupByVariant = (pricing: PricingData[]): GroupedVariant[] => {
  const grouped = new Map<string, GroupedVariant>();
  pricing.forEach(p => {
    if (!grouped.has(p.variant_id)) {
      grouped.set(p.variant_id, { variant_id: p.variant_id, variant_name: p.variant_name, avg_price: 0, min_price: p.ex_showroom_price, max_price: p.ex_showroom_price, types: [] });
    }
    const variant = grouped.get(p.variant_id)!;
    const typeLabel = [p.fuel_type, p.engine_type, p.transmission_type].filter(Boolean).join(' ');
    variant.types.push({ type: typeLabel || 'Standard', price: p.ex_showroom_price });
    variant.min_price = Math.min(variant.min_price, p.ex_showroom_price);
    variant.max_price = Math.max(variant.max_price, p.ex_showroom_price);
  });
  return Array.from(grouped.values()).map(v => ({
    ...v,
    avg_price: v.types.reduce((sum, t) => sum + t.price, 0) / v.types.length
  })).sort((a, b) => a.avg_price - b.avg_price);
};

const formatPrice = (p: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);
const formatPriceShort = (p: number) => {
  if (p >= 10000000) return `₹${(p / 10000000).toFixed(1)}Cr`;
  if (p >= 100000) return `₹${(p / 100000).toFixed(1)}L`;
  return `₹${(p / 1000).toFixed(0)}K`;
};

/* ================= SHARED COMPONENTS ================= */

export const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const raw = payload[0]?.payload;

  if (!raw || !raw.variant_name || !Array.isArray(raw.types)) {
    return null;
  }

  const data = raw as GroupedVariant;

  return (
    <div className="bg-white border-2 border-slate-300 rounded-lg shadow-xl p-3 max-w-xs pointer-events-none text-xs text-slate-800">
      <p className="font-bold mb-2">{data.variant_name}</p>

      <div className="flex justify-between">
        <span className="text-slate-500">Price Range:</span>
        <span className="font-bold text-blue-600">
          {formatPrice(data.min_price)} - {formatPrice(data.max_price)}
        </span>
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-slate-500">Configurations:</span>
        <span className="font-bold">{data.types.length}</span>
      </div>

      <div className="text-slate-400 text-[10px] mt-2 pt-2 border-t">
        Click to see all configurations
      </div>
    </div>
  );
};

const VariantModal = ({
  variant,
  onClose,
  brandColor
}: {
  variant: GroupedVariant | null;
  onClose: () => void;
  brandColor: string;
}) => {
  if (!variant) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${brandColor} text-white p-5 flex items-start justify-between shrink-0`}>
          <div>
            <h3 className="font-bold text-xl">{variant.variant_name}</h3>
            <p className="text-sm opacity-80">{variant.types.length} Configuration{variant.types.length > 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b">
              <tr>
                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">
                  Configuration
                </th>
                <th className="p-3 text-right text-xs font-bold text-slate-500 uppercase">
                  Price
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {variant.types.map((t, i) => {
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-700 font-medium">
                      {t.type}
                    </td>

                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatPrice(t.price)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */

const PriceComparisonPage = () => {
  const [catalog, setCatalog] = useState<CatalogBrand[]>([]);
  const [globalViewMode, setGlobalViewMode] = useState<'chart' | 'table'>('chart');
  const [cars, setCars] = useState<SelectedCar[]>([
    { id: '1', brand: 'Maruti', model: 'Grand Vitara' },
    { id: '2', brand: '', model: '' }
  ]);
  const [selectedVariant, setSelectedVariant] = useState<{ variant: GroupedVariant; carId: string } | null>(null);
  const [domReady, setDomReady] = useState(false);
  // FIX 2: Add loading state to prevent premature API calls
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  const carColors = { '1': 'bg-blue-600', '2': 'bg-red-600' };

  // Common filters for both cars
  interface CommonFilters {
    selectedFuelTypes: Set<string>;
    selectedTransmissions: Set<string>;
    selectedVariants: Set<string>;
    selectedPaintTypes: Set<string>;
    selectedEditions: Set<string>;
  }

  const [commonFilters, setCommonFilters] = useState<CommonFilters>({
    selectedFuelTypes: new Set<string>(),
    selectedTransmissions: new Set<string>(),
    selectedVariants: new Set<string>(),
    selectedPaintTypes: new Set<string>(),
    selectedEditions: new Set<string>()
  });

  useEffect(() => {
    setDomReady(true);
  }, []);

  // FIX 3: Fixed API URL and added proper error handling
  useEffect(() => {
    fetch(`${API_BASE_URL}/catalog`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        return r.json();
      })
      .then(d => {
        setCatalog(d.brands);
        setCatalogLoaded(true);
      })
      .catch(err => console.error('Catalog Error:', err));
  }, []);

  // FIX 4: Fixed API URL
  const fetchPricing = async (car: SelectedCar) => {
    try {
      const res = await fetch(`${API_BASE_URL}/v1/pricing?brand_name=${encodeURIComponent(car.brand)}&car_name=${encodeURIComponent(car.model)}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.success && data.pricing) {
        setCars(p => p.map(c => (c.id === car.id ? { ...c, pricing: data.pricing } : c)));
      }
    } catch (err) {
      console.error('Pricing Error:', err);
    }
  };

  // FIX 5: Fixed hook dependencies - only run when catalog is loaded
  useEffect(() => {
    if (!catalogLoaded) return;

    cars.forEach(car => {
      if (car.brand && car.model && !car.pricing) {
        fetchPricing(car);
      }
    });
  }, [catalogLoaded, cars.map(c => `${c.id}-${c.brand}-${c.model}-${!!c.pricing}`).join(',')]);

  // FIX 6: Fixed hook dependencies - only run once when catalog loads
  useEffect(() => {
    if (!catalogLoaded || catalog.length === 0) return;
    if (cars[1].brand !== '' || cars[1].model !== '') return;

    const vehicle2Brand = catalog.find(b => b.brand_name !== cars[0].brand) || catalog[0];
    const vehicle2Car = vehicle2Brand?.cars[0];

    if (vehicle2Brand && vehicle2Car) {
      setCars(prev => prev.map(c =>
        c.id === '2'
          ? { ...c, brand: vehicle2Brand.brand_name, model: vehicle2Car.car_name }
          : c
      ));
    }
  }, [catalogLoaded, catalog.length]);

  const updateCar = (id: string, key: 'brand' | 'model', value: string) => {
    setCars(p => p.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [key]: value, ...(key === 'brand' && { model: '', pricing: undefined }) };
      if (key === 'model' && updated.brand && value) fetchPricing(updated);
      return updated;
    }));
  };

  // FIX 7: Fixed hook dependencies
  useEffect(() => {
    const allPricing = cars.flatMap(c => c.pricing || []);
    if (allPricing.length === 0) return;

    const uniqueFuelTypes: string[] = Array.from(new Set(allPricing.map(p => p.fuel_type).filter((t): t is string => !!t)));
    const uniqueTransmissions: string[] = Array.from(new Set(allPricing.map(p => p.transmission_type).filter((t): t is string => !!t)));
    const uniqueVariants: string[] = Array.from(new Set(allPricing.map(p => p.variant_id)));
    const uniquePaintTypes: string[] = Array.from(new Set(allPricing.map(p => p.paint_type).filter((t): t is string => !!t)));
    const uniqueEditions: string[] = Array.from(new Set(allPricing.map(p => p.edition).filter((t): t is string => !!t)));

    const defaultFuel = uniqueFuelTypes.filter((f) => f.toLowerCase() === 'petrol');
    const defaultTrans = uniqueTransmissions.filter((t) => ['at', 'dct', 'ivt'].includes(t.toLowerCase()));
    const defaultPaint = uniquePaintTypes.filter((p) => ['dual tone', 'dual_tone'].includes(p.toLowerCase()));
    const defaultEdition = uniqueEditions.filter((e) => ['limited edition', 'limited_edition'].includes(e.toLowerCase()));

    setCommonFilters({
      selectedFuelTypes: new Set(defaultFuel.length > 0 ? defaultFuel : uniqueFuelTypes),
      selectedTransmissions: new Set(defaultTrans.length > 0 ? defaultTrans : uniqueTransmissions),
      selectedVariants: new Set(uniqueVariants),
      selectedPaintTypes: new Set(defaultPaint.length > 0 ? defaultPaint : uniquePaintTypes),
      selectedEditions: new Set(defaultEdition.length > 0 ? defaultEdition : uniqueEditions)
    });
  }, [cars.map(c => c.pricing?.length || 0).join(',')]);

  // Toggle a single filter value
  const toggleCommonFilter = (filterType: keyof CommonFilters, value: string) => {
    setCommonFilters(prev => {
      const filterSet = new Set(prev[filterType]);

      if (filterSet.has(value)) {
        filterSet.delete(value);
      } else {
        filterSet.add(value);
      }

      return {
        ...prev,
        [filterType]: filterSet
      };
    });
  };

  // Update entire filter set
  const updateCommonFilter = (filterType: keyof CommonFilters, newSet: Set<string>) => {
    setCommonFilters(prev => ({
      ...prev,
      [filterType]: newSet
    }));
  };

  // Get filtered pricing for a car using common filters
  const getFilteredPricingForCar = (carId: string): PricingData[] => {
    const car = cars.find(c => c.id === carId);
    if (!car || !car.pricing) return [];

    return car.pricing.filter(p => {
      const fuelMatch = !p.fuel_type || commonFilters.selectedFuelTypes.has(p.fuel_type);
      const transmissionMatch = !p.transmission_type || commonFilters.selectedTransmissions.has(p.transmission_type);
      const variantMatch = commonFilters.selectedVariants.has(p.variant_id);
      const paintMatch = !p.paint_type || commonFilters.selectedPaintTypes.has(p.paint_type);
      const editionMatch = !p.edition || commonFilters.selectedEditions.has(p.edition);
      return fuelMatch && transmissionMatch && variantMatch && paintMatch && editionMatch;
    });
  };

  // Check if we should show combined stacked bar - auto-detect based on loaded cars
  const carsWithPricing = cars.filter(c => c.pricing && c.pricing.length > 0);
  const bothCarsLoaded = carsWithPricing.length === 2;
  const showCombinedView = bothCarsLoaded && globalViewMode === 'chart';

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-col">
      {/* TOP NAV - Moved Action Buttons to Header via Portal */}
      <div className="hidden" />
      {/* FIX 8: Added null check for portal target */}
      {domReady && typeof document !== 'undefined' && document.getElementById('header-action-bar') && createPortal(
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border">
            <button
              onClick={() => setGlobalViewMode('chart')}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all ${globalViewMode === 'chart' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <TrendingUp size={14} /> Chart
            </button>
            <button
              onClick={() => setGlobalViewMode('table')}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all ${globalViewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={14} /> Table
            </button>
          </div>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <DownloadExcelButton
            carsData={cars
              .filter(c => c.brand && c.model && c.pricing && c.pricing.length > 0)
              .map(c => ({
                brand: c.brand,
                model: c.model,
                data: getFilteredPricingForCar(c.id)
              }))
            }
          />
        </div>,
        document.getElementById('header-action-bar')!
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-96 bg-white border-r p-4 space-y-4 overflow-y-auto">
          {/* Vehicle Selection - Compact Horizontal Layout */}
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Vehicle Selection</p>

            {cars.map((c, idx) => {
              const brand = catalog.find(b => b.brand_name === c.brand);
              const carVariants = c.pricing ? Array.from(new Map(c.pricing.map(p => [p.variant_id, p.variant_name])).entries()).map(([id, name]: [string, unknown]) => ({ id, name: name as string })).sort((a, b) => a.name.localeCompare(b.name)) : [];

              return (
                <div key={c.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  {/* Vehicle Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-5 h-5 ${carColors[c.id as '1' | '2']} rounded flex items-center justify-center text-white font-bold text-[10px] shrink-0`}>
                      {idx + 1}
                    </div>
                    <span className="font-bold text-slate-700 text-xs">Vehicle {idx + 1}</span>
                    {c.pricing && c.pricing.length > 0 && (
                      <div className="ml-auto flex items-center gap-1.5 text-[10px] text-green-600">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="font-medium">{c.pricing.length}</span>
                      </div>
                    )}
                  </div>

                  {/* Horizontal Selects */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Brand */}
                    <select
                      className="w-full bg-white border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={c.brand}
                      onChange={e => updateCar(c.id, 'brand', e.target.value)}
                    >
                      <option value="">Brand</option>
                      {catalog.map(b => <option key={b.brand_id} value={b.brand_name}>{b.brand_name}</option>)}
                    </select>

                    {/* Model */}
                    <select
                      className="w-full bg-white border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                      value={c.model}
                      disabled={!c.brand}
                      onChange={e => updateCar(c.id, 'model', e.target.value)}
                    >
                      <option value="">Model</option>
                      {brand?.cars.map(m => <option key={m.car_id} value={m.car_name}>{m.car_name}</option>)}
                    </select>

                    {/* Variants Dropdown with Checkboxes */}
                    <div className="relative">
                      <details className="bg-white border rounded-lg">
                        <summary className="px-2 py-1.5 cursor-pointer text-xs list-none flex items-center justify-between">
                          <span className={carVariants.length === 0 ? 'text-slate-400' : 'text-slate-700'}>
                            Variants ({carVariants.filter(v => commonFilters.selectedVariants.has(v.id)).length}/{carVariants.length})
                          </span>
                          <ChevronDown size={12} className="text-slate-400" />
                        </summary>
                        {carVariants.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                            <div className="p-2 space-y-1">
                              {carVariants.map(v => (
                                <label key={v.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={commonFilters.selectedVariants.has(v.id)}
                                    onChange={() => toggleCommonFilter('selectedVariants', v.id)}
                                    className="rounded border-slate-300 w-3 h-3"
                                  />
                                  <span className={commonFilters.selectedVariants.has(v.id) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                                    {v.name}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </details>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Common Filters - Horizontal Layout */}
          {carsWithPricing.length > 0 && (() => {
            const allPricing = cars.flatMap(c => c.pricing || []);
            const uniqueFuelTypes: string[] = Array.from(new Set(allPricing.map(p => p.fuel_type).filter((t): t is string => !!t))).sort();
            const uniqueTransmissions: string[] = Array.from(new Set(allPricing.map(p => p.transmission_type).filter((t): t is string => !!t))).sort();
            const uniquePaintTypes: string[] = Array.from(new Set(allPricing.map(p => p.paint_type).filter((t): t is string => !!t))).sort();
            const uniqueEditions: string[] = Array.from(new Set(allPricing.map(p => p.edition).filter((t): t is string => !!t))).sort();

            return (
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Filters</p>
                  <div className="text-[10px] text-slate-500">
                    {cars.reduce((sum, c) => sum + getFilteredPricingForCar(c.id).length, 0)}/{allPricing.length} shown
                  </div>
                </div>

                {/* First Row: Fuel Type, Transmission, Paint Type */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Fuel Type Filter */}
                  {uniqueFuelTypes.length > 0 && (
                    <div className="relative">
                      <details className="bg-slate-50 border rounded-lg">
                        <summary className="px-2 py-1.5 cursor-pointer text-xs list-none flex items-center justify-between">
                          <span className="text-slate-700 font-semibold">Fuel</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">{commonFilters.selectedFuelTypes.size}/{uniqueFuelTypes.length}</span>
                            <ChevronDown size={12} className="text-slate-400" />
                          </div>
                        </summary>
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            {uniqueFuelTypes.map((fuel) => (
                              <label key={fuel} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded transition-colors">
                                <input
                                  type="checkbox"
                                  checked={commonFilters.selectedFuelTypes.has(fuel)}
                                  onChange={() => toggleCommonFilter('selectedFuelTypes', fuel)}
                                  className="rounded border-slate-300 w-3 h-3"
                                />
                                <span className={commonFilters.selectedFuelTypes.has(fuel) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                                  {fuel}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Transmission Filter */}
                  {uniqueTransmissions.length > 0 && (
                    <div className="relative">
                      <details className="bg-slate-50 border rounded-lg">
                        <summary className="px-2 py-1.5 cursor-pointer text-xs list-none flex items-center justify-between">
                          <span className="text-slate-700 font-semibold">Trans.</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">{commonFilters.selectedTransmissions.size}/{uniqueTransmissions.length}</span>
                            <ChevronDown size={12} className="text-slate-400" />
                          </div>
                        </summary>
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            {uniqueTransmissions.map((transmission) => (
                              <label key={transmission} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded transition-colors">
                                <input
                                  type="checkbox"
                                  checked={commonFilters.selectedTransmissions.has(transmission)}
                                  onChange={() => toggleCommonFilter('selectedTransmissions', transmission)}
                                  className="rounded border-slate-300 w-3 h-3"
                                />
                                <span className={commonFilters.selectedTransmissions.has(transmission) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                                  {transmission}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>
                  )}

                  {/* Paint Type Filter */}
                  {uniquePaintTypes.length > 0 && (
                    <div className="relative">
                      <details className="bg-slate-50 border rounded-lg">
                        <summary className="px-2 py-1.5 cursor-pointer text-xs list-none flex items-center justify-between">
                          <span className="text-slate-700 font-semibold">Paint</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">{commonFilters.selectedPaintTypes.size}/{uniquePaintTypes.length}</span>
                            <ChevronDown size={12} className="text-slate-400" />
                          </div>
                        </summary>
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            {uniquePaintTypes.map((paint) => (
                              <label key={paint} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded transition-colors">
                                <input
                                  type="checkbox"
                                  checked={commonFilters.selectedPaintTypes.has(paint)}
                                  onChange={() => toggleCommonFilter('selectedPaintTypes', paint)}
                                  className="rounded border-slate-300 w-3 h-3"
                                />
                                <span className={commonFilters.selectedPaintTypes.has(paint) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                                  {paint}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>
                  )}
                </div>

                {/* Second Row: Edition (if exists) */}
                {uniqueEditions.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                      <details className="bg-slate-50 border rounded-lg">
                        <summary className="px-2 py-1.5 cursor-pointer text-xs list-none flex items-center justify-between">
                          <span className="text-slate-700 font-semibold">Edition</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">{commonFilters.selectedEditions.size}/{uniqueEditions.length}</span>
                            <ChevronDown size={12} className="text-slate-400" />
                          </div>
                        </summary>
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            {uniqueEditions.map((edition) => (
                              <label key={edition} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded transition-colors">
                                <input
                                  type="checkbox"
                                  checked={commonFilters.selectedEditions.has(edition)}
                                  onChange={() => toggleCommonFilter('selectedEditions', edition)}
                                  className="rounded border-slate-300 w-3 h-3"
                                />
                                <span className={commonFilters.selectedEditions.has(edition) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                                  {edition}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* MAIN VIEW AREA */}
        {carsWithPricing.length === 2 && globalViewMode === 'chart' ? (
          // COMBINED MODE - Both cars on same axis
          <div className="flex-1 bg-white overflow-hidden flex flex-col">
            {/* Combined Chart with Drag & Drop */}
            <div className="flex-1 p-1">
              <ChartView
                rawPricing={getFilteredPricingForCar('1')}
                chartColor="#2563eb"
                formatPriceShort={formatPriceShort}
                onPricingClick={(p) => {
                  const carId = cars[0].pricing?.some(cp => cp.pricing_id === p.pricing_id) ? '1' : '2';
                  const grouped = groupByVariant(cars[carId === '1' ? 0 : 1].pricing || []);
                  const variant = grouped.find(v => v.variant_id === p.variant_id);
                  if (variant) {
                    setSelectedVariant({ variant, carId });
                  }
                }}
                carId="1"
                carName={`${cars[0].brand} ${cars[0].model}`}
                isCombinedMode={true}
                allCarsData={[
                  { carId: '1', carName: `${cars[0].brand} ${cars[0].model}`, pricing: getFilteredPricingForCar('1'), color: '#2563eb' },
                  { carId: '2', carName: `${cars[1].brand} ${cars[1].model}`, pricing: getFilteredPricingForCar('2'), color: '#dc2626' }
                ]}
                onOrderChange={(newOrder) => {
                  console.log('New car order:', newOrder);
                }}
              />
            </div>
          </div>
        ) : (
          // INDIVIDUAL MODE - Separate views for each car
          <div className={`flex-1 grid ${carsWithPricing.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-px bg-slate-200 overflow-hidden`}>
            {cars.map(car => {
              const filteredPricing = getFilteredPricingForCar(car.id);
              const chartColor = car.id === '1' ? '#2563eb' : '#dc2626';

              if (!car.pricing || car.pricing.length === 0) {
                return (
                  <div key={car.id} className="bg-white flex flex-col items-center justify-center text-slate-300 p-10 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <LayoutGrid size={32} />
                    </div>
                    <p className="font-medium">Configure vehicle {car.id} to view data</p>
                  </div>
                );
              }

              return (
                <div key={car.id} className="flex flex-col bg-white overflow-hidden">
                  <div className={`${carColors[car.id as '1' | '2']} text-white p-4 shadow-md z-10`}>
                    <h3 className="font-bold uppercase tracking-tight">{car.brand} {car.model}</h3>
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col">
                    {globalViewMode === 'chart' ? (
                      <div className="flex-1 p-6">
                        <ChartView
                          rawPricing={filteredPricing}
                          chartColor={chartColor}
                          formatPriceShort={formatPriceShort}
                          onPricingClick={(p) => {
                            const grouped = groupByVariant(car.pricing || []);
                            const variant = grouped.find(v => v.variant_id === p.variant_id);
                            if (variant) {
                              setSelectedVariant({ variant, carId: car.id });
                            }
                          }}
                          carId={car.id}
                          carName={`${car.brand} ${car.model}`}
                        />
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto">
                        <TableView
                          rawPricing={filteredPricing}
                          formatPrice={formatPrice}
                          onPricingClick={(p) => {
                            const grouped = groupByVariant(car.pricing || []);
                            const variant = grouped.find(v => v.variant_id === p.variant_id);
                            if (variant) {
                              setSelectedVariant({ variant, carId: car.id });
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedVariant && (
        <VariantModal
          variant={selectedVariant.variant}
          brandColor={carColors[selectedVariant.carId as '1' | '2']}
          onClose={() => setSelectedVariant(null)}
        />
      )}
    </div>
  );
};

export default PriceComparisonPage







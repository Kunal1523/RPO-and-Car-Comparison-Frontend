
// import React, { useEffect, useState } from 'react';
// import { createPortal } from 'react-dom';
// import { X, TrendingUp, List, LayoutGrid, ChevronDown, Upload, Plus } from 'lucide-react';
// import ChartView from '../components/ChartView';
// import TableView from '../components/TableView';
// import DownloadExcelButton from '../components/DownloadExcelButton';

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

// // Use environment variable or relative API URL
// const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:8000/api';

// const groupByVariant = (pricing: PricingData[]): GroupedVariant[] => {
//   const grouped = new Map<string, GroupedVariant>();
//   pricing.forEach(p => {
//     if (!grouped.has(p.variant_id)) {
//       grouped.set(p.variant_id, { variant_id: p.variant_id, variant_name: p.variant_name, avg_price: 0, min_price: p.ex_showroom_price, max_price: p.ex_showroom_price, types: [] });
//     }
//     const variant = grouped.get(p.variant_id)!;
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
//   const [domReady, setDomReady] = useState(false);
//   const [catalogLoaded, setCatalogLoaded] = useState(false);

//   const carColors = { '1': 'bg-blue-600', '2': 'bg-red-600' };

//   interface CommonFilters {
//     selectedFuelTypes: Set<string>;
//     selectedTransmissions: Set<string>;
//     selectedVariants: Set<string>;
//     selectedPaintTypes: Set<string>;
//     selectedEditions: Set<string>;
//   }

//   const [commonFilters, setCommonFilters] = useState<CommonFilters>({
//     selectedFuelTypes: new Set<string>(),
//     selectedTransmissions: new Set<string>(),
//     selectedVariants: new Set<string>(),
//     selectedPaintTypes: new Set<string>(),
//     selectedEditions: new Set<string>()
//   });

//   // Refs for auto-closing dropdowns
//   const variantDetailsRefs = React.useRef<Map<string, HTMLDetailsElement>>(new Map());
//   const fuelDetailsRef = React.useRef<HTMLDetailsElement>(null);
//   const transmissionDetailsRef = React.useRef<HTMLDetailsElement>(null);
//   const paintDetailsRef = React.useRef<HTMLDetailsElement>(null);
//   const editionDetailsRef = React.useRef<HTMLDetailsElement>(null);

//   // Timer ref for delayed closing
//   const closeTimerRef = React.useRef<NodeJS.Timeout | null>(null);

//   const closeDropdown = (ref: React.RefObject<HTMLDetailsElement | null> | React.RefObject<HTMLDetailsElement> | HTMLDetailsElement | null) => {
//     // Clear any existing timer
//     if (closeTimerRef.current) {
//       clearTimeout(closeTimerRef.current);
//     }

//     // Set a small delay before closing to handle gaps between elements
//     closeTimerRef.current = setTimeout(() => {
//       if (!ref) return;

//       if ('current' in ref) {
//         // It's a RefObject
//         if (ref.current) {
//           ref.current.open = false;
//         }
//       } else if ('open' in ref) {
//         // It's an HTMLDetailsElement
//         ref.open = false;
//       }
//     }, 200); // 200ms delay
//   };

//   const cancelCloseDropdown = () => {
//     if (closeTimerRef.current) {
//       clearTimeout(closeTimerRef.current);
//       closeTimerRef.current = null;
//     }
//   };

//   useEffect(() => {
//     setDomReady(true);
//   }, []);

//   useEffect(() => {
//     fetch(`${API_BASE_URL}/catalog`)
//       .then(r => {
//         if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
//         return r.json();
//       })
//       .then(d => {
//         setCatalog(d.brands);
//         setCatalogLoaded(true);
//       })
//       .catch(err => console.error('Catalog Error:', err));
//   }, []);

//   const fetchPricing = async (car: SelectedCar) => {
//     try {
//       const res = await fetch(`${API_BASE_URL}/v1/pricing?brand_name=${encodeURIComponent(car.brand)}&car_name=${encodeURIComponent(car.model)}`);
//       if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
//       const data = await res.json();
//       if (data.success && data.pricing) {
//         setCars(p => p.map(c => (c.id === car.id ? { ...c, pricing: data.pricing } : c)));
//       }
//     } catch (err) {
//       console.error('Pricing Error:', err);
//     }
//   };

//   useEffect(() => {
//     if (!catalogLoaded) return;

//     cars.forEach(car => {
//       if (car.brand && car.model && !car.pricing) {
//         fetchPricing(car);
//       }
//     });
//   }, [catalogLoaded, cars.map(c => `${c.id}-${c.brand}-${c.model}-${!!c.pricing}`).join(',')]);

//   useEffect(() => {
//     if (!catalogLoaded || catalog.length === 0) return;
//     if (cars[1].brand !== '' || cars[1].model !== '') return;

//     const vehicle2Brand = catalog.find(b => b.brand_name !== cars[0].brand) || catalog[0];
//     const vehicle2Car = vehicle2Brand?.cars[0];

//     if (vehicle2Brand && vehicle2Car) {
//       setCars(prev => prev.map(c =>
//         c.id === '2'
//           ? { ...c, brand: vehicle2Brand.brand_name, model: vehicle2Car.car_name }
//           : c
//       ));
//     }
//   }, [catalogLoaded, catalog.length]);

//   const updateCar = (id: string, key: 'brand' | 'model', value: string) => {
//     setCars(p => p.map(c => {
//       if (c.id !== id) return c;
//       const updated = { ...c, [key]: value, ...(key === 'brand' && { model: '', pricing: undefined }) };
//       if (key === 'model' && updated.brand && value) fetchPricing(updated);
//       return updated;
//     }));
//   };

//   useEffect(() => {
//     const allPricing = cars.flatMap(c => c.pricing || []);
//     if (allPricing.length === 0) return;

//     const uniqueFuelTypes: string[] = Array.from(new Set(allPricing.map(p => p.fuel_type).filter((t): t is string => !!t)));
//     const uniqueTransmissions: string[] = Array.from(new Set(allPricing.map(p => p.transmission_type).filter((t): t is string => !!t)));
//     const uniqueVariants: string[] = Array.from(new Set(allPricing.map(p => p.variant_id)));
//     const uniquePaintTypes: string[] = Array.from(new Set(allPricing.map(p => p.paint_type).filter((t): t is string => !!t)));
//     const uniqueEditions: string[] = Array.from(new Set(allPricing.map(p => p.edition).filter((t): t is string => !!t)));

//     setCommonFilters({
//       selectedFuelTypes: new Set(uniqueFuelTypes),
//       selectedTransmissions: new Set(uniqueTransmissions),
//       selectedVariants: new Set(uniqueVariants),
//       selectedPaintTypes: new Set(uniquePaintTypes),
//       selectedEditions: new Set(uniqueEditions)
//     });
//   }, [cars.map(c => c.pricing?.length || 0).join(',')]);

//   const toggleCommonFilter = (filterType: keyof CommonFilters, value: string) => {
//     setCommonFilters(prev => {
//       const filterSet = new Set(prev[filterType]);

//       if (filterSet.has(value)) {
//         filterSet.delete(value);
//       } else {
//         filterSet.add(value);
//       }

//       return {
//         ...prev,
//         [filterType]: filterSet
//       };
//     });
//   };

//   const updateCommonFilter = (filterType: keyof CommonFilters, newSet: Set<string>) => {
//     setCommonFilters(prev => ({
//       ...prev,
//       [filterType]: newSet
//     }));
//   };

//   const toggleSelectAll = (filterType: keyof CommonFilters, allValues: string[]) => {
//     setCommonFilters(prev => {
//       const currentSet = prev[filterType];
//       const allSelected = allValues.every(val => currentSet.has(val));

//       if (allSelected) {
//         // Deselect all
//         return {
//           ...prev,
//           [filterType]: new Set<string>()
//         };
//       } else {
//         // Select all
//         return {
//           ...prev,
//           [filterType]: new Set(allValues)
//         };
//       }
//     });
//   };

//   // Get available options based on current filter selections
//   const getAvailableOptions = () => {
//     const allPricing = cars.flatMap(c => c.pricing || []);

//     // Filter pricing based on current selections
//     const filteredPricing = allPricing.filter(p => {
//       const fuelMatch = commonFilters.selectedFuelTypes.size === 0 || !p.fuel_type || commonFilters.selectedFuelTypes.has(p.fuel_type);
//       const transmissionMatch = commonFilters.selectedTransmissions.size === 0 || !p.transmission_type || commonFilters.selectedTransmissions.has(p.transmission_type);
//       const variantMatch = commonFilters.selectedVariants.size === 0 || commonFilters.selectedVariants.has(p.variant_id);
//       const paintMatch = commonFilters.selectedPaintTypes.size === 0 || !p.paint_type || commonFilters.selectedPaintTypes.has(p.paint_type);
//       const editionMatch = commonFilters.selectedEditions.size === 0 || !p.edition || commonFilters.selectedEditions.has(p.edition);
//       return fuelMatch && transmissionMatch && variantMatch && paintMatch && editionMatch;
//     });

//     return {
//       availableFuelTypes: Array.from(new Set(filteredPricing.map(p => p.fuel_type).filter((t): t is string => !!t))).sort(),
//       availableTransmissions: Array.from(new Set(filteredPricing.map(p => p.transmission_type).filter((t): t is string => !!t))).sort(),
//       availableVariants: Array.from(new Set(filteredPricing.map(p => p.variant_id))),
//       availablePaintTypes: Array.from(new Set(filteredPricing.map(p => p.paint_type).filter((t): t is string => !!t))).sort(),
//       availableEditions: Array.from(new Set(filteredPricing.map(p => p.edition).filter((t): t is string => !!t))).sort()
//     };
//   };

//   const getFilteredPricingForCar = (carId: string): PricingData[] => {
//     const car = cars.find(c => c.id === carId);
//     if (!car || !car.pricing) return [];

//     return car.pricing.filter(p => {
//       const fuelMatch = !p.fuel_type || commonFilters.selectedFuelTypes.has(p.fuel_type);
//       const transmissionMatch = !p.transmission_type || commonFilters.selectedTransmissions.has(p.transmission_type);
//       const variantMatch = commonFilters.selectedVariants.has(p.variant_id);
//       const paintMatch = !p.paint_type || commonFilters.selectedPaintTypes.has(p.paint_type);
//       const editionMatch = !p.edition || commonFilters.selectedEditions.has(p.edition);
//       return fuelMatch && transmissionMatch && variantMatch && paintMatch && editionMatch;
//     });
//   };

//   const carsWithPricing = cars.filter(c => c.pricing && c.pricing.length > 0);
//   const bothCarsLoaded = carsWithPricing.length === 2;
//   const showCombinedView = bothCarsLoaded && globalViewMode === 'chart';

//   return (
//     <div className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-col">
//       <div className="hidden" />
//       {domReady && typeof document !== 'undefined' && document.getElementById('header-action-bar') && createPortal(
//         <div className="flex items-center gap-3">
//           <div className="flex bg-slate-100 p-1 rounded-xl border">
//             <button
//               onClick={() => setGlobalViewMode('chart')}
//               className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all ${globalViewMode === 'chart' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
//             >
//               <TrendingUp size={14} /> Chart
//             </button>
//             <button
//               onClick={() => setGlobalViewMode('table')}
//               className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all ${globalViewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
//             >
//               <List size={14} /> Table
//             </button>
//           </div>
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
//           <button
//             onClick={() => alert("Coming Soon")}
//             className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors border border-dashed border-slate-300 hover:border-blue-400"
//             title="Upload New Car (Prices)"
//           >
//             <Upload size={16} /> <span className="hidden sm:inline">Upload New Car (Prices)</span>
//           </button>
//         </div>,
//         document.getElementById('header-action-bar')!
//       )}

//       <div className="flex-1 flex overflow-hidden">
//         <div className="w-96 bg-white border-r p-4 space-y-4 overflow-y-auto">
//           <div className="space-y-3">
//             <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Vehicle Selection</p>

//             {cars.map((c, idx) => {
//               const brand = catalog.find(b => b.brand_name === c.brand);
//               const carVariants = c.pricing ? Array.from(new Map(c.pricing.map(p => [p.variant_id, p.variant_name])).entries()).map(([id, name]: [string, unknown]) => ({ id, name: name as string })).sort((a, b) => a.name.localeCompare(b.name)) : [];

//               return (
//                 <div key={c.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
//                   <div className="flex items-center gap-2 mb-2">
//                     <div className={`w-5 h-5 ${carColors[c.id as '1' | '2']} rounded flex items-center justify-center text-white font-bold text-[10px] shrink-0`}>
//                       {idx + 1}
//                     </div>
//                     <span className="font-bold text-slate-700 text-xs">Vehicle {idx + 1}</span>

//                   </div>

//                   <div className="grid grid-cols-3 gap-2">
//                     <select
//                       className="w-full bg-white border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
//                       value={c.brand}
//                       onChange={e => updateCar(c.id, 'brand', e.target.value)}
//                     >
//                       <option value="">Brand</option>
//                       {catalog.map(b => <option key={b.brand_id} value={b.brand_name}>{b.brand_name}</option>)}
//                     </select>

//                     <select
//                       className="w-full bg-white border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
//                       value={c.model}
//                       disabled={!c.brand}
//                       onChange={e => updateCar(c.id, 'model', e.target.value)}
//                     >
//                       <option value="">Model</option>
//                       {brand?.cars.map(m => <option key={m.car_id} value={m.car_name}>{m.car_name}</option>)}
//                     </select>

//                     <div className="relative" onMouseEnter={cancelCloseDropdown} onMouseLeave={() => closeDropdown(variantDetailsRefs.current.get(c.id) || null)}>
//                       <details ref={(el) => { if (el) variantDetailsRefs.current.set(c.id, el); }} className="bg-white border rounded-lg">
//                         <summary className="px-2 py-1.5 cursor-pointer text-xs list-none flex items-center justify-between">
//                           <span className={carVariants.length === 0 ? 'text-slate-400' : 'text-slate-700'}>
//                             Variants ({carVariants.filter(v => commonFilters.selectedVariants.has(v.id)).length}/{carVariants.length})
//                           </span>
//                           <ChevronDown size={12} className="text-slate-400" />
//                         </summary>
//                         {carVariants.length > 0 && (
//                           <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
//                             <div className="p-2 space-y-1">
//                               <button
//                                 onClick={(e) => {
//                                   e.preventDefault();
//                                   const allSelected = carVariants.every(v => commonFilters.selectedVariants.has(v.id));
//                                   setCommonFilters(prev => {
//                                     const newSet = new Set(prev.selectedVariants);
//                                     if (allSelected) {
//                                       // Deselect only this car's variants
//                                       carVariants.forEach(v => newSet.delete(v.id));
//                                     } else {
//                                       // Select only this car's variants
//                                       carVariants.forEach(v => newSet.add(v.id));
//                                     }
//                                     return { ...prev, selectedVariants: newSet };
//                                   });
//                                 }}
//                                 className="w-full text-left px-2 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded transition-colors"
//                               >
//                                 {carVariants.every(v => commonFilters.selectedVariants.has(v.id)) ? 'Deselect All' : 'Select All'}
//                               </button>
//                               <div className="border-t pt-1">
//                                 {carVariants.map(v => (
//                                   <label key={v.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded transition-colors">
//                                     <input
//                                       type="checkbox"
//                                       checked={commonFilters.selectedVariants.has(v.id)}
//                                       onChange={() => toggleCommonFilter('selectedVariants', v.id)}
//                                       className="rounded border-slate-300 w-3 h-3"
//                                     />
//                                     <span className={commonFilters.selectedVariants.has(v.id) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                       {v.name}
//                                     </span>
//                                   </label>
//                                 ))}
//                               </div>
//                             </div>
//                           </div>
//                         )}
//                       </details>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}

//             <button
//               onClick={() => alert("Coming Soon")}
//               className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-dashed border-slate-300 flex items-center justify-center gap-2 text-xs font-bold transition-all"
//               title="Add New Vehicle"
//             >
//               <Plus size={14} /> Add New Vehicle (Max 5)
//             </button>
//           </div>

//           {carsWithPricing.length > 0 && (() => {
//             const allPricing = cars.flatMap(c => c.pricing || []);
//             const availableOptions = getAvailableOptions();
//             const uniqueFuelTypes: string[] = availableOptions.availableFuelTypes;
//             const uniqueTransmissions: string[] = availableOptions.availableTransmissions;
//             const uniquePaintTypes: string[] = availableOptions.availablePaintTypes;
//             const uniqueEditions: string[] = availableOptions.availableEditions;

//             return (
//               <div className="space-y-3 pt-3 border-t">
//                 <div className="flex items-center justify-between">
//                   <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Filters</p>

//                 </div>

//                 <div className="grid grid-cols-3 gap-2">
//                   {uniqueFuelTypes.length > 0 && (
//                     <div className="relative" onMouseEnter={cancelCloseDropdown} onMouseLeave={() => closeDropdown(fuelDetailsRef)}>
//                       <details ref={fuelDetailsRef} className="bg-slate-50 border rounded-lg">
//                         <summary className="px-2 py-1.5 cursor-pointer text-xs list-none flex items-center justify-between">
//                           <span className="text-slate-700 font-semibold">Fuel</span>
//                           <div className="flex items-center gap-1">
//                             <span className="text-[10px] text-slate-500">{commonFilters.selectedFuelTypes.size}/{uniqueFuelTypes.length}</span>
//                             <ChevronDown size={12} className="text-slate-400" />
//                           </div>
//                         </summary>
//                         <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
//                           <div className="p-2 space-y-1">
//                             <button
//                               onClick={(e) => {
//                                 e.preventDefault();
//                                 toggleSelectAll('selectedFuelTypes', uniqueFuelTypes);
//                               }}
//                               className="w-full text-left px-2 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded transition-colors"
//                             >
//                               {uniqueFuelTypes.every(f => commonFilters.selectedFuelTypes.has(f)) ? 'Deselect All' : 'Select All'}
//                             </button>
//                             <div className="border-t pt-1">
//                               {uniqueFuelTypes.map((fuel) => (
//                                 <label key={fuel} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded transition-colors">
//                                   <input
//                                     type="checkbox"
//                                     checked={commonFilters.selectedFuelTypes.has(fuel)}
//                                     onChange={() => toggleCommonFilter('selectedFuelTypes', fuel)}
//                                     className="rounded border-slate-300 w-3 h-3"
//                                   />
//                                   <span className={commonFilters.selectedFuelTypes.has(fuel) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                     {fuel}
//                                   </span>
//                                 </label>
//                               ))}
//                             </div>
//                           </div>
//                         </div>
//                       </details>
//                     </div>
//                   )}

//                   {uniqueTransmissions.length > 0 && (
//                     <div className="relative" onMouseEnter={cancelCloseDropdown} onMouseLeave={() => closeDropdown(transmissionDetailsRef)}>
//                       <details ref={transmissionDetailsRef} className="bg-slate-50 border rounded-lg">
//                         <summary className="px-2 py-1.5 cursor-pointer text-xs list-none flex items-center justify-between">
//                           <span className="text-slate-700 font-semibold">Trans.</span>
//                           <div className="flex items-center gap-1">
//                             <span className="text-[10px] text-slate-500">{commonFilters.selectedTransmissions.size}/{uniqueTransmissions.length}</span>
//                             <ChevronDown size={12} className="text-slate-400" />
//                           </div>
//                         </summary>
//                         <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
//                           <div className="p-2 space-y-1">
//                             <button
//                               onClick={(e) => {
//                                 e.preventDefault();
//                                 toggleSelectAll('selectedTransmissions', uniqueTransmissions);
//                               }}
//                               className="w-full text-left px-2 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded transition-colors"
//                             >
//                               {uniqueTransmissions.every(t => commonFilters.selectedTransmissions.has(t)) ? 'Deselect All' : 'Select All'}
//                             </button>
//                             <div className="border-t pt-1">
//                               {uniqueTransmissions.map((transmission) => (
//                                 <label key={transmission} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded transition-colors">
//                                   <input
//                                     type="checkbox"
//                                     checked={commonFilters.selectedTransmissions.has(transmission)}
//                                     onChange={() => toggleCommonFilter('selectedTransmissions', transmission)}
//                                     className="rounded border-slate-300 w-3 h-3"
//                                   />
//                                   <span className={commonFilters.selectedTransmissions.has(transmission) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                     {transmission}
//                                   </span>
//                                 </label>
//                               ))}
//                             </div>
//                           </div>
//                         </div>
//                       </details>
//                     </div>
//                   )}

//                   {uniquePaintTypes.length > 0 && (
//                     <div className="relative" onMouseEnter={cancelCloseDropdown} onMouseLeave={() => closeDropdown(paintDetailsRef)}>
//                       <details ref={paintDetailsRef} className="bg-slate-50 border rounded-lg">
//                         <summary className="px-2 py-1.5 cursor-pointer text-xs list-none flex items-center justify-between">
//                           <span className="text-slate-700 font-semibold">Paint</span>
//                           <div className="flex items-center gap-1">
//                             <span className="text-[10px] text-slate-500">{commonFilters.selectedPaintTypes.size}/{uniquePaintTypes.length}</span>
//                             <ChevronDown size={12} className="text-slate-400" />
//                           </div>
//                         </summary>
//                         <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
//                           <div className="p-2 space-y-1">
//                             <button
//                               onClick={(e) => {
//                                 e.preventDefault();
//                                 toggleSelectAll('selectedPaintTypes', uniquePaintTypes);
//                               }}
//                               className="w-full text-left px-2 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded transition-colors"
//                             >
//                               {uniquePaintTypes.every(p => commonFilters.selectedPaintTypes.has(p)) ? 'Deselect All' : 'Select All'}
//                             </button>
//                             <div className="border-t pt-1">
//                               {uniquePaintTypes.map((paint) => (
//                                 <label key={paint} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded transition-colors">
//                                   <input
//                                     type="checkbox"
//                                     checked={commonFilters.selectedPaintTypes.has(paint)}
//                                     onChange={() => toggleCommonFilter('selectedPaintTypes', paint)}
//                                     className="rounded border-slate-300 w-3 h-3"
//                                   />
//                                   <span className={commonFilters.selectedPaintTypes.has(paint) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                     {paint}
//                                   </span>
//                                 </label>
//                               ))}
//                             </div>
//                           </div>
//                         </div>
//                       </details>
//                     </div>
//                   )}
//                 </div>

//                 {uniqueEditions.length > 0 && (
//                   <div className="grid grid-cols-3 gap-2">
//                     <div className="relative" onMouseEnter={cancelCloseDropdown} onMouseLeave={() => closeDropdown(editionDetailsRef)}>
//                       <details ref={editionDetailsRef} className="bg-slate-50 border rounded-lg">
//                         <summary className="px-2 py-1.5 cursor-pointer text-xs list-none flex items-center justify-between">
//                           <span className="text-slate-700 font-semibold">Edition</span>
//                           <div className="flex items-center gap-1">
//                             <span className="text-[10px] text-slate-500">{commonFilters.selectedEditions.size}/{uniqueEditions.length}</span>
//                             <ChevronDown size={12} className="text-slate-400" />
//                           </div>
//                         </summary>
//                         <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
//                           <div className="p-2 space-y-1">
//                             <button
//                               onClick={(e) => {
//                                 e.preventDefault();
//                                 toggleSelectAll('selectedEditions', uniqueEditions);
//                               }}
//                               className="w-full text-left px-2 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded transition-colors"
//                             >
//                               {uniqueEditions.every(e => commonFilters.selectedEditions.has(e)) ? 'Deselect All' : 'Select All'}
//                             </button>
//                             <div className="border-t pt-1">
//                               {uniqueEditions.map((edition) => (
//                                 <label key={edition} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded transition-colors">
//                                   <input
//                                     type="checkbox"
//                                     checked={commonFilters.selectedEditions.has(edition)}
//                                     onChange={() => toggleCommonFilter('selectedEditions', edition)}
//                                     className="rounded border-slate-300 w-3 h-3"
//                                   />
//                                   <span className={commonFilters.selectedEditions.has(edition) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
//                                     {edition}
//                                   </span>
//                                 </label>
//                               ))}
//                             </div>
//                           </div>
//                         </div>
//                       </details>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             );
//           })()}
//         </div>

//         {carsWithPricing.length === 2 && globalViewMode === 'chart' ? (
//           <div className="flex-1 bg-white overflow-hidden flex flex-col">
//             <div className="flex-1 p-1">
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

//               return (
//                 <div key={car.id} className="flex flex-col bg-white overflow-hidden">
//                   <div className={`${carColors[car.id as '1' | '2']} text-white p-4 shadow-md z-10`}>
//                     <h3 className="font-bold uppercase tracking-tight">{car.brand} {car.model}</h3>
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


import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp, List, LayoutGrid, ChevronDown, Upload, Plus, RotateCcw, Search } from 'lucide-react';
import ChartView from '../components/ChartView';
import TableView from '../components/TableView';
import DownloadExcelButton from '../components/DownloadExcelButton';
import Sidebar from '../components/Sidebar';
import { SelectionState } from '../types';

/* ================= TYPES & HELPERS ================= */
interface PriceComparisonPageProps {
  initialSelections?: SelectionState[];
}
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

// 👇 NEW — shape returned by /api/catalog/full-pricing
interface SubVariant {
  sub_variant_id: string;
  pricing_id: string;
  ex_showroom_price: number;
  currency: string;
  paint_type: string;
  engine_type: string;
  transmission_type: string;
  fuel_type: string;
  drive_type: string;
}
interface CatalogEntry {
  brand: string;
  model: string;
  body_type: string;
  version: string;
  variant_class: string;
  is_new_model: boolean;
  sub_variants: SubVariant[];
}

// Use environment variable or relative API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4"
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

const PriceComparisonPage = ({ initialSelections }: PriceComparisonPageProps) => {
  const [localSelections, setLocalSelections] = useState<SelectionState[]>(() => initialSelections || []);

  const [globalViewMode, setGlobalViewMode] = useState<'chart' | 'table'>(() => {
    const saved = sessionStorage.getItem('pricingViewMode');
    return (saved === 'chart' || saved === 'table') ? saved : 'chart';
  });

  const [domReady, setDomReady] = useState(false);
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const [selectedVariant, setSelectedVariant] = useState<{ variant: GroupedVariant; carId: string; brandColor: string } | null>(null);

  const [priceMinLakhs, setPriceMinLakhs] = useState<number>(0);
  const [priceMaxLakhs, setPriceMaxLakhs] = useState<number>(100);

  // 👇 NEW — full catalog cache, loaded ONCE on mount (replaces compare/mixed fetch-per-selection)
  const [fullCatalog, setFullCatalog] = useState<CatalogEntry[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  // Old onCompare kept for Sidebar prop compatibility (button is hidden on this page, so it never fires)
  const handleCompare = (selections: SelectionState[], priceFilter?: { min: number; max: number }) => {
    setLocalSelections(selections);
    if (priceFilter) {
      setPriceMinLakhs(priceFilter.min);
      setPriceMaxLakhs(priceFilter.max);
    }
  };

  // 👇 NEW — live price-filter sync from Sidebar (no Compare button needed)
  const handleFiltersChange = (priceFilter: { min: number; max: number }) => {
    setPriceMinLakhs(priceFilter.min);
    setPriceMaxLakhs(priceFilter.max);
  };

  useEffect(() => {
    setDomReady(true);
  }, []);

  // 👇 NEW — load full catalog ONCE on mount (replaces /api/compare/mixed)
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/catalog/full-pricing`)
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data)) {
          setFullCatalog(result.data);
        }
        setCatalogLoaded(true);
      })
      .catch(err => {
        console.error('Catalog Pricing Error:', err);
        setCatalogLoaded(true);
      });
  }, []);

  // 👇 NEW — derive allCarsData CLIENT-SIDE from cached catalog + current selections + price filter
  //          (no network call happens here, just filtering/grouping in memory)
  const allCarsData = useMemo(() => {
    if (localSelections.length < 2 || !catalogLoaded || fullCatalog.length === 0) {
      return [] as { carId: string; carName: string; pricing: PricingData[]; color: string }[];
    }

    const priceMinRupees = priceMinLakhs * 100000;
    const priceMaxRupees = priceMaxLakhs * 100000;
    const carColors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea'];

    const modelOrder: string[] = [];
    const modelMap = new Map<string, { carName: string; pricing: PricingData[] }>();

    const addPricingForEntry = (modelKey: string, entry: CatalogEntry, onlySubVariantId?: string) => {
      if (!modelOrder.includes(modelKey)) modelOrder.push(modelKey);
      if (!modelMap.has(modelKey)) {
        modelMap.set(modelKey, { carName: modelKey, pricing: [] });
      }

      entry.sub_variants
        .filter(sv => !onlySubVariantId || sv.sub_variant_id === onlySubVariantId)
        .filter(sv => sv.ex_showroom_price >= priceMinRupees && sv.ex_showroom_price <= priceMaxRupees)
        .forEach(sv => {
          modelMap.get(modelKey)!.pricing.push({
            variant_id: sv.sub_variant_id,
            variant_name: entry.variant_class,
            pricing_id: sv.pricing_id,
            ex_showroom_price: sv.ex_showroom_price,
            currency: sv.currency || 'INR',
            fuel_type: sv.fuel_type || null,
            engine_type: sv.engine_type || null,
            transmission_type: sv.transmission_type || null,
            paint_type: sv.paint_type || null,
            edition: null,
            pricing_version: 1,
            created_at: '',
          });
        });
    };

    localSelections.forEach(sel => {
      const modelKey = `${sel.brand} ${sel.model}`;

      if (sel.plan_id) {
        // New Model (NM) selection — match by sub_variant_id === plan_id
        const entry = fullCatalog.find(
          e => e.is_new_model && e.sub_variants.some(sv => sv.sub_variant_id === sel.plan_id)
        );
        if (entry) addPricingForEntry(modelKey, entry, sel.plan_id);
      } else {
        // Existing model selection — match by brand + model + variant_class
        const entry = fullCatalog.find(
          e => !e.is_new_model &&
            e.brand === sel.brand &&
            e.model === sel.model &&
            e.variant_class === sel.variant
        );
        if (entry) addPricingForEntry(modelKey, entry);
      }
    });

    return modelOrder
      .map((modelKey, idx) => ({
        carId: modelKey,
        carName: modelMap.get(modelKey)!.carName,
        pricing: modelMap.get(modelKey)!.pricing,
        color: carColors[idx % carColors.length],
      }))
      .filter(c => c.pricing.length > 0);
  }, [localSelections, fullCatalog, catalogLoaded, priceMinLakhs, priceMaxLakhs]);

  // Save view mode
  useEffect(() => {
    sessionStorage.setItem('pricingViewMode', globalViewMode);
  }, [globalViewMode]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-sky-50 flex flex-col">
      <div className="hidden" />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          onCompare={handleCompare}
          isLoading={false}
          selections={localSelections}
          setSelections={setLocalSelections}
          showCompareButton={false}           // 👈 NEW — button hidden, graph already live-renders
          onFiltersChange={handleFiltersChange} // 👈 NEW — price slider live-syncs without Compare
        />

        <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-100 p-2 md:p-4 gap-2">
          <div className="flex-shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">Pricing Analysis</h2>
                <p className="text-[10px] text-slate-500">
                  Compare prices across {localSelections.length} selected variants.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <div className="flex bg-white p-1 rounded-lg border shadow-sm">
                  <button
                    onClick={() => setGlobalViewMode('chart')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold transition-all ${globalViewMode === 'chart' ? 'bg-slate-100 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <TrendingUp size={14} /> Chart
                  </button>
                  <button
                    onClick={() => setGlobalViewMode('table')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold transition-all ${globalViewMode === 'table' ? 'bg-slate-100 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <List size={14} /> Table
                  </button>
                </div>
                
                <DownloadExcelButton
                  carsData={allCarsData.map(c => ({
                    brand: '', model: c.carName, data: c.pricing
                  }))}
                  chartRef={chartContainerRef}
                />
              </div>
            </div>
          </div>

          <div ref={chartContainerRef} className="flex-1 overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white relative flex flex-col">
            {allCarsData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <LayoutGrid size={32} />
                </div>
                <p className="font-medium text-sm">Select at least 2 variants using the sidebar to view data.</p>
              </div>
            ) : globalViewMode === 'chart' ? (
              <div className="flex-1 p-1">
                <ChartView
                  rawPricing={allCarsData[0].pricing} // fallback if 1 car
                  chartColor={allCarsData[0].color}
                  formatPriceShort={formatPriceShort}
                  onPricingClick={(p) => {
                    const carData = allCarsData.find(c => c.pricing.some(cp => cp.variant_id === p.variant_id && cp.ex_showroom_price === p.ex_showroom_price));
                    if (carData) {
                      const grouped = groupByVariant(carData.pricing);
                      const variant = grouped.find(v => v.variant_id === p.variant_id);
                      if (variant) {
                        setSelectedVariant({ variant, carId: carData.carId, brandColor: carData.color });
                      }
                    }
                  }}
                  carId={allCarsData[0].carId}
                  carName={allCarsData[0].carName}
                  isCombinedMode={true}
                  allCarsData={allCarsData}
                  onOrderChange={() => { }}
                />
              </div>
            ) : (
              <div className={`flex-1 grid ${allCarsData.length === 1 ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-px bg-slate-200 overflow-hidden`}>
                {allCarsData.map(carData => (
                  <div key={carData.carId} className="flex flex-col bg-white overflow-hidden">
                    <div className="text-white p-4 shadow-md z-10" style={{ backgroundColor: carData.color }}>
                      <h3 className="font-bold uppercase tracking-tight text-xs">{carData.carName}</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <TableView
                        rawPricing={carData.pricing}
                        formatPrice={formatPrice}
                        onPricingClick={(p) => {
                          const grouped = groupByVariant(carData.pricing);
                          const variant = grouped.find(v => v.variant_id === p.variant_id);
                          if (variant) {
                            setSelectedVariant({ variant, carId: carData.carId, brandColor: carData.color });
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {selectedVariant && (
        <VariantModal
          variant={selectedVariant.variant}
          brandColor={selectedVariant.brandColor}
          onClose={() => setSelectedVariant(null)}
        />
      )}
    </div>
  );
};

export default PriceComparisonPage;
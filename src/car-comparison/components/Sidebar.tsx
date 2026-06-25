// // src/components/Sidebar.tsx
// import React, { useEffect, useMemo, useState } from 'react';
// import { SelectionState } from '../types';
// import { fetchSidebarFilters } from '../services/api';
// import { ChevronRight, ChevronLeft, Filter, Search, X, Plus, Info, AlertCircle } from 'lucide-react';

// // interface SidebarProps {
// //   onCompare: (selections: SelectionState[], priceFilter?: { min: number; max: number }) => void;
// //   isLoading: boolean;
// //   selections: SelectionState[];
// //   setSelections: React.Dispatch<React.SetStateAction<SelectionState[]>>;
// // }
// interface SidebarProps {
//   onCompare: (selections: SelectionState[], priceFilter?: { min: number; max: number }) => void;
//   isLoading: boolean;
//   selections: SelectionState[];
//   setSelections: React.Dispatch<React.SetStateAction<SelectionState[]>>;
//   showCompareButton?: boolean;                                          // 👈 NEW
//   onFiltersChange?: (priceFilter: { min: number; max: number }) => void; // 👈 NEW
// }

// interface SidebarVariant {
//   brand: string;
//   model: string;
//   body_type: string;
//   version: string;
//   variant: string;
//   variant_id: string;
//   price: number;
//   engine_type?: string;
//   transmission_type?: string;
//   fuel_type?: string;
//   drive_type?: string;
//   is_new_model: boolean;
// }

// const BODY_TYPES = ['Hatch', 'Sedan', 'SUV', 'MPV', 'Van'];

// const Sidebar: React.FC<SidebarProps> = ({
//   onCompare,
//   isLoading,
//   selections,
//   setSelections,
//   showCompareButton = true,   // 👈 NEW, default true (Feature Comparison page ke liye)
//   onFiltersChange,            // 👈 NEW
// }) => {
//   const [allVariants, setAllVariants] = useState<SidebarVariant[]>([]);
//   const [dataLoaded, setDataLoaded] = useState(false);
//   const [isOpen, setIsOpen] = useState<boolean>(true);

//   // Filters state
//   const [priceMin, setPriceMin] = useState<number>(0);
//   const [priceMax, setPriceMax] = useState<number>(100); // Max 100 Lakhs initially
//   const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]);
//   const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

//   // Modal state
//   const [modalBrand, setModalBrand] = useState<string>('');
//   const [modalModel, setModalModel] = useState<string>('');
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   // Model dropdown state
//   const [openDropdownBrands, setOpenDropdownBrands] = useState<string[]>([]);
//   const [selectedModels, setSelectedModels] = useState<Array<{ brand: string, model: string }>>([]);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         const data = await fetchSidebarFilters();
//         setAllVariants(data);
//         setDataLoaded(true);

//         // Find max price to set realistic slider bounds
//         if (data.length > 0) {
//           const maxP = Math.ceil(Math.max(...data.map((v: SidebarVariant) => v.price)));
//           setPriceMax(maxP > 0 ? maxP : 100);
//         }

//         // Don't auto-select any brands or models. Wait for user interaction as requested.
//         // Initialize based on price filter
//         const maxP = Math.ceil(Math.max(...data.map((v: SidebarVariant) => v.price)));
//         setPriceMax(maxP > 0 ? maxP : 100);
//       } catch (err) {
//         console.error('Failed to fetch sidebar filters', err);
//       }
//     };
//     loadData();
//   }, []);

//   const toggleBodyType = (type: string) => {
//     setSelectedBodyTypes(prev =>
//       prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
//     );
//   };

//   const toggleBrand = (brand: string) => {
//     setSelectedBrands(prev =>
//       prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
//     );
//   };

//   const openVariantModal = (brand: string, model: string) => {
//     setModalBrand(brand);
//     setModalModel(model);
//     setIsModalOpen(true);
//   };

//   const closeVariantModal = () => {
//     setIsModalOpen(false);
//     setModalModel('');
//     setModalBrand('');
//   };

//   const isVariantSelected = (brand: string, model: string, variant: string, version: string, plan_id?: string) => {
//     if (brand === 'NM') return selections.some(s => s.plan_id === plan_id);
//     return selections.some(s => s.brand === brand && s.model === model && s.variant === variant && s.version === version);
//   };

//   const toggleVariantSelection = (brand: string, model: string, variant: string, version: string, variantId: string) => {
//     const plan_id = brand === 'NM' ? variantId : undefined;

//     if (isVariantSelected(brand, model, variant, version, plan_id)) {
//       setSelections(prev => prev.filter(s => {
//         if (brand === 'NM') return s.plan_id !== plan_id;
//         return !(s.brand === brand && s.model === model && s.variant === variant && s.version === version);
//       }));
//     } else {
//       setSelections(prev => [
//         ...prev,
//         { brand, model, version, variant, variant_id: variantId, plan_id }
//       ]);
//     }
//   };

//   const filteredVariants = useMemo(() => {
//     return allVariants.filter(v =>
//       v.price >= priceMin &&
//       v.price <= priceMax &&
//       (selectedBodyTypes.length === 0 || selectedBodyTypes.includes(v.body_type))
//     );
//   }, [allVariants, priceMin, priceMax, selectedBodyTypes]);

//   const isModelSelectable = (brand: string, model: string) => {
//     return filteredVariants.some(v => v.brand === brand && v.model === model);
//   };

//   const variantsInPriceRange = useMemo(() => {
//     return allVariants.filter(v => v.price >= priceMin && v.price <= priceMax);
//   }, [allVariants, priceMin, priceMax]);

//   const availableBodyTypesInPrice = useMemo(() => {
//     return Array.from(new Set(variantsInPriceRange.map(v => v.body_type)));
//   }, [variantsInPriceRange]);

//   const availableBrandsInFilter = useMemo(() => {
//     return Array.from(new Set(filteredVariants.map(v => v.brand)));
//   }, [filteredVariants]);

//   const activeVariants = useMemo(() => {
//     if (!dataLoaded || !modalBrand || !modalModel) return [];

//     // ONLY SHOW VARIANTS IN FILTER! (Price + Body Type)
//     // The user said: "jo variants bhi show honge na wo price k bsae pr honge bro"
//     const modelVariantsInFilter = filteredVariants.filter(v => v.brand === modalBrand && v.model === modalModel);

//     return modelVariantsInFilter.map(v => ({
//       name: v.variant,
//       version: v.version,
//       variantId: v.variant_id,
//       engine: v.engine_type || '',
//       pt: v.transmission_type || '',
//       fuel: v.fuel_type || '',
//       drive: v.drive_type || '',
//       price: v.price
//     }));
//   }, [dataLoaded, filteredVariants, modalBrand, modalModel]);

//   const allBrands = useMemo(() => {
//     const brands = Array.from(new Set(allVariants.map(v => v.brand)));
//     return brands.sort((a, b) => {
//       if (a === 'NM') return -1;
//       if (b === 'NM') return 1;
//       return a.localeCompare(b);
//     });
//   }, [allVariants]);

//   const isCompareDisabled = isLoading || selections.length < 2;

//   if (!isOpen) {
//     return (
//       <aside className="w-10 md:w-12 lg:w-14 bg-blue-700 text-slate-900 flex-shrink-0 h-full border-r border-slate-200 flex items-center justify-center">
//         <button
//           onClick={() => setIsOpen(true)}
//           className="h-[80%] w-full flex flex-col items-center justify-center gap-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-colors"
//         >
//           <ChevronRight size={18} className="text-blue-700" />
//           <span className="text-[11px] font-bold tracking-wide text-slate-700 transform -rotate-90 whitespace-nowrap">
//             Open Filters
//           </span>
//         </button>
//       </aside>
//     );
//   }

//   return (
//     <>
//       <aside className="w-[380px] bg-white flex-shrink-0 flex flex-col h-full border-r border-slate-300 shadow-xl z-30 font-sans">

//         {/* Header / Compare Button Area */}
//         <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
//           <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
//             <button
//               onClick={() => setIsOpen(false)}
//               className="p-1 -ml-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
//               title="Collapse Sidebar"
//             >
//               <ChevronLeft size={18} />
//             </button>
//             <Filter size={16} className="text-blue-600" />
//             Vehicle Filters
//           </div>
//           <button
//             onClick={() => onCompare(selections, { min: priceMin, max: priceMax })}
//             disabled={isCompareDisabled}
//             className={`px-4 py-1.5 rounded text-xs font-bold shadow-sm transition-all ${isCompareDisabled
//               ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
//               : 'bg-blue-600 hover:bg-blue-700 text-white'
//               }`}
//           >
//             {isLoading ? 'Comparing...' : `Compare (${selections.length})`}
//           </button>
//         </div>

//         <div className="flex-1 overflow-y-auto custom-scrollbar">
//           {!dataLoaded ? (
//             <div className="p-8 text-center text-slate-500 text-sm">Loading catalog...</div>
//           ) : (
//             <div className="flex flex-col h-full bg-white">
//               <div className="flex-1 overflow-y-auto custom-scrollbar border-b border-slate-300">
//                 <div className="flex flex-col border-t border-slate-300">

//                   {/* 1. Price Range Slicer */}
//                   <div className="grid grid-cols-[85px_1fr] border-b border-blue-200">
//                     <div className="border-r border-slate-300 bg-slate-50 p-2 text-[10px] font-bold flex items-center justify-center text-center text-slate-800">
//                       Ex Showroom<br />Price
//                     </div>
//                     <div className="p-4 flex flex-col gap-2 justify-center bg-white">
//                       <div className="relative px-2">
//                         {/* Dual range slider */}
//                         <div className="relative h-1.5 bg-slate-200 rounded-full">
//                           <div
//                             className="absolute h-full bg-slate-600 rounded-full"
//                             style={{
//                               left: `${(priceMin / (Math.ceil(Math.max(...allVariants.map(v => v.price), 100)))) * 100}%`,
//                               right: `${100 - (priceMax / (Math.ceil(Math.max(...allVariants.map(v => v.price), 100)))) * 100}%`
//                             }}
//                           />
//                         </div>
//                         <input
//                           type="range" min={0} max={Math.ceil(Math.max(...allVariants.map(v => v.price), 100))} step={0.5}
//                           value={priceMin} onChange={e => { const v = parseFloat(e.target.value); if (v < priceMax) setPriceMin(v); }}
//                           className="absolute top-0 left-0 w-full h-1.5 opacity-0 cursor-pointer"
//                         />
//                         <input
//                           type="range" min={0} max={Math.ceil(Math.max(...allVariants.map(v => v.price), 100))} step={0.5}
//                           value={priceMax} onChange={e => { const v = parseFloat(e.target.value); if (v > priceMin) setPriceMax(v); }}
//                           className="absolute top-0 left-0 w-full h-1.5 opacity-0 cursor-pointer"
//                         />
//                         {/* Thumbs visual */}
//                         <div className="absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 rounded-full bg-[#cc4400] border-2 border-white shadow pointer-events-none" style={{ left: `${(priceMin / (Math.ceil(Math.max(...allVariants.map(v => v.price), 100)))) * 100}%` }} />
//                         <div className="absolute top-1/2 -translate-y-1/2 -mr-2 w-4 h-4 rounded-full bg-[#006600] border-2 border-white shadow pointer-events-none" style={{ left: `${(priceMax / (Math.ceil(Math.max(...allVariants.map(v => v.price), 100)))) * 100}%` }} />
//                       </div>

//                       <div className="flex justify-between items-center text-[10px] font-bold mt-2">
//                         <div className="flex flex-col gap-1 items-center">
//                           <span className="text-[9px] font-semibold text-slate-500">Min</span>
//                           <div className="border border-slate-400 bg-slate-100 rounded px-1.5 py-0.5 flex items-center">
//                             <input type="number" className="w-8 outline-none text-center bg-transparent" value={priceMin} onChange={e => { const val = parseFloat(e.target.value); if (!isNaN(val) && val < priceMax) setPriceMin(val); }} />
//                             <span>L</span>
//                           </div>
//                         </div>
//                         <div className="flex flex-col gap-1 items-center">
//                           <span className="text-[9px] font-semibold text-slate-500">Max</span>
//                           <div className="border border-slate-400 bg-slate-100 rounded px-1.5 py-0.5 flex items-center">
//                             <input type="number" className="w-8 outline-none text-center bg-transparent" value={priceMax} onChange={e => { const val = parseFloat(e.target.value); if (!isNaN(val) && val > priceMin) setPriceMax(val); }} />
//                             <span>L</span>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* 2. Body Type */}
//                   <div className="grid grid-cols-[85px_1fr] border-b border-blue-200">
//                     <div className="border-r border-slate-300 bg-slate-50 p-2 text-[10px] font-bold flex items-center justify-center text-slate-800">
//                       Body Type
//                     </div>
//                     <div className="p-3 flex gap-2 flex-wrap items-center bg-white">
//                       {BODY_TYPES.map(bt => {
//                         const isSelected = selectedBodyTypes.includes(bt);
//                         const hasInRange = availableBodyTypesInPrice.includes(bt);

//                         let cls = '';
//                         if (isSelected) {
//                           cls = 'bg-blue-500 text-white border-blue-600 shadow-sm';
//                         } else if (hasInRange) {
//                           cls = 'bg-slate-700 text-white hover:bg-slate-800 shadow-sm'; // Dark grey
//                         } else {
//                           cls = 'bg-slate-200 text-slate-500 cursor-not-allowed'; // Light grey
//                         }

//                         return (
//                           <button
//                             key={bt}
//                             disabled={!hasInRange && !isSelected}
//                             onClick={() => {
//                               if (hasInRange || isSelected) toggleBodyType(bt);
//                             }}
//                             className={`px-3 py-1 text-[10px] font-bold rounded-sm transition-all ${cls}`}
//                           >
//                             {bt}
//                           </button>
//                         );
//                       })}
//                     </div>
//                   </div>

//                   {/* 3. Brand */}
//                   <div className="grid grid-cols-[85px_1fr] border-b border-blue-200">
//                     <div className="border-r border-slate-300 bg-slate-50 p-2 text-[10px] font-bold flex items-center justify-center text-slate-800">
//                       Brand
//                     </div>
//                     <div className="p-3 flex justify-center gap-1.5 items-center bg-white overflow-x-auto custom-scrollbar">
//                       {allBrands.filter(b => b !== 'CUSTOM_PLAN').map(brand => {
//                         const isSelected = selectedBrands.includes(brand);
//                         const isSelectable = availableBrandsInFilter.includes(brand);

//                         let bgColor = 'bg-slate-200 border-slate-300 opacity-50 cursor-not-allowed'; // Light grey
//                         if (isSelected) bgColor = 'bg-blue-600 border-blue-700 shadow-sm'; // Blue
//                         else if (isSelectable) bgColor = 'bg-slate-700 border-slate-800 hover:bg-slate-800 shadow-sm'; // Dark grey

//                         return (
//                           <div key={brand} className="w-[84px] shrink-0 flex justify-center">
//                             <button
//                               disabled={!isSelectable && !isSelected}
//                               onClick={() => {
//                                 if (isSelected) {
//                                   setSelectedBrands(prev => prev.filter(b => b !== brand));
//                                   setOpenDropdownBrands(prev => prev.filter(b => b !== brand));
//                                 } else if (isSelectable) {
//                                   setSelectedBrands(prev => [...prev, brand]);
//                                   if (!openDropdownBrands.includes(brand)) {
//                                     setOpenDropdownBrands(prev => [...prev, brand]);
//                                   }
//                                 }
//                               }}
//                               className={`w-12 h-8 shrink-0 flex items-center justify-center border rounded shadow-sm transition-all ${bgColor}`}
//                             >
//                               {brand === 'NM' ? <div className={`font-black text-[10px] tracking-wider ${isSelected || isSelectable ? 'text-white' : 'text-slate-500'}`}>NM</div> :
//                                 brand.toLowerCase().includes('maruti') ? <img src="/maruti_logo.png" alt={brand} className="w-8 h-4 object-contain bg-white rounded-[2px] p-[2px] shadow-sm" /> :
//                                   brand.toLowerCase().includes('hyundai') ? <img src="/hyundai_logo.png" alt={brand} className="w-8 h-4 object-contain bg-white rounded-[2px] p-[2px] shadow-sm" /> :
//                                     <div className={`text-[8px] font-bold text-center leading-tight ${isSelected || isSelectable ? 'text-white' : 'text-slate-500'}`}>{brand}</div>}
//                             </button>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </div>

//                   {/* 4. Model */}
//                   <div className="grid grid-cols-[85px_1fr] border-b border-blue-200">
//                     <div className="border-r border-slate-300 bg-slate-50 p-2 flex flex-col items-center justify-center text-center">
//                       <span className="text-[10px] font-bold text-slate-800">Model</span>
//                     </div>
//                     <div className="p-3 flex justify-center gap-1.5 items-start bg-white min-h-[40px] overflow-x-auto custom-scrollbar">
//                       {allBrands.filter(b => b !== 'CUSTOM_PLAN').map(brand => {
//                         const brandModels = Array.from(new Set(allVariants.filter(v => v.brand === brand).map(v => v.model)));
//                         return (
//                           <div key={brand} className="w-[84px] shrink-0 flex flex-col items-center">
//                             <button
//                               onClick={() => {
//                                 setOpenDropdownBrands(prev =>
//                                   prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
//                                 );
//                               }}
//                               className="w-10 h-5 border border-slate-300 bg-slate-50 rounded shadow-sm text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
//                             >
//                               <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
//                             </button>

//                             {openDropdownBrands.includes(brand) && (
//                               <div className="mt-1.5 bg-white border border-slate-300 shadow-md flex flex-col w-[80px] rounded py-0.5 z-10">
//                                 {brandModels.length === 0 && <div className="px-2 py-1 text-[9px] text-slate-400">No models</div>}
//                                 {brandModels.map(model => {
//                                   const isSelected = selectedModels.some(m => m.brand === brand && m.model === model);
//                                   const isSelectable = isModelSelectable(brand, model);

//                                   let bgColor = 'bg-slate-200 text-slate-500 cursor-not-allowed'; // Light grey - NON-Selectable
//                                   if (isSelected) bgColor = 'bg-blue-600 text-white hover:bg-blue-700 shadow-inner'; // Blue - ONCE Selected
//                                   else if (isSelectable) bgColor = 'bg-slate-700 text-white hover:bg-slate-800 shadow-sm'; // Dark grey - Selectable

//                                   return (
//                                     <button
//                                       key={model}
//                                       disabled={!isSelectable && !isSelected}
//                                       onClick={() => {
//                                         if (isSelected) {
//                                           setSelectedModels(prev => prev.filter(m => !(m.brand === brand && m.model === model)));
//                                           setSelections(prev => prev.filter(s => !(s.brand === brand && s.model === model)));
//                                         } else if (isSelectable) {
//                                           setSelectedModels(prev => [...prev, { brand, model }]);
//                                         }
//                                       }}
//                                       className={`px-1 py-1 mx-0.5 my-0.5 text-[8.5px] font-bold text-center transition-all rounded ${bgColor} leading-[1.1]`}
//                                     >
//                                       {model}
//                                     </button>
//                                   );
//                                 })}
//                               </div>
//                             )}
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </div>

//                   {/* 5. Variant */}
//                   <div className="grid grid-cols-[85px_1fr]">
//                     <div className="border-r border-slate-300 bg-slate-50 p-2 flex flex-col items-center justify-start pt-4 text-center">
//                       <span className="text-[10px] font-bold text-slate-800">Variant</span>
//                       <span className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter mt-1">CLICK HERE</span>
//                     </div>
//                     <div className="p-3 flex justify-center gap-1.5 items-start bg-slate-50/50 min-h-[100px] overflow-x-auto relative">
//                       {allBrands.filter(b => b !== 'CUSTOM_PLAN').map(brand => {
//                         const brandSelectedModels = selectedModels.filter(sm => sm.brand === brand);
//                         return (
//                           <div key={brand} className="w-[84px] shrink-0 flex flex-col items-center gap-1 px-0.5">
//                             {brandSelectedModels.map((sm, idx) => {
//                               const selectedCount = selections.filter(s => s.brand === sm.brand && s.model === sm.model).length;
//                               return (
//                                 <div key={idx} className="flex items-stretch bg-blue-500 text-white rounded shadow-sm w-full hover:shadow transition-shadow">
//                                   <button
//                                     onClick={() => openVariantModal(sm.brand, sm.model)}
//                                     className="w-4 hover:bg-blue-600 rounded-l transition-colors border-r border-blue-400 flex items-center justify-center shrink-0"
//                                     title={`Select variants for ${sm.model}`}
//                                   >
//                                     <Plus size={8} strokeWidth={3} className="text-white" />
//                                   </button>
//                                   <div className="flex-1 px-1 py-1 text-[8.5px] font-bold flex flex-col items-center justify-center bg-blue-500 rounded-r text-center leading-[1.1]">
//                                     <span className="truncate w-full">{sm.model}</span>
//                                     {selectedCount > 0 && <span className="bg-white text-blue-700 text-[7px] px-1 rounded-full shadow-sm mt-[1px]">{selectedCount}</span>}
//                                   </div>
//                                 </div>
//                               );
//                             })}
//                           </div>
//                         );
//                       })}
//                       {selectedModels.length === 0 && (
//                         <div className="absolute left-[85px] right-0 text-[10px] text-slate-400 italic py-1 text-center pointer-events-none mt-2">
//                           Select a model from the dropdowns above
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                 </div>
//               </div>

//               {/* Color Coding Legend matches image exactly */}
//               <div className="p-4 bg-slate-100 flex-shrink-0 border-t border-slate-300">
//                 <div className="bg-slate-200/50 p-3 rounded border border-slate-300 text-[10px] text-slate-700 space-y-1.5">
//                   <div className="font-bold text-slate-800 mb-2 border-b border-slate-300 pb-1">Color Coding:</div>
//                   <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-slate-700 rounded-sm shadow-sm"></div> <span className="font-medium">1) Dark grey</span> — Selectable as it is falling in price range</div>
//                   <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-slate-200 border border-slate-300 rounded-sm"></div> <span className="font-medium text-slate-500">2) Light grey</span> <span className="text-slate-500">— NON-Selectable</span></div>
//                   <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-blue-600 rounded-sm shadow-sm"></div> <span className="font-medium text-blue-700">3) Blue</span> — ONCE Selected</div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </aside>


//       {/* POPUP WINDOW FOR VARIANTS */}
//       {isModalOpen && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
//           <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">

//             <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
//               <h3 className="font-bold text-sm flex items-center gap-2">
//                 Select Variants: <span className="text-blue-300">{modalBrand} {modalModel}</span>
//               </h3>
//               <button onClick={closeVariantModal} className="text-slate-300 hover:text-white transition-colors">
//                 <X size={18} />
//               </button>
//             </div>

//             <div className="p-0 overflow-auto max-h-[60vh] custom-scrollbar">
//               <table className="w-full text-left border-collapse text-xs">
//                 <thead className="bg-slate-100 sticky top-0 shadow-sm z-10">
//                   <tr>
//                     <th className="p-2 border-b border-slate-200 w-10 text-center"></th>
//                     <th className="p-2 border-b border-slate-200 border-l border-slate-200 font-bold text-slate-800">Variant</th>
//                     <th className="p-2 border-b border-slate-200 border-l border-slate-200 font-bold text-slate-800">E/g Type</th>
//                     <th className="p-2 border-b border-slate-200 border-l border-slate-200 font-bold text-slate-800">P/T</th>
//                     <th className="p-2 border-b border-slate-200 border-l border-slate-200 font-bold text-slate-800">Fuel Type</th>
//                     <th className="p-2 border-b border-slate-200 border-l border-slate-200 font-bold text-slate-800 text-slate-400">Drive Type</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100">
//                   {activeVariants.length === 0 ? (
//                     <tr>
//                       <td colSpan={6} className="p-8 text-center text-slate-500">No variants available for this model</td>
//                     </tr>
//                   ) : (
//                     activeVariants.map((v, i) => {
//                       const plan_id = modalBrand === 'NM' ? v.variantId : undefined;
//                       const isSelected = isVariantSelected(modalBrand, modalModel, v.name, v.version, plan_id);
//                       return (
//                         <tr key={i} className={`transition-colors cursor-pointer ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-slate-50 text-slate-800'}`} onClick={() => toggleVariantSelection(modalBrand, modalModel, v.name, v.version, v.variantId)}>
//                           <td className="p-2 border-l border-slate-200 text-center align-middle w-10">
//                             <div className={`w-3.5 h-3.5 border flex items-center justify-center mx-auto transition-colors ${isSelected ? 'bg-white border-white' : 'bg-white border-slate-400'}`}>
//                               {isSelected && <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
//                             </div>
//                           </td>
//                           <td className={`p-2 border-l border-slate-200 font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
//                             {v.name}
//                           </td>
//                           <td className={`p-2 border-l border-slate-200 ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>{v.engine}</td>
//                           <td className={`p-2 border-l border-slate-200 ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>{v.pt}</td>
//                           <td className={`p-2 border-l border-slate-200 ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>{v.fuel}</td>
//                           <td className={`p-2 border-l border-slate-200 ${isSelected ? 'text-blue-100' : 'text-slate-400 italic'}`}>{v.drive || '—'}</td>
//                         </tr>
//                       );
//                     })
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3">
//               <button onClick={closeVariantModal} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded text-sm transition-colors">
//                 Done
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default Sidebar;







// src/components/Sidebar.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { SelectionState } from '../types';
import { fetchSidebarFilters } from '../services/api';
import { ChevronRight, ChevronLeft, Filter, Search, X, Plus, Info, AlertCircle } from 'lucide-react';

interface SidebarProps {
  onCompare: (selections: SelectionState[], priceFilter?: { min: number; max: number }) => void;
  isLoading: boolean;
  selections: SelectionState[];
  setSelections: React.Dispatch<React.SetStateAction<SelectionState[]>>;
  showCompareButton?: boolean;
  onFiltersChange?: (priceFilter: { min: number; max: number }) => void;
}

interface SidebarVariant {
  brand: string;
  model: string;
  body_type: string;
  version: string;
  variant: string;
  variant_id: string;
  price: number;
  engine_type?: string;
  transmission_type?: string;
  fuel_type?: string;
  drive_type?: string;
  is_new_model: boolean;
}

const BODY_TYPES = ['Hatch', 'Sedan', 'SUV', 'MPV', 'Van'];

const Sidebar: React.FC<SidebarProps> = ({
  onCompare,
  isLoading,
  selections,
  setSelections,
  showCompareButton = true,
  onFiltersChange,
}) => {
  const [allVariants, setAllVariants] = useState<SidebarVariant[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Filters state
  const [priceMin, setPriceMin] = useState<number>(() => {
    const saved = sessionStorage.getItem('fc_priceMin');
    return saved ? parseFloat(saved) : 0;
  });
  const [priceMax, setPriceMax] = useState<number>(() => {
    const saved = sessionStorage.getItem('fc_priceMax');
    return saved ? parseFloat(saved) : 100;
  }); // Max 100 Lakhs initially
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('fc_selectedBodyTypes');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('fc_selectedBrands');
    return saved ? JSON.parse(saved) : [];
  });

  // Modal state
  const [modalBrand, setModalBrand] = useState<string>('');
  const [modalModel, setModalModel] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Model dropdown state
  const [openDropdownBrands, setOpenDropdownBrands] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('fc_openDropdownBrands');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedModels, setSelectedModels] = useState<Array<{ brand: string, model: string }>>(() => {
    const saved = sessionStorage.getItem('fc_selectedModels');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist all state
  useEffect(() => {
    sessionStorage.setItem('fc_priceMin', priceMin.toString());
    sessionStorage.setItem('fc_priceMax', priceMax.toString());
    sessionStorage.setItem('fc_selectedBodyTypes', JSON.stringify(selectedBodyTypes));
    sessionStorage.setItem('fc_selectedBrands', JSON.stringify(selectedBrands));
    sessionStorage.setItem('fc_openDropdownBrands', JSON.stringify(openDropdownBrands));
    sessionStorage.setItem('fc_selectedModels', JSON.stringify(selectedModels));
  }, [priceMin, priceMax, selectedBodyTypes, selectedBrands, openDropdownBrands, selectedModels]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchSidebarFilters();
        setAllVariants(data);
        setDataLoaded(true);

        // Find max price to set realistic slider bounds
        if (data.length > 0) {
          const maxP = Math.ceil(Math.max(...data.map((v: SidebarVariant) => v.price)));
          setPriceMax(maxP > 0 ? maxP : 100);
        }

        // Don't auto-select any brands or models. Wait for user interaction as requested.
        // Initialize based on price filter
        const maxP = Math.ceil(Math.max(...data.map((v: SidebarVariant) => v.price)));
        if (!sessionStorage.getItem('fc_priceMax')) {
          setPriceMax(maxP > 0 ? maxP : 100);
        }
      } catch (err) {
        console.error('Failed to fetch sidebar filters', err);
      }
    };
    loadData();
  }, []);

  // ✅ CHANGE 1: price slider badalte hi parent ko turant batao (Compare button ke bina)
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({ min: priceMin, max: priceMax });
    }
  }, [priceMin, priceMax]);

  const toggleBodyType = (type: string) => {
    setSelectedBodyTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const openVariantModal = (brand: string, model: string) => {
    setModalBrand(brand);
    setModalModel(model);
    setIsModalOpen(true);
  };

  const closeVariantModal = () => {
    setIsModalOpen(false);
    setModalModel('');
    setModalBrand('');
  };

  const isVariantSelected = (brand: string, model: string, variant: string, version: string, plan_id?: string) => {
    if (brand === 'NM') return selections.some(s => s.plan_id === plan_id);
    return selections.some(s => s.brand === brand && s.model === model && s.variant === variant && s.version === version);
  };

  const toggleVariantSelection = (brand: string, model: string, variant: string, version: string, variantId: string) => {
    const plan_id = brand === 'NM' ? variantId : undefined;

    if (isVariantSelected(brand, model, variant, version, plan_id)) {
      setSelections(prev => prev.filter(s => {
        if (brand === 'NM') return s.plan_id !== plan_id;
        return !(s.brand === brand && s.model === model && s.variant === variant && s.version === version);
      }));
    } else {
      setSelections(prev => [
        ...prev,
        { brand, model, version, variant, variant_id: variantId, plan_id }
      ]);
    }
  };

  const filteredVariants = useMemo(() => {
    if (selectedBodyTypes.length === 0) return []; // STRICT hierarchy
    return allVariants.filter(v =>
      v.price >= priceMin &&
      v.price <= priceMax &&
      selectedBodyTypes.includes(v.body_type)
    );
  }, [allVariants, priceMin, priceMax, selectedBodyTypes]);

  const isModelSelectable = (brand: string, model: string) => {
    if (!selectedBrands.includes(brand)) return false; // STRICT hierarchy
    return filteredVariants.some(v => v.brand === brand && v.model === model);
  };

  const variantsInPriceRange = useMemo(() => {
    return allVariants.filter(v => v.price >= priceMin && v.price <= priceMax);
  }, [allVariants, priceMin, priceMax]);

  const availableBodyTypesInPrice = useMemo(() => {
    return Array.from(new Set(variantsInPriceRange.map(v => v.body_type)));
  }, [variantsInPriceRange]);

  const availableBrandsInFilter = useMemo(() => {
    return Array.from(new Set(filteredVariants.map(v => v.brand)));
  }, [filteredVariants]);

  const activeVariants = useMemo(() => {
    if (!dataLoaded || !modalBrand || !modalModel) return [];

    // ONLY SHOW VARIANTS IN FILTER! (Price + Body Type)
    // The user said: "jo variants bhi show honge na wo price k bsae pr honge bro"
    const modelVariantsInFilter = filteredVariants.filter(v => v.brand === modalBrand && v.model === modalModel);

    return modelVariantsInFilter.map(v => ({
      name: v.variant,
      version: v.version,
      variantId: v.variant_id,
      engine: v.engine_type || '',
      pt: v.transmission_type || '',
      fuel: v.fuel_type || '',
      drive: v.drive_type || '',
      price: v.price
    }));
  }, [dataLoaded, filteredVariants, modalBrand, modalModel]);

  const allBrands = useMemo(() => {
    const brands = Array.from(new Set(allVariants.map(v => v.brand)));
    return brands.sort((a, b) => {
      if (a === 'NM') return -1;
      if (b === 'NM') return 1;
      return a.localeCompare(b);
    });
  }, [allVariants]);

  const isCompareDisabled = isLoading || selections.length < 2;

  if (!isOpen) {
    return (
      <aside className="w-10 md:w-12 lg:w-14 bg-blue-700 text-slate-900 flex-shrink-0 h-full border-r border-slate-200 flex items-center justify-center">
        <button
          onClick={() => setIsOpen(true)}
          className="h-[80%] w-full flex flex-col items-center justify-center gap-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-colors"
        >
          <ChevronRight size={18} className="text-blue-700" />
          <span className="text-[11px] font-bold tracking-wide text-slate-700 transform -rotate-90 whitespace-nowrap">
            Open Filters
          </span>
        </button>
      </aside>
    );
  }

  return (
    <>
      <aside className="w-[380px] bg-white flex-shrink-0 flex flex-col h-full border-r border-slate-300 shadow-xl z-30 font-sans">

        {/* Header / Compare Button Area */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 -ml-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
              title="Collapse Sidebar"
            >
              <ChevronLeft size={18} />
            </button>
            <Filter size={16} className="text-blue-600" />
            Vehicle Filters
          </div>

          {/* ✅ CHANGE 2: Compare button ab sirf tab dikhega jab showCompareButton true ho (default true) */}
          {showCompareButton && (
            <button
              onClick={() => onCompare(selections, { min: priceMin, max: priceMax })}
              disabled={isCompareDisabled}
              className={`px-4 py-1.5 rounded text-xs font-bold shadow-sm transition-all ${isCompareDisabled
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
            >
              {isLoading ? 'Comparing...' : `Compare (${selections.length})`}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {!dataLoaded ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading catalog...</div>
          ) : (
            <div className="flex flex-col h-full bg-white">
              <div className="flex-1 overflow-y-auto custom-scrollbar border-b border-slate-300">
                <div className="flex flex-col border-t border-slate-300">

                  {/* 1. Price Range Slicer */}
                  <div className="grid grid-cols-[85px_1fr] border-b border-blue-200">
                    <div className="border-r border-slate-300 bg-slate-50 p-2 text-[10px] font-bold flex items-center justify-center text-center text-slate-800">
                      Ex Showroom<br />Price
                    </div>
                    <div className="p-4 flex flex-col gap-2 justify-center bg-white">
                      <div className="relative px-2">
                        {/* Dual range slider */}
                        <div className="relative h-1.5 bg-slate-200 rounded-full">
                          <div
                            className="absolute h-full bg-slate-600 rounded-full"
                            style={{
                              left: `${(priceMin / (Math.ceil(Math.max(...allVariants.map(v => v.price), 100)))) * 100}%`,
                              right: `${100 - (priceMax / (Math.ceil(Math.max(...allVariants.map(v => v.price), 100)))) * 100}%`
                            }}
                          />
                        </div>
                        <input
                          type="range" min={0} max={Math.ceil(Math.max(...allVariants.map(v => v.price), 100))} step={0.5}
                          value={priceMin} onChange={e => { const v = parseFloat(e.target.value); if (v < priceMax) setPriceMin(v); }}
                          className="absolute top-0 left-0 w-full h-1.5 opacity-0 cursor-pointer"
                        />
                        <input
                          type="range" min={0} max={Math.ceil(Math.max(...allVariants.map(v => v.price), 100))} step={0.5}
                          value={priceMax} onChange={e => { const v = parseFloat(e.target.value); if (v > priceMin) setPriceMax(v); }}
                          className="absolute top-0 left-0 w-full h-1.5 opacity-0 cursor-pointer"
                        />
                        {/* Thumbs visual */}
                        <div className="absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 rounded-full bg-[#cc4400] border-2 border-white shadow pointer-events-none" style={{ left: `${(priceMin / (Math.ceil(Math.max(...allVariants.map(v => v.price), 100)))) * 100}%` }} />
                        <div className="absolute top-1/2 -translate-y-1/2 -mr-2 w-4 h-4 rounded-full bg-[#006600] border-2 border-white shadow pointer-events-none" style={{ left: `${(priceMax / (Math.ceil(Math.max(...allVariants.map(v => v.price), 100)))) * 100}%` }} />
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-bold mt-2">
                        <div className="flex flex-col gap-1 items-center">
                          <span className="text-[9px] font-semibold text-slate-500">Min</span>
                          <div className="border border-slate-400 bg-slate-100 rounded px-1.5 py-0.5 flex items-center">
                            <input type="number" className="w-8 outline-none text-center bg-transparent" value={priceMin} onChange={e => { const val = parseFloat(e.target.value); if (!isNaN(val) && val < priceMax) setPriceMin(val); }} />
                            <span>L</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 items-center">
                          <span className="text-[9px] font-semibold text-slate-500">Max</span>
                          <div className="border border-slate-400 bg-slate-100 rounded px-1.5 py-0.5 flex items-center">
                            <input type="number" className="w-8 outline-none text-center bg-transparent" value={priceMax} onChange={e => { const val = parseFloat(e.target.value); if (!isNaN(val) && val > priceMin) setPriceMax(val); }} />
                            <span>L</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Body Type */}
                  <div className="grid grid-cols-[85px_1fr] border-b border-blue-200">
                    <div className="border-r border-slate-300 bg-slate-50 p-2 text-[10px] font-bold flex items-center justify-center text-slate-800">
                      Body Type
                    </div>
                    <div className="p-3 flex gap-2 flex-wrap items-center bg-white">
                      {BODY_TYPES.map(bt => {
                        const isSelected = selectedBodyTypes.includes(bt);
                        const hasInRange = availableBodyTypesInPrice.includes(bt);

                        let cls = '';
                        if (isSelected) {
                          cls = 'bg-blue-500 text-white border-blue-600 shadow-sm';
                        } else if (hasInRange) {
                          cls = 'bg-slate-700 text-white hover:bg-slate-800 shadow-sm'; // Dark grey
                        } else {
                          cls = 'bg-slate-200 text-slate-500 cursor-not-allowed'; // Light grey
                        }

                        return (
                          <button
                            key={bt}
                            disabled={!hasInRange && !isSelected}
                            onClick={() => {
                              if (hasInRange || isSelected) toggleBodyType(bt);
                            }}
                            className={`px-3 py-1 text-[10px] font-bold rounded-sm transition-all ${cls}`}
                          >
                            {bt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Brand */}
                  <div className="grid grid-cols-[85px_1fr] border-b border-blue-200">
                    <div className="border-r border-slate-300 bg-slate-50 p-2 text-[10px] font-bold flex items-center justify-center text-slate-800">
                      Brand
                    </div>
                    <div className="p-3 flex justify-center gap-1.5 items-center bg-white overflow-x-auto custom-scrollbar">
                      {allBrands.filter(b => b !== 'CUSTOM_PLAN').map(brand => {
                        const isSelected = selectedBrands.includes(brand);
                        const isSelectable = availableBrandsInFilter.includes(brand);

                        let bgColor = 'bg-slate-200 border-slate-300 opacity-50 cursor-not-allowed'; // Light grey
                        if (isSelected) bgColor = 'bg-blue-600 border-blue-700 shadow-sm'; // Blue
                        else if (isSelectable) bgColor = 'bg-slate-700 border-slate-800 hover:bg-slate-800 shadow-sm'; // Dark grey

                        return (
                          <div key={brand} className="w-[84px] shrink-0 flex justify-center">
                            <button
                              disabled={!isSelectable && !isSelected}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedBrands(prev => prev.filter(b => b !== brand));
                                  setOpenDropdownBrands(prev => prev.filter(b => b !== brand));
                                } else if (isSelectable) {
                                  setSelectedBrands(prev => [...prev, brand]);
                                  if (!openDropdownBrands.includes(brand)) {
                                    setOpenDropdownBrands(prev => [...prev, brand]);
                                  }
                                }
                              }}
                              className={`w-12 h-8 shrink-0 flex items-center justify-center border rounded shadow-sm transition-all ${bgColor}`}
                            >
                              {brand === 'NM' ? <div className={`font-black text-[10px] tracking-wider ${isSelected || isSelectable ? 'text-white' : 'text-slate-500'}`}>NM</div> :
                                brand.toLowerCase().includes('maruti') ? <img src="/maruti_logo.png" alt={brand} className="w-8 h-4 object-contain bg-white rounded-[2px] p-[2px] shadow-sm" /> :
                                  brand.toLowerCase().includes('hyundai') ? <img src="/hyundai_logo.png" alt={brand} className="w-8 h-4 object-contain bg-white rounded-[2px] p-[2px] shadow-sm" /> :
                                    <div className={`text-[8px] font-bold text-center leading-tight ${isSelected || isSelectable ? 'text-white' : 'text-slate-500'}`}>{brand}</div>}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Model */}
                  <div className="grid grid-cols-[85px_1fr] border-b border-blue-200">
                    <div className="border-r border-slate-300 bg-slate-50 p-2 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-slate-800">Model</span>
                    </div>
                    <div className="p-3 flex justify-center gap-1.5 items-start bg-white min-h-[40px] overflow-x-auto custom-scrollbar">
                      {allBrands.filter(b => b !== 'CUSTOM_PLAN').map(brand => {
                        const brandModels = Array.from(new Set(allVariants.filter(v => v.brand === brand).map(v => v.model)));
                        return (
                          <div key={brand} className="w-[84px] shrink-0 flex flex-col items-center">
                            <button
                              onClick={() => {
                                setOpenDropdownBrands(prev =>
                                  prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
                                );
                              }}
                              className="w-10 h-5 border border-slate-300 bg-slate-50 rounded shadow-sm text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6" /></svg>
                            </button>

                            {openDropdownBrands.includes(brand) && (
                              <div className="mt-1.5 bg-white border border-slate-300 shadow-md flex flex-col w-[80px] rounded py-0.5 z-10">
                                {brandModels.length === 0 && <div className="px-2 py-1 text-[9px] text-slate-400">No models</div>}
                                {brandModels.map(model => {
                                  const isSelected = selectedModels.some(m => m.brand === brand && m.model === model);
                                  const isSelectable = isModelSelectable(brand, model);

                                  let bgColor = 'bg-slate-200 text-slate-500 cursor-not-allowed'; // Light grey - NON-Selectable
                                  if (isSelected) bgColor = 'bg-blue-600 text-white hover:bg-blue-700 shadow-inner'; // Blue - ONCE Selected
                                  else if (isSelectable) bgColor = 'bg-slate-700 text-white hover:bg-slate-800 shadow-sm'; // Dark grey - Selectable

                                  return (
                                    <button
                                      key={model}
                                      disabled={!isSelectable && !isSelected}
                                      onClick={() => {
                                        if (isSelected) {
                                          setSelectedModels(prev => prev.filter(m => !(m.brand === brand && m.model === model)));
                                          setSelections(prev => prev.filter(s => !(s.brand === brand && s.model === model)));
                                        } else if (isSelectable) {
                                          setSelectedModels(prev => [...prev, { brand, model }]);
                                        }
                                      }}
                                      className={`px-1 py-1 mx-0.5 my-0.5 text-[8.5px] font-bold text-center transition-all rounded ${bgColor} leading-[1.1]`}
                                    >
                                      {model}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. Variant */}
                  <div className="grid grid-cols-[85px_1fr]">
                    <div className="border-r border-slate-300 bg-slate-50 p-2 flex flex-col items-center justify-start pt-4 text-center">
                      <span className="text-[10px] font-bold text-slate-800">Variant</span>
                      <span className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter mt-1">CLICK HERE</span>
                    </div>
                    <div className="p-3 flex justify-center gap-1.5 items-start bg-slate-50/50 min-h-[100px] overflow-x-auto relative">
                      {allBrands.filter(b => b !== 'CUSTOM_PLAN').map(brand => {
                        const brandSelectedModels = selectedModels.filter(sm => sm.brand === brand);
                        return (
                          <div key={brand} className="w-[84px] shrink-0 flex flex-col items-center gap-1 px-0.5">
                            {brandSelectedModels.map((sm, idx) => {
                              const selectedCount = selections.filter(s => s.brand === sm.brand && s.model === sm.model).length;
                              return (
                                <div key={idx} className="flex items-stretch bg-blue-500 text-white rounded shadow-sm w-full hover:shadow transition-shadow">
                                  <button
                                    onClick={() => openVariantModal(sm.brand, sm.model)}
                                    className="w-4 hover:bg-blue-600 rounded-l transition-colors border-r border-blue-400 flex items-center justify-center shrink-0"
                                    title={`Select variants for ${sm.model}`}
                                  >
                                    <Plus size={8} strokeWidth={3} className="text-white" />
                                  </button>
                                  <div className="flex-1 px-1 py-1 text-[8.5px] font-bold flex flex-col items-center justify-center bg-blue-500 rounded-r text-center leading-[1.1]">
                                    <span className="truncate w-full">{sm.model}</span>
                                    {selectedCount > 0 && <span className="bg-white text-blue-700 text-[7px] px-1 rounded-full shadow-sm mt-[1px]">{selectedCount}</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                      {selectedModels.length === 0 && (
                        <div className="absolute left-[85px] right-0 text-[10px] text-slate-400 italic py-1 text-center pointer-events-none mt-2">
                          Select a model from the dropdowns above
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Color Coding Legend matches image exactly */}
              <div className="p-4 bg-slate-100 flex-shrink-0 border-t border-slate-300">
                <div className="bg-slate-200/50 p-3 rounded border border-slate-300 text-[10px] text-slate-700 space-y-1.5">
                  <div className="font-bold text-slate-800 mb-2 border-b border-slate-300 pb-1">Color Coding:</div>
                  <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-slate-700 rounded-sm shadow-sm"></div> <span className="font-medium">1) Dark grey</span> — Selectable as it is falling in price range</div>
                  <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-slate-200 border border-slate-300 rounded-sm"></div> <span className="font-medium text-slate-500">2) Light grey</span> <span className="text-slate-500">— NON-Selectable</span></div>
                  <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-blue-600 rounded-sm shadow-sm"></div> <span className="font-medium text-blue-700">3) Blue</span> — ONCE Selected</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>


      {/* POPUP WINDOW FOR VARIANTS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">

            <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                Select Variants: <span className="text-blue-300">{modalBrand} {modalModel}</span>
              </h3>
              <button onClick={closeVariantModal} className="text-slate-300 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-0 overflow-auto max-h-[60vh] custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="p-2 border-b border-slate-200 w-10 text-center"></th>
                    <th className="p-2 border-b border-slate-200 border-l border-slate-200 font-bold text-slate-800">Variant</th>
                    <th className="p-2 border-b border-slate-200 border-l border-slate-200 font-bold text-slate-800">E/g Type</th>
                    <th className="p-2 border-b border-slate-200 border-l border-slate-200 font-bold text-slate-800">P/T</th>
                    <th className="p-2 border-b border-slate-200 border-l border-slate-200 font-bold text-slate-800">Fuel Type</th>
                    <th className="p-2 border-b border-slate-200 border-l border-slate-200 font-bold text-slate-800 text-slate-400">Drive Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeVariants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">No variants available for this model</td>
                    </tr>
                  ) : (
                    activeVariants.map((v, i) => {
                      const plan_id = modalBrand === 'NM' ? v.variantId : undefined;
                      const isSelected = isVariantSelected(modalBrand, modalModel, v.name, v.version, plan_id);
                      return (
                        <tr key={i} className={`transition-colors cursor-pointer ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-slate-50 text-slate-800'}`} onClick={() => toggleVariantSelection(modalBrand, modalModel, v.name, v.version, v.variantId)}>
                          <td className="p-2 border-l border-slate-200 text-center align-middle w-10">
                            <div className={`w-3.5 h-3.5 border flex items-center justify-center mx-auto transition-colors ${isSelected ? 'bg-white border-white' : 'bg-white border-slate-400'}`}>
                              {isSelected && <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            </div>
                          </td>
                          <td className={`p-2 border-l border-slate-200 font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                            {v.name}
                          </td>
                          <td className={`p-2 border-l border-slate-200 ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>{v.engine}</td>
                          <td className={`p-2 border-l border-slate-200 ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>{v.pt}</td>
                          <td className={`p-2 border-l border-slate-200 ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>{v.fuel}</td>
                          <td className={`p-2 border-l border-slate-200 ${isSelected ? 'text-blue-100' : 'text-slate-400 italic'}`}>{v.drive || '—'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={closeVariantModal} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded text-sm transition-colors">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
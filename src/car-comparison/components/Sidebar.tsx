// // src/components/Sidebar.tsx
// import React, { useEffect, useMemo, useState } from 'react';
// import { ModelDetails, SelectionState, DropdownOption } from '../types';
// import { fetchModelDetails } from '../services/api';
// import { ChevronDown, CarFront, ChevronLeft, ChevronRight } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

// interface SidebarProps {
//   onCompare: (selections: SelectionState[]) => void;
//   isLoading: boolean;
// }

// // ---------------- Animations ----------------
// const headerVariant = {
//   hidden: { opacity: 0, y: -10 },
//   visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
// };

// const cardsContainerVariant = {
//   hidden: {},
//   visible: {
//     transition: {
//       delayChildren: 0.15,
//       staggerChildren: 0.1,
//     },
//   },
// };

// const cardVariant = {
//   hidden: { opacity: 0, y: 40 },
//   visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
// };

// const tipVariant = {
//   hidden: { opacity: 0, y: 18 },
//   visible: { opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.25, ease: 'easeOut' } },
// };

// const buttonVariant = {
//   hidden: { opacity: 0, y: 40 },
//   visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.35, ease: 'easeOut' } },
// };

// const Sidebar: React.FC<SidebarProps> = ({ onCompare, isLoading }) => {
//   const [modelData, setModelData] = useState<ModelDetails | null>(null);

//   // ✅ Brand -> Car -> Version (required) -> Variant
//   const [selections, setSelections] = useState<SelectionState[]>([
//     { brand: '', model: '', version: '', variant: '' },
//     { brand: '', model: '', version: '', variant: '' },
//   ]);

//   // Sidebar open/close
//   const [isOpen, setIsOpen] = useState<boolean>(true);

//   // Re-trigger animation
//   const [contentKey, setContentKey] = useState(0);

//   const hasData = useMemo(() => !!modelData, [modelData]);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         const data = await fetchModelDetails();
//         setModelData(data);
//       } catch (err) {
//         console.error('Failed to fetch model details', err);
//       }
//     };
//     loadData();
//   }, []);

//   useEffect(() => {
//     if (isOpen && hasData) setContentKey((k) => k + 1);
//   }, [isOpen, hasData]);

//   const addVehicleCard = () => {
//     setSelections((prev) => [...prev, { brand: '', model: '', version: '', variant: '' }]);
//     setContentKey((k) => k + 1);
//   };

//   const removeVehicleCard = (idx: number) => {
//     setSelections((prev) => prev.filter((_, i) => i !== idx));
//     setContentKey((k) => k + 1);
//   };

//   const handleSelectionChange = (idx: number, field: keyof SelectionState, value: string) => {
//     setSelections((prev) => {
//       const next = [...prev];
//       const current = next[idx];

//       // ✅ chain resets
//       if (field === 'brand') next[idx] = { brand: value, model: '', version: '', variant: '' };
//       else if (field === 'model') next[idx] = { ...current, model: value, version: '', variant: '' };
//       else if (field === 'version') next[idx] = { ...current, version: value, variant: '' };
//       else next[idx] = { ...current, variant: value };

//       return next;
//     });
//   };

//   // ✅ keys for lookup
//   const bmKey = (s: SelectionState) => (s.brand && s.model ? `${s.brand}__${s.model}` : '');
//   const bmvKey = (s: SelectionState) =>
//     s.brand && s.model && s.version ? `${s.brand}__${s.model}__${s.version}` : '';

//   const getVersionOptions = (s: SelectionState): DropdownOption[] => {
//     if (!modelData) return [];
//     const key = bmKey(s);
//     return key ? modelData.versions[key] || [] : [];
//   };

//   const getVariantOptions = (s: SelectionState): string[] => {
//     if (!modelData) return [];
//     const key = bmvKey(s);
//     return key ? modelData.variants[key] || [] : [];
//   };

//   // ✅ Compare disabled: require all fields for all cards
//   const isCompareDisabled =
//     isLoading ||
//     selections.some((s) => !s.brand || !s.model || !s.version || !s.variant);

//   // ✅ Dropdown renderer supports string[] OR DropdownOption[]
//   const renderDropdown = (
//     label: string,
//     value: string,
//     options: (string | DropdownOption)[],
//     onChange: (val: string) => void,
//     disabled: boolean = false
//   ) => (
//     <div className="mb-2">
//       <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
//         {label}
//       </label>

//       <div className="relative">
//         <select
//           value={value}
//           onChange={(e) => onChange(e.target.value)}
//           disabled={disabled || options.length === 0}
//           className={`block w-full appearance-none bg-white border border-slate-300 text-slate-800 py-1.5 px-3 pr-8 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
//             disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'cursor-pointer'
//           }`}
//         >
//           <option value="">Select {label}</option>

//           {options.map((opt) => {
//             const o = typeof opt === 'string' ? { value: opt, label: opt } : opt;
//             return (
//               <option key={o.value} value={o.value}>
//                 {o.label}
//               </option>
//             );
//           })}
//         </select>

//         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
//           <ChevronDown size={16} />
//         </div>
//       </div>
//     </div>
//   );

//   // ---------- CLOSED STATE UI ----------
//   if (!isOpen) {
//     return (
//       <aside
//         className="
//           w-10 md:w-12 lg:w-14
//           bg-blue-700
//           text-slate-900
//           flex-shrink-0
//           h-full
//           border-r border-slate-200
//           flex items-center justify-center
//         "
//       >
//         <button
//           type="button"
//           onClick={() => setIsOpen(true)}
//           className="
//             h-[80%] w-full
//             flex flex-col items-center justify-center
//             gap-2
//             rounded-full
//             bg-white/90 hover:bg-white
//             shadow-md
//             transition-colors
//           "
//           aria-label="Open car selection sidebar"
//         >
//           <ChevronRight size={18} className="text-black-700" />
//           <span className="text-[11px] font-bold tracking-wide text-slate-700 transform -rotate-90">
//             Select Cars Here
//           </span>
//         </button>
//       </aside>
//     );
//   }

//   // ---------- OPEN STATE UI ----------
//   return (
//     <AnimatePresence mode="wait">
//       {isOpen && (
//         <motion.aside
//           key="sidebar-open"
//           initial={{ opacity: 1 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 1 }}
//           className="
//             w-full 
//             md:w-[520px] 
//             lg:w-[420px] 
//             bg-white-200 text-slate-900 
//             flex-shrink-0 flex flex-col h-full 
//             border-r border-slate-200
//           "
//         >
//           {/* Header */}
//           <motion.div
//             variants={headerVariant}
//             initial="hidden"
//             animate="visible"
//             className="flex items-center justify-between p-5 border-b border-black-200 bg-blue-500"
//           >
//             <div>
//               <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
//                 <CarFront className="text-black-500" />
//                 <span>Select Cars</span>
//               </h2>
//               <p className="text-sm text-black-500 mt-1">
//                 Choose vehicles to compare variants and features.
//               </p>
//             </div>

//             <button
//               type="button"
//               onClick={() => setIsOpen(false)}
//               className="
//                 ml-2 inline-flex items-center justify-center
//                 rounded-full border border-slate-300
//                 bg-white p-1.5 shadow-sm
//                 hover:bg-slate-100
//                 transition-colors
//               "
//               aria-label="Close sidebar"
//             >
//               <ChevronLeft size={18} className="text-slate-700" />
//             </button>
//           </motion.div>

//           <div className="px-5 pt-4 pb-3 flex-1 overflow-y-auto space-y-3">
//             {!modelData ? (
//               <div className="text-sm text-slate-600">Loading options...</div>
//             ) : (
//               <motion.div key={contentKey} initial="hidden" animate="visible" className="space-y-3">
//                 <motion.div variants={cardsContainerVariant} className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   {selections.map((sel, idx) => {
//                     const versionOptions = getVersionOptions(sel);
//                     const variantOptions = getVariantOptions(sel);

//                     return (
//                       <motion.div
//                         key={`${idx}-${contentKey}`}
//                         variants={cardVariant}
//                         className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm"
//                       >
//                         <h3 className="text-base font-semibold text-slate-700 mb-2 flex items-center gap-2">
//                           <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
//                             {idx + 1}
//                           </span>
//                           Vehicle {idx + 1}
//                         </h3>

//                         {/* Brand */}
//                         {renderDropdown('Brand', sel.brand, modelData.brands, (v) =>
//                           handleSelectionChange(idx, 'brand', v)
//                         )}

//                         {/* Car */}
//                         {renderDropdown(
//                           'Car',
//                           sel.model,
//                           sel.brand ? modelData.models[sel.brand] || [] : [],
//                           (v) => handleSelectionChange(idx, 'model', v),
//                           !sel.brand
//                         )}

//                         {/* Version (mandatory) */}
//                         {renderDropdown(
//                           'Version',
//                           sel.version,
//                           versionOptions,
//                           (v) => handleSelectionChange(idx, 'version', v),
//                           !sel.model
//                         )}

//                         {/* Variant (depends on version) */}
//                         {renderDropdown(
//                           'Variant',
//                           sel.variant,
//                           variantOptions,
//                           (v) => handleSelectionChange(idx, 'variant', v),
//                           !sel.version
//                         )}

//                         {selections.length > 2 && (
//                           <button
//                             type="button"
//                             onClick={() => removeVehicleCard(idx)}
//                             className="mt-2 text-xs text-red-600 hover:underline"
//                           >
//                             Remove
//                           </button>
//                         )}
//                       </motion.div>
//                     );
//                   })}
//                 </motion.div>

//                 <motion.div
//                   variants={tipVariant}
//                   className="bg-white rounded-lg px-3 py-2 text-[11px] text-slate-600 border border-slate-200 shadow-sm"
//                 >
//                   Tip: Version is mandatory now — pick it before selecting variant.
//                 </motion.div>

//                 <button
//                   type="button"
//                   onClick={addVehicleCard}
//                   className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm font-semibold bg-blue-200"
//                 >
//                   + Add Vehicle
//                 </button>
//               </motion.div>
//             )}
//           </div>

//           {/* Compare button */}
//           <motion.div
//             key={`footer-${contentKey}`}
//             variants={buttonVariant}
//             initial="hidden"
//             animate="visible"
//             className="p-5 border-t border-slate-200 bg-sky-50"
//           >
//             <button
//               onClick={() => onCompare(selections)}
//               disabled={isCompareDisabled}
//               className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm shadow-md transition-all duration-200 ${
//                 isCompareDisabled
//                   ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
//                   : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]'
//               }`}
//             >
//               {isLoading ? 'Comparing...' : 'Compare Now'}
//             </button>
//           </motion.div>
//         </motion.aside>
//       )}
//     </AnimatePresence>
//   );
// };

// export default Sidebar;

// src/components/Sidebar.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { ModelDetails, SelectionState, DropdownOption } from '../types';
import { fetchModelDetails } from '../services/api';
import { ChevronDown, CarFront, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  onCompare: (selections: SelectionState[]) => void;
  isLoading: boolean;
}

// ---------------- Animations ----------------
const headerVariant = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const cardsContainerVariant = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.15,
      staggerChildren: 0.1,
    },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

const tipVariant = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.25, ease: 'easeOut' } },
};

const buttonVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.35, ease: 'easeOut' } },
};

// ✅ NEW: Map version numbers to display labels
const getVersionLabel = (versionValue: string): string => {
  const versionNum = parseInt(versionValue.replace('v', ''));

  // Map version 1 → Jan 2026, version 2 → Feb 2026, etc.
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const year = 2026;

  if (isNaN(versionNum) || versionNum < 1) return versionValue;

  const monthIndex = (versionNum - 1) % 12;
  const yearOffset = Math.floor((versionNum - 1) / 12);

  return `${months[monthIndex]} ${year + yearOffset}`;
};

const Sidebar: React.FC<SidebarProps> = ({ onCompare, isLoading }) => {
  const [modelData, setModelData] = useState<ModelDetails | null>(null);

  const [selections, setSelections] = useState<SelectionState[]>([
    { brand: '', model: '', version: '', variant: '' },
    { brand: '', model: '', version: '', variant: '' },
  ]);

  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [contentKey, setContentKey] = useState(0);

  const hasData = useMemo(() => !!modelData, [modelData]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchModelDetails();
        setModelData(data);
      } catch (err) {
        console.error('Failed to fetch model details', err);
      }
    };
    loadData();
  }, []);

  // ✅ PREFILL Selections (Vehicle 1 & 2)
  useEffect(() => {
    if (!modelData || modelData.brands.length === 0) return;

    // Only run if Vehicle 1 is empty (initial load) to avoid overwriting user edits
    if (selections[0].brand !== '') return;

    const getFullSelection = (brandName: string, modelIdx: number): SelectionState | null => {
      const models = modelData.models[brandName] || [];
      const model = models[modelIdx];
      if (!model) return null;

      const bmKey = `${brandName}__${model}`;
      const versions = modelData.versions[bmKey] || [];
      if (versions.length === 0) return null;

      const versionVal = versions[0].value;
      const bmvKey = `${brandName}__${model}__${versionVal}`;
      const variants = modelData.variants[bmvKey] || [];

      if (variants.length === 0) return null;

      const variant = variants[0];
      const variantKey = `${bmvKey}__${variant}`;
      const variantId = modelData.variantIds?.[variantKey] || '';

      return {
        brand: brandName,
        model,
        version: versionVal,
        variant,
        variant_id: variantId
      };
    };

    // 1. Vehicle 1: First Brand, First Model
    const firstBrand = modelData.brands[0];
    const sel1 = getFullSelection(firstBrand, 0);

    // 2. Vehicle 2: Try Different Model (Same Brand) or Different Brand
    let sel2: SelectionState | null = null;

    // Strategy A: Same Brand, Second Model
    sel2 = getFullSelection(firstBrand, 1);

    // Strategy B: If no second model, try Second Brand, First Model
    if (!sel2 && modelData.brands.length > 1) {
      sel2 = getFullSelection(modelData.brands[1], 0);
    }

    // Strategy C: Fallback to same as Vehicle 1
    if (!sel2) sel2 = sel1;

    if (sel1 && sel2) {
      setSelections(prev => {
        const next = [...prev];
        next[0] = sel1!;
        next[1] = sel2!;
        return next;
      });
      setContentKey(k => k + 1);
    }
  }, [modelData]);

  useEffect(() => {
    if (isOpen && hasData) setContentKey((k) => k + 1);
  }, [isOpen, hasData]);

  const addVehicleCard = () => {
    if (selections.length >= 5) {
      alert('Maximum 5 vehicles can be compared');
      return;
    }
    setSelections((prev) => [...prev, { brand: '', model: '', version: '', variant: '' }]);
    setContentKey((k) => k + 1);
  };

  const removeVehicleCard = (idx: number) => {
    setSelections((prev) => prev.filter((_, i) => i !== idx));
    setContentKey((k) => k + 1);
  };

  const handleSelectionChange = (idx: number, field: keyof SelectionState, value: string) => {
    setSelections((prev) => {
      const next = [...prev];
      const current = next[idx];

      if (field === 'brand') {
        next[idx] = { brand: value, model: '', version: '', variant: '' };
      } else if (field === 'model') {
        next[idx] = { ...current, model: value, version: '', variant: '' };
      } else if (field === 'variant') {
        // ✅ SWAPPED: Variant now comes before version
        next[idx] = { ...current, variant: value, version: '' };
      } else if (field === 'version') {
        // ✅ NEW: Store variant_id when version is selected (now last step)
        const bmvKey = `${current.brand}__${current.model}__${value}`;
        const variantKey = `${bmvKey}__${current.variant}`;
        const variantId = modelData?.variantIds?.[variantKey] || '';

        next[idx] = { ...current, version: value, variant_id: variantId };
      }

      return next;
    });
  };

  const bmKey = (s: SelectionState) => (s.brand && s.model ? `${s.brand}__${s.model}` : '');
  const bmvKey = (s: SelectionState) =>
    s.brand && s.model && s.variant ? `${s.brand}__${s.model}__${s.variant}` : '';

  // ✅ UPDATED: Get version options based on brand + model + variant
  const getVersionOptions = (s: SelectionState): DropdownOption[] => {
    if (!modelData || !s.variant) return [];
    const key = bmKey(s);
    const versions = key ? modelData.versions[key] || [] : [];

    // Map version values to display labels
    return versions.map(v => ({
      value: v.value,
      label: getVersionLabel(v.value)
    }));
  };

  // ✅ UPDATED: Get variant options based on brand + model only
  const getVariantOptions = (s: SelectionState): string[] => {
    if (!modelData || !s.model) return [];

    // Get all versions for this brand+model
    const key = bmKey(s);
    const versions = key ? modelData.versions[key] || [] : [];

    if (versions.length === 0) return [];

    // Get variants from first version (they should be same across versions)
    const firstVersionKey = `${s.brand}__${s.model}__${versions[0].value}`;
    return modelData.variants[firstVersionKey] || [];
  };

  const isCompareDisabled =
    isLoading ||
    selections.some((s) => !s.brand || !s.model || !s.version || !s.variant);

  const renderDropdown = (
    label: string,
    value: string,
    options: (string | DropdownOption)[],
    onChange: (val: string) => void,
    disabled: boolean = false
  ) => (
    <div className="mb-2">
      <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || options.length === 0}
          className={`block w-full appearance-none bg-white border border-slate-300 text-slate-800 py-1.5 px-3 pr-8 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'cursor-pointer'
            }`}
        >
          <option value="">Select {label}</option>

          {options.map((opt) => {
            const o = typeof opt === 'string' ? { value: opt, label: opt } : opt;
            return (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            );
          })}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );

  // ---------- CLOSED STATE UI ----------
  if (!isOpen) {
    return (
      <aside className="w-10 md:w-12 lg:w-14 bg-blue-700 text-slate-900 flex-shrink-0 h-full border-r border-slate-200 flex items-center justify-center">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="h-[80%] w-full flex flex-col items-center justify-center gap-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-colors"
          aria-label="Open car selection sidebar"
        >
          <ChevronRight size={18} className="text-black-700" />
          <span className="text-[11px] font-bold tracking-wide text-slate-700 transform -rotate-90">
            Select Cars Here
          </span>
        </button>
      </aside>
    );
  }

  // ---------- OPEN STATE UI ----------
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          key="sidebar-open"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          className="w-full md:w-[520px] lg:w-[420px] bg-white-200 text-slate-900 flex-shrink-0 flex flex-col h-full border-r border-slate-200"
        >
          {/* Header */}
          <motion.div
            variants={headerVariant}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-between p-5 border-b border-black-200 bg-blue-500"
          >
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                <CarFront className="text-black-500" />
                <span>Select Cars</span>
              </h2>
              <p className="text-sm text-black-500 mt-1">
                Choose 2-5 vehicles to compare variants and features.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="ml-2 inline-flex items-center justify-center rounded-full border border-slate-300 bg-white p-1.5 shadow-sm hover:bg-slate-100 transition-colors"
              aria-label="Close sidebar"
            >
              <ChevronLeft size={18} className="text-slate-700" />
            </button>
          </motion.div>

          <div className="px-5 pt-4 pb-3 flex-1 overflow-y-auto space-y-3">
            {!modelData ? (
              <div className="text-sm text-slate-600">Loading options...</div>
            ) : (
              <motion.div key={contentKey} initial="hidden" animate="visible" className="space-y-3">
                <motion.div variants={cardsContainerVariant} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selections.map((sel, idx) => {
                    const variantOptions = getVariantOptions(sel);
                    const versionOptions = getVersionOptions(sel);

                    return (
                      <motion.div
                        key={`${idx}-${contentKey}`}
                        variants={cardVariant}
                        className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm"
                      >
                        <h3 className="text-base font-semibold text-slate-700 mb-2 flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                            {idx + 1}
                          </span>
                          Vehicle {idx + 1}
                        </h3>

                        {renderDropdown('Brand', sel.brand, modelData.brands, (v) =>
                          handleSelectionChange(idx, 'brand', v)
                        )}

                        {renderDropdown(
                          'Car',
                          sel.model,
                          sel.brand ? modelData.models[sel.brand] || [] : [],
                          (v) => handleSelectionChange(idx, 'model', v),
                          !sel.brand
                        )}

                        {/* ✅ SWAPPED ORDER: Variant comes before Launch Date */}
                        {renderDropdown(
                          'Variant',
                          sel.variant,
                          variantOptions,
                          (v) => handleSelectionChange(idx, 'variant', v),
                          !sel.model
                        )}

                        {/* ✅ RENAMED: Version → Launch Date, with mapped values */}
                        {renderDropdown(
                          'As Of Date',
                          sel.version,
                          versionOptions,
                          (v) => handleSelectionChange(idx, 'version', v),
                          !sel.variant
                        )}

                        {selections.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeVehicleCard(idx)}
                            className="mt-2 text-xs text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>

                <motion.div
                  variants={tipVariant}
                  className="bg-white rounded-lg px-3 py-2 text-[11px] text-slate-600 border border-slate-200 shadow-sm"
                >
                  Tip: You can now compare up to 5 vehicles at once!
                </motion.div>

                {selections.length < 5 && (
                  <button
                    type="button"
                    onClick={addVehicleCard}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 text-sm font-semibold bg-blue-200"
                  >
                    + Add Vehicle (up to 5)
                  </button>
                )}
              </motion.div>
            )}
          </div>

          {/* Compare button */}
          <motion.div
            key={`footer-${contentKey}`}
            variants={buttonVariant}
            initial="hidden"
            animate="visible"
            className="p-5 border-t border-slate-200 bg-sky-50"
          >
            <button
              onClick={() => onCompare(selections)}
              disabled={isCompareDisabled}
              className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm shadow-md transition-all duration-200 ${isCompareDisabled
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]'
                }`}
            >
              {isLoading ? 'Comparing...' : `Compare ${selections.length} Vehicles`}
            </button>
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
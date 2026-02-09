// src/components/Sidebar.tsx
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { ModelDetails, SelectionState, DropdownOption } from '../types';
import { fetchModelDetails } from '../services/api';
import { ChevronDown, CarFront, ChevronLeft, ChevronRight, X, Plus, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  onCompare: (selections: SelectionState[]) => void;
  isLoading: boolean;
  selections: SelectionState[];
  setSelections: React.Dispatch<React.SetStateAction<SelectionState[]>>;
}

// ---------------- Animations ----------------
const headerVariant = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const matrixVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const buttonVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: 0.35,
      ease: [0.4, 0, 0.2, 1] as const
    }
  },
};

// ✅ HELPER: Map version numbers to display labels
const getVersionLabel = (versionValue: string): string => {
  const versionNum = parseInt(versionValue.replace('v', ''));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const year = 2026;

  if (isNaN(versionNum) || versionNum < 1) return versionValue;

  const monthIndex = (versionNum - 1) % 12;
  const yearOffset = Math.floor((versionNum - 1) / 12);
  return `${months[monthIndex]} ${year + yearOffset}`;
};

const Sidebar: React.FC<SidebarProps> = ({ onCompare, isLoading, selections, setSelections }) => {
  const [modelData, setModelData] = useState<ModelDetails | null>(null);

  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [contentKey, setContentKey] = useState(0);

  // Resize state
  const [sidebarWidth, setSidebarWidth] = useState(480);
  const isResizingRef = useRef(false);

  const hasData = useMemo(() => !!modelData, [modelData]);

  // Handle sidebar resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      let newWidth = e.clientX;
      if (newWidth < 300) newWidth = 300; // Minimum width
      if (newWidth > 800) newWidth = 800; // Maximum width
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; // Prevent selection while dragging
  };

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

    // Skip prefill if we already have valid selections (from initialSelections or user edits)
    const hasExistingData = selections.some(s => s.brand !== '');
    if (hasExistingData) return;

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

    const firstBrand = modelData.brands[0];
    const sel1 = getFullSelection(firstBrand, 0);

    let sel2: SelectionState | null = null;
    sel2 = getFullSelection(firstBrand, 1);
    if (!sel2 && modelData.brands.length > 1) {
      sel2 = getFullSelection(modelData.brands[1], 0);
    }
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
        // Find first available version for this car
        const bmKeyStr = `${current.brand}__${value}`;
        const firstVer = modelData?.versions[bmKeyStr]?.[0]?.value || '';
        next[idx] = { ...current, model: value, version: firstVer, variant: '' };
      } else if (field === 'variant') {
        const bmvKey = `${current.brand}__${current.model}__${current.version}`;
        const variantKey = `${bmvKey}__${value}`;
        const variantId = modelData?.variantIds?.[variantKey] || '';

        next[idx] = { ...current, variant: value, variant_id: variantId };
      } else if (field === 'version') {
        const bmvKey = `${current.brand}__${current.model}__${value}`;
        const variantKey = `${bmvKey}__${current.variant}`;
        const variantId = modelData?.variantIds?.[variantKey] || '';

        next[idx] = { ...current, version: value, variant_id: variantId };
      }

      return next;
    });
  };

  const moveVehicle = (idx: number, direction: 'left' | 'right') => {
    setSelections((prev) => {
      const next = [...prev];
      const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;

      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
    setContentKey((k) => k + 1);
  };

  const bmKey = (s: SelectionState) => (s.brand && s.model ? `${s.brand}__${s.model}` : '');

  const getVersionOptions = (s: SelectionState): DropdownOption[] => {
    if (!modelData || !s.variant) return [];
    const key = bmKey(s);
    const versions = key ? modelData.versions[key] || [] : [];
    return versions.map(v => ({
      value: v.value,
      label: getVersionLabel(v.value)
    }));
  };

  const getVariantOptions = (s: SelectionState): string[] => {
    if (!modelData || !s.model) return [];
    const key = bmKey(s);
    const versions = key ? modelData.versions[key] || [] : [];
    if (versions.length === 0) return [];
    const firstVersionKey = `${s.brand}__${s.model}__${versions[0].value}`;
    return modelData.variants[firstVersionKey] || [];
  };

  const isCompareDisabled =
    isLoading ||
    selections.some((s) => !s.brand || !s.model || !s.version || !s.variant);

  const renderCellDropdown = (
    value: string,
    options: (string | DropdownOption)[],
    onChange: (val: string) => void,
    disabled: boolean = false,
    placeholder: string = "Select"
  ) => (
    <div className="relative min-w-[85px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || options.length === 0}
        className={`block w-full appearance-none bg-white border border-slate-300 text-slate-800 py-1.5 px-2 pr-6 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors ${disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'cursor-pointer'
          }`}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => {
          const o = typeof opt === 'string' ? { value: opt, label: opt } : opt;
          return (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          );
        })}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-slate-400">
        <ChevronDown size={14} />
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

  // ---------- OPEN STATE UI (Matrix) ----------
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          key="sidebar-open"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          className="relative bg-slate-50 text-slate-900 flex-shrink-0 flex flex-col h-full border-r border-slate-200 shadow-xl z-30"
          style={{ width: sidebarWidth, maxWidth: '100vw' }}
        >
          {/* Resize Handle */}
          <div
            onMouseDown={startResizing}
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 transition-colors z-50 opacity-0 hover:opacity-100"
            title="Drag to resize sidebar"
          />

          {/* Header */}
          <motion.div
            variants={headerVariant}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-between p-3 border-b border-blue-600 bg-blue-600 text-white shadow-md"
          >
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <CarFront className="text-white" size={16} />
                <span>Select Cars</span>
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="ml-2 inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 p-1 transition-colors"
            >
              <ChevronLeft size={16} className="text-white" />
            </button>
          </motion.div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {!modelData ? (
              <div className="p-5 text-xs text-slate-500">Loading details...</div>
            ) : (
              <motion.div
                className="flex-1 flex flex-col overflow-hidden"
                variants={matrixVariant}
                initial="hidden"
                animate="visible"
              >
                {/* Matrix Container for Horizontal Scroll */}
                <div className="flex-1 overflow-auto p-1">
                  <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full border-collapse table-fixed">
                      <thead>
                        <tr>
                          {/* Label Column - Very Narrow */}
                          <th className="p-1 w-12 sticky left-0 bg-slate-50 z-10 border-b border-slate-200">
                            {/* Empty header for label column */}
                          </th>

                          {selections.map((_, idx) => (
                            <th key={`head-${idx}`} className="p-1 border-b border-slate-200 bg-slate-50">
                              <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-1">
                                  {idx > 0 && (
                                    <button
                                      onClick={() => moveVehicle(idx, 'left')}
                                      className="text-slate-400 hover:text-blue-500 transition-colors"
                                      title="Move Left"
                                    >
                                      <ChevronLeft size={10} />
                                    </button>
                                  )}
                                  <span className="text-[9px] font-bold text-slate-700 whitespace-nowrap">Veh {idx + 1}</span>
                                  {idx < selections.length - 1 && (
                                    <button
                                      onClick={() => moveVehicle(idx, 'right')}
                                      className="text-slate-400 hover:text-blue-500 transition-colors"
                                      title="Move Right"
                                    >
                                      <ChevronRight size={10} />
                                    </button>
                                  )}
                                </div>
                                {selections.length > 2 && (
                                  <button
                                    onClick={() => removeVehicleCard(idx)}
                                    className="text-slate-400 hover:text-red-500 transition-colors ml-1"
                                  >
                                    <X size={10} />
                                  </button>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">

                        {/* Brand Row */}
                        <tr>
                          <td className="p-1 px-2 text-[9px] font-bold text-slate-600 uppercase w-12 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-sm truncate">
                            Brand
                          </td>
                          {selections.map((sel, idx) => (
                            <td key={`brand-${idx}`} className="p-0.5">
                              {renderCellDropdown(
                                sel.brand,
                                modelData.brands,
                                (v) => handleSelectionChange(idx, 'brand', v),
                                false,
                                "Brand"
                              )}
                            </td>
                          ))}
                        </tr>

                        {/* Car Row */}
                        <tr>
                          <td className="p-1 px-2 text-[9px] font-bold text-slate-600 uppercase w-12 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-sm truncate">
                            Car
                          </td>
                          {selections.map((sel, idx) => (
                            <td key={`car-${idx}`} className="p-0.5">
                              {renderCellDropdown(
                                sel.model,
                                sel.brand ? modelData.models[sel.brand] || [] : [],
                                (v) => handleSelectionChange(idx, 'model', v),
                                !sel.brand,
                                "Car"
                              )}
                            </td>
                          ))}
                        </tr>

                        {/* Variant Row */}
                        <tr>
                          <td className="p-1 px-2 text-[9px] font-bold text-slate-600 uppercase w-12 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-sm truncate">
                            Var
                          </td>
                          {selections.map((sel, idx) => (
                            <td key={`var-${idx}`} className="p-0.5">
                              {renderCellDropdown(
                                sel.variant,
                                getVariantOptions(sel),
                                (v) => handleSelectionChange(idx, 'variant', v),
                                !sel.model,
                                "Var"
                              )}
                            </td>
                          ))}
                        </tr>

                        {/* Date Row (Version) */}
                        <tr>
                          <td className="p-1 px-2 text-[9px] font-bold text-slate-600 uppercase w-12 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-sm truncate">
                            Date
                          </td>
                          {selections.map((sel, idx) => (
                            <td key={`ver-${idx}`} className="p-0.5">
                              {renderCellDropdown(
                                sel.version,
                                getVersionOptions(sel),
                                (v) => handleSelectionChange(idx, 'version', v),
                                !sel.variant,
                                "Date"
                              )}
                            </td>
                          ))}
                        </tr>

                        {/* ADD BUTTON ROW */}
                        {selections.length < 5 && (
                          <tr>
                            <td
                              colSpan={selections.length + 1}
                              className="p-2 bg-slate-50 border-t border-slate-200"
                            >
                              <button
                                onClick={addVehicleCard}
                                className="w-full flex items-center justify-center py-2 px-3 text-xs font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 border border-blue-300 border-dashed transition-all"
                              >
                                <Plus size={14} className="mr-1.5" />
                                Add Another Vehicle
                              </button>
                            </td>
                          </tr>
                        )}

                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer with Compare Button */}
          <motion.div
            variants={buttonVariant}
            initial="hidden"
            animate="visible"
            className="p-4 border-t border-slate-200 bg-slate-50"
          >
            <button
              onClick={() => onCompare(selections)}
              disabled={isCompareDisabled}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-lg transition-all duration-200 transform ${isCompareDisabled
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white active:scale-[0.98]'
                }`}
            >
              {isLoading ? 'Comparing...' : 'Compare Now'}
            </button>
          </motion.div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
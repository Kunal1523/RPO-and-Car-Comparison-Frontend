// src/components/Sidebar.tsx
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { ModelDetails, SelectionState, DropdownOption, VariantClassData, ModelPlan } from '../types';
import { fetchModelDetails, fetchVariantClasses, fetchModelPlans } from '../services/api';
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
  const [plans, setPlans] = useState<ModelPlan[]>([]);

  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [contentKey, setContentKey] = useState(0);

  // ✅ Track variant classes for each selection index
  const [variantClassesMap, setVariantClassesMap] = useState<Record<number, VariantClassData[]>>({});

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
        const [data, planData] = await Promise.all([
          fetchModelDetails(),
          fetchModelPlans()
        ]);
        setModelData(data);
        setPlans(planData || []);
      } catch (err) {
        console.error('Failed to fetch data', err);
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

      return {
        brand: brandName,
        model,
        version: versionVal,
        variant: '',
        variant_id: ''
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

  // ✅ FETCH Variant Classes when brand/model changes
  useEffect(() => {
    if (!modelData) return;

    selections.forEach((sel, idx) => {
      if (sel.brand && sel.model) {
        const bmKey = `${sel.brand}__${sel.model}`;
        const carId = modelData.carIds[bmKey];

        // If we have a carId and we haven't fetched classes for this specific selection yet
        // OR the classes we have don't match the current selection's brand/model
        if (carId) {
          const fetchClasses = async () => {
            try {
              const classes = await fetchVariantClasses(carId);
              setVariantClassesMap(prev => ({ ...prev, [idx]: classes }));
            } catch (err) {
              console.error(`Failed to fetch classes for ${bmKey}:`, err);
            }
          };

          // Check if we need to fetch
          const existingClasses = variantClassesMap[idx];

          // Actually, just compare carId if we can. 
          // Simplified: fetch if not present. Clear on model change.
          if (!existingClasses) {
            fetchClasses();
          } else if (existingClasses.length > 0 && !sel.variant) {
            // Auto-select first variant class
            const firstClass = existingClasses[0];
            const firstVariantId = firstClass.variants.length > 0 ? firstClass.variants[0].id : '';

            // Wrap in setTimeout to avoid updating state during another state's render cycle if any
            setTimeout(() => {
              setSelections(prev => {
                const next = [...prev];
                if (next[idx].brand === sel.brand && next[idx].model === sel.model && !next[idx].variant) {
                  next[idx] = { ...next[idx], variant: firstClass.variant_class, variant_id: firstVariantId };
                }
                return next;
              });
            }, 0);
          }
        }
      }
    });

    // Clean up classes for indices that no longer exist
    if (Object.keys(variantClassesMap).length > selections.length) {
      setVariantClassesMap(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (parseInt(key) >= selections.length) delete next[parseInt(key)];
        });
        return next;
      });
    }
  }, [selections, modelData, variantClassesMap]);

  useEffect(() => {
    if (isOpen && hasData) setContentKey((k) => k + 1);
  }, [isOpen, hasData]);

  const MAX_VEHICLES = 20;
  const CHUNK_SIZE = 5;

  const addVehicleCard = () => {
    if (selections.length >= MAX_VEHICLES) {
      alert(`Maximum ${MAX_VEHICLES} vehicles can be compared`);
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
        next[idx] = { brand: value, model: '', version: '', variant: '', plan_id: undefined };
        // Clear classes for this index
        setVariantClassesMap(prev => {
          const nextVal = { ...prev };
          delete nextVal[idx];
          return nextVal;
        });
      } else if (field === 'model') {
        // Find first available version for this car
        const bmKeyStr = `${current.brand}__${value}`;
        const firstVer = modelData?.versions[bmKeyStr]?.[0]?.value || '';
        next[idx] = { ...current, model: value, version: firstVer, variant: '' };
        // Clear classes for this index to trigger re-fetch
        setVariantClassesMap(prev => {
          const nextVal = { ...prev };
          delete nextVal[idx];
          return nextVal;
        });
      } else if (field === 'variant') {
        // value here is actually variant_class name
        const classes = variantClassesMap[idx] || [];
        const selectedClass = classes.find(c => c.variant_class === value);

        if (selectedClass && selectedClass.variants.length > 0) {
          // Pick the first variant's ID from the class
          const firstVariant = selectedClass.variants[0];
          next[idx] = { ...current, variant: value, variant_id: firstVariant.id };
        } else {
          next[idx] = { ...current, variant: value, variant_id: '' };
        }
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

  const getVariantOptions = (idx: number, s: SelectionState): string[] => {
    if (s.brand === 'CUSTOM_PLAN') return [];
    if (!modelData || !s.model) return [];

    // Check if we have variant classes for this selection
    const classes = variantClassesMap[idx];
    if (classes && classes.length > 0) {
      return classes.map(c => c.variant_class);
    }

    // Fallback to regular variants if classes are still loading or unavailable
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
        <option value="" disabled hidden>{placeholder}</option>
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
                {/* Matrix Container - Chunks of 5 vehicles per row */}
                <div className="flex-1 overflow-auto p-1 space-y-2">
                  {Array.from({ length: Math.ceil(selections.length / CHUNK_SIZE) }, (_, chunkIdx) => {
                    const start = chunkIdx * CHUNK_SIZE;
                    const chunkSelections = selections.slice(start, start + CHUNK_SIZE);
                    const isLastChunk = start + CHUNK_SIZE >= selections.length;

                    return (
                      <div key={`chunk-${chunkIdx}`} className="inline-block min-w-full align-middle">
                        {chunkIdx > 0 && (
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 pt-1 pb-0.5 border-t border-slate-200">
                            Vehicles {start + 1}–{Math.min(start + CHUNK_SIZE, selections.length)}
                          </div>
                        )}
                        <table className="min-w-full border-collapse">
                          <thead>
                            <tr>
                              <th className="p-1 w-12 sticky left-0 bg-slate-50 z-10 border-b border-slate-200" />
                              {chunkSelections.map((_, ci) => {
                                const idx = start + ci;
                                const colors = [
                                  'bg-blue-600',
                                  'bg-emerald-600',
                                  'bg-violet-600',
                                  'bg-orange-600',
                                  'bg-sky-600'
                                ];
                                const headerBg = colors[idx % colors.length];

                                return (
                                  <th 
                                    key={`head-${idx}`} 
                                    className={`p-1 border-b border-slate-200 border-l border-white/20 ${headerBg}`}
                                    style={{ width: `${100 / chunkSelections.length}%` }}
                                  >
                                    <div className="flex items-center justify-between px-1 text-white">
                                      <div className="flex items-center gap-1">
                                        {idx > 0 && (
                                          <button onClick={() => moveVehicle(idx, 'left')} className="text-white/70 hover:text-white transition-colors" title="Move Left">
                                            <ChevronLeft size={10} />
                                          </button>
                                        )}
                                        <span className="text-[9px] font-bold whitespace-nowrap">Veh {idx + 1}</span>
                                        {idx < selections.length - 1 && (
                                          <button onClick={() => moveVehicle(idx, 'right')} className="text-white/70 hover:text-white transition-colors" title="Move Right">
                                            <ChevronRight size={10} />
                                          </button>
                                        )}
                                      </div>
                                      {selections.length > 1 && (
                                        <button onClick={() => removeVehicleCard(idx)} className="text-white/70 hover:text-red-300 transition-colors ml-1">
                                          <X size={10} />
                                        </button>
                                      )}
                                    </div>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">

                            {/* Brand Row */}
                            <tr>
                              <td className="p-1 px-2 text-[9px] font-extrabold text-slate-900 uppercase w-12 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-sm truncate">Brand</td>
                              {chunkSelections.map((sel, ci) => {
                                const idx = start + ci;
                                const brandOptions = [
                                  { value: 'CUSTOM_PLAN', label: '⭐ New Model Plan' },
                                  ...modelData.brands.map(b => ({ value: b, label: b }))
                                ];
                                return (
                                  <td key={`brand-${idx}`} className="p-0.5 border-l border-slate-50">
                                    {renderCellDropdown(sel.brand, brandOptions, (v) => handleSelectionChange(idx, 'brand', v), false, "Brand")}
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Car Row */}
                            <tr>
                              <td className="p-1 px-2 text-[9px] font-extrabold text-slate-900 uppercase w-12 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-sm truncate">Car</td>
                              {chunkSelections.map((sel, ci) => {
                                const idx = start + ci;
                                let carOptions: any = [];
                                if (sel.brand === 'CUSTOM_PLAN') {
                                  carOptions = plans.map(p => ({ value: p.plan_id, label: `${p.name} (${p.base_variant_class})` }));
                                } else if (sel.brand) {
                                  carOptions = modelData.models[sel.brand] || [];
                                }
                                return (
                                  <td key={`car-${idx}`} className="p-0.5 border-l border-slate-50">
                                    {renderCellDropdown(
                                      sel.brand === 'CUSTOM_PLAN' ? sel.plan_id || '' : sel.model,
                                      carOptions,
                                      (v) => {
                                        if (sel.brand === 'CUSTOM_PLAN') {
                                          const p = plans.find(pl => pl.plan_id === v);
                                          if (p) {
                                            setSelections(prev => {
                                              const n = [...prev];
                                              n[idx] = { brand: 'CUSTOM_PLAN', model: 'Plan', variant: p.name, plan_id: v, version: 'v1' };
                                              return n;
                                            });
                                          }
                                        } else {
                                          handleSelectionChange(idx, 'model', v);
                                        }
                                      },
                                      !sel.brand,
                                      sel.brand === 'CUSTOM_PLAN' ? "Plan" : "Car"
                                    )}
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Variant Row */}
                            <tr>
                              <td className="p-1 px-2 text-[9px] font-extrabold text-slate-900 uppercase w-12 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-sm truncate">Var</td>
                              {chunkSelections.map((sel, ci) => {
                                const idx = start + ci;
                                return (
                                  <td key={`var-${idx}`} className="p-0.5 border-l border-slate-50">
                                    {renderCellDropdown(
                                      sel.variant,
                                      sel.brand === 'CUSTOM_PLAN' ? [{ value: sel.variant, label: sel.variant }] : getVariantOptions(idx, sel),
                                      (v) => handleSelectionChange(idx, 'variant', v),
                                      !sel.model || sel.brand === 'CUSTOM_PLAN',
                                      "Var"
                                    )}
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Date Row */}
                            <tr>
                              <td className="p-1 px-2 text-[9px] font-extrabold text-slate-900 uppercase w-12 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-sm truncate">Date</td>
                              {chunkSelections.map((sel, ci) => {
                                const idx = start + ci;
                                return (
                                  <td key={`ver-${idx}`} className="p-0.5 border-l border-slate-50">
                                    {renderCellDropdown(
                                      sel.version,
                                      sel.brand === 'CUSTOM_PLAN' ? [{ value: 'v1', label: 'Latest' }] : getVersionOptions(sel),
                                      (v) => handleSelectionChange(idx, 'version', v),
                                      !sel.variant || sel.brand === 'CUSTOM_PLAN',
                                      "Date"
                                    )}
                                  </td>
                                );
                              })}
                            </tr>

                            {/* Add button only on the last chunk, and only if under limit */}
                            {isLastChunk && selections.length < MAX_VEHICLES && (
                              <tr>
                                <td colSpan={chunkSelections.length + 1} className="p-2 bg-slate-50 border-t border-slate-200">
                                  <button
                                    onClick={addVehicleCard}
                                    className="w-full flex items-center justify-center py-2 px-3 text-xs font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 border border-blue-300 border-dashed transition-all"
                                  >
                                    <Plus size={14} className="mr-1.5" />
                                    Add Another Vehicle ({selections.length}/{MAX_VEHICLES})
                                  </button>
                                </td>
                              </tr>
                            )}

                          </tbody>
                        </table>
                      </div>
                    );
                  })}
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
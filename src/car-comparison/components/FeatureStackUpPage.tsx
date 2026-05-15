import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Check,
  X,
  TrendingUp,
  Info,
  Save,
  ChevronDown,
  Layers,
  PlusCircle,
  HelpCircle,
  Search,
  Car,
  ChevronRight,
  ChevronLeft,
  CarFront,
  Zap,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
  FileText,
  LayoutGrid,
  Columns,
  Sparkles,
  Download,
  Loader2
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchModelDetails,
  fetchVariantClasses,
  fetchVariantClassDetails,
  fetchModelPlans,
  fetchModelPlanById
} from '../services/api';
import {
  ModelDetails,
  SelectionState,
  VariantClassData,
  VariantClassDetailsResponse,
  ModelPlan,
  PlanFeature
} from '../types';

// Interface for comparison data
interface ComparisonCardData {
  id: string;
  targetName: string;
  baseName: string;
  features: {
    category: string;
    feature_name: string;
    baseValue: string;
    targetValue: string;
    type: 'same' | 'changed' | 'added' | 'removed';
  }[];
}

interface ComparisonState {
  id: string;
  planId: string;
  baseVariant: string;
}

const FeatureStackUpPage: React.FC = () => {
  // Main State
  const [comparisons, setComparisons] = useState<ComparisonState[]>(() => {
    const saved = localStorage.getItem('rpo_stackup_comparisons');
    return saved ? JSON.parse(saved) : [
      { id: 'initial_1', planId: '', baseVariant: '' },
      { id: 'initial_2', planId: '', baseVariant: '' },
      { id: 'initial_3', planId: '', baseVariant: '' }
    ];
  });

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('rpo_stackup_comparisons', JSON.stringify(comparisons));
  }, [comparisons]);

  const [modelData, setModelData] = useState<ModelDetails | null>(null);
  const [plans, setPlans] = useState<ModelPlan[]>([]);
  const [allVariants, setAllVariants] = useState<{ variant_class: string; brand: string; model: string; car_id: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Per-Card Data Cache - Now with persistence for instant loading
  const [baseDataCache, setBaseDataCache] = useState<Record<string, VariantClassDetailsResponse>>(() => {
    const saved = localStorage.getItem('rpo_stackup_base_cache');
    return saved ? JSON.parse(saved) : {};
  });
  const [plansDataCache, setPlansDataCache] = useState<Record<string, ModelPlan>>(() => {
    const saved = localStorage.getItem('rpo_stackup_plans_cache');
    return saved ? JSON.parse(saved) : {};
  });

  // Persist Caches
  useEffect(() => {
    localStorage.setItem('rpo_stackup_base_cache', JSON.stringify(baseDataCache));
  }, [baseDataCache]);

  useEffect(() => {
    localStorage.setItem('rpo_stackup_plans_cache', JSON.stringify(plansDataCache));
  }, [plansDataCache]);

  type FilterState = {
    initialized: boolean;
    selectedCategories: Set<string>;
    selectedFeatures: Set<string>;
    isFilterOpen: boolean;
    filterSearch: string;
    expandedCats: Set<string>;
  };
  const [cardFilters, setCardFilters] = useState<Record<string, FilterState>>({});

  const getCardFilter = (compId: string): FilterState => {
    return cardFilters[compId] || {
      initialized: false,
      selectedCategories: new Set(),
      selectedFeatures: new Set(),
      isFilterOpen: false,
      filterSearch: '',
      expandedCats: new Set()
    };
  };

  const updateCardFilter = (compId: string, updates: Partial<FilterState>) => {
    setCardFilters(prev => ({
      ...prev,
      [compId]: { ...getCardFilter(compId), ...updates }
    }));
  };

  // Fetch initial model data & plans
  useEffect(() => {
    const loadData = async () => {
      try {
        const [details, planList] = await Promise.all([
          fetchModelDetails(),
          fetchModelPlans()
        ]);
        setModelData(details);
        setPlans(planList || []);

        // Flatten all variants for the dropdown
        if (details) {
          const brandModelPairs = Object.entries(details.carIds);

          // Fetch variant classes for all cars
          const classPromises = brandModelPairs.map(async ([key, carId]) => {
            const [brand, model] = key.split('__');
            try {
              const classes = await fetchVariantClasses(carId);
              return classes.map(c => ({
                variant_class: c.variant_class,
                brand,
                model,
                car_id: carId
              }));
            } catch (e) { return []; }
          });

          const results = await Promise.all(classPromises);
          setAllVariants(results.flat().sort((a, b) => a.variant_class.localeCompare(b.variant_class)));
        }
      } catch (err) {
        console.error('Failed to fetch initial data', err);
      }
    };
    loadData();
  }, []);

  // Fetch full details for selected plans/variants in comparisons
  useEffect(() => {
    comparisons.forEach(async (comp) => {
      // Load Plan Data - Always refresh to get latest additional features
      if (comp.planId) {
        try {
          const data = await fetchModelPlanById(comp.planId);
          setPlansDataCache(prev => ({ ...prev, [comp.planId]: data }));
        } catch (err) { console.error(err); }
      }

      // Load Base Data
      if (comp.baseVariant && !baseDataCache[comp.baseVariant]) {
        try {
          const data = await fetchVariantClassDetails(comp.baseVariant, 1);
          setBaseDataCache(prev => ({ ...prev, [comp.baseVariant]: data }));
        } catch (err) { console.error(err); }
      }
    });
  }, [comparisons]);

  // Get all available categories and features for filtering
  const availableFilters = useMemo(() => {
    const cats = new Set<string>();
    const feats = new Map<string, Set<string>>();

    Object.values(baseDataCache).forEach(data => {
      data.features.forEach(f => {
        cats.add(f.category);
        if (!feats.has(f.category)) feats.set(f.category, new Set());
        feats.get(f.category)!.add(f.feature_name);
      });
    });

    Object.values(plansDataCache).forEach(plan => {
      plan.features?.forEach(f => {
        cats.add(f.category);
        if (!feats.has(f.category)) feats.set(f.category, new Set());
        feats.get(f.category)!.add(f.feature_name);
      });
    });

    return {
      categories: Array.from(cats).sort(),
      featuresByCategory: feats
    };
  }, [baseDataCache, plansDataCache]);

  // Initialize filters for any card that hasn't been initialized yet
  useEffect(() => {
    if (availableFilters.categories.length > 0) {
      const allF = new Set<string>();
      availableFilters.featuresByCategory.forEach(set => set.forEach(f => allF.add(f)));
      
      let changed = false;
      const nextFilters = { ...cardFilters };
      
      comparisons.forEach(comp => {
         if (!nextFilters[comp.id]?.initialized) {
            nextFilters[comp.id] = {
               initialized: true,
               selectedCategories: new Set(availableFilters.categories),
               selectedFeatures: new Set(allF),
               isFilterOpen: false,
               filterSearch: '',
               expandedCats: new Set()
            };
            changed = true;
         }
      });
      
      if (changed) {
         setCardFilters(nextFilters);
      }
    }
  }, [availableFilters, comparisons, cardFilters]);

  // Comparison Logic - Now returns data for each comparison entry
  const comparisonDataMap = useMemo(() => {
    const data: Record<string, ComparisonCardData> = {};
    comparisons.forEach(comp => {
      const baseData = baseDataCache[comp.baseVariant];
      const plan = plansDataCache[comp.planId];

      if (!baseData || !plan || !plan.features) return;

      const features: ComparisonCardData['features'] = [];
      const allNames = new Set([
        ...baseData.features.map(f => f.feature_name),
        ...plan.features.map(f => f.feature_name)
      ]);

      allNames.forEach(name => {
        const baseF = baseData.features.find(f => f.feature_name === name);
        // 1. Find all plan features matching this name (case-insensitive)
        const matchingPlanFeatures = plan.features?.filter(f => f.feature_name.trim().toLowerCase() === name.trim().toLowerCase()) || [];

        // 2. Check if ANY of those records are marked as deleted
        const isDeleted = matchingPlanFeatures.some(f =>
          f.is_deleted === true ||
          String(f.is_deleted).toUpperCase() === 'TRUE' ||
          Number(f.is_deleted) === 1
        );

        const cat = matchingPlanFeatures[0]?.category || baseF?.category || 'General';

        const filter = getCardFilter(comp.id);
        if (filter.initialized) {
           if (!filter.selectedCategories.has(cat)) return;
           if (filter.selectedFeatures.size > 0 && !filter.selectedFeatures.has(name)) return;
        }

        const baseVals = baseF ? Array.from(new Set(Object.values(baseF.sub_variant_values).filter(v => v !== null && v !== undefined && v !== ''))) : [];
        const baseVal = baseVals.length > 0 ? baseVals.join(' / ') : '';

        if (isDeleted) {
          features.push({
            category: cat,
            feature_name: name,
            baseValue: baseVal || '—',
            targetValue: 'Deleted',
            type: 'removed'
          });
          return;
        }

        // 3. If not deleted, use the value from the first non-deleted matching feature
        const planF = matchingPlanFeatures.find(f => !f.is_deleted);
        const targetVal = planF?.value || '';

        if (baseVal && targetVal) {
          if (baseVals.includes(targetVal) && baseVals.length === 1) {
            features.push({ category: cat, feature_name: name, baseValue: baseVal, targetValue: targetVal, type: 'same' });
          } else {
            features.push({ category: cat, feature_name: name, baseValue: baseVal, targetValue: targetVal, type: 'changed' });
          }
        } else if (!baseVal && targetVal) {
          features.push({ category: cat, feature_name: name, baseValue: '—', targetValue: targetVal, type: 'added' });
        } else if (baseVal && !targetVal) {
          // If it's in base but not in plan list (and NOT deleted), it's inherited (Same)
          features.push({ category: cat, feature_name: name, baseValue: baseVal, targetValue: baseVal, type: 'same' });
        }
      });

      data[comp.id] = {
        id: comp.id,
        targetName: plan.name,
        baseName: comp.baseVariant,
        features: features.sort((a, b) => {
          // Sort order: Same (blue), Changed (yellow), Added (green), Removed (red)
          const order: Record<string, number> = { 'same': 1, 'changed': 2, 'added': 3, 'removed': 4 };
          if (order[a.type] !== order[b.type]) {
            return order[a.type] - order[b.type];
          }
          return a.category.localeCompare(b.category) || a.feature_name.localeCompare(b.feature_name);
        })
      };
    });
    return data;
  }, [comparisons, baseDataCache, plansDataCache, cardFilters]);

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Feature Stack-Up', {
        views: [{ showGridLines: false }]
      });

      const typeColors: Record<string, string> = {
        'same': 'FFDBEAFE',    // blue-100
        'changed': 'FFFEF08A', // yellow-200
        'added': 'FFBBF7D0',   // green-200
        'removed': 'FFFED7AA'  // orange-200
      };

      const visibleComps = comparisons.filter(c => comparisonDataMap[c.id]);
      if (visibleComps.length === 0) {
        setIsExporting(false);
        return;
      }

      const columns: any[] = [];
      visibleComps.forEach((comp, idx) => {
        columns.push({ key: `card_${idx}`, width: 45 });
        if (idx < visibleComps.length - 1) {
          columns.push({ key: `gap_${idx}`, width: 3 });
        }
      });
      ws.columns = columns;

      const headerRow = ws.getRow(2);
      visibleComps.forEach((comp, idx) => {
        const colIndex = idx * 2 + 1;
        const cell = headerRow.getCell(colIndex);
        const cardData = comparisonDataMap[comp.id];

        cell.value = `New ${cardData.targetName} vs ${cardData.baseName}`;
        cell.font = { bold: true, size: 11 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4D4D8' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      const maxFeatures = Math.max(...visibleComps.map(c => comparisonDataMap[c.id]?.features?.length || 0));

      for (let i = 0; i < maxFeatures; i++) {
        const row = ws.getRow(i + 3);
        visibleComps.forEach((comp, idx) => {
          const colIndex = idx * 2 + 1;
          const cell = row.getCell(colIndex);
          const cardData = comparisonDataMap[comp.id];
          const feature = cardData?.features?.[i];

          if (feature) {
            let text = '';
            if (feature.type === 'removed') {
              text = feature.feature_name;
            } else if (feature.type === 'changed') {
              text = `${feature.feature_name}: ${feature.baseValue || '—'} ➔ ${feature.targetValue}`;
            } else if (feature.type === 'added') {
              text = feature.feature_name;
            } else {
              text = feature.feature_name;
            }

            cell.value = text;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: typeColors[feature.type] || 'FFFFFFFF' } };
            cell.alignment = { wrapText: true, vertical: 'middle' };
          }
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `Feature_StackUp_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden font-sans text-slate-900">
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <TrendingUp size={16} />
            </div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">Feature Stack-Up Comparison</h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Legend */}
            <div className="flex items-center gap-4 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#bae6fd]"></div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Same as Base</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-yellow-200"></div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Changed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-green-200"></div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Additional</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-red-200"></div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Deleted</span>
              </div>
            </div>
            <button
              onClick={exportToExcel}
              disabled={isExporting || comparisons.length === 0}
              className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-all disabled:opacity-50 text-[10px] uppercase tracking-wider"
            >
              {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              <span>{isExporting ? 'Exporting...' : 'Download Excel'}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-[#f8fafc] p-8">
          <div className="flex gap-10 h-full min-w-max pb-4">

            {comparisons.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center w-full min-w-full text-center">
                <div className="w-20 h-20 bg-slate-200/50 rounded-3xl flex items-center justify-center mb-6">
                  <Layers size={40} className="text-slate-300" />
                </div>
                <h2 className="text-xl font-black text-slate-400">No Comparisons Added</h2>
                <button
                  onClick={() => setComparisons([{ id: Math.random().toString(), planId: '', baseVariant: '' }])}
                  className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase"
                >
                  Start New Stack-Up
                </button>
              </div>
            ) : (
              <>
                {comparisons.map((comp) => {
                  const cardData = comparisonDataMap[comp.id];
                  const filter = getCardFilter(comp.id);
                  const grouped = cardData?.features.reduce((acc, f) => {
                    if (!acc[f.category]) acc[f.category] = [];
                    acc[f.category].push(f);
                    return acc;
                  }, {} as Record<string, typeof cardData.features>);

                  return (
                    <motion.div
                      key={comp.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group flex-1 min-w-[280px] max-w-[450px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex flex-col overflow-hidden border border-slate-200 h-full relative shrink-0"
                    >
                      {/* Card Delete Button */}
                      <button
                        onClick={() => setComparisons(comparisons.filter(c => c.id !== comp.id))}
                        className="absolute -right-1 -top-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center z-50 shadow-xl opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"
                      >
                        <X size={12} />
                      </button>

                      {/* Card Header with Side-by-Side Selectors */}
                      {/* Ultra-Compact Card Header */}
                      <div className="bg-[#f8fafc] px-2 py-1.5 border-b border-slate-200 flex flex-col gap-1.5">
                        {cardData && (
                          <div className="text-[10px] font-black text-center text-slate-700 bg-slate-100 rounded py-0.5 border border-slate-200 uppercase tracking-tight">
                            {cardData.targetName} vs {cardData.baseName}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          {/* Plan Dropdown First */}
                          <div className="flex-1 flex items-center gap-1 min-w-0">
                            <span className="text-[7px] font-black text-slate-400 uppercase shrink-0">Plan:</span>
                            <select
                              value={comp.planId}
                              onChange={(e) => {
                                setComparisons(prev => prev.map(c => c.id === comp.id ? { ...c, planId: e.target.value } : c));
                              }}
                              className="flex-1 bg-white border border-slate-200 rounded px-1 py-0.5 text-[8px] font-black outline-none shadow-sm min-w-0 truncate"
                            >
                              <option value="">Choose Plan</option>
                              {plans.map(p => <option key={p.plan_id} value={p.plan_id}>{p.name}</option>)}
                            </select>
                          </div>

                          {/* Base Dropdown Second */}
                          <div className="flex-1 flex items-center gap-1 min-w-0">
                            <span className="text-[7px] font-black text-slate-400 uppercase shrink-0">Base:</span>
                            <select
                              value={comp.baseVariant}
                              onChange={(e) => {
                                setComparisons(prev => prev.map(c => c.id === comp.id ? { ...c, baseVariant: e.target.value } : c));
                              }}
                              className="flex-1 bg-white border border-slate-200 rounded px-1 py-0.5 text-[8px] font-black outline-none shadow-sm min-w-0 truncate"
                            >
                              <option value="">Choose Base</option>
                              {allVariants.map(v => (
                                <option key={`${v.car_id}_${v.variant_class}`} value={v.variant_class}>
                                  {v.variant_class} ({v.brand})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {!cardData ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50/50">
                          <Info size={24} className="text-slate-300 mb-3" />
                          <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                            Select both a plan and a base model to see the stack-up data
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Column Labels */}
                          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-[7px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-2">
                              <div className="relative py-1 -my-1" onMouseLeave={() => updateCardFilter(comp.id, { isFilterOpen: false })}>
                                <button
                                  onClick={() => updateCardFilter(comp.id, { isFilterOpen: !filter.isFilterOpen })}
                                  className={`p-0.5 rounded transition-all ${filter.isFilterOpen ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 text-slate-400'}`}
                                >
                                  <Menu size={8} />
                                </button>

                                <AnimatePresence>
                                  {filter.isFilterOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                      className="absolute left-0 top-full w-52 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] p-3 pt-4 normal-case tracking-normal text-left overflow-hidden"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-[7.5px] font-black text-slate-800 uppercase tracking-widest">Filters</span>
                                        <div className="flex gap-2">
                                          <button onClick={() => { updateCardFilter(comp.id, { selectedCategories: new Set(availableFilters.categories), selectedFeatures: new Set(Array.from(availableFilters.featuresByCategory.values()).flatMap(s => Array.from(s))) }); }} className="text-[7px] font-black text-indigo-600">ALL</button>
                                          <button onClick={() => { updateCardFilter(comp.id, { selectedCategories: new Set(), selectedFeatures: new Set() }); }} className="text-[7px] font-black text-slate-400">NONE</button>
                                        </div>
                                      </div>
                                      <div className="relative mb-2">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300" size={8} />
                                        <input type="text" placeholder="Search..." value={filter.filterSearch} onChange={(e) => updateCardFilter(comp.id, { filterSearch: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-6 pr-1.5 py-1 text-[8px] font-bold outline-none" />
                                      </div>
                                      <div className="space-y-0.5 max-h-40 overflow-y-auto custom-scrollbar pr-0.5">
                                        {availableFilters.categories.map(cat => {
                                          const feats = Array.from(availableFilters.featuresByCategory.get(cat) || []).filter(f => !filter.filterSearch || f.toLowerCase().includes(filter.filterSearch.toLowerCase()));
                                          if (filter.filterSearch && feats.length === 0) return null;
                                          return (
                                            <div key={cat} className="space-y-0.5">
                                              <div className="flex items-center gap-1.5 px-1 py-0.5 hover:bg-slate-50 rounded">
                                                <input type="checkbox" checked={filter.selectedCategories.has(cat)} onChange={(e) => { const next = new Set(filter.selectedCategories); const nextFeats = new Set(filter.selectedFeatures); if (e.target.checked) { next.add(cat); availableFilters.featuresByCategory.get(cat)?.forEach(f => nextFeats.add(f)); } else { next.delete(cat); availableFilters.featuresByCategory.get(cat)?.forEach(f => nextFeats.delete(f)); } updateCardFilter(comp.id, { selectedCategories: next, selectedFeatures: nextFeats }); }} className="w-2 h-2 accent-indigo-600" />
                                                <button onClick={() => { const next = new Set(filter.expandedCats); if (next.has(cat)) next.delete(cat); else next.add(cat); updateCardFilter(comp.id, { expandedCats: next }); }} className="flex-1 text-left text-[8px] font-bold text-slate-700 truncate">{cat}</button>
                                                <ChevronDown size={8} className={`text-slate-400 ${filter.expandedCats.has(cat) || filter.filterSearch ? 'rotate-180' : ''}`} />
                                              </div>
                                              {(filter.expandedCats.has(cat) || filter.filterSearch) && (
                                                <div className="ml-4 border-l border-slate-100 pl-1.5 py-0.5">
                                                  {feats.sort().map(feat => (
                                                    <label key={feat} className="flex items-center gap-1.5 py-0.5 cursor-pointer">
                                                      <input type="checkbox" checked={filter.selectedFeatures.has(feat)} onChange={(e) => { const next = new Set(filter.selectedFeatures); if (e.target.checked) next.add(feat); else next.delete(feat); updateCardFilter(comp.id, { selectedFeatures: next }); }} className="w-2 h-2 accent-indigo-600" />
                                                      <span className="text-[7.5px] font-medium text-slate-500 truncate">{feat}</span>
                                                    </label>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                              <span>Feature Detail</span>
                          </div>

                          {/* Features List */}
                          <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {cardData.features.map((item, i) => (
                              <div
                                key={i}
                                className={`px-3 py-1.5 border-b border-black/[0.03] last:border-0 hover:bg-slate-50/50 transition-colors ${item.type === 'same' ? 'bg-[#bae6fd]' :
                                  item.type === 'changed' ? 'bg-yellow-200' :
                                    item.type === 'added' ? 'bg-green-200' :
                                      item.type === 'removed' ? 'bg-red-200' : ''
                                  }`}
                              >
                                <span className="text-[8px] font-bold text-slate-800 leading-tight block" title={item.feature_name}>
                                  {item.type === 'removed' && item.feature_name}
                                  {item.type === 'same' && item.feature_name}
                                  {item.type === 'added' && item.feature_name}
                                  {item.type === 'changed' && (
                                    <>
                                      {item.feature_name}: <span className="text-slate-500 font-medium">{item.baseValue || '—'}</span> <span className="text-slate-400 mx-0.5">➔</span> <span className="text-slate-900">{item.targetValue}</span>
                                    </>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}

                {/* Add Comparison Ghost Card */}
                <button
                  onClick={() => setComparisons([...comparisons, { id: Math.random().toString(), planId: '', baseVariant: '' }])}
                  className="min-w-[180px] max-w-[240px] w-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-indigo-400 hover:bg-indigo-50/20 transition-all text-slate-300 hover:text-indigo-500 group shrink-0 h-full"
                >
                  <div className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={24} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">Add Another Card</span>
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default FeatureStackUpPage;

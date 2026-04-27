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
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchModelDetails,
  fetchVariantClasses,
  fetchVariantClassDetails,
  createModelPlan,
  fetchModelPlans,
  fetchModelPlanById,
  updatePlanFeature,
  addPlanFeature,
  deletePlanFeature
} from '../services/api';
import {
  ModelDetails,
  SelectionState,
  DropdownOption,
  VariantClassData,
  VariantClassDetailsResponse,
  ModelPlan,
  PlanFeature
} from '../types';

//Animations
const containerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const FeatureStackUpPage: React.FC = () => {
  // Sidebar/Selection State
  const [modelData, setModelData] = useState<ModelDetails | null>(null);
  const [variantClasses, setVariantClasses] = useState<VariantClassData[]>([]);
  const [selection, setSelection] = useState<SelectionState>({
    brand: '',
    model: '',
    version: '',
    variant: '', // used for variant_class name
    variant_id: ''
  });

  // Base Model Preview Data
  const [baseClassData, setBaseClassData] = useState<VariantClassDetailsResponse | null>(null);
  const [isFetchingBase, setIsFetchingBase] = useState(false);

  // Plan State
  const [currentPlan, setCurrentPlan] = useState<ModelPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [activeCategory, setActiveCategory] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  
  const [plans, setPlans] = useState<ModelPlan[]>([]);
  const [isFetchingPlans, setIsFetchingPlans] = useState(false);

  const [newFeature, setNewFeature] = useState({
    name: '',
    category: 'Exterior',
    value: 'Standard',
    cost: 0
  });

  // Fetch initial model data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [details, planList] = await Promise.all([
          fetchModelDetails(),
          fetchModelPlans()
        ]);
        setModelData(details);
        setPlans(planList || []);
      } catch (err) {
        console.error('Failed to fetch initial data', err);
      }
    };
    loadData();
  }, []);

  // Fetch variant class details when selection is finalized
  useEffect(() => {
    if (selection.variant) {
      const loadBaseDetails = async () => {
        setIsFetchingBase(true);
        try {
          const data = await fetchVariantClassDetails(selection.variant, 1);
          setBaseClassData(data);
        } catch (err) {
          console.error("Failed to fetch base details", err);
        } finally {
          setIsFetchingBase(false);
        }
      };
      loadBaseDetails();
    } else {
      setBaseClassData(null);
    }
  }, [selection.variant]);

  // Fetch variant classes when car changes to populate "Base Model" dropdown
  useEffect(() => {
    if (!modelData || !selection.brand || !selection.model) return;

    const bmKey = `${selection.brand}__${selection.model}`;
    const carId = modelData.carIds[bmKey];

    if (carId) {
      const loadClasses = async () => {
        try {
          const classes = await fetchVariantClasses(carId);
          setVariantClasses(classes);
        } catch (err) {
          console.error('Failed to fetch variant classes', err);
        }
      };
      loadClasses();
    }
  }, [selection.brand, selection.model, modelData]);

  const handleSelectionChange = (field: keyof SelectionState, value: string) => {

    // Clear active plan when manually changing selections
    setCurrentPlan(null);

    setSelection(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'brand') {
        next.model = '';
        next.version = '';
        next.variant = '';
      } else if (field === 'model') {
        const bmKey = `${next.brand}__${value}`;
        next.version = modelData?.versions[bmKey]?.[0]?.value || '';
        next.variant = '';
      } else if (field === 'variant') {
        // Here variant is variant_class
      }
      return next;
    });
  };

  const handleCreatePlan = async () => {
    if (!selection.variant || !newPlanName) {
      alert("Please enter a plan name and select a base model");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createModelPlan(newPlanName, selection.variant, 1);
      // Fetch full plan details because create only returns meta data
      const fullPlan = await fetchModelPlanById(result.plan_id);
      setCurrentPlan(fullPlan);
      setNewPlanName('');
      // Refresh plans list
      const updatedPlans = await fetchModelPlans();
      setPlans(updatedPlans);
    } catch (err) {
      console.error('Failed to create plan', err);
      alert('Error creating plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPlan = async (planId: string) => {
    setIsLoading(true);
    try {
      const fullPlan = await fetchModelPlanById(planId);
      setCurrentPlan(fullPlan);
      // Sync selection to match plan's base class so reference view updates
      setSelection(prev => ({
        ...prev,
        variant: fullPlan.base_variant_class
      }));
    } catch (err) {
      console.error('Failed to load plan', err);
      alert('Error loading plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateFeature = async (featureId: string, updates: { value?: string | null, cost_delta?: number }) => {
    if (!currentPlan) return;
    try {
      const res = await updatePlanFeature(currentPlan.plan_id, featureId, updates);
      if (res.success) {
        setCurrentPlan(prev => {
          if (!prev || !prev.features) return prev;
          return {
            ...prev,
            features: prev.features.map(f => f.plan_feature_id === featureId ? { ...f, ...updates } : f)
          };
        });
      }
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const handleAddCustomFeature = async () => {
    if (!currentPlan || !newFeature.name) return;
    try {
      const res = await addPlanFeature(currentPlan.plan_id, {
        feature_name: newFeature.name,
        category: newFeature.category,
        value: newFeature.value,
        cost_delta: newFeature.cost
      });
      if (res.success) {
        setCurrentPlan(prev => ({
          ...prev!,
          features: [...(prev!.features || []), { ...res.data, tag: res.data.tag || 'Additional' }]
        }));
        setNewFeature({ name: '', category: 'Exterior', value: 'Standard', cost: 0 });
        setIsAddingMode(false);
      }
    } catch (err) {
      console.error('Add failed', err);
    }
  };

  const handleDelete = async (featureId: string) => {
    if (!currentPlan) return;
    try {
      const res = await deletePlanFeature(currentPlan.plan_id, featureId);
      if (res.success) {
        setCurrentPlan(prev => ({
          ...prev!,
          features: prev!.features?.filter(f => f.plan_feature_id !== featureId)
        }));
      }
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const filteredFeatures = useMemo(() => {
    if (currentPlan && currentPlan.features) {
      if (!searchTerm) return currentPlan.features;
      return currentPlan.features.filter(f =>
        f.feature_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // If no plan yet, filter base class features for preview
    if (baseClassData && baseClassData.features) {
      if (!searchTerm) return baseClassData.features;
      return baseClassData.features.filter(f =>
        f.feature_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return [];
  }, [currentPlan, baseClassData, searchTerm]);

  const groupedFeatures = useMemo(() => {
    const grouped = filteredFeatures.reduce((acc, f) => {
      const category = (f as any).category || 'Other';
      if (!acc[category]) acc[category] = { items: [], inherited: 0, additional: 0 };
      acc[category].items.push(f);

      const tag = (f as any).tag;
      const isInherited = (f as any).is_inherited === true || tag === 'Inherited';
      const isAdditional = tag === 'Additional' || (!isInherited && (f as any).plan_feature_id);

      if (isInherited) acc[category].inherited++;
      else if (isAdditional) acc[category].additional++;

      return acc;
    }, {} as Record<string, { items: any[], inherited: number, additional: number }>);

    // Sort: Additional features on top
    Object.keys(grouped).forEach(cat => {
      grouped[cat].items.sort((a, b) => {
        const tagA = (a as any).tag || '';
        const tagB = (b as any).tag || '';
        const isAddA = tagA === 'Additional' || (!(a as any).is_inherited && (a as any).plan_feature_id);
        const isAddB = tagB === 'Additional' || (!(b as any).is_inherited && (b as any).plan_feature_id);

        if (isAddA && !isAddB) return -1;
        if (!isAddA && isAddB) return 1;
        return 0;
      });
    });

    return grouped;
  }, [filteredFeatures]);

  // Sync active category
  useEffect(() => {
    const categories = Object.keys(groupedFeatures);
    if (categories.length > 0 && (!activeCategory || !categories.includes(activeCategory))) {
      setActiveCategory(categories[0]);
    }
  }, [groupedFeatures]);

  const totalDelta = useMemo(() => {

    if (!currentPlan || !currentPlan.features) return 0;
    return currentPlan.features.reduce((sum, f) => sum + (f.cost_delta || 0), 0);
  }, [currentPlan]);

  const getVersionLabel = (v: string) => {
    if (!v) return '';
    const num = v.replace('v', '');
    return `Version ${num}`;
  };

  return (
    <div className="flex h-full bg-[#f8fafc] overflow-hidden font-sans text-slate-900">
      {/* --- SIDEBAR --- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-xl z-30"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
              <div className="flex items-center gap-3">
                <CarFront size={24} />
                <h2 className="text-lg font-black tracking-tight">BASE MODEL</h2>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-1 hover:bg-white/10 rounded"
              >
                <ChevronLeft size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Recent Plans Select */}
              {plans.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Load Recent Plan</label>
                  <div className="relative group">
                    <select 
                      value={currentPlan?.plan_id || ''}
                      onChange={(e) => handleLoadPlan(e.target.value)}
                      className="w-full appearance-none bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-blue-900"
                    >
                      <option value="">Choose Saved Plan</option>
                      {plans.map(p => <option key={p.plan_id} value={p.plan_id}>{p.name} ({p.base_variant_class})</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={16} />
                  </div>
                  <div className="h-px bg-slate-100 my-4" />
                </div>
              )}

              {/* Brand Select */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Brand</label>
                <div className="relative group">
                  <select
                    value={selection.brand}
                    onChange={(e) => handleSelectionChange('brand', e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="">Select Brand</option>
                    {modelData?.brands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" size={16} />
                </div>
              </div>

              {/* Model Select */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Car Model</label>
                <div className="relative group">
                  <select
                    disabled={!selection.brand}
                    value={selection.model}
                    onChange={(e) => handleSelectionChange('model', e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">Select Model</option>
                    {selection.brand && modelData?.models[selection.brand]?.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              {/* Version/Release Select */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Release Version</label>
                <div className="relative group">
                  <select
                    disabled={!selection.model}
                    value={selection.version}
                    onChange={(e) => handleSelectionChange('version', e.target.value)}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">Select Version</option>
                    {selection.model && modelData?.versions[`${selection.brand}__${selection.model}`]?.map(v => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              {/* Base Model Select */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Select Base Model</label>
                <div className="relative group">
                  <select
                    disabled={!selection.version}
                    value={selection.variant}
                    onChange={(e) => {
                      setSelection(prev => ({ ...prev, variant: e.target.value }));
                      setCurrentPlan(null);
                    }}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">Choose Reference</option>
                    {variantClasses.map(c => <option key={c.variant_class} value={c.variant_class}>{c.variant_class}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>


              <div className="pt-4 space-y-4">
                <div className="h-px bg-slate-100" />
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">New Plan Name</label>
                  <input
                    type="text"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    placeholder="e.g. My Future Model"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <button
                  onClick={handleCreatePlan}
                  disabled={!selection.variant || !newPlanName || isLoading}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full" /> : <Save size={20} />}
                  CARRY FORWARD TO NEW MODEL
                </button>
              </div>

            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] h-full overflow-hidden">
        {/* Header Bar */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-sm z-20">
          <div className="flex items-center gap-6">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
              >
                <Menu size={20} />
              </button>
            )}
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg text-white">
                  <Zap size={20} />
                </div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {currentPlan ? currentPlan.name : 'Feature Stack-Up Canvas'}
                </h1>
              </div>
              {currentPlan && (
                <p className="text-[10px] text-slate-500 font-bold ml-11 uppercase tracking-wider">
                  Base Reference: {currentPlan.base_variant_class}
                </p>

              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentPlan && (
              <div className="hidden lg:flex items-center gap-3 mr-4">
                {/* Impacted Count Box */}
                <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3 group hover:border-blue-200 transition-colors">
                  <div className="text-right">
                    <p className="text-[8px] uppercase font-black text-slate-400 leading-none mb-1">Impacted Items</p>
                    <p className="text-sm font-black text-slate-900 leading-none">
                      {currentPlan.features?.filter(f => f.cost_delta !== 0).length || 0}
                    </p>
                  </div>
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Layers size={14} />
                  </div>
                </div>

                {/* Net BOM Delta Box */}
                <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3 group hover:border-slate-300 transition-colors">
                  <div className="text-right">
                    <p className="text-[8px] uppercase font-black text-slate-400 leading-none mb-1">Delta Cost</p>
                    <p className={`text-sm font-black leading-none ${totalDelta >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {totalDelta >= 0 ? '+' : '-'} ₹{Math.abs(totalDelta).toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-1.5 rounded-lg transition-all ${totalDelta >= 0
                      ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white'
                      : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                    }`}>
                    {totalDelta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </div>
                </div>
              </div>
            )}

            <button
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-black text-sm rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
              onClick={() => alert("Changes persisted to database")}
            >
              <Save size={18} />
              <span className="hidden sm:inline">Finalize Plan</span>
            </button>
          </div>
        </header>
        <div className="flex-1 flex overflow-hidden">
          {!selection.variant ? (
            <div className="flex-1 h-full flex flex-col items-center justify-center text-center p-8 bg-white/40">
              <div className="w-24 h-24 bg-blue-50 text-blue-100 rounded-full flex items-center justify-center mb-8">
                <Layers size={48} className="opacity-20 text-blue-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Ready to build the future?</h2>
              <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                Select a base model from the sidebar to preview features and start your stack-up.
              </p>
            </div>
          ) : (
            <>
              {/* Category Sub-Sidebar */}
              <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col pt-8">
                <div className="px-6 mb-6">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    <Menu size={12} /> Categories
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar pb-10">
                  {Object.keys(groupedFeatures).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black transition-all flex flex-col gap-1 group ${activeCategory === cat
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                          : 'text-slate-500 hover:bg-white hover:text-slate-800'
                        }`}
                    >
                      <div className="w-full flex items-center justify-between">
                        <span className="truncate pr-2">{cat}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${activeCategory === cat ? 'bg-blue-500/50 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                          {groupedFeatures[cat].items.length}
                        </span>
                      </div>

                      {currentPlan && (
                        <div className={`flex items-center gap-2 text-[8px] font-bold ${activeCategory === cat ? 'text-blue-100' : 'text-slate-400'}`}>
                          <span className="flex items-center gap-0.5"><div className={`w-1 h-1 rounded-full ${activeCategory === cat ? 'bg-white' : 'bg-blue-400'}`} /> {groupedFeatures[cat].inherited} Existing</span>
                          <span className="flex items-center gap-0.5"><div className={`w-1 h-1 rounded-full ${activeCategory === cat ? 'bg-white' : 'bg-purple-400'}`} /> {groupedFeatures[cat].additional} Added</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feature Matrix Content */}
              <div className="flex-1 flex flex-col overflow-hidden bg-white/40">
                {/* Content Header (Search & Meta) */}
                <div className="p-6 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center gap-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder={`Search in ${activeCategory}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-2xl pl-11 pr-6 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  {currentPlan && (
                    <button
                      onClick={() => setIsAddingMode(true)}
                      className="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg hover:bg-slate-800 transition-all shrink-0"
                    >
                      <PlusCircle size={16} />
                      <span>Add New Feature</span>
                    </button>
                  )}

                  {/* Plan Stage Indicator */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <div className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${!currentPlan ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 opacity-50'}`}>
                      1. Preview
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                    <div className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${currentPlan ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 opacity-50'}`}>
                      2. Active
                    </div>
                  </div>
                </div>

                {/* Table Header Labels (Sticky) */}
                <div className="grid grid-cols-12 gap-0 text-[10px] font-black uppercase tracking-widest bg-slate-100/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200">
                  <div className="col-span-2 py-4 px-8 text-slate-600">Feature Set</div>
                  <div className="col-span-4 py-4 px-6 border-l border-slate-200 text-slate-600 bg-slate-50/50">Base Reference Features</div>
                  <div className="col-span-6 py-4 px-8 border-l-2 border-blue-200 text-blue-800 bg-blue-50/30">Target Model Configuration</div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                  {isAddingMode && currentPlan && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="m-6 bg-slate-900 rounded-3xl p-6 text-white shadow-2xl"
                    >
                      <div className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-3 space-y-2">
                          <label className="text-[10px] uppercase font-black text-slate-400">Feature Name</label>
                          <input
                            autoFocus
                            type="text"
                            placeholder="e.g. Next-Gen Connected Suite"
                            value={newFeature.name}
                            onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-3 space-y-2">
                          <label className="text-[10px] uppercase font-black text-slate-400">Category</label>
                          <select
                            value={newFeature.category}
                            onChange={(e) => setNewFeature({ ...newFeature, category: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
                          >
                            {Object.keys(groupedFeatures).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2 space-y-2">
                          <label className="text-[10px] uppercase font-black text-slate-400">Value</label>
                          <input
                            type="text"
                            placeholder="Standard"
                            value={newFeature.value}
                            onChange={(e) => setNewFeature({ ...newFeature, value: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <label className="text-[10px] uppercase font-black text-slate-400">Cost (₹)</label>
                          <input
                            type="number"
                            value={newFeature.cost || ''}
                            onChange={(e) => setNewFeature({ ...newFeature, cost: Number(e.target.value) })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold outline-none"
                          />
                        </div>
                        <div className="col-span-2 flex gap-2">
                          <button onClick={handleAddCustomFeature} className="flex-1 h-10 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all"><Check size={20} /></button>
                          <button onClick={() => setIsAddingMode(false)} className="h-10 w-10 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all"><X size={20} /></button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeCategory && (groupedFeatures[activeCategory]?.items || []).map((feature: any) => {
                    const isPlanFeature = 'plan_feature_id' in feature;
                    const featureName = isPlanFeature ? feature.feature_name : feature.feature_name;

                    let baseValues: Record<string, string> = {};
                    if (isPlanFeature) {
                      const baseF = baseClassData?.features.find(f => f.feature_name === feature.feature_name);
                      baseValues = baseF?.sub_variant_values || { "Value": feature.value };
                    } else {
                      baseValues = feature.sub_variant_values || {};
                    }

                    return (
                      <div
                        key={isPlanFeature ? feature.plan_feature_id : (feature.feature_id || feature.feature_name)}
                        className={`grid grid-cols-12 gap-0 items-stretch hover:bg-blue-50/20 transition-colors group border-b border-slate-100 ${
                          isPlanFeature && feature.value !== feature.original_value ? 'bg-amber-50/50' : ''
                        }`}
                      >
                        {/* LEFT SECTION: REFERENCE (col-span-6) */}
                        <div className="col-span-2 py-5 px-8 flex flex-col justify-center bg-white">
                          <p className="text-xs font-black text-slate-800 tracking-tight leading-tight">{featureName}</p>
                          {(feature.tag || isPlanFeature) && (
                            <span className={`mt-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md w-fit ${
                              (feature.tag === 'Inherited' || (isPlanFeature && feature.is_inherited)) 
                                ? 'bg-blue-50 text-blue-600' 
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {feature.tag || (feature.is_inherited ? 'Inherited' : 'Additional')}
                            </span>
                          )}
                        </div>

                        <div className="col-span-4 py-5 px-6 border-l border-slate-100 flex flex-col justify-center gap-1.5 bg-slate-50/30">
                          {Object.entries(baseValues).map(([svName, val]) => (
                            <div key={svName} className="flex items-center justify-between gap-3 text-[9px] font-black">
                              <span className="text-slate-500 font-black truncate max-w-[120px] uppercase tracking-tighter">
                                {svName.replace(selection.variant + ' ', '')}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md border min-w-[60px] text-right font-black ${val === 'Yes' ? 'bg-blue-50 text-blue-600 border-blue-100/50' : 'bg-white text-slate-600 border-slate-100/50'
                                }`}>
                                {val || '—'}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* RIGHT SECTION: CONFIGURATION (col-span-6) */}
                        <div className="col-span-6 py-5 px-8 border-l-2 border-blue-100 bg-blue-50/10 flex items-center">
                          {isPlanFeature ? (
                            <div className="w-full grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-5 relative">
                                <input
                                  list={`options-${feature.plan_feature_id}`}
                                  defaultValue={feature.value || ''}
                                  placeholder="Select or type..."
                                  onBlur={(e) => handleUpdateFeature(feature.plan_feature_id, { value: e.target.value || null })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') e.currentTarget.blur();
                                  }}
                                  className={`w-full px-3 py-2 rounded-xl text-[10px] font-black border transition-all shadow-sm outline-none ${
                                    feature.value !== feature.original_value 
                                      ? 'bg-amber-100 border-amber-300 text-amber-900 ring-2 ring-amber-200' 
                                      : ['Standard', 'Yes', 'S'].includes(feature.value) 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                        : ['Optional', 'O'].includes(feature.value) 
                                          ? 'bg-amber-50 text-amber-700 border-amber-100' 
                                          : 'bg-white text-slate-800 border-slate-300'
                                  }`}
                                />
                                <datalist id={`options-${feature.plan_feature_id}`}>
                                  {feature.available_options?.map((opt: string) => (
                                    <option key={opt} value={opt} />
                                  ))}
                                </datalist>
                              </div>
                              <div className="col-span-5 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-black text-[10px]">₹</span>
                                <input
                                  type="number"
                                  defaultValue={feature.cost_delta || ''}
                                  placeholder="0"
                                  onBlur={(e) => handleUpdateFeature(feature.plan_feature_id, { cost_delta: Number(e.target.value) })}
                                  className={`w-full bg-white border border-slate-300 rounded-xl pl-6 pr-3 py-2 text-[10px] font-black text-right outline-none transition-all focus:ring-2 focus:ring-blue-500 ${feature.cost_delta !== 0 ? 'text-blue-600 border-blue-200' : 'text-slate-500'
                                    }`}
                                />
                              </div>
                              <div className="col-span-2 flex justify-end">
                                <button
                                  onClick={() => handleDelete(feature.plan_feature_id)}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full flex items-center justify-center opacity-60">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Selected for Reference Only</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {!activeCategory && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-300 italic text-sm">
                      Select a category to view features
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

    </div>
  );
};

export default FeatureStackUpPage;

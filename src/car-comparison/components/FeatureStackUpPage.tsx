import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  TrendingUp, 
  Info,
  Save,
  ChevronRight,
  ChevronDown,
  Layers,
  PlusCircle,
  HelpCircle,
  Search,
  Car
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchModelDetails, fetchComparisonDetails } from '../services/api';
import { ModelDetails, SelectionState, DropdownOption } from '../types';

interface FeatureItem {
  id: string;
  name: string;
  category: string;
  baseStatus: string;
  futureStatus: string;
  cost: number;
  rationale: string;
}

const CATEGORIES = [
  'Exterior',
  'Interior',
  'Safety',
  'Comfort & Convenience',
  'Infotainment',
  'Performance'
];

const getVersionLabel = (versionValue: string): string => {
  const versionNum = parseInt(versionValue.replace('v', ''));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const year = 2026;
  if (isNaN(versionNum) || versionNum < 1) return versionValue;
  const monthIndex = (versionNum - 1) % 12;
  const yearOffset = Math.floor((versionNum - 1) / 12);
  return `${months[monthIndex]} ${year + yearOffset}`;
};

const FeatureStackUpPage: React.FC = () => {
  // Model Data & Selection State
  const [modelData, setModelData] = useState<ModelDetails | null>(null);
  const [baseSelection, setBaseSelection] = useState<SelectionState>({
    brand: '',
    model: '',
    version: '',
    variant: '',
    variant_id: ''
  });
  
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);
  const [futureModelName, setFutureModelName] = useState('Planned Future Model');
  const [baseCost, setBaseCost] = useState(0);
  
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [isAddingMode, setIsAddingMode] = useState(false);
  
  const [newFeature, setNewFeature] = useState<Omit<FeatureItem, 'id'>>({
    name: '',
    category: 'Exterior',
    baseStatus: 'Not Available',
    futureStatus: 'Standard',
    cost: 0,
    rationale: ''
  });

  // Fetch initial model data
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

  // Sync features when base car is selected
  const handleLoadBaseFeatures = async () => {
    if (!baseSelection.variant_id) return;

    setIsLoadingFeatures(true);
    try {
      // Fetch details by comparing base model with itself (to bypass 2-vehicle requirement)
      const data = await fetchComparisonDetails([baseSelection, baseSelection]);
      
      // Parse data into features
      const baseColHeader = data.columns[1];
      const parsedFeatures: FeatureItem[] = data.data.map((row, index) => {
        const baseVal = row[baseColHeader] || '';
        
        // Try to extract category from feature name like "Exterior - Headlamps"
        let category = 'General';
        let cleanName = row.feature;
        if (row.feature.includes(' - ')) {
          [category, cleanName] = row.feature.split(' - ').map(s => s.trim());
        } else if (row.feature.includes(':')) {
          [category, cleanName] = row.feature.split(':').map(s => s.trim());
        }

        return {
          id: `base-${index}`,
          name: cleanName,
          category: category,
          baseStatus: baseVal,
          futureStatus: baseVal,
          cost: 0,
          rationale: 'Inherited from base model'
        };
      });

      setFeatures(parsedFeatures);
      
      // Extract price if available in features
      const priceRow = parsedFeatures.find(f => f.name.toLowerCase().includes('price'));
      if (priceRow && priceRow.baseStatus) {
        const priceNum = parseInt(priceRow.baseStatus.replace(/[^0-9]/g, ''));
        if (!isNaN(priceNum)) setBaseCost(priceNum);
      }

    } catch (err) {
      console.error('Failed to fetch base features', err);
      alert('Failed to load base model features.');
    } finally {
      setIsLoadingFeatures(false);
    }
  };

  const totalDelta = useMemo(() => 
    features.reduce((sum, feature) => sum + feature.cost, 0), 
  [features]);

  const futureTotalCost = baseCost + totalDelta;

  const handleAddFeature = () => {
    if (!newFeature.name) return;
    setFeatures([
      ...features, 
      { ...newFeature, id: `custom-${Math.random().toString(36).substr(2, 9)}` }
    ]);
    setNewFeature({
      name: '',
      category: 'Exterior',
      baseStatus: 'Not Available',
      futureStatus: 'Standard',
      cost: 0,
      rationale: ''
    });
    setIsAddingMode(false);
  };

  const handleDeleteFeature = (id: string) => {
    setFeatures(features.filter(f => f.id !== id));
  };

  const updateFeatureStatus = (id: string, status: string) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, futureStatus: status } : f));
  };

  const updateFeatureCost = (id: string, cost: number) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, cost } : f));
  };

  const updateFeatureRationale = (id: string, rationale: string) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, rationale } : f));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
      {/* Top Header Section */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm z-20">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
              <Layers size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Feature Stack-Up</h2>
              <p className="text-xs text-slate-500 font-medium">Build future models by modifying existing configurations</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="bg-slate-50 border border-slate-200 rounded-2xl p-1 flex items-center gap-1">
                <div className="px-4 py-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Base Reference</p>
                  <p className="text-sm font-bold text-slate-700">{baseSelection.model || 'None Selected'}</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="px-4 py-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Future Est. Cost</p>
                  <p className="text-xl font-black text-blue-600">₹{futureTotalCost.toLocaleString()}</p>
                </div>
             </div>
             <button 
              className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
              onClick={() => alert("Configuration Saved Successfully!")}
             >
                <Save size={18} /> Save Config
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Base Model Selection Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Search size={20} className="text-blue-500" />
              1. Select Base Reference Model
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Brand */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Brand</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  value={baseSelection.brand}
                  onChange={e => setBaseSelection({ brand: e.target.value, model: '', version: '', variant: '', variant_id: '' })}
                >
                  <option value="">Select Brand</option>
                  {modelData?.brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Model */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Car Model</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={!baseSelection.brand}
                  value={baseSelection.model}
                  onChange={e => setBaseSelection({ ...baseSelection, model: e.target.value, version: '', variant: '', variant_id: '' })}
                >
                  <option value="">Select Model</option>
                  {baseSelection.brand && modelData?.models[baseSelection.brand]?.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Version/Date */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Release Date</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={!baseSelection.model}
                  value={baseSelection.version}
                  onChange={e => setBaseSelection({ ...baseSelection, version: e.target.value, variant: '', variant_id: '' })}
                >
                  <option value="">Select Date</option>
                  {baseSelection.model && modelData?.versions[`${baseSelection.brand}__${baseSelection.model}`]?.map(v => (
                    <option key={v.value} value={v.value}>{getVersionLabel(v.value)}</option>
                  ))}
                </select>
              </div>

              {/* Variant */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Variant</label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={!baseSelection.version}
                    value={baseSelection.variant}
                    onChange={e => {
                      const bmvKey = `${baseSelection.brand}__${baseSelection.model}__${baseSelection.version}`;
                      const variantKey = `${bmvKey}__${e.target.value}`;
                      const variantId = modelData?.variantIds?.[variantKey] || '';
                      setBaseSelection({ ...baseSelection, variant: e.target.value, variant_id: variantId });
                    }}
                  >
                    <option value="">Select Variant</option>
                    {baseSelection.version && modelData?.variants[`${baseSelection.brand}__${baseSelection.model}__${baseSelection.version}`]?.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleLoadBaseFeatures}
                    disabled={!baseSelection.variant_id || isLoadingFeatures}
                    className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center min-w-[48px]"
                  >
                    {isLoadingFeatures ? <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full"></div> : <Check size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Configuration Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <PlusCircle size={20} className="text-blue-500" />
                      2. Feature Stack-Up Management
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5 ml-7">Modify base features or add new ones to your future model</p>
                  </div>
                  <button 
                    onClick={() => setIsAddingMode(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                  >
                    <Plus size={16} /> New Feature
                  </button>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                      <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky top-0 z-10">
                        <th className="px-6 py-4 border-b border-slate-200 backdrop-blur-md">Feature Name</th>
                        <th className="px-1 py-1 border-b border-slate-200 backdrop-blur-md w-px"></th>
                        <th className="px-6 py-4 border-b border-slate-200 backdrop-blur-md text-center">Status Comparison</th>
                        <th className="px-6 py-4 border-b border-slate-200 backdrop-blur-md text-right">Inc. Cost</th>
                        <th className="px-6 py-4 border-b border-slate-200 backdrop-blur-md">Cost Rationale</th>
                        <th className="px-4 py-4 border-b border-slate-200 backdrop-blur-md text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <AnimatePresence initial={false}>
                        {isAddingMode && (
                          <motion.tr 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-blue-50/40"
                          >
                            <td className="px-6 py-4">
                              <input 
                                autoFocus
                                type="text" 
                                placeholder="Feature name..."
                                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                                value={newFeature.name}
                                onChange={e => setNewFeature({...newFeature, name: e.target.value})}
                              />
                            </td>
                            <td></td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <div className="text-[9px] text-slate-400 italic">Target:</div>
                                <select 
                                  className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold shadow-sm outline-none"
                                  value={newFeature.futureStatus}
                                  onChange={e => setNewFeature({...newFeature, futureStatus: e.target.value})}
                                >
                                  <option value="Standard">Standard</option>
                                  <option value="Optional">Optional</option>
                                  <option value="Not Available">Not Available</option>
                                </select>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                <input 
                                  type="number" 
                                  className="w-full pl-6 pr-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-bold shadow-sm outline-none text-right"
                                  value={newFeature.cost}
                                  onChange={e => setNewFeature({...newFeature, cost: Number(e.target.value)})}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4">
                               <input 
                                type="text" 
                                placeholder="Why add this?"
                                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-medium shadow-sm outline-none"
                                value={newFeature.rationale}
                                onChange={e => setNewFeature({...newFeature, rationale: e.target.value})}
                              />
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1.5">
                                <button onClick={handleAddFeature} className="p-2 bg-blue-600 text-white rounded-lg"><Check size={14} /></button>
                                <button onClick={() => setIsAddingMode(false)} className="p-2 bg-slate-200 text-slate-600 rounded-lg"><X size={14} /></button>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>

                      {features.length === 0 && !isLoadingFeatures && (
                        <tr>
                          <td colSpan={6} className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center opacity-30">
                              <Car size={64} strokeWidth={1} className="mb-4 text-slate-400" />
                              <p className="text-lg font-black text-slate-900 mb-1">Select a Base Vehicle</p>
                              <p className="text-sm font-medium">Load features from an existing vehicle to start stacking</p>
                            </div>
                          </td>
                        </tr>
                      )}

                      {Object.entries(
                        features.reduce((acc, f) => {
                          if (!acc[f.category]) acc[f.category] = [];
                          acc[f.category].push(f);
                          return acc;
                        }, {} as Record<string, FeatureItem[]>)
                      ).map(([category, catFeatures]) => (
                        <React.Fragment key={category}>
                          <tr className="bg-slate-100/50">
                            <td colSpan={6} className="px-6 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-y border-slate-200">
                              {category}
                            </td>
                          </tr>
                          {catFeatures.map((feature) => (
                            <motion.tr 
                              layout
                              key={feature.id} 
                              className="hover:bg-slate-50/80 transition-all group"
                            >
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-800 text-sm">{feature.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium whitespace-pre-wrap max-w-xs transition-all decoration-blue-500/30 group-hover:text-slate-600">
                                  Base Reference: {feature.baseStatus || 'Not Available'}
                                </p>
                              </td>
                              <td className="w-px bg-slate-100"></td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col items-center gap-1">
                                  <select 
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all outline-none ${
                                      feature.futureStatus === 'Standard' || feature.futureStatus === 'Yes' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                      feature.futureStatus === 'Optional' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                      'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                    value={feature.futureStatus}
                                    onChange={(e) => updateFeatureStatus(feature.id, e.target.value)}
                                  >
                                    <option value="Standard">Standard</option>
                                    <option value="Optional">Optional</option>
                                    <option value="Not Available">Not Available</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                  {feature.baseStatus !== feature.futureStatus && (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                      className="flex items-center gap-1 text-[9px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200 shadow-sm"
                                    >
                                      Delta Detected
                                    </motion.div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="relative group/cost inline-block w-28">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">₹</span>
                                  <input 
                                    type="number" 
                                    className={`w-full pl-5 pr-2 py-1.5 text-xs font-black rounded-lg text-right outline-none transition-all ${
                                      feature.cost !== 0 ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' : 'bg-transparent text-slate-300 border border-transparent group-hover/cost:bg-slate-100'
                                    }`}
                                    value={feature.cost || ''}
                                    placeholder="0"
                                    onChange={(e) => updateFeatureCost(feature.id, Number(e.target.value))}
                                  />
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <input 
                                  type="text" 
                                  className="w-full bg-transparent text-[11px] text-slate-500 font-medium italic border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white focus:px-2 rounded-sm py-1 transition-all outline-none"
                                  value={feature.rationale}
                                  onChange={(e) => updateFeatureRationale(feature.id, e.target.value)}
                                  placeholder="Add cost rationale..."
                                />
                              </td>
                              <td className="px-4 py-4">
                                <button 
                                  onClick={() => handleDeleteFeature(feature.id)}
                                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Insights */}
            <div className="space-y-6">
               <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-6">Planned Model Summary</h4>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-medium text-slate-300">Base Reference Cost</span>
                        <span className="text-sm font-bold">₹{baseCost.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-medium text-slate-300">Net Feature Delta</span>
                        <span className="text-lg font-black text-blue-400">+ ₹{totalDelta.toLocaleString()}</span>
                      </div>

                      <div className="h-px bg-slate-800 my-4"></div>

                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-slate-500">Target Production Cost</p>
                        <p className="text-3xl font-black tracking-tighter text-white">₹{futureTotalCost.toLocaleString()}</p>
                      </div>

                      <div className="pt-4">
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (totalDelta / (baseCost || 1)) * 500)}%` }}
                            className="h-full bg-gradient-to-r from-blue-600 to-indigo-400"
                          ></motion.div>
                        </div>
                        <p className="text-right text-[10px] font-bold text-slate-500 mt-1 uppercase">
                          BOM Inflation: <span className="text-white">{((totalDelta / (baseCost || 1)) * 100).toFixed(2)}%</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Decorative element */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
               </div>

               <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-500" />
                    Market Rationale
                  </h4>
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[11px] font-bold text-slate-700 leading-snug">
                        Total {features.filter(f => f.cost > 0).length} new features added. 
                        Average cost per feature: <span className="text-blue-600">₹{(totalDelta / (features.filter(f => f.cost > 0).length || 1)).toLocaleString()}</span>
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-xl shrink-0"><HelpCircle size={16}/></div>
                      <p className="text-[10px] font-medium text-slate-500 leading-normal">
                        Your planned model exceeds segment averages by 4.2%. Consider optimizing Exterior features to maintain margin targets.
                      </p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureStackUpPage;

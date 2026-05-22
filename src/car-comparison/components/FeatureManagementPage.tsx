import React, { useState, useEffect, useMemo } from 'react';
import {
  Sliders,
  Search,
  Edit3,
  Move,
  Trash2,
  PlusCircle,
  Check,
  X,
  Folder,
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchFeatureMasterCategoryWise,
  renameFeatureMaster,
  moveFeatureMaster,
  deleteFeatureMaster
} from '../services/api';

interface FeatureItem {
  id: string;
  name: string;
}

const FeatureManagementPage: React.FC = () => {
  // Data State
  const [data, setData] = useState<Record<string, FeatureItem[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Search & Filter
  const [categorySearch, setCategorySearch] = useState<string>('');
  const [featureSearch, setFeatureSearch] = useState<string>('');

  // Inline editing state
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Moving category state
  const [movingFeatureId, setMovingFeatureId] = useState<string | null>(null);
  const [isSavingMove, setIsSavingMove] = useState<boolean>(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  // Deleting feature state
  const [deletingFeatureId, setDeletingFeatureId] = useState<string | null>(null);
  const [isSavingDelete, setIsSavingDelete] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Creating feature state
  const [isCreatingFeature, setIsCreatingFeature] = useState<boolean>(false);
  const [newFeatureName, setNewFeatureName] = useState<string>('');
  const [newFeatureCategory, setNewFeatureCategory] = useState<string>('');
  const [newFeatureError, setNewFeatureError] = useState<string | null>(null);
  const [isSavingNewFeature, setIsSavingNewFeature] = useState<boolean>(false);

  // Load category-wise master features
  const loadData = async (shouldResetSelected: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFeatureMasterCategoryWise();
      setData(result);
      
      const categories = Object.keys(result).sort();
      if (categories.length > 0) {
        if (shouldResetSelected || !selectedCategory || !result[selectedCategory]) {
          setSelectedCategory(categories[0]);
        }
      } else {
        setSelectedCategory('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch features list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  // Sorted list of all active categories
  const sortedCategories = useMemo(() => {
    return Object.keys(data).sort();
  }, [data]);

  // Categories filtered by category search query
  const filteredCategories = useMemo(() => {
    return sortedCategories.filter(cat =>
      cat.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [sortedCategories, categorySearch]);

  // Total feature count helper
  const totalFeatureCount = useMemo(() => {
    return Object.values(data).reduce((acc, currentList) => acc + currentList.length, 0);
  }, [data]);

  // Active features list for current category, filtered by feature search query
  const currentFeaturesFiltered = useMemo(() => {
    if (!selectedCategory || !data[selectedCategory]) return [];
    return data[selectedCategory].filter(feat =>
      feat.name.toLowerCase().includes(featureSearch.toLowerCase())
    );
  }, [data, selectedCategory, featureSearch]);

  // Action handlers
  const handleRename = async (featureId: string) => {
    if (!editNameValue.trim()) {
      setEditError('Feature name cannot be empty');
      return;
    }
    
    setIsSavingEdit(true);
    setEditError(null);
    try {
      await renameFeatureMaster(featureId, editNameValue.trim());
      // Refresh local data
      await loadData();
      setEditingFeatureId(null);
    } catch (err: any) {
      setEditError(err.message || 'Failed to rename feature');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleMoveCategory = async (featureId: string, targetCategory: string) => {
    if (!targetCategory || targetCategory === selectedCategory) return;
    
    setMovingFeatureId(featureId);
    setIsSavingMove(true);
    setMoveError(null);
    try {
      await moveFeatureMaster(featureId, targetCategory);
      // Refresh local data and stay on current or swap to new category
      await loadData();
      setMovingFeatureId(null);
    } catch (err: any) {
      setMoveError(err.message || 'Failed to move feature');
      // Alert the user since it's a dropdown option that failed
      alert(err.message || 'Failed to move feature');
      setMovingFeatureId(null);
    } finally {
      setIsSavingMove(false);
    }
  };

  const handleDelete = async (featureId: string) => {
    setIsSavingDelete(true);
    setDeleteError(null);
    try {
      await deleteFeatureMaster(featureId);
      await loadData();
      setDeletingFeatureId(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete feature');
      alert(err.message || 'Failed to delete feature');
      setDeletingFeatureId(null);
    } finally {
      setIsSavingDelete(false);
    }
  };

  const handleCreateFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeatureName.trim()) {
      setNewFeatureError('Feature name cannot be empty');
      return;
    }
    const categoryToUse = newFeatureCategory || selectedCategory;
    if (!categoryToUse) {
      setNewFeatureError('Please select or specify a category');
      return;
    }

    setIsSavingNewFeature(true);
    setNewFeatureError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/features/master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFeatureName.trim(),
          category: categoryToUse.trim()
        })
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.detail || 'Failed to create feature');
      }

      await loadData();
      setSelectedCategory(categoryToUse.trim());
      setIsCreatingFeature(false);
      setNewFeatureName('');
      setNewFeatureCategory('');
    } catch (err: any) {
      setNewFeatureError(err.message || 'Failed to create new feature');
    } finally {
      setIsSavingNewFeature(false);
    }
  };

  return (
    <div className="flex h-full bg-[#f8fafc] overflow-hidden">
      {/* Sidebar - Categories list */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 shadow-sm">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Folder size={14} className="text-blue-600" />
              <span>Categories</span>
            </h2>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {sortedCategories.length} Cats
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Search categories..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
          {isLoading && sortedCategories.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading categories...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400 italic">No categories found</div>
          ) : (
            filteredCategories.map((cat) => {
              const active = selectedCategory === cat;
              const count = data[cat]?.length || 0;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setFeatureSearch('');
                    setEditingFeatureId(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all ${
                    active
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-200'
                      : 'hover:bg-slate-50 text-slate-600 font-medium'
                  }`}
                >
                  <span className="text-xs truncate mr-2">{cat}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 font-extrabold ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Sidebar Footer Info Card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/30">
          <div className="bg-gradient-to-br from-indigo-50 to-sky-50 rounded-xl p-3 border border-indigo-100">
            <h4 className="text-[10px] font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1 mb-1">
              <Sparkles size={11} className="text-indigo-600" />
              <span>Statistics</span>
            </h4>
            <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
              <span>Total Active Features:</span>
              <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                {totalFeatureCount}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel - Features table and actions */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#f8fafc]">
        {/* Main Content Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <Sliders size={16} />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
                <span>Feature Master Manager</span>
                <span className="text-slate-300 font-light">|</span>
                <span className="text-blue-600 font-extrabold lowercase text-xs">{selectedCategory}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData(false)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              title="Refresh Features"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setIsCreatingFeature(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all text-xs uppercase tracking-wider"
            >
              <Plus size={13} />
              <span>New Feature</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-red-700">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5">Database Error</h4>
                <p className="text-xs font-semibold leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {isLoading && Object.keys(data).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={36} className="text-blue-600 animate-spin mb-4" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading database features...</p>
            </div>
          ) : !selectedCategory ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <Info size={36} className="text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-800 mb-1">No Categories Selected</h3>
              <p className="text-xs text-slate-400">Please choose a category from the sidebar or create a new feature.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Features Controls inside grid */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                  <input
                    type="text"
                    placeholder={`Search features in ${selectedCategory}...`}
                    value={featureSearch}
                    onChange={(e) => setFeatureSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  {featureSearch && (
                    <button
                      onClick={() => setFeatureSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">
                  Showing {currentFeaturesFiltered.length} / {data[selectedCategory]?.length || 0} features
                </span>
              </div>

              {/* Table/List of Features */}
              <div className="divide-y divide-slate-100">
                {currentFeaturesFiltered.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic">
                    {featureSearch ? 'No matching features found' : 'This category has no active features'}
                  </div>
                ) : (
                  currentFeaturesFiltered.map((feat) => {
                    const isEditing = editingFeatureId === feat.id;
                    const isMoving = movingFeatureId === feat.id;
                    const isDeleting = deletingFeatureId === feat.id;

                    return (
                      <div
                        key={feat.id}
                        className={`px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${
                          isEditing ? 'bg-blue-50/30' : 'hover:bg-slate-50/30'
                        }`}
                      >
                        {/* Left: Name / Inline Rename Input */}
                        <div className="flex-1 min-w-0 w-full">
                          {isEditing ? (
                            <div className="flex flex-col gap-1.5 w-full">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editNameValue}
                                  onChange={(e) => setEditNameValue(e.target.value)}
                                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                  autoFocus
                                  disabled={isSavingEdit}
                                  placeholder="Enter new feature name"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRename(feat.id);
                                    else if (e.key === 'Escape') setEditingFeatureId(null);
                                  }}
                                />
                                <button
                                  onClick={() => handleRename(feat.id)}
                                  disabled={isSavingEdit}
                                  className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center shrink-0 shadow-sm"
                                  title="Save Rename"
                                >
                                  {isSavingEdit ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Check size={13} />
                                  )}
                                </button>
                                <button
                                  onClick={() => setEditingFeatureId(null)}
                                  disabled={isSavingEdit}
                                  className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition-colors flex items-center justify-center shrink-0"
                                  title="Cancel"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                              {editError && (
                                <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5">
                                  <AlertCircle size={10} />
                                  {editError}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800 leading-relaxed block truncate">
                                {feat.name}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Right: Actions (Rename, Move, Delete) */}
                        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
                          {!isEditing && (
                            <>
                              {/* Rename Trigger */}
                              <button
                                onClick={() => {
                                  setEditingFeatureId(feat.id);
                                  setEditNameValue(feat.name);
                                  setEditError(null);
                                }}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center"
                                title="Rename Feature"
                              >
                                <Edit3 size={13} />
                              </button>

                              {/* Move Category Selector */}
                              <div className="relative">
                                <select
                                  disabled={isSavingMove}
                                  value={selectedCategory}
                                  onChange={(e) => handleMoveCategory(feat.id, e.target.value)}
                                  className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 py-1 pl-2.5 pr-7 rounded-lg text-[10px] font-bold outline-none cursor-pointer transition-all"
                                  title="Move to another Category"
                                >
                                  {sortedCategories.map((c) => (
                                    <option key={c} value={c} disabled={c === selectedCategory}>
                                      {c === selectedCategory ? 'Move to...' : c}
                                    </option>
                                  ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                                  {isSavingMove && movingFeatureId === feat.id ? (
                                    <Loader2 size={10} className="animate-spin" />
                                  ) : (
                                    <Move size={10} />
                                  )}
                                </div>
                              </div>

                              {/* Delete Action (Soft Delete) */}
                              {deletingFeatureId === feat.id ? (
                                <div className="flex items-center gap-1 bg-red-50 border border-red-100 rounded-lg p-1">
                                  <span className="text-[9px] font-black text-red-600 px-1">Confirm delete?</span>
                                  <button
                                    onClick={() => handleDelete(feat.id)}
                                    disabled={isSavingDelete}
                                    className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors shrink-0"
                                  >
                                    {isSavingDelete ? (
                                      <Loader2 size={8} className="animate-spin" />
                                    ) : (
                                      <Check size={8} />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setDeletingFeatureId(null)}
                                    disabled={isSavingDelete}
                                    className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors shrink-0"
                                  >
                                    <X size={8} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setDeletingFeatureId(feat.id);
                                    setDeleteError(null);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                                  title="Deactivate Feature"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* New Feature Modal */}
      <AnimatePresence>
        {isCreatingFeature && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                  <PlusCircle size={15} className="text-blue-600" />
                  <span>Create Master Feature</span>
                </h3>
                <button
                  onClick={() => setIsCreatingFeature(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateFeature} className="p-6 space-y-4">
                {newFeatureError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-2 text-red-700 text-xs font-semibold leading-relaxed">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{newFeatureError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Feature Name</label>
                  <input
                    type="text"
                    required
                    value={newFeatureName}
                    onChange={(e) => setNewFeatureName(e.target.value)}
                    placeholder="e.g. Adaptive Cruise Control"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-300"
                    disabled={isSavingNewFeature}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Category</label>
                  <div className="flex gap-2">
                    {/* Input or select Category */}
                    <input
                      type="text"
                      value={newFeatureCategory}
                      onChange={(e) => setNewFeatureCategory(e.target.value)}
                      placeholder={`e.g. ${selectedCategory || 'Safety'}`}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-slate-300"
                      disabled={isSavingNewFeature}
                    />
                    <select
                      value={newFeatureCategory}
                      onChange={(e) => setNewFeatureCategory(e.target.value)}
                      className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-[10px] font-bold focus:outline-none cursor-pointer"
                      disabled={isSavingNewFeature}
                    >
                      <option value="">Current Category</option>
                      {sortedCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[9px] text-slate-400 italic">
                    Type a new custom category name, select an existing one, or leave as default ({selectedCategory || 'None'})
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreatingFeature(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors text-xs uppercase"
                    disabled={isSavingNewFeature}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all text-xs uppercase tracking-wider flex items-center gap-1.5"
                    disabled={isSavingNewFeature}
                  >
                    {isSavingNewFeature ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check size={13} />
                        <span>Create Feature</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeatureManagementPage;

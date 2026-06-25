// /**
//  * FeatureMasterSection.tsx — v3
//  * Vertical accordion drag & drop, compact, auto-scroll during drag.
//  */

// import React, { useState, useRef, useEffect } from 'react';
// import { Plus, Merge, Undo2, GripVertical, X, Check, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
// import {
//     addFeatureMaster,
//     renameFeatureMaster,
//     mergeFeatureMaster,
//     unmergeFeatureMaster,
//     reorderFeatures,
//     moveFeatureCategory,
// } from '../services/api';

// interface Feature {
//     id: string;
//     name: string;
//     sort_order?: number;
//     isMerged?: boolean;
// }

// interface Props {
//     featuresMaster: Record<string, Feature[]>;
//     onRefresh: () => void;
//     showToast: (type: 'success' | 'error', msg: string) => void;
// }

// interface DragPayload {
//     featureId: string;
//     sourceCategory: string;
//     sourceIndex: number;
// }

// const FeatureMasterSection: React.FC<Props> = ({ featuresMaster, onRefresh, showToast }) => {
//     const [localMaster, setLocalMaster] = useState<Record<string, Feature[]>>(featuresMaster);
//     const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
//     const [selections, setSelections] = useState<Record<string, Set<string>>>({});
//     const [mergeModal, setMergeModal] = useState<{ category: string } | null>(null);
//     const [mergeTargetName, setMergeTargetName] = useState('');
//     const [addingIn, setAddingIn] = useState<string | null>(null);
//     const [newFeatName, setNewFeatName] = useState('');
//     const [renamingId, setRenamingId] = useState<string | null>(null);
//     const [renameValue, setRenameValue] = useState('');

//     // Drag state
//     const dragPayload = useRef<DragPayload | null>(null);
//     const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
//     const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
//     const [draggingId, setDraggingId] = useState<string | null>(null);

//     // Scroll container ref for auto-scroll during drag
//     const scrollRef = useRef<HTMLDivElement>(null);
//     const autoScrollFrame = useRef<number | null>(null);

//     useEffect(() => {
//         setLocalMaster(featuresMaster);
//     }, [featuresMaster]);

//     const categories = Object.keys(localMaster);

//     // ── Auto-scroll during drag ──────────────────────────────────────────────
//     const handleDragOverScroll = (e: React.DragEvent) => {
//         const el = scrollRef.current;
//         if (!el) return;
//         const rect = el.getBoundingClientRect();
//         const ZONE = 60; // px from edge triggers scroll
//         const SPEED = 8;
//         if (autoScrollFrame.current) cancelAnimationFrame(autoScrollFrame.current);
//         const scroll = () => {
//             const distTop = e.clientY - rect.top;
//             const distBot = rect.bottom - e.clientY;
//             if (distTop < ZONE) el.scrollTop -= SPEED * (1 - distTop / ZONE);
//             else if (distBot < ZONE) el.scrollTop += SPEED * (1 - distBot / ZONE);
//         };
//         scroll();
//         autoScrollFrame.current = requestAnimationFrame(scroll);
//     };

//     // ── Helpers ──────────────────────────────────────────────────────────────
//     const getSelection = (cat: string) => selections[cat] ?? new Set<string>();
//     const clearSelection = (cat: string) =>
//         setSelections(prev => ({ ...prev, [cat]: new Set() }));
//     const toggleSelect = (cat: string, id: string) => {
//         setSelections(prev => {
//             const s = new Set(prev[cat] ?? []);
//             s.has(id) ? s.delete(id) : s.add(id);
//             return { ...prev, [cat]: s };
//         });
//     };
//     const toggleCollapse = (cat: string) =>
//         setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

//     // ── Drag handlers ────────────────────────────────────────────────────────
//     const onDragStart = (featureId: string, sourceCategory: string, sourceIndex: number) =>
//         (e: React.DragEvent) => {
//             dragPayload.current = { featureId, sourceCategory, sourceIndex };
//             e.dataTransfer.effectAllowed = 'move';
//             setDraggingId(featureId);
//         };

//     const onDragEnd = () => {
//         setDraggingId(null);
//         setDragOverCategory(null);
//         setDragOverIndex(null);
//         if (autoScrollFrame.current) cancelAnimationFrame(autoScrollFrame.current);
//     };

//     // Hovering over a category header → highlight + auto-expand
//     const onHeaderDragOver = (cat: string) => (e: React.DragEvent) => {
//         e.preventDefault();
//         e.stopPropagation();
//         e.dataTransfer.dropEffect = 'move';
//         setDragOverCategory(cat);
//         setDragOverIndex(null);
//         setCollapsed(prev => ({ ...prev, [cat]: false })); // auto-expand
//         handleDragOverScroll(e);
//     };

//     // Hovering over a specific feature row
//     const onFeatureDragOver = (cat: string, idx: number) => (e: React.DragEvent) => {
//         e.preventDefault();
//         e.stopPropagation();
//         e.dataTransfer.dropEffect = 'move';
//         setDragOverCategory(cat);
//         setDragOverIndex(idx);
//         handleDragOverScroll(e);
//     };

//     const executeDrop = async (targetCategory: string, targetIndex: number) => {
//         const payload = dragPayload.current;
//         setDragOverCategory(null);
//         setDragOverIndex(null);
//         setDraggingId(null);
//         if (!payload) return;
//         const { featureId, sourceCategory, sourceIndex } = payload;
//         dragPayload.current = null;

//         // Cross-category move
//         if (sourceCategory !== targetCategory) {
//             const srcList = [...(localMaster[sourceCategory] ?? [])];
//             const [moved] = srcList.splice(sourceIndex, 1);
//             const tgtList = [...(localMaster[targetCategory] ?? [])];
//             const insertAt = targetIndex < 0 ? tgtList.length : targetIndex;
//             tgtList.splice(insertAt, 0, moved);

//             setLocalMaster(prev => ({
//                 ...prev,
//                 [sourceCategory]: srcList,
//                 [targetCategory]: tgtList,
//             }));

//             try {
//                 await moveFeatureCategory(featureId, targetCategory);
//                 await reorderFeatures(tgtList.map((f, i) => ({ id: f.id, sort_order: i })));
//                 showToast('success', `Moved to "${targetCategory}"`);
//                 onRefresh();
//             } catch (err: any) {
//                 showToast('error', err.message || 'Move failed');
//                 onRefresh();
//             }
//             return;
//         }

//         // Same-category reorder
//         if (sourceIndex === targetIndex) return;
//         const list = [...(localMaster[sourceCategory] ?? [])];
//         const [moved] = list.splice(sourceIndex, 1);
//         const insertAt = targetIndex < 0 ? list.length : targetIndex;
//         list.splice(insertAt, 0, moved);
//         setLocalMaster(prev => ({ ...prev, [sourceCategory]: list }));

//         try {
//             await reorderFeatures(list.map((f, i) => ({ id: f.id, sort_order: i })));
//             showToast('success', 'Order saved');
//             onRefresh();
//         } catch (err: any) {
//             showToast('error', err.message || 'Reorder failed');
//             onRefresh();
//         }
//     };

//     const onDrop = (targetCategory: string, targetIndex: number) => (e: React.DragEvent) => {
//         e.preventDefault();
//         executeDrop(targetCategory, targetIndex);
//     };

//     // ── CRUD ─────────────────────────────────────────────────────────────────
//     const handleAddFeature = async (cat: string) => {
//         if (!newFeatName.trim()) return;
//         try {
//             await addFeatureMaster(newFeatName.trim(), cat);
//             showToast('success', 'Feature added');
//             setNewFeatName('');
//             setAddingIn(null);
//             onRefresh();
//         } catch (err: any) {
//             showToast('error', err.message || 'Failed to add');
//         }
//     };

//     const handleRename = async (id: string) => {
//         if (!renameValue.trim()) return;
//         try {
//             await renameFeatureMaster(id, renameValue.trim());
//             showToast('success', 'Renamed');
//             setRenamingId(null);
//             onRefresh();
//         } catch (err: any) {
//             showToast('error', err.message || 'Rename failed');
//         }
//     };

//     const handleMerge = async (cat: string) => {
//         const ids = [...getSelection(cat)];
//         if (ids.length < 2) { showToast('error', 'Select at least 2 features'); return; }
//         if (!mergeTargetName.trim()) { showToast('error', 'Enter merged feature name'); return; }
//         try {
//             await mergeFeatureMaster(ids, mergeTargetName.trim(), cat);
//             showToast('success', 'Features merged');
//             setMergeModal(null);
//             setMergeTargetName('');
//             clearSelection(cat);
//             onRefresh();
//         } catch (err: any) {
//             showToast('error', err.message || 'Merge failed');
//         }
//     };

//     const handleUnmerge = async (id: string) => {
//         try {
//             await unmergeFeatureMaster(id);
//             showToast('success', 'Unmerged');
//             onRefresh();
//         } catch (err: any) {
//             showToast('error', err.message || 'Unmerge failed');
//         }
//     };

//     // ─────────────────────────────────────────────────────────────────────────
//     return (
//         <div className="bg-white border border-[#ccc] rounded-sm shadow-sm flex flex-col">
//             {/* Header */}
//             <div className="bg-[#e2e2e2] px-3 py-2 border-b border-[#bbb] flex items-center justify-between">
//                 <span className="font-bold text-black text-[13px]">2. Define Comparison Features</span>
//                 <span className="text-[10px] text-slate-400 italic">
//                     Drag grip → drop on category header to move across categories
//                 </span>
//             </div>

//             {/* Scrollable list — auto-scroll zone active during drag */}
//             <div
//                 ref={scrollRef}
//                 className="overflow-y-auto divide-y divide-[#e8e8e8] custom-scrollbar"
//                 style={{ maxHeight: 420 }}
//                 onDragOver={handleDragOverScroll}
//             >
//                 {categories.map(cat => {
//                     const features = localMaster[cat] ?? [];
//                     const sel = getSelection(cat);
//                     const selCount = sel.size;
//                     const isCollapsed = collapsed[cat];
//                     const isTargeted = dragOverCategory === cat;

//                     return (
//                         <div key={cat}>

//                             {/* ── Category Header ──────────────────────────────────────── */}
//                             <div
//                                 className={`flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer select-none transition-all
//                   ${isTargeted
//                                         ? 'bg-blue-100 border-l-[3px] border-blue-500'
//                                         : 'bg-[#f2f5f8] hover:bg-[#e8eef4] border-l-[3px] border-transparent'
//                                     }`}
//                                 onClick={() => toggleCollapse(cat)}
//                                 onDragOver={onHeaderDragOver(cat)}
//                                 onDrop={onDrop(cat, -1)}
//                             >
//                                 <span className="text-slate-400 flex-shrink-0">
//                                     {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
//                                 </span>

//                                 <span className="text-[11px] font-bold text-[#104a7a] uppercase tracking-wide flex-1 truncate">
//                                     {cat}
//                                 </span>

//                                 {/* Drop hint — only shows while dragging */}
//                                 {draggingId && (
//                                     <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 transition-all
//                     ${isTargeted ? 'bg-blue-500 text-white' : 'bg-[#dde3ea] text-slate-400'}`}>
//                                         {isTargeted ? '↓ Drop here' : 'drag here'}
//                                     </span>
//                                 )}

//                                 {/* Count badge */}
//                                 <span className="text-[9px] text-slate-400 tabular-nums bg-white border border-[#ddd] px-1 py-0.5 rounded-sm flex-shrink-0">
//                                     {features.length}
//                                 </span>

//                                 {/* Merge bar — only when 2+ selected */}
//                                 {selCount >= 2 && (
//                                     <div className="flex items-center gap-1 ml-1" onClick={e => e.stopPropagation()}>
//                                         <span className="text-[9px] text-purple-700 font-semibold">{selCount} sel</span>
//                                         <button
//                                             onClick={() => { setMergeModal({ category: cat }); setMergeTargetName(''); }}
//                                             className="flex items-center gap-0.5 text-[9px] bg-purple-600 text-white px-1 py-0.5 rounded hover:bg-purple-700"
//                                         >
//                                             <Merge size={9} /> Merge
//                                         </button>
//                                         <button onClick={() => clearSelection(cat)} className="text-purple-400 hover:text-purple-700">
//                                             <X size={11} />
//                                         </button>
//                                     </div>
//                                 )}

//                                 {/* Add feature */}
//                                 <button
//                                     onClick={e => {
//                                         e.stopPropagation();
//                                         setAddingIn(cat);
//                                         setNewFeatName('');
//                                         setCollapsed(prev => ({ ...prev, [cat]: false }));
//                                     }}
//                                     className="ml-0.5 text-[#104a7a] hover:bg-blue-100 rounded p-0.5 flex-shrink-0"
//                                     title="Add feature"
//                                 >
//                                     <Plus size={12} />
//                                 </button>
//                             </div>

//                             {/* ── Feature List ─────────────────────────────────────────── */}
//                             {!isCollapsed && (
//                                 <div className={`transition-colors ${isTargeted ? 'bg-blue-50/30' : ''}`}>

//                                     {/* Inline add row */}
//                                     {addingIn === cat && (
//                                         <div className="flex items-center gap-1.5 pl-8 pr-3 py-1.5 bg-blue-50 border-b border-blue-100">
//                                             <input
//                                                 autoFocus
//                                                 type="text"
//                                                 value={newFeatName}
//                                                 onChange={e => setNewFeatName(e.target.value)}
//                                                 onKeyDown={e => {
//                                                     if (e.key === 'Enter') handleAddFeature(cat);
//                                                     if (e.key === 'Escape') setAddingIn(null);
//                                                 }}
//                                                 placeholder="Feature name… Enter to save, Esc to cancel"
//                                                 className="flex-1 text-[11px] border border-[#bcd] px-2 py-0.5 rounded-sm focus:outline-none focus:border-[#104a7a]"
//                                             />
//                                             <button onClick={() => handleAddFeature(cat)} disabled={!newFeatName.trim()} className="text-green-600 hover:text-green-800 disabled:text-gray-300">
//                                                 <Check size={13} />
//                                             </button>
//                                             <button onClick={() => setAddingIn(null)} className="text-slate-400 hover:text-slate-600">
//                                                 <X size={13} />
//                                             </button>
//                                         </div>
//                                     )}

//                                     {/* Feature rows */}
//                                     {features.map((feat, idx) => {
//                                         const isDropHere = isTargeted && dragOverIndex === idx;
//                                         const isRenaming = renamingId === feat.id;
//                                         const isSelected = sel.has(feat.id);
//                                         const isDraggingThis = draggingId === feat.id;

//                                         return (
//                                             <React.Fragment key={feat.id}>
//                                                 {/* Drop line above */}
//                                                 {isDropHere && (
//                                                     <div className="h-[2px] mx-2 bg-blue-400 rounded-full" />
//                                                 )}

//                                                 <div
//                                                     draggable
//                                                     onDragStart={onDragStart(feat.id, cat, idx)}
//                                                     onDragEnd={onDragEnd}
//                                                     onDragOver={onFeatureDragOver(cat, idx)}
//                                                     onDrop={onDrop(cat, idx)}
//                                                     className={`group flex items-center gap-1.5 pl-2 pr-3 py-[5px] border-b border-[#f2f2f2]
//                             cursor-grab active:cursor-grabbing select-none transition-colors
//                             ${isDraggingThis ? 'opacity-30 bg-slate-50' : ''}
//                             ${isSelected && !isDraggingThis ? 'bg-purple-50' : ''}
//                             ${!isSelected && !isDraggingThis ? 'hover:bg-[#f5f8fc]' : ''}
//                           `}
//                                                 >
//                                                     {/* Grip */}
//                                                     <GripVertical size={11} className="text-slate-300 group-hover:text-slate-400 flex-shrink-0" />

//                                                     {/* Serial number — always use idx+1 for display */}
//                                                     <span className="text-[9px] text-slate-400 tabular-nums w-4 text-right flex-shrink-0">
//                                                         {idx + 1}.
//                                                     </span>

//                                                     {/* Checkbox */}
//                                                     <input
//                                                         type="checkbox"
//                                                         checked={isSelected}
//                                                         onChange={() => toggleSelect(cat, feat.id)}
//                                                         onClick={e => e.stopPropagation()}
//                                                         className="cursor-pointer flex-shrink-0 accent-purple-600 w-3 h-3"
//                                                     />

//                                                     {/* Name / rename input */}
//                                                     {isRenaming ? (
//                                                         <input
//                                                             autoFocus
//                                                             type="text"
//                                                             value={renameValue}
//                                                             onChange={e => setRenameValue(e.target.value)}
//                                                             onKeyDown={e => {
//                                                                 if (e.key === 'Enter') handleRename(feat.id);
//                                                                 if (e.key === 'Escape') setRenamingId(null);
//                                                             }}
//                                                             onClick={e => e.stopPropagation()}
//                                                             className="flex-1 text-[11px] border border-[#104a7a] px-1.5 py-0.5 rounded-sm focus:outline-none"
//                                                         />
//                                                     ) : (
//                                                         <span className="flex-1 text-[11px] font-medium text-slate-700 truncate">
//                                                             {feat.name}
//                                                         </span>
//                                                     )}

//                                                     {/* Merged badge */}
//                                                     {feat.isMerged && !isRenaming && (
//                                                         <span className="flex items-center gap-0.5 bg-purple-100 text-purple-700 text-[8px] px-1 py-0.5 rounded border border-purple-200 font-semibold flex-shrink-0">
//                                                             Merged
//                                                             <button
//                                                                 onClick={e => { e.stopPropagation(); handleUnmerge(feat.id); }}
//                                                                 title="Unmerge"
//                                                                 className="ml-0.5 text-orange-500 hover:text-orange-700"
//                                                             >
//                                                                 <Undo2 size={8} />
//                                                             </button>
//                                                         </span>
//                                                     )}

//                                                     {/* Edit / confirm rename — visible on hover or during rename */}
//                                                     <div className={`flex items-center gap-0.5 flex-shrink-0 transition-opacity ${isRenaming ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
//                                                         {isRenaming ? (
//                                                             <>
//                                                                 <button onClick={() => handleRename(feat.id)} disabled={!renameValue.trim()} className="text-green-600 hover:text-green-800 disabled:text-gray-300 p-0.5">
//                                                                     <Check size={12} />
//                                                                 </button>
//                                                                 <button onClick={() => setRenamingId(null)} className="text-slate-400 hover:text-slate-600 p-0.5">
//                                                                     <X size={12} />
//                                                                 </button>
//                                                             </>
//                                                         ) : (
//                                                             <button
//                                                                 onClick={e => {
//                                                                     e.stopPropagation();
//                                                                     setRenamingId(feat.id);
//                                                                     setRenameValue(feat.name);
//                                                                 }}
//                                                                 className="text-slate-300 hover:text-blue-600 p-0.5 hover:bg-blue-50 rounded"
//                                                                 title="Rename"
//                                                             >
//                                                                 <Edit2 size={11} />
//                                                             </button>
//                                                         )}
//                                                     </div>
//                                                 </div>
//                                             </React.Fragment>
//                                         );
//                                     })}

//                                     {/* Bottom drop zone */}
//                                     <div
//                                         className={`flex items-center justify-center transition-all
//                       ${isTargeted && (dragOverIndex === null || dragOverIndex >= features.length)
//                                                 ? 'h-8 bg-blue-100 border-2 border-dashed border-blue-300 mx-2 my-1 rounded text-[10px] text-blue-500 font-medium'
//                                                 : features.length === 0
//                                                     ? 'h-8 border border-dashed border-[#ddd] mx-2 my-1.5 rounded text-[10px] text-slate-300 italic'
//                                                     : 'h-3'
//                                             }`}
//                                         onDragOver={onFeatureDragOver(cat, features.length)}
//                                         onDrop={onDrop(cat, features.length)}
//                                     >
//                                         {features.length === 0 && !isTargeted && 'No features — click + to add'}
//                                         {isTargeted && (dragOverIndex === null || dragOverIndex >= features.length) && '↓ Drop here'}
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     );
//                 })}
//             </div>

//             {/* ── Merge Modal ──────────────────────────────────────────────────── */}
//             {mergeModal && (
//                 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
//                     <div className="bg-white rounded-lg shadow-xl w-[360px] overflow-hidden">
//                         <div className="bg-purple-700 text-white px-4 py-2.5 font-medium flex justify-between items-center text-sm">
//                             <span className="flex items-center gap-2"><Merge size={13} /> Merge Features</span>
//                             <button onClick={() => setMergeModal(null)} className="text-white/70 hover:text-white"><X size={15} /></button>
//                         </div>
//                         <div className="p-4 space-y-3">
//                             <div className="bg-purple-50 p-2.5 rounded border border-purple-100 text-xs text-purple-800">
//                                 Merging <strong>{getSelection(mergeModal.category).size}</strong> features from <strong>{mergeModal.category}</strong>
//                             </div>
//                             <div className="flex flex-wrap gap-1">
//                                 {[...getSelection(mergeModal.category)].map(id => {
//                                     const feat = (localMaster[mergeModal.category] ?? []).find(f => f.id === id);
//                                     return feat ? (
//                                         <span key={id} className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded border border-purple-200">
//                                             {feat.name}
//                                         </span>
//                                     ) : null;
//                                 })}
//                             </div>
//                             <div>
//                                 <label className="block text-xs font-medium text-slate-700 mb-1">Merged Feature Name</label>
//                                 <input
//                                     type="text"
//                                     value={mergeTargetName}
//                                     onChange={e => setMergeTargetName(e.target.value)}
//                                     onKeyDown={e => { if (e.key === 'Enter') handleMerge(mergeModal.category); }}
//                                     placeholder="e.g. Combined Headlamps"
//                                     autoFocus
//                                     className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"
//                                 />
//                             </div>
//                             <div className="flex justify-end gap-2">
//                                 <button onClick={() => setMergeModal(null)} className="px-3 py-1.5 border border-gray-300 rounded text-xs text-slate-700 hover:bg-gray-50">Cancel</button>
//                                 <button
//                                     onClick={() => handleMerge(mergeModal.category)}
//                                     disabled={!mergeTargetName.trim()}
//                                     className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-1"
//                                 >
//                                     <Merge size={11} /> Merge
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default FeatureMasterSection;

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Merge, Undo2, GripVertical, X, Check, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import {
    addFeatureMaster,
    renameFeatureMaster,
    deleteFeatureMaster,
    mergeFeatureMaster,
    unmergeFeatureMaster,
    reorderFeatures,
    moveFeatureCategory,
} from '../services/api';

interface Feature {
    id: string;
    name: string;
    sort_order?: number;
    isMerged?: boolean;
}

interface Props {
    featuresMaster: Record<string, Feature[]>;
    onRefresh: () => void;
    showToast: (type: 'success' | 'error', msg: string) => void;
}

interface DragPayload {
    featureId: string;
    sourceCategory: string;
    sourceIndex: number;
}

// Canonical display order — duplicates/typos from DB handled by normalizing
const CATEGORY_ORDER = [
    'Transmission',
    'Fuel',
    'Brake', 'Brakes',
    'Dimension', 'Dimensions',
    'Engine',
    'Suspension', 'Suspensions',
    'Tyre', 'Tyres',
    'Exterior',
    'Interior',
    'Safety',
    'Infotainment', 'Infotainemt',
    'Comfort and Convenience',
    'Audio and Entertainment',
    'Connected Car Technology',
];

const sortCategories = (cats: string[]): string[] => {
    const ordered = CATEGORY_ORDER.filter(c => cats.includes(c));
    const rest = cats.filter(c => !CATEGORY_ORDER.includes(c));
    return [...ordered, ...rest];
};

const FeatureMasterSection: React.FC<Props> = ({ featuresMaster, onRefresh, showToast }) => {
    const [localMaster, setLocalMaster] = useState<Record<string, Feature[]>>(featuresMaster);

    // Default: ALL collapsed
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        Object.keys(featuresMaster).forEach(cat => { init[cat] = true; });
        return init;
    });

    const [selections, setSelections] = useState<Record<string, Set<string>>>({});
    const [mergeModal, setMergeModal] = useState<{ category: string } | null>(null);
    const [mergeTargetName, setMergeTargetName] = useState('');
    const [addingIn, setAddingIn] = useState<string | null>(null);
    const [newFeatName, setNewFeatName] = useState('');
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    const dragPayload = useRef<DragPayload | null>(null);
    const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [sourceCategory, setSourceCategory] = useState<string | null>(null); // track which cat is being dragged from

    const scrollRef = useRef<HTMLDivElement>(null);
    const autoScrollFrame = useRef<number | null>(null);

    useEffect(() => {
        setLocalMaster(featuresMaster);
        // Sync new categories as collapsed
        setCollapsed(prev => {
            const next = { ...prev };
            Object.keys(featuresMaster).forEach(cat => {
                if (next[cat] === undefined) next[cat] = true;
            });
            return next;
        });
    }, [featuresMaster]);

    const categories = sortCategories(Object.keys(localMaster));

    const getSelection = (cat: string) => selections[cat] ?? new Set<string>();
    const clearSelection = (cat: string) =>
        setSelections(prev => ({ ...prev, [cat]: new Set() }));
    const toggleSelect = (cat: string, id: string) => {
        setSelections(prev => {
            const s = new Set(prev[cat] ?? []);
            s.has(id) ? s.delete(id) : s.add(id);
            return { ...prev, [cat]: s };
        });
    };

    // Toggle one category; close all others
    const openOnly = (cat: string) => {
        setCollapsed(prev => {
            const next: Record<string, boolean> = {};
            Object.keys(prev).forEach(k => { next[k] = true; }); // close all
            next[cat] = !prev[cat]; // toggle clicked one
            return next;
        });
    };

    // Auto-scroll during drag
    const handleAutoScroll = (e: React.DragEvent) => {
        const el = scrollRef.current;
        if (!el) return;
        if (autoScrollFrame.current) cancelAnimationFrame(autoScrollFrame.current);
        const rect = el.getBoundingClientRect();
        const ZONE = 60, SPEED = 8;
        const scroll = () => {
            const distTop = e.clientY - rect.top;
            const distBot = rect.bottom - e.clientY;
            if (distTop < ZONE) el.scrollTop -= SPEED * (1 - distTop / ZONE);
            else if (distBot < ZONE) el.scrollTop += SPEED * (1 - distBot / ZONE);
        };
        scroll();
        autoScrollFrame.current = requestAnimationFrame(scroll);
    };

    // ── Drag ──────────────────────────────────────────────────────────────────
    const onDragStart = (featureId: string, srcCat: string, srcIdx: number) =>
        (e: React.DragEvent) => {
            dragPayload.current = { featureId, sourceCategory: srcCat, sourceIndex: srcIdx };
            e.dataTransfer.effectAllowed = 'move';
            setDraggingId(featureId);
            setSourceCategory(srcCat);

            // Close all categories EXCEPT the source one
            setCollapsed(prev => {
                const next: Record<string, boolean> = {};
                Object.keys(prev).forEach(k => { next[k] = k !== srcCat; });
                return next;
            });
        };

    const onDragEnd = () => {
        setDraggingId(null);
        setSourceCategory(null);
        setDragOverCategory(null);
        setDragOverIndex(null);
        if (autoScrollFrame.current) cancelAnimationFrame(autoScrollFrame.current);
    };

    const onHeaderDragOver = (cat: string) => (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDragOverCategory(cat);
        setDragOverIndex(null);
        // Auto-expand target category when hovering its header
        setCollapsed(prev => {
            if (!prev[cat]) return prev; // already open, no re-render needed
            const next = { ...prev };
            // Close source, open target
            Object.keys(next).forEach(k => { next[k] = true; });
            if (sourceCategory) next[sourceCategory] = false; // keep source open so user sees what they dragged
            next[cat] = false;
            return next;
        });
        handleAutoScroll(e);
    };

    const onFeatureDragOver = (cat: string, idx: number) => (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setDragOverCategory(cat);
        setDragOverIndex(idx);
        handleAutoScroll(e);
    };

    const executeDrop = async (targetCategory: string, targetIndex: number) => {
        const payload = dragPayload.current;
        setDragOverCategory(null);
        setDragOverIndex(null);
        setDraggingId(null);
        setSourceCategory(null);
        if (!payload) return;

        const { featureId, sourceCategory: srcCat, sourceIndex } = payload;
        dragPayload.current = null;

        // Re-open target category after drop
        setCollapsed(prev => ({ ...prev, [targetCategory]: false }));

        // Cross-category move
        if (srcCat !== targetCategory) {
            const srcList = [...(localMaster[srcCat] ?? [])];
            const [moved] = srcList.splice(sourceIndex, 1);
            const tgtList = [...(localMaster[targetCategory] ?? [])];
            const insertAt = targetIndex < 0 ? tgtList.length : targetIndex;
            tgtList.splice(insertAt, 0, moved);

            setLocalMaster(prev => ({ ...prev, [srcCat]: srcList, [targetCategory]: tgtList }));

            try {
                await moveFeatureCategory(featureId, targetCategory);
                await reorderFeatures(tgtList.map((f, i) => ({ id: f.id, sort_order: i })));
                showToast('success', `Moved to "${targetCategory}"`);
                onRefresh();
            } catch (err: any) {
                showToast('error', err.message || 'Move failed');
                onRefresh();
            }
            return;
        }

        // Same-category reorder
        if (sourceIndex === targetIndex) return;
        const list = [...(localMaster[srcCat] ?? [])];
        const [moved] = list.splice(sourceIndex, 1);
        const insertAt = targetIndex < 0 ? list.length : targetIndex;
        list.splice(insertAt, 0, moved);
        setLocalMaster(prev => ({ ...prev, [srcCat]: list }));

        try {
            await reorderFeatures(list.map((f, i) => ({ id: f.id, sort_order: i })));
            showToast('success', 'Order saved');
            onRefresh();
        } catch (err: any) {
            showToast('error', err.message || 'Reorder failed');
            onRefresh();
        }
    };

    const onDrop = (targetCategory: string, targetIndex: number) => (e: React.DragEvent) => {
        e.preventDefault();
        executeDrop(targetCategory, targetIndex);
    };

    // ── CRUD ─────────────────────────────────────────────────────────────────
    const handleAddFeature = async (cat: string) => {
        if (!newFeatName.trim()) return;
        try {
            await addFeatureMaster(newFeatName.trim(), cat);
            showToast('success', 'Feature added');
            setNewFeatName('');
            setAddingIn(null);
            onRefresh();
        } catch (err: any) {
            showToast('error', err.message || 'Failed to add');
        }
    };

    const handleRename = async (id: string) => {
        if (!renameValue.trim()) return;
        try {
            await renameFeatureMaster(id, renameValue.trim());
            showToast('success', 'Renamed');
            setRenamingId(null);
            onRefresh();
        } catch (err: any) {
            showToast('error', err.message || 'Rename failed');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
        try {
            await deleteFeatureMaster(id, `Deleted Feature: "${name}"`, name);
            showToast('success', 'Feature deleted');
            onRefresh();
        } catch (err: any) {
            showToast('error', err.message || 'Failed to delete');
        }
    };

    const handleMerge = async (cat: string) => {
        const ids = [...getSelection(cat)];
        if (ids.length < 2) { showToast('error', 'Select at least 2 features'); return; }
        if (!mergeTargetName.trim()) { showToast('error', 'Enter merged feature name'); return; }
        try {
            await mergeFeatureMaster(ids, mergeTargetName.trim(), cat);
            showToast('success', 'Features merged');
            setMergeModal(null);
            setMergeTargetName('');
            clearSelection(cat);
            onRefresh();
        } catch (err: any) {
            showToast('error', err.message || 'Merge failed');
        }
    };

    const handleUnmerge = async (id: string, name: string) => {
        try {
            await unmergeFeatureMaster(id, `Unmerged Feature: "${name}"`, name);
            showToast('success', 'Unmerged');
            onRefresh();
        } catch (err: any) {
            showToast('error', err.message || 'Unmerge failed');
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="bg-white border border-[#ccc] rounded-sm shadow-sm flex flex-col">
            {/* Header */}
            <div className="bg-[#e2e2e2] px-3 py-2 border-b border-[#bbb] flex items-center justify-between">
                <span className="font-bold text-black text-[13px]">2. Define Comparison Features</span>
                <span className="text-[10px] text-slate-400 italic">
                    Click to expand · Drag to reorder or move across categories
                </span>
            </div>

            {/* Scrollable accordion */}
            <div
                ref={scrollRef}
                className="overflow-y-auto divide-y divide-[#e8e8e8] custom-scrollbar"
                style={{ maxHeight: 420 }}
                onDragOver={handleAutoScroll}
            >
                {categories.map(cat => {
                    const features = localMaster[cat] ?? [];
                    const sel = getSelection(cat);
                    const selCount = sel.size;
                    const isCollapsed = collapsed[cat] !== false; // default true
                    const isTargeted = dragOverCategory === cat;
                    const isSource = sourceCategory === cat;

                    return (
                        <div key={cat}>
                            {/* ── Category Header ──────────────────────────────────────── */}
                            <div
                                className={`flex items-center gap-1.5 px-2.5 py-[7px] cursor-pointer select-none transition-all
                  ${isTargeted && !isSource
                                        ? 'bg-blue-100 border-l-[3px] border-blue-500'
                                        : isSource
                                            ? 'bg-amber-50 border-l-[3px] border-amber-400'
                                            : !isCollapsed
                                                ? 'bg-[#e8eef6] border-l-[3px] border-[#104a7a]'
                                                : 'bg-[#f2f5f8] hover:bg-[#e8eef4] border-l-[3px] border-transparent'
                                    }`}
                                onClick={() => openOnly(cat)}
                                onDragOver={onHeaderDragOver(cat)}
                                onDrop={onDrop(cat, -1)}
                            >
                                {/* Chevron */}
                                <span className="text-slate-400 flex-shrink-0">
                                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                                </span>

                                {/* Category name */}
                                <span className={`text-[11px] font-bold uppercase tracking-wide flex-1 truncate
                  ${!isCollapsed ? 'text-[#104a7a]' : 'text-slate-600'}`}>
                                    {cat}
                                </span>

                                {/* Add feature — right next to name */}
                                <button
                                    onClick={e => {
                                        e.stopPropagation();
                                        setAddingIn(cat);
                                        setNewFeatName('');
                                        // Open this category
                                        setCollapsed(prev => {
                                            const next: Record<string, boolean> = {};
                                            Object.keys(prev).forEach(k => { next[k] = true; });
                                            next[cat] = false;
                                            return next;
                                        });
                                    }}
                                    className="text-slate-600 hover:text-[#104a7a] hover:bg-blue-100 rounded p-0.5 flex-shrink-0 transition-colors"
                                    title={`Add feature to ${cat}`}
                                >
                                    <Plus size={12} />
                                </button>

                                {/* Drag drop hint */}
                                {draggingId && !isSource && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ml-0.5
                    ${isTargeted ? 'bg-blue-500 text-white' : 'bg-[#dde3ea] text-slate-400'}`}>
                                        {isTargeted ? '↓ drop' : 'drop here'}
                                    </span>
                                )}

                                {/* Count badge */}
                                <span className="text-[9px] text-slate-400 tabular-nums bg-white border border-[#ddd] px-1 py-0.5 rounded-sm flex-shrink-0 ml-0.5">
                                    {features.length}
                                </span>

                                {/* Merge bar */}
                                {selCount >= 2 && (
                                    <div className="flex items-center gap-1 ml-1" onClick={e => e.stopPropagation()}>
                                        <span className="text-[9px] text-purple-700 font-semibold">{selCount} sel</span>
                                        <button
                                            onClick={() => { setMergeModal({ category: cat }); setMergeTargetName(''); }}
                                            className="flex items-center gap-0.5 text-[9px] bg-purple-600 text-white px-1 py-0.5 rounded hover:bg-purple-700"
                                        >
                                            <Merge size={9} /> Merge
                                        </button>
                                        <button onClick={() => clearSelection(cat)} className="text-purple-400 hover:text-purple-700">
                                            <X size={11} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* ── Feature List ─────────────────────────────────────────── */}
                            {!isCollapsed && (
                                <div className={`transition-colors ${isTargeted ? 'bg-blue-50/30' : 'bg-white'}`}>

                                    {/* Inline add row */}
                                    {addingIn === cat && (
                                        <div className="flex items-center gap-1.5 pl-7 pr-3 py-1.5 bg-blue-50 border-b border-blue-100">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={newFeatName}
                                                onChange={e => setNewFeatName(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleAddFeature(cat);
                                                    if (e.key === 'Escape') setAddingIn(null);
                                                }}
                                                placeholder="Feature name… Enter to save, Esc to cancel"
                                                className="flex-1 text-[11px] border border-[#bcd] px-2 py-0.5 rounded-sm focus:outline-none focus:border-[#104a7a]"
                                            />
                                            <button onClick={() => handleAddFeature(cat)} disabled={!newFeatName.trim()} className="text-green-600 hover:text-green-800 disabled:text-gray-300">
                                                <Check size={13} />
                                            </button>
                                            <button onClick={() => setAddingIn(null)} className="text-slate-400 hover:text-slate-600">
                                                <X size={13} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Feature rows */}
                                    {features.map((feat, idx) => {
                                        const isDropHere = isTargeted && dragOverIndex === idx;
                                        const isRenaming = renamingId === feat.id;
                                        const isSelected = sel.has(feat.id);
                                        const isDraggingThis = draggingId === feat.id;

                                        return (
                                            <React.Fragment key={feat.id}>
                                                {isDropHere && (
                                                    <div className="h-[2px] mx-2 bg-blue-400 rounded-full" />
                                                )}
                                                <div
                                                    draggable
                                                    onDragStart={onDragStart(feat.id, cat, idx)}
                                                    onDragEnd={onDragEnd}
                                                    onDragOver={onFeatureDragOver(cat, idx)}
                                                    onDrop={onDrop(cat, idx)}
                                                    className={`group flex items-center gap-1.5 pl-2 pr-3 py-[5px] border-b border-[#f2f2f2]
                            cursor-grab active:cursor-grabbing select-none transition-colors
                            ${isDraggingThis ? 'opacity-30 bg-slate-50' : ''}
                            ${isSelected && !isDraggingThis ? 'bg-purple-50' : ''}
                            ${!isSelected && !isDraggingThis ? 'hover:bg-[#f5f8fc]' : ''}
                          `}
                                                >
                                                    <GripVertical size={11} className="text-slate-300 group-hover:text-slate-400 flex-shrink-0" />

                                                    {/* Serial number */}
                                                    <span className="text-[9px] text-slate-400 tabular-nums w-4 text-right flex-shrink-0">
                                                        {idx + 1}.
                                                    </span>

                                                    {/* Checkbox */}
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(cat, feat.id)}
                                                        onClick={e => e.stopPropagation()}
                                                        className="cursor-pointer flex-shrink-0 accent-purple-600 w-3 h-3"
                                                    />

                                                    {/* Name / rename */}
                                                    {isRenaming ? (
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={renameValue}
                                                            onChange={e => setRenameValue(e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') handleRename(feat.id);
                                                                if (e.key === 'Escape') setRenamingId(null);
                                                            }}
                                                            onClick={e => e.stopPropagation()}
                                                            className="flex-1 text-[11px] border border-[#104a7a] px-1.5 py-0.5 rounded-sm focus:outline-none"
                                                        />
                                                    ) : (
                                                        <span className="flex-1 text-[11px] font-medium text-slate-700 truncate">
                                                            {feat.name}
                                                        </span>
                                                    )}

                                                    {/* Merged badge */}
                                                    {feat.isMerged && !isRenaming && (
                                                        <span className="flex items-center gap-0.5 bg-purple-100 text-purple-700 text-[8px] px-1 py-0.5 rounded border border-purple-200 font-semibold flex-shrink-0">
                                                            Merged
                                                            <button
                                                                onClick={e => { e.stopPropagation(); handleUnmerge(feat.id, feat.name); }}
                                                                title="Unmerge"
                                                                className="ml-0.5 text-orange-500 hover:text-orange-700"
                                                            >
                                                                <Undo2 size={8} />
                                                            </button>
                                                        </span>
                                                    )}

                                                    {/* Edit / confirm */}
                                                    <div className={`flex items-center gap-0.5 flex-shrink-0 transition-opacity
                            ${isRenaming ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                                                        {isRenaming ? (
                                                            <>
                                                                <button onClick={() => handleRename(feat.id)} disabled={!renameValue.trim()} className="text-green-600 hover:text-green-800 disabled:text-gray-300 p-0.5">
                                                                    <Check size={12} />
                                                                </button>
                                                                <button onClick={() => setRenamingId(null)} className="text-slate-400 hover:text-slate-600 p-0.5">
                                                                    <X size={12} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        setRenamingId(feat.id);
                                                                        setRenameValue(feat.name);
                                                                    }}
                                                                    className="text-slate-500 hover:text-blue-600 p-0.5 hover:bg-blue-50 rounded"
                                                                    title="Rename"
                                                                >
                                                                    <Edit2 size={11} />
                                                                </button>
                                                                <button
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        handleDelete(feat.id, feat.name);
                                                                    }}
                                                                    className="text-slate-500 hover:text-red-600 p-0.5 hover:bg-red-50 rounded ml-0.5"
                                                                    title="Delete Feature"
                                                                >
                                                                    <Trash2 size={11} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}

                                    {/* Bottom drop zone */}
                                    <div
                                        className={`flex items-center justify-center transition-all
                      ${isTargeted && (dragOverIndex === null || dragOverIndex >= features.length)
                                                ? 'h-8 bg-blue-100 border-2 border-dashed border-blue-300 mx-2 my-1 rounded text-[10px] text-blue-500 font-medium'
                                                : features.length === 0
                                                    ? 'h-8 border border-dashed border-[#ddd] mx-2 my-1.5 rounded text-[10px] text-slate-300 italic'
                                                    : 'h-2'
                                            }`}
                                        onDragOver={onFeatureDragOver(cat, features.length)}
                                        onDrop={onDrop(cat, features.length)}
                                    >
                                        {features.length === 0 && !isTargeted && 'No features — click + to add'}
                                        {isTargeted && (dragOverIndex === null || dragOverIndex >= features.length) && '↓ Drop here'}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Merge Modal */}
            {mergeModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl w-[360px] overflow-hidden">
                        <div className="bg-purple-700 text-white px-4 py-2.5 font-medium flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2"><Merge size={13} /> Merge Features</span>
                            <button onClick={() => setMergeModal(null)} className="text-white/70 hover:text-white"><X size={15} /></button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="bg-purple-50 p-2.5 rounded border border-purple-100 text-xs text-purple-800">
                                Merging <strong>{getSelection(mergeModal.category).size}</strong> features from <strong>{mergeModal.category}</strong>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {[...getSelection(mergeModal.category)].map(id => {
                                    const feat = (localMaster[mergeModal.category] ?? []).find(f => f.id === id);
                                    return feat ? (
                                        <span key={id} className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded border border-purple-200">
                                            {feat.name}
                                        </span>
                                    ) : null;
                                })}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Merged Feature Name</label>
                                <input
                                    type="text"
                                    value={mergeTargetName}
                                    onChange={e => setMergeTargetName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleMerge(mergeModal.category); }}
                                    placeholder="e.g. Combined Headlamps"
                                    autoFocus
                                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setMergeModal(null)} className="px-3 py-1.5 border border-gray-300 rounded text-xs text-slate-700 hover:bg-gray-50">Cancel</button>
                                <button
                                    onClick={() => handleMerge(mergeModal.category)}
                                    disabled={!mergeTargetName.trim()}
                                    className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-1"
                                >
                                    <Merge size={11} /> Merge
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeatureMasterSection;
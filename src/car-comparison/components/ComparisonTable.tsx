// import React, { useMemo, useState, useEffect, useCallback } from 'react';
// import { ChevronDown, ChevronUp, AlertCircle, Download, Plus, Minus, Loader2, Edit2, Trash2, Check, X, Save, PlusCircle, Undo2, Filter, Info, Search, GripVertical } from 'lucide-react';
// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
// import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
// import { renameFeatureMaster, moveFeatureMaster, deleteFeatureMaster } from '../services/api';

// import { ComparisonResponse, FeatureGroup, GroupedFeature, VariantPriceData, PriceDetail } from '../types';

// interface ComparisonTableProps {
//   data: ComparisonResponse | null;
//   selections: any[];
//   onAddPlanFeature?: (planId: string, feature: any) => void;
//   onUpdatePlanFeature?: (planId: string, featureName: string, category: string, updates: { value?: string, cost_delta?: number, price_delta?: number, is_deleted?: boolean }) => void;
//   onDeletePlanFeature?: (planId: string, featureName: string) => void;
//   onRenamePlan?: (planId: string, newName: string) => void;
//   onDeletePlan?: (planId: string) => void;
//   onFinalizePlan?: (planId: string) => void;
//   onPlanNewModel?: (variantName: string) => void;
//   onRefresh?: () => Promise<void>;
// }

// const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
//   if (!highlight || !highlight.trim()) {
//     return <>{text}</>;
//   }
//   // Escape special regex characters
//   const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
//   const regex = new RegExp(`(${escapedHighlight})`, 'gi');

//   const parts = text.split(regex);
//   return (
//     <>
//       {parts.map((part, i) =>
//         regex.test(part) ? <span key={i} className="bg-yellow-300 text-slate-900 font-bold rounded-sm px-0.5">{part}</span> : part
//       )}
//     </>
//   );
// };

// const DroppableCategoryHeader = ({ group, isOpen, showDiffOnly, toggleGroup, gridColsStyle, children }: any) => {
//   const { isOver, setNodeRef } = useDroppable({
//     id: `category__${group.groupName}`,
//     data: {
//       category: group.groupName
//     }
//   });

//   return (
//     <div
//       ref={setNodeRef}
//       onClick={() => !(showDiffOnly && !group.hasDifferences) && toggleGroup(group.groupName)}
//       className={`grid sticky top-[33px] z-30 border-b border-slate-100 transition-all duration-200 ${isOver
//         ? 'bg-gradient-to-r from-indigo-100 to-sky-100 border-indigo-400 shadow-md ring-2 ring-indigo-500/30 text-indigo-900 scale-[1.002]'
//         : showDiffOnly && !group.hasDifferences
//           ? 'bg-slate-50 text-slate-400 cursor-default'
//           : 'bg-sky-50 hover:bg-sky-100 text-slate-900 cursor-pointer'
//         }`}
//       style={gridColsStyle}
//     >
//       {children}
//     </div>
//   );
// };

// const DraggableFeatureRow = ({ item, group, rowBg, gridColsStyle, children }: any) => {
//   const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
//     id: `feature__${item.feature_id}`,
//     data: {
//       feature_id: item.feature_id,
//       feature_name: item.featureName,
//       category: group.groupName
//     },
//     disabled: !item.feature_id
//   });

//   const style: React.CSSProperties = {
//     transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
//     opacity: isDragging ? 0.5 : 1,
//     zIndex: isDragging ? 60 : undefined,
//     position: 'relative',
//   };

//   return (
//     <div
//       ref={setNodeRef}
//       className={`grid transition-all duration-200 border-b border-slate-300 ${rowBg} ${isDragging ? 'shadow-lg border-indigo-300 bg-indigo-50/30' : ''}`}
//       style={{ ...gridColsStyle, ...style }}
//       {...attributes}
//     >
//       {React.Children.map(children, child => {
//         if (React.isValidElement(child) && (child.props as any).isRowHeader) {
//           return React.cloneElement(child as React.ReactElement<any>, { dragListeners: listeners });
//         }
//         return child;
//       })}
//     </div>
//   );
// };

// const RowHeaderCell = ({
//   item,
//   group,
//   isBrand,
//   isCar,
//   isVar,
//   isDate,
//   isPriceRow,
//   searchTerm,
//   dragListeners,
//   editingMasterFeatureId,
//   setEditingMasterFeatureId,
//   editingMasterFeatureName,
//   setEditingMasterFeatureName,
//   onRefresh
// }: any) => {
//   const [isHovered, setIsHovered] = useState(false);
//   const isEditing = editingMasterFeatureId === item.feature_id && item.feature_id;

//   const handleRenameSave = async () => {
//     if (!editingMasterFeatureName.trim()) return;
//     try {
//       await renameFeatureMaster(item.feature_id, editingMasterFeatureName.trim());
//       setEditingMasterFeatureId(null);
//       if (onRefresh) await onRefresh();
//     } catch (err) {
//       console.error(err);
//       alert(err instanceof Error ? err.message : 'Failed to rename feature');
//     }
//   };

//   // const handleDeleteClick = async () => {
//   //   if (!window.confirm(`Are you sure you want to delete "${item.featureName}" from the master list? This will remove it across all models.`)) {
//   //     return;
//   //   }
//   //   try {
//   //     await deleteFeatureMaster(item.feature_id);
//   //     if (onRefresh) await onRefresh();
//   //   } catch (err) {
//   //     console.error(err);
//   //     alert(err instanceof Error ? err.message : 'Failed to delete feature');
//   //   }
//   // };

//   return (
//     <div
//       className={`p-1 pl-2 pr-2 text-[10px] font-medium border-r border-slate-300 flex items-center justify-start text-left gap-1.5 relative group/header-cell min-h-[32px] ${isBrand || isCar || isVar || isDate ? 'text-blue-900 font-bold' : 'text-slate-700'
//         }`}
//       onMouseEnter={() => setIsHovered(true)}
//       onMouseLeave={() => setIsHovered(false)}
//     >
//       {/* 1. Drag Grip Handle */}
//       {item.feature_id && !isBrand && !isCar && !isVar && !isDate && !isPriceRow ? (
//         <button
//           className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
//           title="Drag to move category"
//           {...dragListeners}
//         >
//           <GripVertical size={12} />
//         </button>
//       ) : (
//         <div className="w-5 shrink-0" />
//       )}

//       {/* 2. Item Numbering */}
//       <span className="text-slate-500 inline-block min-w-[20px] text-right shrink-0">
//         {(group as any).originalGroupIndex + 1}.{(item as any).originalItemIndex + 1}
//       </span>

//       {/* 3. Feature Name (Editable inline) */}
//       <div className="flex-1 min-w-0 pr-12">
//         {isEditing ? (
//           <input
//             type="text"
//             value={editingMasterFeatureName}
//             onChange={(e) => setEditingMasterFeatureName(e.target.value)}
//             onBlur={handleRenameSave}
//             onKeyDown={(e) => {
//               if (e.key === 'Enter') handleRenameSave();
//               else if (e.key === 'Escape') setEditingMasterFeatureId(null);
//             }}
//             className="w-full bg-white border-2 border-indigo-500 rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-900 outline-none shadow-sm focus:ring-1 focus:ring-indigo-300"
//             autoFocus
//             onClick={(e) => e.stopPropagation()}
//           />
//         ) : (
//           <span
//             className={`block truncate ${isBrand || isCar || isVar || isDate ? 'uppercase tracking-tight text-[9px]' : ''
//               } ${item.feature_id ? 'cursor-pointer hover:text-indigo-600 hover:underline decoration-indigo-400/50' : ''}`}
//             onDoubleClick={() => {
//               if (item.feature_id && !isBrand && !isCar && !isVar && !isDate && !isPriceRow) {
//                 setEditingMasterFeatureId(item.feature_id);
//                 setEditingMasterFeatureName(item.featureName);
//               }
//             }}
//             title={item.feature_id ? "Double-click to rename master feature" : undefined}
//           >
//             <HighlightText text={item.featureName} highlight={searchTerm} />
//           </span>
//         )}
//       </div>

//       {/* 4. Action Buttons (Rename / Delete) */}
//       {item.feature_id && !isBrand && !isCar && !isVar && !isDate && !isPriceRow && !isEditing && isHovered && (
//         <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center bg-slate-50/90 pl-1 py-0.5 rounded shadow-sm border border-slate-200/50 gap-0.5 z-10">
//           <button
//             onClick={() => {
//               setEditingMasterFeatureId(item.feature_id);
//               setEditingMasterFeatureName(item.featureName);
//             }}
//             className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
//             title="Rename master feature"
//           >
//             <Edit2 size={10} />
//           </button>
//           {/* <button
//             onClick={handleDeleteClick}
//             className="p-1 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition-colors"
//             title="Delete master feature"
//           >
//             <Trash2 size={10} />
//           </button> */}
//         </div>
//       )}
//     </div>
//   );
// };

// const ComparisonTable: React.FC<ComparisonTableProps> = ({
//   data,
//   selections,
//   onAddPlanFeature,
//   onUpdatePlanFeature,
//   onDeletePlanFeature,
//   onRenamePlan,
//   onDeletePlan,
//   onFinalizePlan,
//   onPlanNewModel,
//   onRefresh
// }) => {
//   const [editingMasterFeatureId, setEditingMasterFeatureId] = useState<string | null>(null);
//   const [editingMasterFeatureName, setEditingMasterFeatureName] = useState<string>('');
//   const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
//   const [showDiffOnly, setShowDiffOnly] = useState(false);
//   const [expandAll, setExpandAll] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [hiddenVehicles, setHiddenVehicles] = useState<Set<number>>(new Set());
//   const [isEditingEnabled, setIsEditingEnabled] = useState(false);
//   const [draftRows, setDraftRows] = useState<Record<string, { name: string, value: string, cost: number, price: number, afterFeature?: string }>>({});
//   const [editingPlanName, setEditingPlanName] = useState<{ id: string, name: string } | null>(null);
//   const [isFeatureFilterOpen, setIsFeatureFilterOpen] = useState(false);
//   const [hiddenFeatures, setHiddenFeatures] = useState<Set<string>>(new Set());
//   const [filterPanelSearch, setFilterPanelSearch] = useState('');
//   const [activeBreakdown, setActiveBreakdown] = useState<{ planId: string, variant: string, type: 'cost' | 'price', items: any[], total: number } | null>(null);

//   // States for Column Resizing
//   const [featureWidth, setFeatureWidth] = useState<number>(160);
//   const [widths, setWidths] = useState<Record<string, number>>({});
//   const [hasResizedFeature, setHasResizedFeature] = useState(false);

//   // Helper variables for column widths computed at top of component
//   const resizeVariants = useMemo(() => data?.columns.slice(1) || [], [data]);
//   const resizeVisibleVariants = useMemo(() => resizeVariants.filter((_, idx) => !hiddenVehicles.has(idx)), [resizeVariants, hiddenVehicles]);

//   const getColWidthAtTop = useCallback(() => {
//     const count = resizeVisibleVariants.length;
//     if (count <= 2) return 300;
//     if (count <= 3) return 260;
//     if (count <= 4) return 220;
//     if (count <= 5) return 190;
//     if (count <= 6) return 160;
//     if (count <= 8) return 140;
//     if (count <= 10) return 120;
//     if (count <= 13) return 110;
//     return 100;
//   }, [resizeVisibleVariants.length]);

//   const defaultColWidthAtTop = getColWidthAtTop();

//   // Sync initial feature width if it hasn't been manually resized
//   const initialFeatureWidth = useMemo(() => {
//     return resizeVisibleVariants.length <= 3 ? 200 : 160;
//   }, [resizeVisibleVariants.length]);

//   useEffect(() => {
//     if (!hasResizedFeature) {
//       setFeatureWidth(initialFeatureWidth);
//     }
//   }, [initialFeatureWidth, hasResizedFeature]);

//   // Drag-to-resize mouse handler
//   const handleMouseDown = useCallback((e: React.MouseEvent, colKey: string) => {
//     e.preventDefault();
//     e.stopPropagation();

//     const startX = e.clientX;
//     const startWidth = colKey === 'feature' ? featureWidth : (widths[colKey] ?? defaultColWidthAtTop);

//     const handleMouseMove = (moveEvent: MouseEvent) => {
//       const deltaX = moveEvent.clientX - startX;
//       const newWidth = Math.max(60, startWidth + deltaX);

//       if (colKey === 'feature') {
//         setFeatureWidth(newWidth);
//         setHasResizedFeature(true);
//       } else {
//         setWidths(prev => ({
//           ...prev,
//           [colKey]: newWidth
//         }));
//       }
//     };

//     const handleMouseUp = () => {
//       document.removeEventListener('mousemove', handleMouseMove);
//       document.removeEventListener('mouseup', handleMouseUp);
//     };

//     document.addEventListener('mousemove', handleMouseMove);
//     document.addEventListener('mouseup', handleMouseUp);
//   }, [featureWidth, widths, defaultColWidthAtTop]);
//   const handleDragEnd = async (event: any) => {
//     const { active, over } = event;
//     if (!over) return;

//     const activeIdStr = String(active.id);
//     const overIdStr = String(over.id);

//     if (activeIdStr.startsWith('feature__') && overIdStr.startsWith('category__')) {
//       const featureId = activeIdStr.replace('feature__', '');
//       const targetCategory = overIdStr.replace('category__', '');
//       const sourceCategory = active.data.current?.category;

//       if (sourceCategory === targetCategory) return;

//       try {
//         await moveFeatureMaster(featureId, targetCategory);
//         if (onRefresh) await onRefresh();
//       } catch (err) {
//         console.error(err);
//         alert(err instanceof Error ? err.message : 'Failed to move feature');
//       }
//     }
//   };

//   // Debounced input component for plan features
//   const PlanFeatureInput = ({ planId, featureName, category, initialValue, onUpdate, isNewFeature, baselineValue, isDeleted, originalValue }: any) => {
//     const [value, setValue] = useState(initialValue);
//     const [isSyncing, setIsSyncing] = useState(false);
//     const [lastSyncedValue, setLastSyncedValue] = useState(initialValue);

//     useEffect(() => {
//       setValue(initialValue);
//       setLastSyncedValue(initialValue);
//     }, [initialValue]);

//     const handleSync = useCallback(() => {
//       if (value === lastSyncedValue) return;
//       setIsSyncing(true);
//       onUpdate(planId, featureName, category, { value })
//         .then(() => {
//           setLastSyncedValue(value);
//           setIsSyncing(false);
//         })
//         .catch(() => setIsSyncing(false));
//     }, [value, planId, featureName, category, onUpdate, lastSyncedValue]);

//     useEffect(() => {
//       if (value === lastSyncedValue) return;

//       const timer = setTimeout(() => {
//         handleSync();
//       }, 5000);

//       return () => clearTimeout(timer);
//     }, [value, lastSyncedValue, handleSync]);

//     const handleKeyDown = (e: React.KeyboardEvent) => {
//       if (e.key === 'Enter') {
//         handleSync();
//       }
//     };

//     // Edited if current value differs from original_value (from plan_features table)
//     const isEdited = originalValue !== undefined && originalValue !== null && value !== originalValue;

//     return (
//       <div className="flex items-center gap-1 w-full min-w-0">
//         <input
//           value={value}
//           onChange={(e) => setValue(e.target.value)}
//           onKeyDown={handleKeyDown}
//           placeholder="Enter value..."
//           disabled={isDeleted}
//           className={`text-[10px] px-1.5 py-0.5 rounded border border-transparent hover:border-indigo-300 focus:border-indigo-500 focus:bg-white outline-none transition-all flex-1 min-w-0 font-medium ${isDeleted ? 'bg-slate-100 text-slate-400 line-through cursor-not-allowed' :
//             !value ? 'bg-orange-50 text-orange-600 italic placeholder:text-orange-300 border-dashed border-orange-200' : 'bg-indigo-50/30'
//             }`}
//         />
//         {isSyncing && (
//           <div className="animate-spin h-2 w-2 border border-indigo-500 border-t-transparent rounded-full shrink-0" />
//         )}
//         <div className="flex gap-0.5 shrink-0">
//           {isNewFeature && (
//             <span className="text-[6px] font-black uppercase tracking-wider px-1 py-0.5 bg-emerald-100 text-emerald-700 rounded-sm">Added</span>
//           )}
//           {isEdited && !isDeleted && (
//             <span className="text-[6px] font-black uppercase tracking-wider px-1 py-0.5 bg-blue-100 text-blue-700 rounded-sm">Edited</span>
//           )}
//           {isDeleted && (
//             <span className="text-[6px] font-black uppercase tracking-wider px-1 py-0.5 bg-red-100 text-red-700 rounded-sm">Deleted</span>
//           )}
//         </div>
//       </div>
//     );
//   };


//   const renderDraftRow = (draftKey: string, draft: any, category: string, planId: string, variant: string, itemIdx: number, totalItems: number) => {
//     const proposedNum = draft.afterFeature === '__TOP__' ? 1 : itemIdx + 2;

//     return (
//       <div key={`draft-${draftKey}`} className="grid bg-emerald-50/50 border-b border-slate-300" style={gridColsStyle}>
//         {/* Feature Name Input */}
//         <div className="p-2 pl-6 pr-2 border-r border-slate-300 flex items-start gap-1.5">
//           <span className="text-emerald-500 inline-block min-w-[30px] text-right font-bold text-[10px]">
//             {(displayGroups.find(g => g.groupName === category) as any)?.originalGroupIndex + 1}.{proposedNum}
//           </span>
//           <div className="flex-1">
//             <input
//               autoFocus
//               placeholder="Feature Name..."
//               value={draft.name}
//               onChange={(e) => setDraftRows(prev => ({
//                 ...prev,
//                 [draftKey]: { ...draft, name: e.target.value }
//               }))}
//               className="w-full bg-white border border-emerald-200 rounded px-2 py-1 text-[10px] font-bold outline-none focus:ring-1 focus:ring-emerald-500"
//             />
//           </div>
//         </div>

//         {/* Columns */}
//         {variants.map((v2, vIdx2) => {
//           if (hiddenVehicles.has(vIdx2)) return null;
//           const isThisPlan = v2 === variant;

//           return (
//             <div key={vIdx2} className="p-2 border-l border-slate-300 relative">
//               {isThisPlan ? (
//                 <div className="space-y-2">
//                   <input
//                     placeholder="Value..."
//                     value={draft.value}
//                     onChange={(e) => setDraftRows(prev => ({
//                       ...prev,
//                       [draftKey]: { ...draft, value: e.target.value }
//                     }))}
//                     className="w-full bg-white border border-emerald-200 rounded px-2 py-1 text-[10px] font-bold outline-none focus:ring-1 focus:ring-emerald-500"
//                   />
//                   <div className="grid grid-cols-2 gap-1">
//                     <div className="flex flex-col">
//                       <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Cost</span>
//                       <input
//                         type="number"
//                         value={draft.cost}
//                         onChange={(e) => setDraftRows(prev => ({
//                           ...prev,
//                           [draftKey]: { ...draft, cost: Number(e.target.value) }
//                         }))}
//                         className="w-full bg-white border border-emerald-200 rounded px-1.5 py-0.5 text-[9px] font-bold"
//                       />
//                     </div>
//                     <div className="flex flex-col">
//                       <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Price</span>
//                       <input
//                         type="number"
//                         value={draft.price}
//                         onChange={(e) => setDraftRows(prev => ({
//                           ...prev,
//                           [draftKey]: { ...draft, price: Number(e.target.value) }
//                         }))}
//                         className="w-full bg-white border border-emerald-200 rounded px-1.5 py-0.5 text-[9px] font-bold"
//                       />
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2 mt-1">
//                     <button
//                       onClick={() => {
//                         if (draft.name && draft.value) {
//                           onAddPlanFeature?.(planId, {
//                             feature_name: draft.name,
//                             category: category,
//                             value: draft.value,
//                             cost_delta: draft.cost,
//                             price_delta: draft.price,
//                             after_feature: draft.afterFeature === '__TOP__' ? undefined : draft.afterFeature
//                           });
//                           setDraftRows(prev => {
//                             const next = { ...prev };
//                             delete next[draftKey];
//                             return next;
//                           });
//                         } else {
//                           alert("Please enter both Feature Name and Value");
//                         }
//                       }}
//                       className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors flex items-center justify-center shadow-sm"
//                       title="Add Feature"
//                     >
//                       <Check size={14} />
//                     </button>
//                     <button
//                       onClick={() => setDraftRows(prev => {
//                         const next = { ...prev };
//                         delete next[draftKey];
//                         return next;
//                       })}
//                       className="p-1 bg-white text-slate-400 hover:text-red-500 rounded border border-slate-200 transition-colors shadow-sm"
//                       title="Cancel"
//                     >
//                       <X size={14} />
//                     </button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="h-full flex items-center justify-center text-slate-300 text-[8px] italic">
//                   -
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     );
//   };


//   // Mock Edit Handler
//   const handleEditClick = (featureName: string, variant: string, currentValue: string) => {
//     // TODO: Replace with actual API call
//     console.log(`[MOCK API] Edit requested for Feature: "${featureName}", Variant: "${variant}", Current Value: "${currentValue}"`);
//     alert(`Edit Feature: ${featureName}
// Variant: ${variant}
// Current Value: ${currentValue}

// (Backend functionality under construction)`);
//   };

//   const NO_INFO = 'No information Available';

//   const groups: FeatureGroup[] = useMemo(() => {
//     if (!data) return [];
//     // ... feature group items ...
//     const groupMap: Record<string, GroupedFeature[]> = {};
//     const priceGroup: GroupedFeature[] = [];
//     const additionalGroup: GroupedFeature[] = [];

//     const variants = data.columns.slice(1);

//     data.data.forEach((row: any) => {
//       const featureText = row.feature;
//       const ftLower = featureText.trim().toLowerCase();
//       const category = row.category || 'Additional Features';

//       const values: { [key: string]: any } = {};
//       const isPriceRow = ftLower === 'price value';

//       variants.forEach((v) => {
//         const val = row[v];

//         if (isPriceRow && typeof val === 'object' && val !== null && 'pricing' in val) {
//           values[v] = val;
//         } else if (val && typeof val === 'object') {
//           // This is our new sub_variant_values map
//           values[v] = val;
//         } else if (typeof val === 'string') {
//           values[v] = val && val.trim() !== '' ? val : NO_INFO;
//         } else {
//           values[v] = NO_INFO;
//         }
//       });

//       const hasAnyInfo = Object.values(values).some((val) => {
//         if (typeof val === 'object' && val !== null) {
//           if ('pricing' in val) return true;
//           return Object.values(val as object).some(v => v && String(v).trim() !== '' && v !== NO_INFO);
//         }
//         return val !== NO_INFO;
//       });

//       if (!hasAnyInfo) return;

//       if (isPriceRow || ftLower.startsWith('variant launched')) {
//         priceGroup.push({
//           featureName: featureText,
//           values,
//           feature_id: row.feature_id,
//           is_deleted: row.is_deleted,
//           original_values: row.original_values,
//           cost_deltas: row.cost_deltas,
//           price_deltas: row.price_deltas,
//           plan_feature_ids: row.plan_feature_ids,
//           tags: row.tags
//         });
//         return;
//       }

//       if (category && category !== 'Additional Features') {
//         if (!groupMap[category]) groupMap[category] = [];
//         let featureName = featureText;
//         if (featureName.startsWith(`${category} - `)) {
//           featureName = featureName.substring(category.length + 3);
//         }
//         groupMap[category].push({
//           featureName,
//           values,
//           feature_id: row.feature_id,
//           is_deleted: row.is_deleted,
//           original_values: row.original_values,
//           cost_deltas: row.cost_deltas,
//           price_deltas: row.price_deltas,
//           plan_feature_ids: row.plan_feature_ids,
//           tags: row.tags
//         });
//       } else {
//         additionalGroup.push({
//           featureName: featureText,
//           values,
//           feature_id: row.feature_id,
//           is_deleted: row.is_deleted,
//           original_values: row.original_values,
//           cost_deltas: row.cost_deltas,
//           price_deltas: row.price_deltas,
//           plan_feature_ids: row.plan_feature_ids,
//           tags: row.tags
//         });
//       }
//     });

//     const result: FeatureGroup[] = [];
//     if (priceGroup.length > 0) result.push({ groupName: 'Price & Basic Info', items: priceGroup, hasDifferences: true });

//     Object.keys(groupMap).forEach((key) => {
//       const items = groupMap[key];
//       const hasDifferences = items.some(item => {
//         const variantValues = variants.map(v => {
//           const val = item.values[v];
//           return typeof val === 'object' ? JSON.stringify(val) : val;
//         });
//         const nonNoInfoValues = variantValues.filter(v => v !== NO_INFO);
//         const uniqueVals = new Set(nonNoInfoValues);
//         return uniqueVals.size > 1;
//       });

//       result.push({ groupName: key, items, hasDifferences });
//     });

//     if (additionalGroup.length > 0) {
//       const hasDifferences = additionalGroup.some(item => {
//         const variantValues = variants.map(v => {
//           const val = item.values[v];
//           return typeof val === 'object' ? JSON.stringify(val) : val;
//         });
//         const nonNoInfoValues = variantValues.filter(v => v !== NO_INFO);
//         const uniqueVals = new Set(nonNoInfoValues);
//         return uniqueVals.size > 1;
//       });
//       result.push({ groupName: 'Additional Features', items: additionalGroup, hasDifferences });
//     }

//     const CATEGORY_ORDER = [
//       'Price & Basic Info',
//       'Transmission',
//       'Fuel',
//       'Brake', 'Brakes',
//       'Dimension', 'Dimensions',
//       'Engine',
//       'Suspension', 'Suspensions',
//       'Tyre', 'Tyres',
//       'Exterior',
//       'Interior',
//       'Safety',
//       'Infotainment', 'Infotainemt',
//       'Comfort and Convenience',
//       'Audio and Entertainment',
//       'Connected Car Technology'
//     ];

//     result.sort((a, b) => {
//       const getIndex = (name: string) => {
//         const lowerName = name.toLowerCase();
//         // Check for exact match or includes to be safe, but exact is better for order list
//         const idx = CATEGORY_ORDER.findIndex(cat =>
//           cat.toLowerCase() === lowerName || lowerName.includes(cat.toLowerCase())
//         );
//         return idx === -1 ? 999 : idx;
//       };

//       const idxA = getIndex(a.groupName);
//       const idxB = getIndex(b.groupName);

//       return idxA - idxB;
//     });

//     return result;
//   }, [data]);

//   // Add original indices to groups and items for numbering retention
//   const groupsWithIndices = useMemo(() => {
//     return groups.map((group, groupIdx) => ({
//       ...group,
//       originalGroupIndex: groupIdx,
//       items: group.items.map((item, itemIdx) => ({
//         ...item,
//         originalItemIndex: itemIdx
//       }))
//     }));
//   }, [groups]);

//   // Filter groups based on search term and hidden vehicles
//   const filteredGroups = useMemo(() => {
//     if (!data) return [];
//     const variants = data.columns.slice(1);

//     // If no search and no hidden vehicles and no hidden features, return original groups
//     if (!searchTerm.trim() && hiddenVehicles.size === 0 && hiddenFeatures.size === 0) return groupsWithIndices;

//     const lowerTerm = searchTerm.toLowerCase();

//     return groupsWithIndices.map(group => {
//       let filteredItems = group.items;

//       // 0. Filter hidden features
//       if (hiddenFeatures.size > 0) {
//         filteredItems = filteredItems.filter(item => !hiddenFeatures.has(`${group.groupName}__${item.featureName}`));
//       }

//       // 1. Search Filter
//       if (searchTerm.trim()) {
//         const groupMatches = group.groupName.toLowerCase().includes(lowerTerm);
//         if (!groupMatches) {
//           filteredItems = group.items.filter(item =>
//             item.featureName.toLowerCase().includes(lowerTerm)
//           );
//         }
//       }

//       if (filteredItems.length === 0) return null;

//       // 2. Recalculate hasDifferences for the subset of items AND visible columns
//       const hasDifferences = filteredItems.some(item => {
//         const variantValues = variants
//           .filter((_, idx) => !hiddenVehicles.has(idx))
//           .map(v => item.values[v]);

//         const nonNoInfoValues = variantValues.filter(v => v !== NO_INFO);
//         const uniqueVals = new Set(nonNoInfoValues);
//         return uniqueVals.size > 1;
//       });

//       return { ...group, items: filteredItems, hasDifferences };
//     }).filter(Boolean) as any[];
//   }, [groupsWithIndices, searchTerm, data, hiddenVehicles, hiddenFeatures]);

//   // Apply "Differs Only" filter to groups and items
//   const displayGroups = useMemo(() => {
//     return filteredGroups.map(group => {
//       let items = group.items;
//       if (showDiffOnly) {
//         items = items.filter((item: any) => {
//           const variantValues = data!.columns.slice(1)
//             .filter((_, idx) => !hiddenVehicles.has(idx))
//             .map(v => item.values[v]);
//           const nonNoInfoValues = variantValues.filter(v => v !== NO_INFO);
//           const uniqueVals = new Set(nonNoInfoValues);
//           return uniqueVals.size > 1;
//         });
//       }
//       if (items.length === 0) return null;
//       return { ...group, items };
//     }).filter(Boolean) as any[];
//   }, [filteredGroups, showDiffOnly, data, hiddenVehicles]);

//   // When search is active, default to expanded view
//   useEffect(() => {
//     if (searchTerm) {
//       setExpandAll(true);
//     }
//   }, [searchTerm]);

//   // Only initialize new groups, don't overwrite existing ones on data refresh
//   useEffect(() => {
//     setOpenGroups(prev => {
//       const next = { ...prev };
//       let changed = false;
//       displayGroups.forEach(g => {
//         if (next[g.groupName] === undefined) {
//           next[g.groupName] = expandAll;
//           changed = true;
//         }
//       });
//       return changed ? next : prev;
//     });
//   }, [displayGroups]);

//   // Master toggle for expandAll
//   useEffect(() => {
//     const s: Record<string, boolean> = {};
//     displayGroups.forEach(g => s[g.groupName] = expandAll);
//     setOpenGroups(s);
//   }, [expandAll]);

//   const toggleGroup = (groupName: string) =>
//     setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));

//   const [isExporting, setIsExporting] = useState(false);

//   const exportToExcel = async () => {
//     if (!data) return;

//     setIsExporting(true);

//     try {
//       const wb = new ExcelJS.Workbook();
//       const ws = wb.addWorksheet('Comparison');
//       const variants = data.columns.slice(1);
//       const exportVariants = variants.filter((_, idx) => !hiddenVehicles.has(idx));

//       // --- Setup Columns ---
//       // Category + Feature + 1 column per visible variant
//       const columns = [
//         { header: 'Category', key: 'category', width: 25 },
//         { header: 'Feature', key: 'feature', width: 40 },
//         ...exportVariants.map(v => {
//           const selection = selections.find(s => s.variant === v || (s.plan_id && v.includes(s.variant)));
//           const isPlan = !!selection?.plan_id;

//           let headerText = `${isPlan ? '[PLAN] ' : ''}${v}`;

//           // Add Delta Cost/Price to header for plans
//           if (isPlan && data) {
//             let totalDelta = 0;
//             let totalPriceDelta = 0;
//             data.data.forEach(row => {
//               if (!row.is_deleted?.[v]) {
//                 totalDelta += Number(row.cost_deltas?.[v] || 0);
//                 totalPriceDelta += Number(row.price_deltas?.[v] || 0);
//               }
//             });
//             headerText += ` (C: ${totalDelta > 0 ? '+' : ''}${totalDelta.toLocaleString()}, P: ${totalPriceDelta > 0 ? '+' : ''}${totalPriceDelta.toLocaleString()})`;
//           }

//           return { header: headerText, key: v, width: 35 };
//         })
//       ];
//       ws.columns = columns;

//       // Add Auto-Filter
//       ws.autoFilter = {
//         from: { row: 1, column: 1 },
//         to: { row: 1, column: columns.length }
//       };

//       // --- Style Header Row ---
//       const headerRow = ws.getRow(1);
//       headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
//       headerRow.eachCell((cell) => {
//         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
//         cell.alignment = { horizontal: 'center', vertical: 'middle' };
//         cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
//       });

//       // --- Add Data ---
//       // Navigate through groups (use original 'groups' but apply filters)

//       const categoryOrder = [
//         'Price & Basic Info', 'Brake', 'Dimension', 'Engine', 'Fuel', 'Transmission',
//         'Suspension', 'Tyre', 'Exterior', 'Interior', 'Safety', 'Infotainment',
//         'Comfort', 'Audio', 'Connected'
//       ]; // Simplified logic for sorting if needed, but 'groups' is already sorted?
//       // Actually 'groups' variable is sorted in useMemo. We use 'groupsWithIndices' to get original indices.

//       let currentRowIndex = 2; // Start after header

//       groupsWithIndices.forEach((group: any) => {
//         // Filter logic identical to UI
//         const itemsToExport = group.items.filter((item: any) => {
//           const isPriceRow = item.featureName.toLowerCase().trim() === 'price value';
//           // Check diff on VISIBLE columns
//           const visibleValues = variants
//             .map((v, i) => !hiddenVehicles.has(i) ? item.values[v] : null)
//             .filter(v => v !== null) as string[];
//           const nonNoInfoValues = visibleValues.filter(v => v !== NO_INFO);
//           const uniqueVals = new Set(nonNoInfoValues);
//           const isDifferent = uniqueVals.size > 1;

//           if (showDiffOnly && !isDifferent && !isPriceRow) return false;

//           // Search filter
//           if (searchTerm.trim()) {
//             const lowerTerm = searchTerm.toLowerCase();
//             const groupMatches = group.groupName.toLowerCase().includes(lowerTerm);
//             if (!groupMatches && !item.featureName.toLowerCase().includes(lowerTerm)) {
//               return false;
//             }
//           }

//           return true;
//         });

//         if (itemsToExport.length === 0 && (showDiffOnly || searchTerm.trim())) return;

//         // Group Header Row
//         const groupLabel = `${group.originalGroupIndex + 1}. ${group.groupName}`;
//         const groupHeaderRow = ws.addRow([
//           groupLabel,
//           '',
//           ...Array(exportVariants.length).fill('')
//         ]);
//         groupHeaderRow.font = { bold: true };
//         groupHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } }; // Sky-50
//         groupHeaderRow.getCell(1).alignment = { horizontal: 'left' };

//         // Merge group header cells (across Category and Feature and variants)
//         ws.mergeCells(currentRowIndex, 1, currentRowIndex, exportVariants.length + 2);
//         currentRowIndex++;

//         itemsToExport.forEach((item: any) => {
//           const isPriceRow = item.featureName.toLowerCase().trim() === 'price value';

//           // Check diff (for coloring)
//           const visibleValues = variants
//             .map((v, i) => !hiddenVehicles.has(i) ? item.values[v] : null)
//             .filter(v => v !== null) as string[];

//           const nonNoInfoValues = visibleValues.filter(v => v !== NO_INFO);
//           const isDifferent = new Set(nonNoInfoValues).size > 1;

//           const rowData = [
//             groupLabel, // Use the SAME label as the header for consistent filtering
//             `${group.originalGroupIndex + 1}.${item.originalItemIndex + 1}  ${item.featureName}`
//           ];

//           exportVariants.forEach(v => {
//             const val = item.values[v];

//             if (val === NO_INFO || val === null || val === undefined) {
//               rowData.push(NO_INFO);
//               return;
//             }

//             // Handle complex pricing object
//             if (typeof val === 'object' && val !== null && 'pricing' in val) {
//               const prices = (val.pricing.prices || []).map((p: any) => {
//                 const label = [p.fuel_type, p.transmission_type].filter(Boolean).join(' ');
//                 return `${label ? label + ': ' : ''}₹${p.ex_showroom_price?.toLocaleString() || p.ex_showroom_price}`;
//               }).join('\n');
//               rowData.push(prices || (val.pricing.avg_price?.value ? '₹' + val.pricing.avg_price.value.toLocaleString() : NO_INFO));
//             }
//             // Handle objects (variant classes or pricing objects)
//             else if (typeof val === 'object' && val !== null) {
//               const extractPrice = (obj: any): string | null => {
//                 if (!obj || typeof obj !== 'object') return null;

//                 // Handle sub_variants structure (common for Price Value rows)
//                 if (obj.is_price_class && Array.isArray(obj.sub_variants)) {
//                   return obj.sub_variants.map((sv: any) => {
//                     const pricing = (sv.pricing || []).map((p: any) => {
//                       const label = [p.fuel_type, p.engine_type, p.transmission_type].filter(Boolean).join(' / ');
//                       const priceStr = `₹${p.ex_showroom_price?.toLocaleString() || p.ex_showroom_price}`;
//                       return `${label ? label + ': ' : ''}${priceStr}`;
//                     }).join(' | ');
//                     return `${sv.name}: ${pricing || 'No info'}`;
//                   }).join('\n');
//                 }

//                 if (obj.pricing?.avg_price?.display) return obj.pricing.avg_price.display;
//                 if (obj.pricing?.avg_price?.value) return `₹${obj.pricing.avg_price.value.toLocaleString()}`;
//                 if (obj.price_display) return obj.price_display;
//                 if (obj.ex_showroom_price) return `₹${obj.ex_showroom_price.toLocaleString()}`;
//                 if (obj.value && typeof obj.value === 'number') return `₹${obj.value.toLocaleString()}`;
//                 if (typeof obj.pricing === 'object' && obj.pricing?.prices?.[0]?.ex_showroom_price) {
//                   return `₹${obj.pricing.prices[0].ex_showroom_price.toLocaleString()}`;
//                 }
//                 return null;
//               };

//               // First try to extract price from the object itself (if it's a pricing object)
//               const directPrice = extractPrice(val);
//               if (directPrice && item.featureName.toLowerCase().includes('price')) {
//                 rowData.push(directPrice);
//               } else {
//                 // Otherwise, it might be a map of sub-variants (e.g. { Alpha: "Disc", Sigma: "Drum" })
//                 // or a map of sub-variants to pricing objects
//                 const uniqueVals = Array.from(new Set(
//                   Object.values(val as Record<string, any>)
//                     .map(lv => {
//                       const p = extractPrice(lv);
//                       if (p && item.featureName.toLowerCase().includes('price')) return p;
//                       if (typeof lv === 'object' && lv !== null) {
//                         return lv.name || lv.label || lv.variant_name || '';
//                       }
//                       return String(lv || '').trim();
//                     })
//                     .filter(lv => lv && lv.toLowerCase() !== 'no information available' && lv !== 'true' && lv !== 'false' && lv !== '[object object]')
//                 )).sort();
//                 rowData.push(uniqueVals.length > 0 ? uniqueVals.join(' | ') : NO_INFO);
//               }
//             }
//             else {
//               rowData.push(String(val));
//             }
//           });

//           const dataRow = ws.addRow(rowData);

//           // Row styling
//           if (isDifferent && !isPriceRow) {
//             // Amber-100
//             dataRow.eachCell({ includeEmpty: true }, (cell) => {
//               cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
//             });
//           }
//           if (isPriceRow) {
//             dataRow.font = { bold: true, color: { argb: 'FF15803D' } }; // Green text 
//             dataRow.eachCell((cell) => cell.alignment = { wrapText: true, vertical: 'top' });
//           }

//           // Borders
//           dataRow.eachCell({ includeEmpty: true }, (cell) => {
//             cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
//             if (!isPriceRow) cell.alignment = { wrapText: true, vertical: 'top' };
//           });

//           currentRowIndex++;
//         });

//         // Add spacer row?
//         // currentRowIndex++;
//       });

//       // Generate Filename
//       const variantNames = exportVariants.map(v => v.split(' - ').pop()).join('_vs_');
//       const filename = `Comparison_${variantNames}_${new Date().toISOString().split('T')[0]}.xlsx`;

//       const buffer = await wb.xlsx.writeBuffer();
//       saveAs(new Blob([buffer]), filename);
//     } catch (e) {
//       console.error(e);
//       alert("Export failed");
//     } finally {
//       setIsExporting(false);
//     }
//   };

//   if (!data) {
//     return (
//       <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-white rounded-xl border-2 border-dashed border-slate-200 p-10">
//         <div className="bg-blue-100 p-4 rounded-full mb-4">
//           <AlertCircle size={40} className="text-blue-500" />
//         </div>
//         <h3 className="text-lg font-semibold text-slate-800">No comparison generated yet</h3>
//         <p className="mt-2 text-center max-w-sm text-sm">
//           Please select vehicles from the left panel and click "Compare Now" to view detailed comparison.
//         </p>
//       </div>
//     );
//   }

//   const variants = data.columns.slice(1);

//   // Filter out hidden vehicles
//   const visibleVariants = variants.filter((_, idx) => !hiddenVehicles.has(idx));

//   const toggleVehicleVisibility = (index: number) => {
//     setHiddenVehicles(prev => {
//       const newSet = new Set(prev);
//       if (newSet.has(index)) {
//         newSet.delete(index);
//       } else {
//         // Don't allow hiding all vehicles
//         if (newSet.size < variants.length - 1) {
//           newSet.add(index);
//         } else {
//           alert('At least one vehicle must remain visible');
//         }
//       }
//       return newSet;
//     });
//   };

//   // Compute a flexible or fixed per-column width.
//   const getColWidth = () => {
//     const count = visibleVariants.length;
//     if (count <= 2) return 300;
//     if (count <= 3) return 260;
//     if (count <= 4) return 220;
//     if (count <= 5) return 190;
//     if (count <= 6) return 160;
//     if (count <= 8) return 140;
//     if (count <= 10) return 120;
//     if (count <= 13) return 110;
//     return 100;
//   };

//   const defaultColWidth = getColWidth();

//   const tableMinWidth = featureWidth + visibleVariants.reduce((sum, v) => sum + (widths[v] ?? defaultColWidth), 0);

//   // const gridColsStyle: React.CSSProperties = {
//   //   display: 'grid',
//   //   gridTemplateColumns: `${featureWidth}px ${visibleVariants.map(v => `${widths[v] ?? defaultColWidth}px`).join(' ')}`,
//   //   minWidth: `${tableMinWidth}px`,
//   //   width: '100%',
//   // };
//   const gridColsStyle: React.CSSProperties = {
//     display: 'grid',
//     gridTemplateColumns: `${featureWidth}px ${visibleVariants.map(v =>
//       widths[v] ? `${widths[v]}px` : '1fr'   // ← manually resized ho to px, warna 1fr
//     ).join(' ')}`,
//     minWidth: `${tableMinWidth}px`,
//     width: '100%',
//   };


//   const variantBg = (idx: number) => {
//     const colors = [
//       'bg-blue-600 text-white',
//       'bg-emerald-600 text-white',
//       'bg-violet-600 text-white',
//       'bg-orange-600 text-white',
//       'bg-sky-600 text-white'
//     ];
//     return colors[idx % colors.length];
//   };

//   const getFontSize = () => {
//     const count = visibleVariants.length;
//     if (count <= 3) return 'text-sm';
//     if (count <= 5) return 'text-xs';
//     if (count <= 8) return 'text-[11px]';
//     return 'text-[10px]';
//   };

//   const getHeaderFontSize = () => {
//     const count = visibleVariants.length;
//     if (count <= 3) return 'text-sm';
//     if (count <= 5) return 'text-xs';
//     if (count <= 8) return 'text-[11px]';
//     return 'text-[10px]';
//   };

//   return (
//     <DndContext onDragEnd={handleDragEnd}>
//       <div className="h-full flex flex-col bg-white">

//         <div className="flex-shrink-0 flex items-center justify-between gap-4 px-4 py-2 border-b bg-gradient-to-r from-slate-50 to-blue-50">
//           <div className="flex items-center gap-4">

//             <div className="hidden md:block h-6 w-px bg-slate-300" />

//             <div className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={showDiffOnly}
//                 onChange={() => setShowDiffOnly(prev => !prev)}
//                 className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
//               />
//               <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Differs only</span>
//             </div>

//             <div className="flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={expandAll}
//                 onChange={() => setExpandAll(prev => !prev)}
//                 className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
//               />
//               <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Expand all</span>
//             </div>

//             <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
//               <input
//                 type="checkbox"
//                 checked={false}
//                 disabled={true}
//                 className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-not-allowed"
//               />
//               <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Unofficial</span>
//             </div>


//             {/* Hidden Vehicles Dropdown */}
//             {hiddenVehicles.size > 0 && (
//               <div className="relative group">
//                 <button className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg border border-amber-300 text-xs font-semibold transition-colors">
//                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                     <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//                     <circle cx="12" cy="12" r="3"></circle>
//                     <line x1="1" y1="1" x2="23" y2="23"></line>
//                   </svg>
//                   <span>{hiddenVehicles.size} Hidden</span>
//                 </button>

//                 <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100]">
//                   <div className="flex justify-between items-center mb-2 px-2">
//                     <div className="text-xs font-bold text-slate-600">Hidden Vehicles</div>
//                     <button
//                       onClick={() => setHiddenVehicles(new Set())}
//                       className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-semibold transition-colors"
//                     >
//                       Clear All
//                     </button>
//                   </div>
//                   <div className="space-y-1">
//                     {variants.map((v, idx) => {
//                       if (!hiddenVehicles.has(idx)) return null;
//                       return (
//                         <button
//                           key={idx}
//                           onClick={() => toggleVehicleVisibility(idx)}
//                           className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center justify-between group/item"
//                         >
//                           <span className="truncate flex-1">
//                             {(() => {
//                               const selection = selections.find(s => s.variant === v || (s.plan_id && v.includes(s.variant)));
//                               return selection?.plan_id ? 'Plan' : 'Veh';
//                             })()} {idx + 1}: {v}
//                           </span>
//                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0 ml-2">
//                             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//                             <circle cx="12" cy="12" r="3"></circle>
//                           </svg>
//                         </button>
//                       );
//                     })}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           <button
//             onClick={exportToExcel}
//             className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
//             disabled={isExporting}
//           >
//             {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
//             <span className="text-sm">{isExporting ? 'Exporting...' : 'Download Excel'}</span>
//           </button>
//         </div>

//         <div
//           className="flex-1 overflow-auto w-full"
//           style={{ minWidth: 0 }}
//         >
//           <div style={{ minWidth: `${tableMinWidth}px`, width: '100%' }}>

//             <div className="grid border-b border-slate-200 sticky top-0 z-50 shadow-md backdrop-blur-md bg-white/90" style={gridColsStyle}>
//               <div className="p-3 font-bold uppercase tracking-wider text-[10px] md:text-xs flex items-center bg-gradient-to-br from-slate-800 to-slate-900 text-white border-r border-slate-700 shadow-inner relative group/resizer">
//                 <span className="opacity-90 flex-1">Comparison Feature</span>
//                 <div
//                   onMouseDown={(e) => handleMouseDown(e, 'feature')}
//                   onDoubleClick={() => {
//                     setFeatureWidth(visibleVariants.length <= 3 ? 200 : 160);
//                     setHasResizedFeature(false);
//                   }}
//                   className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/80 active:bg-blue-600 z-50 transition-colors"
//                   onClick={(e) => e.stopPropagation()}
//                   title="Drag to resize, double-click to reset"
//                 />
//                 <div className="relative" onMouseLeave={() => setIsFeatureFilterOpen(false)}>
//                   <button
//                     onClick={() => setIsFeatureFilterOpen(prev => !prev)}
//                     className={`p-1.5 rounded-full transition-colors ml-2 ${isFeatureFilterOpen || hiddenFeatures.size > 0 ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
//                     title="Filter Features"
//                   >
//                     <Filter size={14} />
//                   </button>

//                   {isFeatureFilterOpen && (
//                     <div className="absolute top-full left-0 mt-0 pt-2 w-64 bg-transparent z-[100] text-slate-800 flex flex-col font-normal max-h-[60vh]">
//                       <div className="bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
//                         <div className="p-2 border-b border-slate-100 flex flex-col gap-2 bg-slate-50">
//                           <div className="flex justify-between gap-2">
//                             <button
//                               onClick={() => setHiddenFeatures(new Set())}
//                               className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 font-semibold flex-1 transition-colors"
//                             >
//                               Select All
//                             </button>
//                             <button
//                               onClick={() => {
//                                 const allFeatures = new Set<string>();
//                                 groups.forEach(g => g.items.forEach(i => allFeatures.add(`${g.groupName}__${i.featureName}`)));
//                                 setHiddenFeatures(allFeatures);
//                               }}
//                               className="text-[10px] bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300 font-semibold flex-1 transition-colors"
//                             >
//                               Clear All
//                             </button>
//                           </div>
//                           <div className="relative">
//                             <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                             <input
//                               type="text"
//                               placeholder="Search features..."
//                               value={filterPanelSearch}
//                               onChange={(e) => setFilterPanelSearch(e.target.value)}
//                               className="w-full pl-7 pr-7 py-1.5 text-[11px] border border-slate-200 rounded-md bg-white outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 transition-all"
//                             />
//                             {filterPanelSearch && (
//                               <button
//                                 onClick={() => setFilterPanelSearch('')}
//                                 className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
//                                 title="Clear search"
//                               >
//                                 <X size={11} />
//                               </button>
//                             )}
//                           </div>
//                         </div>
//                         <div className="overflow-y-auto flex-1 p-3 space-y-4">
//                           {groups.map(group => {
//                             const groupKeyPrefix = `${group.groupName}__`;
//                             const groupItemKeys = group.items.map(i => `${groupKeyPrefix}${i.featureName}`);

//                             // Filter items by filterPanelSearch
//                             const lowerFilter = filterPanelSearch.toLowerCase();
//                             const filteredItems = filterPanelSearch.trim()
//                               ? group.items.filter(i =>
//                                 i.featureName.toLowerCase().includes(lowerFilter) ||
//                                 group.groupName.toLowerCase().includes(lowerFilter)
//                               )
//                               : group.items;

//                             // Hide entire group if no items match
//                             if (filteredItems.length === 0) return null;

//                             const filteredItemKeys = filteredItems.map(i => `${groupKeyPrefix}${i.featureName}`);
//                             const allHidden = filteredItemKeys.every(k => hiddenFeatures.has(k));
//                             const someHidden = filteredItemKeys.some(k => hiddenFeatures.has(k));

//                             return (
//                               <div key={group.groupName} className="flex flex-col gap-1.5">
//                                 <label className="flex items-center gap-2 cursor-pointer font-bold text-[11px] text-slate-800">
//                                   <input
//                                     type="checkbox"
//                                     checked={!allHidden}
//                                     ref={(el) => { if (el) el.indeterminate = someHidden && !allHidden; }}
//                                     onChange={(e) => {
//                                       const next = new Set(hiddenFeatures);
//                                       if (e.target.checked) {
//                                         filteredItemKeys.forEach(k => next.delete(k));
//                                       } else {
//                                         filteredItemKeys.forEach(k => next.add(k));
//                                       }
//                                       setHiddenFeatures(next);
//                                     }}
//                                     className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
//                                   />
//                                   {group.groupName}
//                                 </label>
//                                 <div className="pl-5 flex flex-col gap-1">
//                                   {filteredItems.map(item => {
//                                     const itemKey = `${groupKeyPrefix}${item.featureName}`;
//                                     const isHidden = hiddenFeatures.has(itemKey);
//                                     return (
//                                       <label key={itemKey} className="flex items-center gap-2 cursor-pointer text-[10px] text-slate-600 hover:text-slate-900">
//                                         <input
//                                           type="checkbox"
//                                           checked={!isHidden}
//                                           onChange={(e) => {
//                                             const next = new Set(hiddenFeatures);
//                                             if (e.target.checked) next.delete(itemKey);
//                                             else next.add(itemKey);
//                                             setHiddenFeatures(next);
//                                           }}
//                                           className="rounded border-slate-300 text-blue-500 focus:ring-blue-500 w-2.5 h-2.5 cursor-pointer"
//                                         />
//                                         <span className="truncate" title={item.featureName}>{item.featureName}</span>
//                                       </label>
//                                     );
//                                   })}
//                                 </div>
//                               </div>
//                             );
//                           })}
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {variants.map((v, idx) => {
//                 if (hiddenVehicles.has(idx)) return null;
//                 const selection = selections.find(s => s.variant === v || (s.plan_id && v.includes(s.variant)));
//                 const isPlan = selection?.plan_id ? true : false;
//                 const planId = selection?.plan_id;

//                 // Calculate delta for this plan column
//                 let totalDelta = 0;
//                 let totalPriceDelta = 0;
//                 const costItems: { category: string, featureName: string, amount: number }[] = [];
//                 const priceItems: { category: string, featureName: string, amount: number }[] = [];

//                 if (isPlan && data) {
//                   data.data.forEach(row => {
//                     if (!row.is_deleted?.[v]) {
//                       const costVal = Number(row.cost_deltas?.[v] || 0);
//                       const priceVal = Number(row.price_deltas?.[v] || 0);

//                       if (costVal !== 0) {
//                         totalDelta += costVal;
//                         const cat = row.category || 'General';
//                         let fName = row.feature;
//                         if (fName.startsWith(`${cat} - `)) {
//                           fName = fName.substring(cat.length + 3);
//                         }
//                         costItems.push({ category: cat, featureName: fName, amount: costVal });
//                       }

//                       if (priceVal !== 0) {
//                         totalPriceDelta += priceVal;
//                         const cat = row.category || 'General';
//                         let fName = row.feature;
//                         if (fName.startsWith(`${cat} - `)) {
//                           fName = fName.substring(cat.length + 3);
//                         }
//                         priceItems.push({ category: cat, featureName: fName, amount: priceVal });
//                       }
//                     }
//                   });
//                 }

//                 return (
//                   <div
//                     key={idx}
//                     className={`p-1.5 font-bold text-[11px] md:text-sm border-l border-white/20 flex flex-col items-start justify-center relative group ${isPlan ? 'bg-indigo-700 text-white' : variantBg(idx)} min-w-0`}
//                     title={v}
//                   >
//                     {/* Column Actions (Hide/Delete) */}
//                     <div className="absolute top-1 right-1 flex items-center gap-1 z-10">
//                       <button
//                         onClick={() => toggleVehicleVisibility(idx)}
//                         className="transition-all bg-black/10 hover:bg-black/30 rounded-full p-1 text-white shadow-sm"
//                         title="Hide this column"
//                       >
//                         <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
//                           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//                           <circle cx="12" cy="12" r="3"></circle>
//                           <line x1="1" y1="1" x2="23" y2="23"></line>
//                         </svg>
//                       </button>

//                       {isPlan && (
//                         <button
//                           onClick={() => onDeletePlan?.(planId!)}
//                           className="bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-full shadow-sm transition-all"
//                           title="Delete Plan Permanently"
//                         >
//                           <Trash2 size={10} />
//                         </button>
//                       )}
//                     </div>

//                     {/* Main Header Content */}
//                     <div className="flex flex-col w-full min-w-0 pr-6">
//                       <div className="flex items-center justify-between gap-2 w-full">
//                         <div className="flex items-center gap-1 min-w-0 font-bold">
//                           <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[7px] font-black shrink-0">{idx + 1}</span>
//                           {(() => {
//                             const currentEditing = editingPlanName;
//                             const isEditingThis = currentEditing !== null && currentEditing.id === planId;

//                             if (isEditingThis && currentEditing) {
//                               return (
//                                 <input
//                                   type="text"
//                                   value={currentEditing.name}
//                                   onChange={(e) => setEditingPlanName({ id: currentEditing.id, name: e.target.value })}
//                                   onBlur={() => {
//                                     if (currentEditing.name.trim() && currentEditing.name.trim() !== v) {
//                                       onRenamePlan?.(planId!, currentEditing.name.trim());
//                                     }
//                                     setEditingPlanName(null);
//                                   }}
//                                   onKeyDown={(e) => {
//                                     if (e.key === 'Enter') {
//                                       if (currentEditing.name.trim() && currentEditing.name.trim() !== v) {
//                                         onRenamePlan?.(planId!, currentEditing.name.trim());
//                                       }
//                                       setEditingPlanName(null);
//                                     } else if (e.key === 'Escape') {
//                                       setEditingPlanName(null);
//                                     }
//                                   }}
//                                   autoFocus
//                                   onClick={(e) => e.stopPropagation()}
//                                   className="bg-white text-slate-900 px-1 py-0.5 rounded text-[10px] font-bold outline-none ring-2 ring-indigo-500 w-full"
//                                 />
//                               );
//                             }

//                             return (
//                               <span
//                                 className={`truncate font-black text-[10px] md:text-xs leading-tight drop-shadow-sm ${isPlan ? 'cursor-text hover:underline decoration-white/40' : ''}`}
//                                 onClick={() => isPlan && setEditingPlanName({ id: planId!, name: v })}
//                               >
//                                 {isPlan && data?.base_variant_classes?.[v] ? `${v} (${data.base_variant_classes[v]})` : v}
//                               </span>
//                             );
//                           })()}
//                         </div>


//                         {isPlan && (
//                           <button
//                             onClick={() => onDeletePlan?.(planId!)}
//                             className="bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-full shadow-sm transition-all"
//                             title="Delete Plan Permanently"
//                           >
//                             <Trash2 size={10} />
//                           </button>
//                         )}  
//                       </div>

//                       {isPlan && (
//                         <div className="flex items-center gap-2 mt-0.5 pt-0.5 border-t border-white/10">
//                           <div className="relative group/breakdown">
//                             <span
//                               className={`text-[11px] font-black cursor-help hover:bg-white/10 rounded px-0.5 transition-colors ${totalDelta <= 0 ? 'text-emerald-300' : 'text-red-300'}`}
//                             >
//                               C: {totalDelta > 0 ? '+' : ''}₹{totalDelta.toLocaleString()}
//                             </span>

//                             {/* Cost Hover Breakdown */}
//                             <div className={`absolute top-full ${idx === 0 ? 'left-0' : idx === variants.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2'} mt-1 hidden group-hover/breakdown:block z-[100] w-64 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden text-slate-800 pointer-events-none`}>
//                               <div className="p-2 bg-indigo-600 text-white text-[10px] font-bold flex justify-between items-center">
//                                 <span>COST BREAKDOWN</span>
//                                 <span>TOTAL: ₹{totalDelta.toLocaleString()}</span>
//                               </div>
//                               <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
//                                 {costItems.length === 0 ? (
//                                   <div className="p-3 text-center text-[9px] text-slate-400 italic">No changes</div>
//                                 ) : costItems.map((item, i) => (
//                                   <div key={i} className="p-2 flex justify-between items-start gap-2 bg-white">
//                                     <div className="min-w-0">
//                                       <div className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">{item.category}</div>
//                                       <div className="text-[9px] font-semibold truncate max-w-[140px]">{item.featureName}</div>
//                                     </div>
//                                     <div className={`text-[9px] font-black ${item.amount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
//                                       {item.amount > 0 ? '+' : ''}₹{item.amount.toLocaleString()}
//                                     </div>
//                                   </div>
//                                 ))}
//                               </div>
//                             </div>
//                           </div>

//                           <div className="relative group/breakdown-p">
//                             <span
//                               className={`text-[11px] font-black cursor-help hover:bg-white/10 rounded px-0.5 transition-colors ${totalPriceDelta >= 0 ? 'text-emerald-300' : 'text-red-300'}`}
//                             >
//                               P: {totalPriceDelta > 0 ? '+' : ''}₹{totalPriceDelta.toLocaleString()}
//                             </span>

//                             {/* Price Hover Breakdown */}
//                             <div className={`absolute top-full ${idx === 0 ? 'left-0' : idx === variants.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2'} mt-1 hidden group-hover/breakdown-p:block z-[100] w-64 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden text-slate-800 pointer-events-none`}>
//                               <div className="p-2 bg-emerald-600 text-white text-[10px] font-bold flex justify-between items-center">
//                                 <span>PRICE BREAKDOWN</span>
//                                 <span>TOTAL: ₹{totalPriceDelta.toLocaleString()}</span>
//                               </div>
//                               <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
//                                 {priceItems.length === 0 ? (
//                                   <div className="p-3 text-center text-[9px] text-slate-400 italic">No changes</div>
//                                 ) : priceItems.map((item, i) => (
//                                   <div key={i} className="p-2 flex justify-between items-start gap-2 bg-white">
//                                     <div className="min-w-0">
//                                       <div className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">{item.category}</div>
//                                       <div className="text-[9px] font-semibold truncate max-w-[140px]">{item.featureName}</div>
//                                     </div>
//                                     <div className={`text-[9px] font-black ${item.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
//                                       {item.amount > 0 ? '+' : ''}₹{item.amount.toLocaleString()}
//                                     </div>
//                                   </div>
//                                 ))}
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                     {/* Variant column resizer handle */}
//                     <div
//                       onMouseDown={(e) => handleMouseDown(e, v)}
//                       onDoubleClick={() => {
//                         setWidths(prev => {
//                           const next = { ...prev };
//                           delete next[v];
//                           return next;
//                         });
//                       }}
//                       className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/80 active:bg-blue-600 z-50 transition-colors"
//                       onClick={(e) => e.stopPropagation()}
//                       title="Drag to resize, double-click to reset"
//                     />
//                   </div>
//                 );
//               })}
//             </div>

//             <div className="divide-y divide-slate-200">
//               {displayGroups.length === 0 ? (
//                 <div className="p-8 text-center text-slate-500">
//                   {searchTerm
//                     ? `No features match your search "${searchTerm}"${showDiffOnly ? ' (with differences)' : ''}`
//                     : (showDiffOnly ? "No differing features found across selected vehicles." : "No data available.")
//                   }
//                 </div>
//               ) : displayGroups.map((group, groupIdx) => {
//                 const isOpen = openGroups[group.groupName] ?? false;

//                 return (
//                   <div key={group.groupName} className="bg-white">

//                     <DroppableCategoryHeader
//                       group={group}
//                       isOpen={isOpen}
//                       showDiffOnly={showDiffOnly}
//                       toggleGroup={toggleGroup}
//                       gridColsStyle={gridColsStyle}
//                     >
//                       <div className="w-full flex items-center px-3 py-1.5 text-left border-r border-slate-200 justify-between group/cat">
//                         <span className="font-semibold flex items-center gap-2 text-[11px]">
//                           <span className="mr-1 text-blue-600">
//                             {isOpen && !(showDiffOnly && !group.hasDifferences) ? <Minus size={12} /> : <Plus size={12} />}
//                           </span>
//                           <span>{(group as any).originalGroupIndex + 1}. {group.groupName}</span>
//                           {showDiffOnly && !group.hasDifferences && (
//                             <span className="ml-2 text-[9px] font-medium bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
//                               No Differences
//                             </span>
//                           )}
//                         </span>

//                         {/* Add feature button next to category name - only shows if category is open and there's a plan, and NOT for Price category */}
//                         {isOpen && group.groupName !== 'Price & Basic Info' && variants.some((v, vIdx) => {
//                           const selection = selections.find(s => s.variant === v || (s.plan_id && v.includes(s.variant)));
//                           return selection?.plan_id ? true : false;
//                         }) && (
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 variants.forEach((v, vIdx) => {
//                                   const selection = selections.find(s => s.variant === v || (s.plan_id && v.includes(s.variant)));
//                                   if (selection?.plan_id) {
//                                     const planId = selection.plan_id;
//                                     const draftKey = `${group.groupName}__${planId}`;
//                                     setDraftRows(prev => ({
//                                       ...prev,
//                                       [draftKey]: { name: '', value: 'Standard', cost: 0, price: 0, afterFeature: '__TOP__', variant: v }
//                                     }));
//                                   }
//                                 });
//                               }}
//                               className="w-5 h-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-sm transition-all"
//                               title={`Add new feature to ${group.groupName}`}
//                             >
//                               <PlusCircle size={14} />
//                             </button>
//                           )}
//                       </div>

//                       {/* Category Header Planning Columns (Empty now as buttons moved) */}
//                       {variants.map((v, vIdx) => {
//                         if (hiddenVehicles.has(vIdx)) return null;
//                         return (
//                           <div key={vIdx} className="p-1 px-2 border-l border-slate-100 flex items-center justify-center relative">
//                             {/* Buttons removed from here */}
//                           </div>
//                         );
//                       })}
//                     </DroppableCategoryHeader>

//                     {isOpen && (
//                       <div>
//                         {/* TOP-LEVEL DRAFT ROWS (from category header) */}
//                         {variants.map((v, vIdx) => {
//                           if (hiddenVehicles.has(vIdx)) return null;
//                           const selection = selections.find(s => s.variant === v || (s.plan_id && v.includes(s.variant)));
//                           const planId = selection?.plan_id;
//                           if (!planId) return null;

//                           const draftKey = `${group.groupName}__${planId}`;
//                           const draft = draftRows[draftKey];
//                           if (!draft || draft.afterFeature !== '__TOP__') return null;

//                           return renderDraftRow(draftKey, draft, group.groupName, planId, v, -1, group.items.length);
//                         })}

//                         {group.items.map((item: any, idx: number) => {

//                           const ftLower = item.featureName.toLowerCase().trim();
//                           const isBrand = ftLower === 'brand';
//                           const isCar = ftLower === 'car';
//                           const isVar = ftLower === 'variant';
//                           const isDate = ftLower === 'variant launched';
//                           const isPriceRow = ftLower === 'price value';

//                           const variantValues = variants
//                             .filter((_, vIdx) => !hiddenVehicles.has(vIdx))
//                             .map(v => item.values[v]);

//                           const nonNoInfoValues = variantValues.filter(v => v !== NO_INFO);

//                           // Normalize values for comparison — extract UNIQUE leaf values for object maps.
//                           // Maruti variant classes have varying sub-variant counts per column (Alpha: 2, E: 3, etc.).
//                           // We must deduplicate leaf values so that {Disc, Disc} vs {Disc, Disc, Disc}
//                           // both normalize to just "disc" and are treated as equal.
//                           const normalizeForCompare = (val: any): string => {
//                             if (val === NO_INFO || val === null || val === undefined) return NO_INFO;
//                             if (typeof val === 'string') return val.trim().toLowerCase();
//                             if (typeof val === 'object') {
//                               // Get UNIQUE leaf values only (deduped + sorted) so count differences don't matter
//                               const uniqueLeaf = Array.from(new Set(
//                                 Object.values(val as Record<string, any>)
//                                   .map(lv => String(lv || '').trim().toLowerCase())
//                                   .filter(lv => lv && lv !== 'no information available')
//                               )).sort();
//                               return uniqueLeaf.length > 0 ? uniqueLeaf.join('|') : NO_INFO;
//                             }
//                             return String(val).trim().toLowerCase();
//                           };

//                           const uniqueVals = Array.from(new Set(nonNoInfoValues.map(normalizeForCompare)));

//                           // isValueDifferent: strictly for the yellow highlight — only when actual values differ
//                           const isValueDifferent = uniqueVals.length > 1;

//                           // isDifferent: for 'Differs only' filter — also includes plan rows so they remain visible
//                           const hasPlanInfo = variants.some(v => {
//                             const selection = selections.find(s => s.variant === v || (s.plan_id && v.includes(s.variant)));
//                             return selection?.plan_id && item.values[v] !== NO_INFO;
//                           });
//                           const isDifferent = isValueDifferent || hasPlanInfo;

//                           if (showDiffOnly && !isDifferent && !isPriceRow && !isBrand && !isCar && !isVar && !isDate) return null;

//                           // Custom row background based on type
//                           let rowBg = 'hover:bg-slate-50';
//                           if (isBrand) rowBg = 'bg-blue-50 hover:bg-blue-100/80';
//                           else if (isCar) rowBg = 'bg-indigo-50 hover:bg-indigo-100/80';
//                           else if (isVar) rowBg = 'bg-violet-50 hover:bg-violet-100/80';
//                           else if (isDate) rowBg = 'bg-emerald-50 hover:bg-emerald-100/80';
//                           else if (isPriceRow) rowBg = 'bg-slate-50';
//                           else if (isValueDifferent) rowBg = 'bg-amber-100 hover:bg-amber-300/80';

//                           return (
//                             <React.Fragment key={idx}>
//                               <DraggableFeatureRow item={item} group={group} rowBg={rowBg} gridColsStyle={gridColsStyle}>
//                                 <RowHeaderCell
//                                   item={item}
//                                   group={group}
//                                   isBrand={isBrand}
//                                   isCar={isCar}
//                                   isVar={isVar}
//                                   isDate={isDate}
//                                   isPriceRow={isPriceRow}
//                                   searchTerm={searchTerm}
//                                   editingMasterFeatureId={editingMasterFeatureId}
//                                   setEditingMasterFeatureId={setEditingMasterFeatureId}
//                                   editingMasterFeatureName={editingMasterFeatureName}
//                                   setEditingMasterFeatureName={setEditingMasterFeatureName}
//                                   onRefresh={onRefresh}
//                                   isRowHeader={true}
//                                 />

//                                 {variants.map((v, vIdx) => {
//                                   if (hiddenVehicles.has(vIdx)) return null;

//                                   const selection = selections.find(s => s.variant === v || (s.plan_id && v.includes(s.variant)));
//                                   const isPlan = selection?.plan_id ? true : false;
//                                   const planId = selection?.plan_id;

//                                   const value = item.values[v];
//                                   const isPriceCell = isPriceRow && value && typeof value === 'object' && (value as any).is_price_class;

//                                   return (
//                                     <React.Fragment key={vIdx}>
//                                       <div
//                                         className={`relative p-1 px-2 text-[10px] border-l border-slate-300 ${item.values[v] === NO_INFO ? 'text-slate-400 italic' : 'text-slate-900'
//                                           }`}
//                                         style={{ wordBreak: 'break-word', minWidth: 0, overflow: 'visible' }}
//                                       >

//                                         {isPriceCell ? (
//                                           <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: '240px' }}>
//                                             {(value as any).sub_variants.map((sv: any, svIdx: number) => (
//                                               <div key={svIdx} className="border-b border-slate-200 last:border-0 pb-1 last:pb-0">
//                                                 <div className="text-[7px] text-slate-400 font-bold uppercase tracking-tight mb-0.5 truncate" title={sv.name}>
//                                                   {sv.name}
//                                                 </div>
//                                                 <div className="space-y-0.5">
//                                                   {(sv.pricing || []).map((price: any, pIdx: number) => {
//                                                     const label = [
//                                                       price.fuel_type,
//                                                       price.engine_type,
//                                                       price.transmission_type,
//                                                       price.paint_type,
//                                                       price.edition
//                                                     ].filter(Boolean).join(' / ') || 'Standard';
//                                                     const formattedPrice = new Intl.NumberFormat('en-IN', {
//                                                       style: 'currency',
//                                                       currency: price.currency || 'INR',
//                                                       maximumFractionDigits: 0
//                                                     }).format(price.ex_showroom_price);

//                                                     return (
//                                                       <div key={pIdx} className="flex flex-col gap-0">
//                                                         <span className="text-[7px] text-slate-500 font-medium leading-tight break-words whitespace-normal">
//                                                           <HighlightText text={label} highlight={searchTerm} />
//                                                         </span>
//                                                         <span className="text-[9px] font-bold text-green-700 whitespace-nowrap">
//                                                           <HighlightText text={formattedPrice} highlight={searchTerm} />
//                                                         </span>
//                                                       </div>
//                                                     );
//                                                   })}
//                                                 </div>
//                                               </div>
//                                             ))}
//                                           </div>
//                                         ) : (
//                                           <div className="flex flex-col gap-1 w-full py-1">
//                                             {isPlan ? (
//                                               <div className="flex flex-row items-center gap-1 w-full relative pr-5">
//                                                 <div className="flex-1 min-w-0">
//                                                   <PlanFeatureInput
//                                                     planId={planId!}
//                                                     featureName={item.featureName}
//                                                     category={group.groupName}
//                                                     initialValue={(() => {
//                                                       if (typeof value === 'string') return value === NO_INFO ? '' : value;
//                                                       if (value && typeof value === 'object') return value[v] || '';
//                                                       return '';
//                                                     })()}
//                                                     onUpdate={onUpdatePlanFeature!}
//                                                     isDeleted={item.is_deleted?.[v]}
//                                                     originalValue={(() => {
//                                                       const orig = item.original_values?.[v];
//                                                       if (typeof orig === 'string') return orig === NO_INFO ? '' : orig;
//                                                       if (orig && typeof orig === 'object') return (orig as any)[v] || '';
//                                                       return '';
//                                                     })()}
//                                                     isNewFeature={!variants.some(variant => {
//                                                       const sel = selections.find(s => s.variant === variant);
//                                                       return !sel?.plan_id && item.values[variant] !== NO_INFO;
//                                                     })}
//                                                     baselineValue={(() => {
//                                                       const firstVar = variants.find(variant => {
//                                                         const sel = selections.find(s => s.variant === variant);
//                                                         return !sel?.plan_id;
//                                                       });
//                                                       return firstVar ? item.values[firstVar] : null;
//                                                     })()}
//                                                   />
//                                                 </div>

//                                                 <div className="flex items-center gap-1 shrink-0">
//                                                   <div className="flex items-center gap-0.5 group/cost" title="Cost Delta">
//                                                     <span className="text-[7px] text-slate-400 uppercase font-black">C:</span>
//                                                     <input
//                                                       key={`cost_${item.cost_deltas?.[v] ?? 0}`}
//                                                       type="number"
//                                                       defaultValue={item.cost_deltas?.[v] ?? 0}
//                                                       onBlur={(e) => {
//                                                         const val = parseFloat(e.target.value);
//                                                         if (!isNaN(val)) {
//                                                           if (val !== (item.cost_deltas?.[v] ?? 0)) {
//                                                             onUpdatePlanFeature?.(planId!, item.featureName, group.groupName, { cost_delta: val });
//                                                           }
//                                                         } else {
//                                                           e.target.value = String(item.cost_deltas?.[v] ?? 0);
//                                                         }
//                                                       }}
//                                                       onKeyDown={(e) => {
//                                                         if (e.key === 'Enter') e.currentTarget.blur();
//                                                         // Allow only numbers, dot, minus, and control keys
//                                                         if (!/[0-9.\-]/.test(e.key) && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
//                                                           e.preventDefault();
//                                                         }
//                                                       }}
//                                                       className={`text-[8px] font-bold w-10 bg-white/50 border border-slate-200 rounded px-0.5 outline-none text-right transition-all focus:border-blue-400 focus:bg-white ${Number(item.cost_deltas?.[v] || 0) > 0 ? 'text-red-500' : Number(item.cost_deltas?.[v] || 0) < 0 ? 'text-emerald-500' : 'text-slate-400'
//                                                         }`}
//                                                     />
//                                                     {(item.cost_deltas?.[v] || 0) !== 0 && (
//                                                       <button
//                                                         onClick={() => onUpdatePlanFeature?.(planId!, item.featureName, group.groupName, { cost_delta: 0 })}
//                                                         className="text-[6px] text-slate-300 hover:text-blue-500 font-bold"
//                                                         title="Reset to 0"
//                                                       >
//                                                         ↺
//                                                       </button>
//                                                     )}
//                                                   </div>
//                                                   <div className="flex items-center gap-0.5 group/price" title="Price Delta">
//                                                     <span className="text-[7px] text-slate-400 uppercase font-black">P:</span>
//                                                     <input
//                                                       key={`price_${item.price_deltas?.[v] ?? 0}`}
//                                                       type="number"
//                                                       defaultValue={item.price_deltas?.[v] ?? 0}
//                                                       onBlur={(e) => {
//                                                         const val = parseFloat(e.target.value);
//                                                         if (!isNaN(val)) {
//                                                           if (val !== (item.price_deltas?.[v] ?? 0)) {
//                                                             onUpdatePlanFeature?.(planId!, item.featureName, group.groupName, { price_delta: val });
//                                                           }
//                                                         } else {
//                                                           e.target.value = String(item.price_deltas?.[v] ?? 0);
//                                                         }
//                                                       }}
//                                                       onKeyDown={(e) => {
//                                                         if (e.key === 'Enter') e.currentTarget.blur();
//                                                         if (!/[0-9.\-]/.test(e.key) && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
//                                                           e.preventDefault();
//                                                         }
//                                                       }}
//                                                       className={`text-[8px] font-bold w-10 bg-white/50 border border-slate-200 rounded px-0.5 outline-none text-right transition-all focus:border-blue-400 focus:bg-white ${Number(item.price_deltas?.[v] || 0) > 0 ? 'text-emerald-500' : Number(item.price_deltas?.[v] || 0) < 0 ? 'text-red-500' : 'text-slate-400'
//                                                         }`}
//                                                     />
//                                                     {(item.price_deltas?.[v] || 0) !== 0 && (
//                                                       <button
//                                                         onClick={() => onUpdatePlanFeature?.(planId!, item.featureName, group.groupName, { price_delta: 0 })}
//                                                         className="text-[6px] text-slate-300 hover:text-blue-500 font-bold"
//                                                         title="Reset to 0"
//                                                       >
//                                                         ↺
//                                                       </button>
//                                                     )}
//                                                   </div>
//                                                 </div>

//                                                 {item.is_deleted?.[v] ? (
//                                                   <button
//                                                     onClick={() => onUpdatePlanFeature?.(planId!, item.featureName, group.groupName, { is_deleted: false })}
//                                                     className="absolute top-1/2 -translate-y-1/2 right-1 text-emerald-500 hover:text-emerald-600 transition-colors bg-white/80 rounded-full p-0.5 shadow-sm"
//                                                     title="Restore Feature"
//                                                   >
//                                                     <Undo2 size={10} />
//                                                   </button>
//                                                 ) : (
//                                                   <button
//                                                     onClick={() => onUpdatePlanFeature?.(planId!, item.featureName, group.groupName, { is_deleted: true })}
//                                                     className="absolute top-1/2 -translate-y-1/2 right-1 text-slate-300 hover:text-red-500 transition-colors bg-white/80 rounded-full p-0.5"
//                                                     title="Remove Feature"
//                                                   >
//                                                     <Trash2 size={10} />
//                                                   </button>
//                                                 )}
//                                               </div>
//                                             ) : typeof value === 'string' ? (
//                                               <div className="text-slate-400 italic text-[9px]">{value}</div>
//                                             ) : (
//                                               (() => {
//                                                 const grouped: Record<string, string[]> = {};
//                                                 Object.entries(value as Record<string, any>).forEach(([name, val]) => {
//                                                   const dVal = String(val || 'No information Available');
//                                                   if (!grouped[dVal]) grouped[dVal] = [];
//                                                   grouped[dVal].push(name);
//                                                 });

//                                                 const groupEntries = Object.entries(grouped);
//                                                 const isSingleValue = groupEntries.length === 1;

//                                                 return groupEntries.map(([displayVal, names], gIdx) => {
//                                                   const isNoInfo = displayVal === 'No information Available';
//                                                   const cleanNames = names.map(name => {
//                                                     let clean = name;
//                                                     if (v && clean.toLowerCase().startsWith(v.toLowerCase())) {
//                                                       clean = clean.substring(v.length).trim();
//                                                       if (clean.startsWith('-')) clean = clean.substring(1).trim();
//                                                     }
//                                                     return clean || name;
//                                                   });
//                                                   const combinedNames = cleanNames.join(' / ');

//                                                   return (
//                                                     <div key={gIdx} className="flex items-start gap-1.5 group/plan-cell">
//                                                       {!isNoInfo && !isSingleValue && <span className="text-blue-500 mt-0.5 whitespace-nowrap">&bull;</span>}
//                                                       <div className="flex-1 flex flex-wrap items-center gap-1 min-h-[16px]">
//                                                         {!isNoInfo && !isSingleValue && (
//                                                           <>
//                                                             <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight whitespace-nowrap">
//                                                               <HighlightText text={combinedNames} highlight={searchTerm} />
//                                                             </span>
//                                                             <span className="text-slate-600">&rarr;</span>
//                                                           </>
//                                                         )}
//                                                         <span className={isNoInfo ? 'text-[9px] text-slate-400 italic' : 'font-medium'}>
//                                                           <HighlightText text={displayVal} highlight={searchTerm} />
//                                                         </span>
//                                                       </div>
//                                                     </div>
//                                                   );
//                                                 });
//                                               })()
//                                             )}
//                                           </div>
//                                         )}
//                                       </div>
//                                     </React.Fragment>
//                                   );
//                                 })}
//                               </DraggableFeatureRow>

//                               {/* RENDER DRAFT ROWS IF ANY PLAN HAS ONE FOR THIS ITEM */}
//                               {variants.map((v, vIdx) => {
//                                 if (hiddenVehicles.has(vIdx)) return null;
//                                 const selection = selections.find(s => s.variant === v || (s.plan_id && v.includes(s.variant)));
//                                 if (!selection?.plan_id) return null;
//                                 const planId = selection.plan_id;
//                                 const draftKey = `${group.groupName}__${planId}`;
//                                 const draft = draftRows[draftKey];
//                                 if (!draft || draft.afterFeature !== item.featureName) return null;

//                                 return renderDraftRow(draftKey, draft, group.groupName, planId, v, idx, group.items.length);
//                               })}
//                             </React.Fragment>
//                           );
//                         })}
//                       </div>
//                     )}

//                   </div>
//                 );
//               })}
//             </div>{/* end groups list */}
//           </div>{/* end minWidth wrapper */}
//         </div>{/* end overflow-x */}
//       </div>
//     </DndContext>
//   );
// };

// export default ComparisonTable;



import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { AlertCircle, Download, Plus, Minus, Loader2, Filter, Search, X, Copy, ClipboardPaste, Check, Trash2 } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { ComparisonResponse, FeatureGroup, GroupedFeature } from '../types';
import NMFeatureCell from './NMFeatureCell';
import { copyFeaturesToNMVariant, updateNMVariantFeature, clearNMVariantFeatures, getNMVariantFeatures } from '../services/api';

const EXCLUDED_FEATURE_IDS = new Set([
  'e03ef22e-9dd9-497f-a63e-a66498865dec',
  '9e7edfff-c83f-4fec-96e9-8dc3a430caa9',
  '769ad0f5-a7fb-4965-8260-fa1408e11fd7',
  '2f2c9a92-2933-4d3c-9497-05166c1e3bfd',
]);

interface ComparisonTableProps {
  data: ComparisonResponse | null;
  selections: any[];
}

// ── Local NM feature value type ──────────────────────────────────────────────
interface LocalNMFeature {
  value: string;
  cost_delta: number;
  is_edited: boolean;
  copied_from?: string | null;
  sub_variant_values?: Record<string, string>;
}
// key: `${nm_variant_id}::${feature_id}`
type LocalNMState = Record<string, LocalNMFeature>;

const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight || !highlight.trim()) return <>{text}</>;
  const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <span key={i} className="bg-yellow-300 text-slate-900 font-bold rounded-sm px-0.5">{part}</span>
          : part
      )}
    </>
  );
};

const RowHeaderCell = ({ item, group, isBrand, isCar, isVar, isDate, searchTerm }: any) => (
  <div className={`p-1 pl-2 pr-2 text-[10px] font-medium border-r border-slate-300 flex items-center justify-start text-left gap-1.5 min-h-[32px]
    ${isBrand || isCar || isVar || isDate ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>
    <span className="text-slate-500 inline-block min-w-[20px] text-right shrink-0">
      {(group as any).originalGroupIndex + 1}.{(item as any).originalItemIndex + 1}
    </span>
    <div className="flex-1 min-w-0">
      <span className={`block truncate ${isBrand || isCar || isVar || isDate ? 'uppercase tracking-tight text-[9px]' : ''}`}>
        <HighlightText text={item.featureName} highlight={searchTerm} />
      </span>
    </div>
  </div>
);

const ComparisonTable: React.FC<ComparisonTableProps> = ({ data, selections }) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [showDiffOnly, setShowDiffOnly] = useState(false);
  const [expandAll, setExpandAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hiddenVehicles, setHiddenVehicles] = useState<Set<number>>(new Set());
  const [isFeatureFilterOpen, setIsFeatureFilterOpen] = useState(false);
  const [hiddenFeatures, setHiddenFeatures] = useState<Set<string>>(new Set());
  const [filterPanelSearch, setFilterPanelSearch] = useState('');

  const [featureWidth, setFeatureWidth] = useState<number>(160);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [hasResizedFeature, setHasResizedFeature] = useState(false);

  // ── Local NM state — lives here so paste/edit reflect instantly ──────────
  // Seeded from data.nm_variant_ids on load/change, then mutated locally on save
  const [localNM, setLocalNM] = useState<LocalNMState>({});

  const [copiedCol, setCopiedCol] = useState<string | null>(null);
  const [pasting, setPasting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [justPastedCol, setJustPastedCol] = useState<string | null>(null);

  // ── NM variant map from server ───────────────────────────────────────────
  const nmVariantMap: Record<string, {
    nm_variant_id: string;
    feature_values: Record<string, LocalNMFeature>;
  }> = (data as any)?.nm_variant_ids ?? {};

  const nmVariantMapKeys = useMemo(() => Object.keys(nmVariantMap), [nmVariantMap]);

  const getNMKey = useCallback((colName: string): string | undefined => {
    if (nmVariantMap[colName]) return colName;
    const lower = colName.trim().toLowerCase();
    return nmVariantMapKeys.find(k => k.trim().toLowerCase() === lower);
  }, [nmVariantMap, nmVariantMapKeys]);

  const isNMColumn = useCallback((colName: string) => !!getNMKey(colName), [getNMKey]);

  const getNMData = useCallback((colName: string) => {
    const key = getNMKey(colName);
    return key ? nmVariantMap[key] : undefined;
  }, [getNMKey, nmVariantMap]);

  const variantMeta: Record<string, { car_id: string; variant_class: string; version?: number }> =
    (data as any)?.variant_meta ?? {};

  // ── Seed localNM whenever server data changes (e.g. initial load) ────────
  // We only seed keys that don't already exist in localNM (so local edits survive)
  useEffect(() => {
    if (!data) return;
    setLocalNM(prev => {
      const next = { ...prev };
      let changed = false;
      Object.entries(nmVariantMap).forEach(([, nmCol]) => {
        const nmId = nmCol.nm_variant_id;
        Object.entries(nmCol.feature_values || {}).forEach(([fid, fv]) => {
          const key = `${nmId}::${fid}`;
          if (!next[key]) {
            next[key] = { ...fv };
            changed = true;
          }
        });
      });
      return changed ? next : prev;
    });

    // Fire background fetches to ensure we have the absolute latest data
    // even if App.tsx gave us stale data on remount.
    Object.entries(nmVariantMap).forEach(async ([, nmCol]) => {
      try {
        const freshResult = await getNMVariantFeatures(nmCol.nm_variant_id);
        const freshFeatures: any[] = freshResult?.data ?? [];
        setLocalNM(prev => {
          const next = { ...prev };
          let hasUpdates = false;
          freshFeatures.forEach((f: any) => {
            const key = `${nmCol.nm_variant_id}::${f.feature_id}`;
            const newVal = f.feature_value ?? '';
            const newCost = f.cost_delta ?? 0;
            // Only update if it actually differs from what we just seeded
            if (!next[key] || next[key].value !== newVal || next[key].cost_delta !== newCost) {
              next[key] = {
                value: newVal,
                cost_delta: newCost,
                is_edited: false,
                copied_from: f.copied_from_variant_class,
                sub_variant_values: f.sub_variant_values ?? {},
              };
              hasUpdates = true;
            }
          });
          return hasUpdates ? next : prev;
        });
      } catch (e) {
        console.error("Failed to fresh fetch NM variant", e);
      }
    });
  }, [data, nmVariantMap]);

  // ── After paste: seed ALL features from server response into localNM ─────
  const seedLocalNMFromServer = useCallback(() => {
    setLocalNM({});       // clear so useEffect above re-seeds with fresh server data
    // The re-seed happens automatically when data prop updates after parent refresh
    // But if parent doesn't re-fetch, we force it:
    // Caller should trigger a data refresh — we just clear local so new paste shows
  }, []);

  // ── Helper: get current feature value from localNM, fallback to server ───
  const getLocalFeature = useCallback((nmVariantId: string, featureId: string): LocalNMFeature | undefined => {
    const key = `${nmVariantId}::${featureId}`;
    if (localNM[key]) return localNM[key];
    // Fallback: scan nmVariantMap
    for (const nmCol of Object.values(nmVariantMap)) {
      if (nmCol.nm_variant_id === nmVariantId) {
        return nmCol.feature_values?.[featureId];
      }
    }
    return undefined;
  }, [localNM, nmVariantMap]);

  // ── Update localNM when NMFeatureCell saves ──────────────────────────────
  const handleNMFeatureSaved = useCallback((
    nmVariantId: string,
    featureId: string,
    newValue: string,
    newCost: number
  ) => {
    const key = `${nmVariantId}::${featureId}`;
    setLocalNM(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? {}),
        value: newValue,
        cost_delta: newCost,
        is_edited: true,
      }
    }));
  }, []);

  // ── Cost totals derived from localNM (updates instantly on cost save) ────
  const nmCostTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(nmVariantMap).forEach(([colName, nmCol]) => {
      const nmId = nmCol.nm_variant_id;
      let total = 0;
      // Prefer localNM, fallback to server feature_values
      const allFids = new Set([
        ...Object.keys(nmCol.feature_values || {}),
        ...Object.keys(localNM).filter(k => k.startsWith(`${nmId}::`)).map(k => k.split('::')[1]),
      ]);
      allFids.forEach(fid => {
        const local = localNM[`${nmId}::${fid}`];
        const server = nmCol.feature_values?.[fid];
        total += (local?.cost_delta ?? server?.cost_delta ?? 0);
      });
      totals[colName] = total;
    });
    return totals;
  }, [nmVariantMap, localNM]);

  // ── Paste handler ────────────────────────────────────────────────────────
  const handlePaste = useCallback(async (targetNMCol: string, sourceCol: string) => {
    const nmCol = getNMData(targetNMCol);
    if (!nmCol) { alert(`NM variant data not found for "${targetNMCol}".`); return; }
    const meta = variantMeta[sourceCol];
    if (!meta?.car_id) { alert(`No car_id found for "${sourceCol}".`); return; }

    setPasting(true);
    try {
      // Step 1: Copy features from source variant class into NM variant (DB mein save hoga)
      await copyFeaturesToNMVariant(
        nmCol.nm_variant_id,
        meta.car_id,
        meta.variant_class,
        meta.version ?? 1
      );

      // Step 2: Blank out excluded features (engine/fuel/drive/transmission)
      await Promise.all(
        Array.from(EXCLUDED_FEATURE_IDS).map(fid =>
          updateNMVariantFeature(nmCol.nm_variant_id, fid, { feature_value: '' }).catch(() => null)
        )
      );

      // Step 3: Fetch fresh features from backend and seed localNM immediately
      // Yahi woh step hai jo UI ko instantly update karta hai — no page reload needed
      const freshResult = await getNMVariantFeatures(nmCol.nm_variant_id);
      const freshFeatures: any[] = freshResult?.data ?? [];

      setLocalNM(prev => {
        const next = { ...prev };
        freshFeatures.forEach((f: any) => {
          const key = `${nmCol.nm_variant_id}::${f.feature_id}`;
          next[key] = {
            value: f.feature_value ?? '',
            cost_delta: f.cost_delta ?? 0,
            is_edited: false,
            copied_from: f.copied_from_variant_class ?? sourceCol,
            sub_variant_values: f.sub_variant_values ?? {},
          };
        });
        return next;
      });

      setCopiedCol(null);
      setJustPastedCol(targetNMCol);
      setTimeout(() => setJustPastedCol(null), 1800);

    } catch (e: any) {
      alert(e.message || 'Paste failed');
    } finally {
      setPasting(false);
    }
  }, [getNMData, variantMeta]);

  const handleClearNMColumn = useCallback(async (colName: string) => {
    const nmCol = getNMData(colName);
    if (!nmCol) return;
    if (!window.confirm(`Clear all copied features for "${colName}"? This cannot be undone.`)) return;
    setIsClearing(true);
    try {
      await clearNMVariantFeatures(nmCol.nm_variant_id);
      // Clear from localNM too
      setLocalNM(prev => {
        const next = { ...prev };
        // Reset server-sent features to empty as well so fallback shows empty
        Object.keys(nmCol.feature_values || {}).forEach(fid => {
           next[`${nmCol.nm_variant_id}::${fid}`] = { value: '', cost_delta: 0, is_edited: false, copied_from: null, sub_variant_values: {} };
        });
        // Reset any local overrides
        const prefix = `${nmCol.nm_variant_id}::`;
        Object.keys(next).forEach(k => { 
           if (k.startsWith(prefix)) {
              next[k] = { value: '', cost_delta: 0, is_edited: false, copied_from: null, sub_variant_values: {} };
           } 
        });
        return next;
      });
    } catch (e: any) {
      alert(e.message || 'Clear failed');
    } finally {
      setIsClearing(false);
    }
  }, [getNMData]);

  // ── Resize ───────────────────────────────────────────────────────────────
  const resizeVariants = useMemo(() => data?.columns.slice(1) || [], [data]);
  const resizeVisibleVariants = useMemo(
    () => resizeVariants.filter((_, idx) => !hiddenVehicles.has(idx)),
    [resizeVariants, hiddenVehicles]
  );

  const getColWidthAtTop = useCallback(() => {
    const count = resizeVisibleVariants.length;
    if (count <= 2) return 300; if (count <= 3) return 260; if (count <= 4) return 220;
    if (count <= 5) return 190; if (count <= 6) return 160; if (count <= 8) return 140;
    if (count <= 10) return 120; if (count <= 13) return 110; return 100;
  }, [resizeVisibleVariants.length]);

  const defaultColWidthAtTop = getColWidthAtTop();
  const initialFeatureWidth = useMemo(() => resizeVisibleVariants.length <= 3 ? 200 : 160, [resizeVisibleVariants.length]);
  useEffect(() => { if (!hasResizedFeature) setFeatureWidth(initialFeatureWidth); }, [initialFeatureWidth, hasResizedFeature]);

  const handleMouseDown = useCallback((e: React.MouseEvent, colKey: string) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX;
    const startWidth = colKey === 'feature' ? featureWidth : (widths[colKey] ?? defaultColWidthAtTop);
    const onMove = (mv: MouseEvent) => {
      const nw = Math.max(60, startWidth + mv.clientX - startX);
      if (colKey === 'feature') { setFeatureWidth(nw); setHasResizedFeature(true); }
      else setWidths(prev => ({ ...prev, [colKey]: nw }));
    };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [featureWidth, widths, defaultColWidthAtTop]);

  const NO_INFO = 'No information Available';

  // ── Groups ───────────────────────────────────────────────────────────────
  const groups: FeatureGroup[] = useMemo(() => {
    if (!data) return [];
    const groupMap: Record<string, GroupedFeature[]> = {};
    const priceGroup: GroupedFeature[] = [];
    const additionalGroup: GroupedFeature[] = [];
    const variants = data.columns.slice(1);

    data.data.forEach((row: any) => {
      const featureText = row.feature;
      const ftLower = featureText.trim().toLowerCase();
      const category = row.category || 'Additional Features';
      const values: Record<string, any> = {};
      const isPriceRow = ftLower === 'price value';

      variants.forEach((v) => {
        const val = row[v];
        if (isPriceRow && typeof val === 'object' && val !== null && 'pricing' in val) values[v] = val;
        else if (val && typeof val === 'object') values[v] = val;
        else if (typeof val === 'string') values[v] = val.trim() !== '' ? val : NO_INFO;
        else values[v] = NO_INFO;
      });

      const hasAnyInfo = Object.values(values).some(val => {
        if (typeof val === 'object' && val !== null) {
          if ('pricing' in val) return true;
          return Object.values(val as object).some(v => v && String(v).trim() !== '' && v !== NO_INFO);
        }
        return val !== NO_INFO;
      });
      // WE DO NOT FILTER OUT EMPTY FEATURES ANYMORE, WE KEEP THEM SO PADDED MASTER FEATURES APPEAR
      // if (!hasAnyInfo) return;

      if (isPriceRow || ftLower.startsWith('variant launched')) {
        priceGroup.push({ featureName: featureText, values, feature_id: row.feature_id, tags: row.tags });
        return;
      }
      if (category && category !== 'Additional Features') {
        if (!groupMap[category]) groupMap[category] = [];
        let fn = featureText;
        if (fn.startsWith(`${category} - `)) fn = fn.substring(category.length + 3);
        groupMap[category].push({ featureName: fn, values, feature_id: row.feature_id, tags: row.tags });
      } else {
        additionalGroup.push({ featureName: featureText, values, feature_id: row.feature_id, tags: row.tags });
      }
    });

    const result: FeatureGroup[] = [];
    if (priceGroup.length > 0) result.push({ groupName: 'Price & Basic Info', items: priceGroup, hasDifferences: true });
    Object.keys(groupMap).forEach(key => {
      const items = groupMap[key];
      const hasDiff = items.some(item => {
        const vals = variants.map(v => typeof item.values[v] === 'object' ? JSON.stringify(item.values[v]) : item.values[v]);
        return new Set(vals.filter(v => v !== NO_INFO)).size > 1;
      });
      result.push({ groupName: key, items, hasDifferences: hasDiff });
    });
    if (additionalGroup.length > 0) {
      const hasDiff = additionalGroup.some(item => {
        const vals = variants.map(v => typeof item.values[v] === 'object' ? JSON.stringify(item.values[v]) : item.values[v]);
        return new Set(vals.filter(v => v !== NO_INFO)).size > 1;
      });
      result.push({ groupName: 'Additional Features', items: additionalGroup, hasDifferences: hasDiff });
    }

    const ORDER = ['Price & Basic Info', 'Transmission', 'Fuel', 'Brake', 'Brakes', 'Dimension', 'Dimensions',
      'Engine', 'Suspension', 'Suspensions', 'Tyre', 'Tyres', 'Exterior', 'Interior', 'Safety',
      'Infotainment', 'Infotainemt', 'Comfort and Convenience', 'Audio and Entertainment', 'Connected Car Technology'];
    result.sort((a, b) => {
      const idx = (n: string) => { const i = ORDER.findIndex(c => c.toLowerCase() === n.toLowerCase() || n.toLowerCase().includes(c.toLowerCase())); return i === -1 ? 999 : i; };
      return idx(a.groupName) - idx(b.groupName);
    });
    return result;
  }, [data]);

  const groupsWithIndices = useMemo(() =>
    groups.map((g, gi) => ({ ...g, originalGroupIndex: gi, items: g.items.map((it, ii) => ({ ...it, originalItemIndex: ii })) }))
    , [groups]);

  const filteredGroups = useMemo(() => {
    if (!data) return [];
    const variants = data.columns.slice(1);
    if (!searchTerm.trim() && hiddenVehicles.size === 0 && hiddenFeatures.size === 0) return groupsWithIndices;
    const lowerTerm = searchTerm.toLowerCase();
    return groupsWithIndices.map(group => {
      let items = group.items;
      if (hiddenFeatures.size > 0) items = items.filter(i => !hiddenFeatures.has(`${group.groupName}__${i.featureName}`));
      if (searchTerm.trim()) {
        const gm = group.groupName.toLowerCase().includes(lowerTerm);
        if (!gm) items = group.items.filter(i => i.featureName.toLowerCase().includes(lowerTerm));
      }
      if (items.length === 0) return null;
      const hasDiff = items.some(item => {
        const vals = variants.filter((_, i) => !hiddenVehicles.has(i)).map(v => item.values[v]);
        return new Set(vals.filter(v => v !== NO_INFO)).size > 1;
      });
      return { ...group, items, hasDifferences: hasDiff };
    }).filter(Boolean) as any[];
  }, [groupsWithIndices, searchTerm, data, hiddenVehicles, hiddenFeatures]);

  const displayGroups = useMemo(() =>
    filteredGroups.map(group => {
      let items = group.items;
      if (showDiffOnly) {
        items = items.filter((item: any) => {
          const vals = data!.columns.slice(1).filter((_, i) => !hiddenVehicles.has(i)).map(v => item.values[v]);
          return new Set(vals.filter(v => v !== NO_INFO)).size > 1;
        });
      }
      if (items.length === 0) return null;
      return { ...group, items };
    }).filter(Boolean) as any[]
    , [filteredGroups, showDiffOnly, data, hiddenVehicles]);

  useEffect(() => { if (searchTerm) setExpandAll(true); }, [searchTerm]);
  useEffect(() => {
    setOpenGroups(prev => {
      const next = { ...prev }; let changed = false;
      displayGroups.forEach(g => { if (next[g.groupName] === undefined) { next[g.groupName] = expandAll; changed = true; } });
      return changed ? next : prev;
    });
  }, [displayGroups]);
  useEffect(() => {
    const s: Record<string, boolean> = {};
    displayGroups.forEach(g => s[g.groupName] = expandAll);
    setOpenGroups(s);
  }, [expandAll]);

  const toggleGroup = (gn: string) => setOpenGroups(prev => ({ ...prev, [gn]: !prev[gn] }));

  // ── Export ───────────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);
  const exportToExcel = async () => {
    if (!data) return;
    setIsExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Comparison');
      const variants = data.columns.slice(1);
      const exportVariants = variants.filter((_, i) => !hiddenVehicles.has(i));
      const columns = [
        { header: 'Category', key: 'category', width: 25 },
        { header: 'Feature', key: 'feature', width: 40 },
        ...exportVariants.map(v => ({ header: v, key: v, width: 35 }))
      ];
      ws.columns = columns;
      ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      let rowIdx = 2;
      groupsWithIndices.forEach((group: any) => {
        const toExport = group.items.filter((item: any) => {
          const isPR = item.featureName.toLowerCase().trim() === 'price value';
          const vv = variants.map((v, i) => !hiddenVehicles.has(i) ? item.values[v] : null).filter(Boolean);
          const diff = new Set(vv.filter(v => v !== NO_INFO)).size > 1;
          if (showDiffOnly && !diff && !isPR) return false;
          if (searchTerm.trim()) {
            const lt = searchTerm.toLowerCase();
            if (!group.groupName.toLowerCase().includes(lt) && !item.featureName.toLowerCase().includes(lt)) return false;
          }
          return true;
        });
        if (toExport.length === 0 && (showDiffOnly || searchTerm.trim())) return;
        const gl = `${group.originalGroupIndex + 1}. ${group.groupName}`;
        const ghr = ws.addRow([gl, '', ...Array(exportVariants.length).fill('')]);
        ghr.font = { bold: true };
        ghr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F9FF' } };
        ghr.getCell(1).alignment = { horizontal: 'left' };
        ws.mergeCells(rowIdx, 1, rowIdx, exportVariants.length + 2);
        rowIdx++;
        toExport.forEach((item: any) => {
          const isPR = item.featureName.toLowerCase().trim() === 'price value';
          const vv = variants.map((v, i) => !hiddenVehicles.has(i) ? item.values[v] : null).filter(Boolean);
          const diff = new Set(vv.filter(v => v !== NO_INFO)).size > 1;
          const rd = [gl, `${group.originalGroupIndex + 1}.${item.originalItemIndex + 1}  ${item.featureName}`];
          exportVariants.forEach(v => {
            if (isNMColumn(v)) {
              const nmCol = getNMData(v);
              const fd = localNM[`${nmCol?.nm_variant_id}::${item.feature_id}`] ?? nmCol?.feature_values?.[item.feature_id];
              rd.push(fd?.value ?? NO_INFO); return;
            }
            const val = item.values[v];
            if (!val || val === NO_INFO) { rd.push(NO_INFO); return; }
            if (typeof val === 'object' && 'pricing' in val) {
              rd.push((val.pricing.prices || []).map((p: any) => `${[p.fuel_type, p.transmission_type].filter(Boolean).join(' ')}: ₹${p.ex_showroom_price?.toLocaleString()}`).join('\n') || NO_INFO);
            } else if (typeof val === 'object') {
              const uv = Array.from(new Set(Object.values(val as Record<string, any>).map(lv => typeof lv === 'object' ? (lv?.name || '') : String(lv || '').trim()).filter(x => x && x !== 'No information Available' && x !== 'true' && x !== 'false'))).sort();
              rd.push(uv.join(' | ') || NO_INFO);
            } else { rd.push(String(val)); }
          });
          const dr = ws.addRow(rd);
          if (diff && !isPR) dr.eachCell({ includeEmpty: true }, cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; });
          if (isPR) { dr.font = { bold: true, color: { argb: 'FF15803D' } }; dr.eachCell(c => c.alignment = { wrapText: true, vertical: 'top' }); }
          dr.eachCell({ includeEmpty: true }, cell => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            if (!isPR) cell.alignment = { wrapText: true, vertical: 'top' };
          });
          rowIdx++;
        });
      });
      const fn = `Comparison_${exportVariants.map(v => v.split(' - ').pop()).join('_vs_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(new Blob([await wb.xlsx.writeBuffer()]), fn);
    } catch (e) { console.error(e); alert('Export failed'); }
    finally { setIsExporting(false); }
  };

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-white rounded-xl border-2 border-dashed border-slate-200 p-10">
        <div className="bg-blue-100 p-4 rounded-full mb-4"><AlertCircle size={40} className="text-blue-500" /></div>
        <h3 className="text-lg font-semibold text-slate-800">No comparison generated yet</h3>
        <p className="mt-2 text-center max-w-sm text-sm">Please select vehicles from the left panel and click "Compare Now" to view detailed comparison.</p>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const variants = data.columns.slice(1);
  const visibleVariants = variants.filter((_, i) => !hiddenVehicles.has(i));

  const toggleVehicleVisibility = (index: number) => {
    setHiddenVehicles(prev => {
      const s = new Set(prev);
      if (s.has(index)) { s.delete(index); }
      else if (s.size < variants.length - 1) s.add(index);
      else alert('At least one vehicle must remain visible');
      return s;
    });
  };

  const defaultColWidth = (() => {
    const c = visibleVariants.length;
    if (c <= 2) return 300; if (c <= 3) return 260; if (c <= 4) return 220; if (c <= 5) return 190;
    if (c <= 6) return 160; if (c <= 8) return 140; if (c <= 10) return 120; if (c <= 13) return 110; return 100;
  })();

  const tableMinWidth = featureWidth + visibleVariants.reduce((s, v) => s + (widths[v] ?? defaultColWidth), 0);
  const gridColsStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `${featureWidth}px ${visibleVariants.map(v => widths[v] ? `${widths[v]}px` : '1fr').join(' ')}`,
    minWidth: `${tableMinWidth}px`, width: '100%',
  };

  const variantBg = (i: number) => ['bg-blue-600 text-white', 'bg-emerald-600 text-white', 'bg-violet-600 text-white', 'bg-orange-600 text-white', 'bg-sky-600 text-white'][i % 5];
  const variantHeaderBg = (i: number, col: string) => isNMColumn(col) ? 'bg-indigo-700 text-white' : variantBg(i);

  // Extract just the variant label for NM columns (V, L, etc.)
  const getColDisplayName = (col: string) => {
    const nmCol = getNMData(col);
    if (!nmCol) return col;
    // col is like "NM1 V" or "NM1 - V" — return the part after last space or dash
    const parts = col.split(/[\s\-]+/);
    return parts[parts.length - 1] || col;
  };

  return (
    <div className="h-full flex flex-col bg-white">

      {/* Toolbar */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4 px-4 py-2 border-b bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showDiffOnly} onChange={() => setShowDiffOnly(p => !p)} className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Differs only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={expandAll} onChange={() => setExpandAll(p => !p)} className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Expand all</span>
          </label>
          <div className="relative">
            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search features..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="pl-7 pr-7 py-1.5 text-xs border border-slate-300 rounded-md outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 w-48" />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={11} /></button>}
          </div>
          {hiddenVehicles.size > 0 && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg border border-amber-300 text-xs font-semibold transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                {hiddenVehicles.size} Hidden
              </button>
              <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100]">
                <div className="flex justify-between items-center mb-2 px-2">
                  <span className="text-xs font-bold text-slate-600">Hidden Vehicles</span>
                  <button onClick={() => setHiddenVehicles(new Set())} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-semibold">Clear All</button>
                </div>
                {variants.map((v, i) => !hiddenVehicles.has(i) ? null : (
                  <button key={i} onClick={() => toggleVehicleVisibility(i)} className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center justify-between group/item">
                    <span className="truncate flex-1">Vehicle {i + 1}: {v}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button onClick={exportToExcel} disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-50">
          {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          <span className="text-sm">{isExporting ? 'Exporting...' : 'Download Excel'}</span>
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto w-full" style={{ minWidth: 0 }}>
        <div style={{ minWidth: `${tableMinWidth}px`, width: '100%' }}>

          {/* Header */}
          <div className="grid border-b border-slate-200 sticky top-0 z-50 shadow-md backdrop-blur-md bg-white/90" style={gridColsStyle}>
            {/* Feature col header */}
            <div className="p-3 font-bold uppercase tracking-wider text-[10px] md:text-xs flex items-center bg-gradient-to-br from-slate-800 to-slate-900 text-white border-r border-slate-700 shadow-inner relative">
              <span className="opacity-90 flex-1">Comparison Feature</span>
              <div onMouseDown={e => handleMouseDown(e, 'feature')} onDoubleClick={() => { setFeatureWidth(visibleVariants.length <= 3 ? 200 : 160); setHasResizedFeature(false); }}
                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/80 z-50 transition-colors" onClick={e => e.stopPropagation()} />
              <div className="relative" onMouseLeave={() => setIsFeatureFilterOpen(false)}>
                <button onClick={() => setIsFeatureFilterOpen(p => !p)}
                  className={`p-1.5 rounded-full transition-colors ml-2 ${isFeatureFilterOpen || hiddenFeatures.size > 0 ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} title="Filter Features">
                  <Filter size={14} />
                </button>
                {isFeatureFilterOpen && (
                  <div className="absolute top-full left-0 mt-0 pt-2 w-64 bg-transparent z-[100] text-slate-800 flex flex-col font-normal max-h-[60vh]">
                    <div className="bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                      <div className="p-2 border-b border-slate-100 flex flex-col gap-2 bg-slate-50">
                        <div className="flex justify-between gap-2">
                          <button onClick={() => setHiddenFeatures(new Set())} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 font-semibold flex-1">Select All</button>
                          <button onClick={() => { const s = new Set<string>(); groups.forEach(g => g.items.forEach(i => s.add(`${g.groupName}__${i.featureName}`))); setHiddenFeatures(s); }}
                            className="text-[10px] bg-slate-200 text-slate-700 px-2 py-1 rounded hover:bg-slate-300 font-semibold flex-1">Clear All</button>
                        </div>
                        <div className="relative">
                          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          <input type="text" placeholder="Search features..." value={filterPanelSearch} onChange={e => setFilterPanelSearch(e.target.value)}
                            className="w-full pl-7 pr-7 py-1.5 text-[11px] border border-slate-200 rounded-md bg-white outline-none focus:border-blue-400" />
                          {filterPanelSearch && <button onClick={() => setFilterPanelSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X size={11} /></button>}
                        </div>
                      </div>
                      <div className="overflow-y-auto flex-1 p-3 space-y-4">
                        {groups.map(group => {
                          const pf = `${group.groupName}__`;
                          const lf = filterPanelSearch.toLowerCase();
                          const fi = filterPanelSearch.trim() ? group.items.filter(i => i.featureName.toLowerCase().includes(lf) || group.groupName.toLowerCase().includes(lf)) : group.items;
                          if (!fi.length) return null;
                          const fk = fi.map(i => `${pf}${i.featureName}`);
                          const allH = fk.every(k => hiddenFeatures.has(k));
                          const someH = fk.some(k => hiddenFeatures.has(k));
                          return (
                            <div key={group.groupName} className="flex flex-col gap-1.5">
                              <label className="flex items-center gap-2 cursor-pointer font-bold text-[11px] text-slate-800">
                                <input type="checkbox" checked={!allH} ref={el => { if (el) el.indeterminate = someH && !allH; }}
                                  onChange={e => { const n = new Set(hiddenFeatures); if (e.target.checked) fk.forEach(k => n.delete(k)); else fk.forEach(k => n.add(k)); setHiddenFeatures(n); }}
                                  className="rounded border-slate-300 text-blue-600 w-3 h-3 cursor-pointer" />
                                {group.groupName}
                              </label>
                              <div className="pl-5 flex flex-col gap-1">
                                {fi.map(item => {
                                  const ik = `${pf}${item.featureName}`; const ih = hiddenFeatures.has(ik); return (
                                    <label key={ik} className="flex items-center gap-2 cursor-pointer text-[10px] text-slate-600 hover:text-slate-900">
                                      <input type="checkbox" checked={!ih} onChange={e => { const n = new Set(hiddenFeatures); if (e.target.checked) n.delete(ik); else n.add(ik); setHiddenFeatures(n); }} className="rounded border-slate-300 text-blue-500 w-2.5 h-2.5 cursor-pointer" />
                                      <span className="truncate" title={item.featureName}>{item.featureName}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Variant headers */}
            {variants.map((v, idx) => {
              if (hiddenVehicles.has(idx)) return null;
              const isNM = isNMColumn(v);
              const isThisCopied = copiedCol === v;
              const justPasted = justPastedCol === v;
              const nmData = getNMData(v);
              const nmId = nmData?.nm_variant_id ?? '';
              const costTotal = nmCostTotals[v] ?? 0;

              // Copied-from: get from localNM first, then server
              const copiedFromSource = isNM
                ? (() => {
                  const localEntry = Object.entries(localNM).find(([k, fv]) => k.startsWith(`${nmId}::`) && fv.copied_from);
                  if (localEntry) return localEntry[1].copied_from;
                  return Object.values(nmData?.feature_values || {}).find(fv => fv.copied_from)?.copied_from ?? null;
                })()
                : null;

              const displayName = isNM ? getColDisplayName(v) : (data?.base_variant_classes?.[v] ? `${v} (${data.base_variant_classes[v]})` : v);

              return (
                <div key={idx}
                  className={`p-1.5 font-bold text-[11px] md:text-sm border-l border-white/20 flex flex-col items-start justify-center relative group ${variantHeaderBg(idx, v)} min-w-0`}
                  title={v}>

                  {/* Action buttons top-right */}
                  <div className="absolute top-1 right-1 flex items-center gap-1 z-10">
                    {/* Copy button — real columns only */}
                    {!isNM && (
                      <button onClick={() => setCopiedCol(p => p === v ? null : v)}
                        className={`transition-all rounded-full p-1 shadow-sm ${isThisCopied ? 'bg-white text-indigo-700' : 'bg-black/10 hover:bg-black/30 text-white'}`}
                        title={isThisCopied ? 'Copied — click to undo' : `Copy "${v}" features`}>
                        {isThisCopied ? <Check size={10} /> : <Copy size={10} />}
                      </button>
                    )}
                    {/* Paste button — NM columns only */}
                    {isNM && (
                      <button onClick={() => copiedCol && !pasting && handlePaste(v, copiedCol)} disabled={!copiedCol || pasting}
                        className={`transition-all rounded-full p-1 shadow-sm
                          ${justPasted ? 'bg-emerald-400 text-white'
                            : copiedCol ? 'bg-white text-indigo-700 hover:bg-indigo-50 animate-pulse'
                              : 'bg-black/10 text-white/50 cursor-not-allowed'}`}
                        title={copiedCol ? `Paste "${copiedCol}" features here` : 'Copy a column first'}>
                        {justPasted ? <Check size={10} /> : <ClipboardPaste size={10} />}
                      </button>
                    )}
                    {/* Clear — NM only, when features exist */}
                    {isNM && (Object.keys(nmData?.feature_values || {}).length > 0 || Object.keys(localNM).some(k => k.startsWith(`${nmId}::`))) && (
                      <button onClick={() => handleClearNMColumn(v)} disabled={isClearing} className="transition-all bg-red-500/70 hover:bg-red-600 rounded-full p-1 text-white shadow-sm" title="Clear all copied features">
                        {isClearing ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                      </button>
                    )}
                    {/* Hide */}
                    <button onClick={() => toggleVehicleVisibility(idx)} className="transition-all bg-black/10 hover:bg-black/30 rounded-full p-1 text-white shadow-sm" title="Hide this column">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    </button>
                  </div>

                  {/* Column name + badges */}
                  <div className="flex flex-col w-full min-w-0 pr-12">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center text-[7px] font-black shrink-0">{idx + 1}</span>
                      <span className="truncate font-black text-[10px] md:text-xs leading-tight drop-shadow-sm">{displayName}</span>
                      {isNM && <span className="text-[7px] font-black bg-white/20 px-1 py-0.5 rounded-sm uppercase ml-1 shrink-0">NM</span>}
                    </div>

                    {/* Copied-from source */}
                    {isNM && copiedFromSource && (
                      <div className="mt-0.5 flex items-center gap-1 text-[8px] font-bold bg-purple-500/30 text-white px-1.5 py-0.5 rounded-sm">
                        <ClipboardPaste size={8} /> From: {copiedFromSource}
                      </div>
                    )}
                    {/* Cost delta total */}
                    {isNM && costTotal !== 0 && (
                      <div className={`mt-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-sm ${costTotal > 0 ? 'bg-red-500/30 text-white' : 'bg-emerald-500/30 text-white'}`}>
                        ΔC: {costTotal > 0 ? '+' : ''}{costTotal.toLocaleString('en-IN')}
                      </div>
                    )}
                    {/* Status hints */}
                    {isThisCopied && !isNM && (
                      <div className="mt-1 text-[8px] font-bold bg-white/30 text-white px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                        <Check size={9} /> Copied — tap Paste on NM column
                      </div>
                    )}
                    {isNM && copiedCol && !justPasted && (
                      <div className="mt-1 text-[8px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                        <ClipboardPaste size={9} /> Tap to paste "{copiedCol.split(' - ').pop()}"
                      </div>
                    )}
                    {justPasted && (
                      <div className="mt-1 text-[8px] font-bold bg-emerald-500/80 text-white px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                        <Check size={9} /> Pasted!
                      </div>
                    )}
                  </div>

                  {/* Resize handle */}
                  <div onMouseDown={e => handleMouseDown(e, v)} onDoubleClick={() => setWidths(p => { const n = { ...p }; delete n[v]; return n; })}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/80 active:bg-blue-600 z-50 transition-colors" onClick={e => e.stopPropagation()} />
                </div>
              );
            })}
          </div>

          {/* Body */}
          <div className="divide-y divide-slate-200">
            {displayGroups.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                {searchTerm ? `No features match "${searchTerm}"${showDiffOnly ? ' (with differences)' : ''}` : showDiffOnly ? 'No differing features found.' : 'No data available.'}
              </div>
            ) : displayGroups.map((group) => {
              const isOpen = openGroups[group.groupName] ?? false;
              return (
                <div key={group.groupName} className="bg-white">
                  {/* Group header */}
                  <div onClick={() => !(showDiffOnly && !group.hasDifferences) && toggleGroup(group.groupName)}
                    className={`grid sticky top-[33px] z-30 border-b border-slate-100 transition-all duration-200 ${showDiffOnly && !group.hasDifferences ? 'bg-slate-50 text-slate-400 cursor-default' : 'bg-sky-50 hover:bg-sky-100 text-slate-900 cursor-pointer'}`}
                    style={gridColsStyle}>
                    <div className="w-full flex items-center px-3 py-1.5 text-left border-r border-slate-200 justify-between">
                      <span className="font-semibold flex items-center gap-2 text-[11px]">
                        <span className="mr-1 text-blue-600">{isOpen && !(showDiffOnly && !group.hasDifferences) ? <Minus size={12} /> : <Plus size={12} />}</span>
                        {(group as any).originalGroupIndex + 1}. {group.groupName}
                        {showDiffOnly && !group.hasDifferences && <span className="ml-2 text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider">No Differences</span>}
                      </span>
                    </div>
                    {visibleVariants.map((v, vi) => <div key={vi} className="p-1 px-2 border-l border-slate-100" />)}
                  </div>

                  {/* Rows */}
                  {isOpen && (
                    <div>
                      {group.items.map((item: any, idx: number) => {
                        const ftLower = item.featureName.toLowerCase().trim();
                        const isBrand = ftLower === 'brand', isCar = ftLower === 'car', isVar = ftLower === 'variant', isDate = ftLower === 'variant launched', isPriceRow = ftLower === 'price value';
                        const vv = variants.filter((_, vi) => !hiddenVehicles.has(vi)).map(v => item.values[v]);
                        const nonNI = vv.filter(v => v !== NO_INFO);
                        const norm = (val: any): string => {
                          if (!val || val === NO_INFO) return NO_INFO;
                          if (typeof val === 'string') return val.trim().toLowerCase();
                          if (typeof val === 'object') {
                            const u = Array.from(new Set(Object.values(val as Record<string, any>).map(lv => String(lv || '').trim().toLowerCase()).filter(lv => lv && lv !== 'no information available'))).sort();
                            return u.length ? u.join('|') : NO_INFO;
                          }
                          return String(val).trim().toLowerCase();
                        };
                        const isDiff = new Set(nonNI.map(norm)).size > 1;
                        if (showDiffOnly && !isDiff && !isPriceRow && !isBrand && !isCar && !isVar && !isDate) return null;

                        let rowBg = 'hover:bg-slate-50';
                        if (isBrand) rowBg = 'bg-blue-50 hover:bg-blue-100/80';
                        else if (isCar) rowBg = 'bg-indigo-50 hover:bg-indigo-100/80';
                        else if (isVar) rowBg = 'bg-violet-50 hover:bg-violet-100/80';
                        else if (isDate) rowBg = 'bg-emerald-50 hover:bg-emerald-100/80';
                        else if (isPriceRow) rowBg = 'bg-slate-50';
                        else if (isDiff) rowBg = 'bg-amber-100 hover:bg-amber-300/80';

                        return (
                          <div key={idx} className={`grid border-b border-slate-300 ${rowBg}`} style={gridColsStyle}>
                            <RowHeaderCell item={item} group={group} isBrand={isBrand} isCar={isCar} isVar={isVar} isDate={isDate} searchTerm={searchTerm} />

                            {variants.map((v, vIdx) => {
                              if (hiddenVehicles.has(vIdx)) return null;
                              const value = item.values[v];
                              const isPriceCell = isPriceRow && value && typeof value === 'object' && (value as any).is_price_class;

                              // ── NM editable cell ──────────────────────────
                              if (isNMColumn(v) && !isPriceRow && !isBrand && !isCar && !isVar && !isDate) {
                                const nmCol = getNMData(v);
                                const nmId = nmCol?.nm_variant_id ?? '';
                                const localKey = `${nmId}::${item.feature_id}`;
                                const featureData = localNM[localKey] ?? nmCol?.feature_values?.[item.feature_id];

                                // ── Excluded features (engine/fuel/drive/transmission) — show empty cell ──
                                if (EXCLUDED_FEATURE_IDS.has(item.feature_id ?? '')) {
                                  return (
                                    <div key={vIdx}
                                      className="relative border-l border-slate-300 bg-indigo-50/30 px-1"
                                      style={{ minWidth: 0 }}>
                                      <div className="py-2 px-1.5 text-[9px] text-slate-300 italic">—</div>
                                    </div>
                                  );
                                }

                                return (
                                  <div key={vIdx}
                                    className="relative border-l border-slate-300 bg-indigo-50/30 px-1"
                                    style={{ minWidth: 0 }}>
                                    <NMFeatureCell
                                      key={`${nmId}-${item.feature_id}`}
                                      nmVariantId={nmId}
                                      featureId={item.feature_id ?? ''}
                                      value={featureData?.value ?? ''}
                                      // subVariantValues prop hata diya — ab NM cell sirf single value dikhayega
                                      costDelta={featureData?.cost_delta ?? 0}
                                      isEdited={featureData?.is_edited ?? false}
                                      copiedFrom={featureData?.copied_from ?? null}
                                      onSaved={(fid, newVal, newCost) => handleNMFeatureSaved(nmId, fid, newVal, newCost)}
                                    />
                                  </div>
                                );
                              }

                              // ── Regular read-only cell ────────────────────
                              return (
                                <div key={vIdx}
                                  className={`relative p-1 px-2 text-[10px] border-l border-slate-300 ${value === NO_INFO ? 'text-slate-400 italic' : 'text-slate-900'}`}
                                  style={{ wordBreak: 'break-word', minWidth: 0, overflow: 'visible' }}>
                                  {isPriceCell ? (
                                    <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: '240px' }}>
                                      {(value as any).sub_variants.map((sv: any, si: number) => (
                                        <div key={si} className="border-b border-slate-200 last:border-0 pb-1 last:pb-0">
                                          <div className="text-[7px] text-slate-400 font-bold uppercase tracking-tight mb-0.5 truncate">{sv.name}</div>
                                          <div className="space-y-0.5">
                                            {(sv.pricing || []).map((price: any, pi: number) => {
                                              const label = [price.fuel_type, price.engine_type, price.transmission_type, price.paint_type, price.edition].filter(Boolean).join(' / ') || 'Standard';
                                              const fp = new Intl.NumberFormat('en-IN', { style: 'currency', currency: price.currency || 'INR', maximumFractionDigits: 0 }).format(price.ex_showroom_price);
                                              return (
                                                <div key={pi} className="flex flex-col">
                                                  <span className="text-[7px] text-slate-500 font-medium"><HighlightText text={label} highlight={searchTerm} /></span>
                                                  <span className="text-[9px] font-bold text-green-700 whitespace-nowrap"><HighlightText text={fp} highlight={searchTerm} /></span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-1 w-full py-1">
                                      {typeof value === 'string' ? (
                                        <div className="text-slate-400 italic text-[9px]">{value}</div>
                                      ) : (() => {
                                        const grouped: Record<string, string[]> = {};
                                        Object.entries(value as Record<string, any>).forEach(([n, val]) => {
                                          const dv = String(val || 'No information Available');
                                          if (!grouped[dv]) grouped[dv] = [];
                                          grouped[dv].push(n);
                                        });
                                        const ge = Object.entries(grouped);
                                        const single = ge.length === 1;
                                        return ge.map(([dv, names], gi) => {
                                          const noInfo = dv === 'No information Available';
                                          const clean = names.map(n => { let c = n; if (v && c.toLowerCase().startsWith(v.toLowerCase())) { c = c.substring(v.length).trim(); if (c.startsWith('-')) c = c.substring(1).trim(); } return c || n; });
                                          return (
                                            <div key={gi} className="flex items-start gap-1.5">
                                              {!noInfo && !single && <span className="text-blue-500 mt-0.5 whitespace-nowrap">&bull;</span>}
                                              <div className="flex-1 flex flex-wrap items-center gap-1 min-h-[16px]">
                                                {!noInfo && !single && <><span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight whitespace-nowrap"><HighlightText text={clean.join(' / ')} highlight={searchTerm} /></span><span className="text-slate-600">&rarr;</span></>}
                                                <span className={noInfo ? 'text-[9px] text-slate-400 italic' : 'font-medium'}><HighlightText text={dv} highlight={searchTerm} /></span>
                                              </div>
                                            </div>
                                          );
                                        });
                                      })()}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pasting overlay */}
      {pasting && (
        <div className="fixed inset-0 z-[9998] bg-black/10 flex items-center justify-center pointer-events-none">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl px-6 py-4 flex items-center gap-3">
            <svg className="animate-spin w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
            <span className="text-sm font-semibold text-slate-700">Copying features…</span>
          </div>
        </div>
      )}

      {/* Clipboard toast */}
      {copiedCol && !pasting && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9997] bg-slate-800 text-white text-[12px] font-medium px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
          <Copy size={13} />
          <span>"{copiedCol}" copied — tap the paste icon on an NM column</span>
          <button onClick={() => setCopiedCol(null)} className="ml-1 text-slate-400 hover:text-white"><X size={12} /></button>
        </div>
      )}
    </div>
  );
};

export default ComparisonTable;
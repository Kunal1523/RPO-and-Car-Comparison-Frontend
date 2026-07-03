// src/car-comparison/components/FeatureStackUpPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Layers, TrendingUp, GripVertical, Eye, EyeOff, ArrowRightLeft, ChevronDown, ArrowLeft, X } from 'lucide-react';
import StackUpSidebar from '../components/StackUpSidebar';
import {
  fetchVariantClassDetails,
  getNMVariantFeatures,
  fetchFeatureStackUpPrefsBulk,
  upsertFeatureStackUpPref,
  reorderFeatureStackUpPrefsBulk,
} from '../services/stackUpApi';
import {
  StackUpSelection,
  ModelStackCard,
  VariantBlockData,
  StackUpFeatureRow,
  FeatureStackUpPref,
} from '../stackUpTypes';
import { SelectionState } from '../types';

// ─── helpers ────────────────────────────────────────────────────────────────

function groupSelectionsIntoCards(sels: StackUpSelection[]): Omit<ModelStackCard, 'variant_blocks'>[] {
  const seen = new Map<string, Omit<ModelStackCard, 'variant_blocks'>>();
  sels.forEach((s) => {
    const k = `${s.source}__${s.car_id}`;
    if (!seen.has(k)) seen.set(k, { model_key: k, source: s.source, brand: s.brand, model_name: s.model, car_id: s.car_id });
  });
  return Array.from(seen.values());
}

function applyPrefs(
  raw: { feature_id: string | null; feature_name: string; category: string; value: string }[],
  prefs: FeatureStackUpPref[]
): StackUpFeatureRow[] {
  const map = new Map<string, FeatureStackUpPref>();
  prefs.forEach((p) => map.set(p.feature_name.trim().toLowerCase(), p));
  return raw
    .map((f, i) => {
      const p = map.get(f.feature_name.trim().toLowerCase());
      return { ...f, display_order: p ? p.display_order : i, is_hidden: p ? p.is_hidden : false };
    })
    .sort((a, b) => a.display_order - b.display_order);
}

const COMP_COLORS = {
  same:     { bg: 'bg-[#e0f2fe] border-[#bae6fd]',      circleBg: 'bg-[#38bdf8]', text: 'text-sky-800',    label: 'Same',        hex: '#e0f2fe' },
  change:   { bg: 'bg-[#fef08a] border-[#fde047]',      circleBg: 'bg-[#eab308]', text: 'text-yellow-800', label: 'Changed',     hex: '#fef08a' },
  addition: { bg: 'bg-[#dcfce7] border-[#bbf7d0]',      circleBg: 'bg-[#22c55e]', text: 'text-green-800',  label: 'Added',       hex: '#dcfce7' },
  deletion: { bg: 'bg-[#fee2e2] border-[#fecaca]',      circleBg: 'bg-[#ef4444]', text: 'text-red-800',    label: 'Deleted',     hex: '#fee2e2' },
  absent:   { bg: 'bg-[#ffedd5] border-[#fed7aa]',      circleBg: 'bg-[#f97316]', text: 'text-orange-800', label: 'Not in Base', hex: '#ffedd5' },
};
type CompColor = keyof typeof COMP_COLORS;

function classify(compVal: string | undefined, baseVal: string | undefined, inBase: boolean): CompColor {
  const hC = !!compVal && compVal.trim() !== '' && compVal.toLowerCase() !== 'no' && compVal.toLowerCase() !== 'no information found';
  const hB = !!baseVal && baseVal.trim() !== '' && baseVal.toLowerCase() !== 'no' && baseVal.toLowerCase() !== 'no information found';
  if (!inBase && hC) return 'absent';
  if (hB && hC && compVal === baseVal) return 'same';
  if (hB && hC) return 'change';
  if (!hB && hC) return 'addition';
  if (hB && !hC) return 'deletion';
  return 'same';
}

// ─── Variant Feature Card ────────────────────────────────────────────────────

interface VCardProps {
  block: VariantBlockData;
  showHidden: boolean;
  index: number;
  total: number;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

const VariantCard: React.FC<VCardProps> = ({
  block, showHidden, index, total,
  isDragging, onDragStart, onDragOver, onDrop
}) => {
  const staggerLeft = (total - index - 1) * 16;

  const validFeatures = block.features.filter((f) => {
    const val = f.value?.trim().toLowerCase();
    return val && val !== 'no' && val !== 'no information found';
  });
  const shown = showHidden ? validFeatures.filter((f) => f.is_hidden) : validFeatures.filter((f) => !f.is_hidden);
  const hidden = validFeatures.filter((f) => f.is_hidden);



  return (
    <div
      className={`flex items-start gap-0 mb-2 transition-opacity select-none ${isDragging ? 'opacity-30' : ''}`}
      style={{ marginLeft: staggerLeft }}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex flex-col items-end justify-start pt-2 pr-1.5 shrink-0" style={{ width: 60 }}>
        <span className="text-[11px] font-black leading-none text-right text-[#1e6091]">
          {block.variant_class}
        </span>
      </div>

      <div className="rounded-xl border-2 shadow-sm flex-shrink-0 border-[#1e6091] bg-[#c8dff0]" style={{ width: 260 }}>
        <div className="flex items-center justify-between px-2 py-0.5 text-[8px] font-bold bg-[#1e6091] text-white">
          <span>{shown.filter(f => !f.is_hidden).length} shown</span>
          {hidden.length > 0 && <span className="bg-pink-400/80 px-1 rounded">{hidden.length} hid</span>}
        </div>

        <div className="custom-scrollbar" style={{ maxHeight: 260, overflowY: 'auto' }}>
          {shown.length === 0 && <div className="text-center text-[10px] text-slate-500 py-4">No features</div>}
          {shown.map((row, fi) => (
            <div
              key={row.feature_name + '-' + fi}
              className={`group flex items-center gap-1.5 px-2 py-[3px] border-b last:border-0 text-[9px] ${
                row.is_hidden ? 'bg-pink-100 border-pink-200' : 'bg-sky-100/80 border-sky-200'
              }`}
            >
              <span className={`flex-1 truncate font-semibold ${row.is_hidden ? 'text-pink-700' : 'text-slate-800'}`}>{row.feature_name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Model Priority Popup ────────────────────────────────────────────────────────

interface ModelPriorityPopupProps {
  card: ModelStackCard;
  onClose: () => void;
  onSave: (newOrder: string[], hiddenStates: Record<string, boolean>) => void;
}

import { Search } from 'lucide-react';

const ModelPriorityPopup: React.FC<ModelPriorityPopupProps> = ({ card, onClose, onSave }) => {
  const [features, setFeatures] = useState<{name: string, is_hidden: boolean}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const dragIdx = useRef<number | null>(null);

  useEffect(() => {
    const rankMap = new Map<string, number>();
    const hiddenMap = new Map<string, boolean>();
    
    card.variant_blocks.forEach(v => {
      v.features.forEach(f => {
        if (!rankMap.has(f.feature_name) || f.display_order < rankMap.get(f.feature_name)!) {
          rankMap.set(f.feature_name, f.display_order);
        }
        if (!hiddenMap.has(f.feature_name)) {
          hiddenMap.set(f.feature_name, f.is_hidden);
        } else if (f.is_hidden) {
          hiddenMap.set(f.feature_name, true);
        }
      });
    });

    const unique = Array.from(rankMap.keys()).sort((a, b) => rankMap.get(a)! - rankMap.get(b)!);
    setFeatures(unique.map(name => ({ name, is_hidden: hiddenMap.get(name)! })));
  }, [card]);

  const dropFeat = (dropIdx: number) => {
    const di = dragIdx.current;
    dragIdx.current = null;
    if (di === null || di === dropIdx) return;
    const reord = [...features];
    const [m] = reord.splice(di, 1);
    reord.splice(dropIdx, 0, m);
    setFeatures(reord);
  };

  const toggleHide = (name: string) => {
    setFeatures(features.map(f => f.name === name ? { ...f, is_hidden: !f.is_hidden } : f));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const order = features.map(f => f.name);
      
      const hiddenStates: Record<string, boolean> = {};
      for (const f of features) {
        hiddenStates[f.name] = f.is_hidden;
      }

      await reorderFeatureStackUpPrefsBulk(card.source, card.car_id, order, hiddenStates);

      onSave(order, hiddenStates);
    } catch (e) {
      console.error(e);
      alert('Failed to save priority');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-[400px] flex flex-col max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
          <h3 className="font-bold text-slate-800 text-[13px] flex items-center gap-2">
            <GripVertical size={14} className="text-slate-400" />
            Model Priority & Visibility
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X size={16} />
          </button>
        </div>
        <div className="p-3 bg-slate-100 border-b flex flex-col gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-[11px] focus:outline-none focus:border-[#1e6091] focus:ring-1 focus:ring-[#1e6091]"
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-slate-500 font-semibold">Drag to reorder features</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setFeatures(features.map(f => ({...f, is_hidden: false})))} className="text-[10px] text-[#1e6091] font-bold hover:underline">Select All</button>
              <span className="text-slate-300">|</span>
              <button onClick={() => setFeatures(features.map(f => ({...f, is_hidden: true})))} className="text-[10px] text-slate-500 font-bold hover:underline">Clear All</button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {features.map((f, i) => ({f, i})).filter(x => x.f.name.toLowerCase().includes(searchTerm.toLowerCase())).map(({f, i}) => (
            <div
              key={f.name}
              draggable={searchTerm === ''} // Only allow drag when not searching to prevent wrong index dropping
              onDragStart={(e) => { e.stopPropagation(); dragIdx.current = i; }}
              onDragOver={(e) => { e.stopPropagation(); e.preventDefault(); }}
              onDrop={(e) => { e.stopPropagation(); dropFeat(i); }}
              className={`group flex items-center gap-2 px-3 py-2 mb-1 border rounded text-[11px] font-semibold bg-white shadow-sm transition-colors ${
                searchTerm === '' ? 'cursor-move' : ''
              } ${f.is_hidden ? 'border-slate-200 text-slate-400 bg-slate-50' : 'border-sky-200 text-slate-700'}`}
            >
              <GripVertical size={12} className={`shrink-0 ${f.is_hidden ? 'text-slate-200' : 'text-slate-300'}`} />
              <input
                type="checkbox"
                checked={!f.is_hidden}
                onChange={() => toggleHide(f.name)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#1e6091] focus:ring-[#1e6091] cursor-pointer"
              />
              <span className={`flex-1 truncate ${f.is_hidden ? 'line-through decoration-slate-300' : ''}`}>
                {f.name}
              </span>
            </div>
          ))}
          {features.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
            <div className="text-center text-slate-400 text-[11px] py-4">No features found</div>
          )}
        </div>
        <div className="p-3 border-t bg-slate-50 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} disabled={saving} className="px-4 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-[#1e6091] hover:bg-[#164a73] transition-colors flex items-center gap-2 shadow-sm">
            {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Model Column ─────────────────────────────────────────────────────────────

interface ModelColumnProps {
  card: ModelStackCard;
  onCardUpdate: (c: ModelStackCard) => void;
  loadingVariantId?: string;
}

const ModelColumn: React.FC<ModelColumnProps> = ({ card, onCardUpdate, loadingVariantId }) => {
  const [showHidden, setShowHidden] = useState(false);
  const [showPriorityPopup, setShowPriorityPopup] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const dropRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.85);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setScale(s => Math.min(1.0, Math.max(0.5, s - e.deltaY * 0.005)));
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const processedBlocks = card.variant_blocks.map(block => {
    const isCompletelyEmpty = block.features.every(f => f.value === 'No information found');
    return isCompletelyEmpty ? { ...block, features: [] } : block;
  });

  const handleVariantDrop = (dropIdx: number) => {
    const di = draggingIdx;
    setDraggingIdx(null);
    if (di === null || di === dropIdx) return;
    const nb = [...card.variant_blocks];
    const [m] = nb.splice(di, 1);
    nb.splice(dropIdx, 0, m);
    onCardUpdate({ ...card, variant_blocks: nb });
  };

  return (
    <div className="flex flex-col shrink-0 flex-1 min-w-[340px] max-w-[450px] h-full border-r border-slate-400/50 pr-4 mr-3 last:border-0 last:pr-0 last:mr-0">
      <div className="flex-1 rounded-2xl border-2 border-slate-400 overflow-hidden shadow bg-[#e0e0e0] flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 bg-slate-500 shrink-0 h-9">
          <div className="text-[11px] font-black text-white truncate max-w-[180px] uppercase tracking-wide">
             {card.brand === 'NM' ? 'NM' : card.brand} {card.model_name}
          </div>
          <div className="flex items-center gap-2">
            {loadingVariantId && <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />}
            <div className="text-[10px] text-slate-200 font-bold pr-1">
              {card.variant_blocks.length} variant{card.variant_blocks.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div ref={containerRef} className="p-4 overflow-y-auto overflow-x-auto custom-scrollbar flex-1">
          <div style={{ zoom: scale } as React.CSSProperties}>
            {processedBlocks.length === 0 ? (
              <div className="text-[11px] text-slate-500 text-center py-10 px-4">No variants with features.<br/><span className="text-slate-400 text-[10px]">Use the sidebar to add variants.</span></div>
            ) : (
              processedBlocks.map((block, idx) => (
              <VariantCard
                key={block.variant_id}
                block={block}
                showHidden={showHidden}
                index={idx}
                total={processedBlocks.length}
                isDragging={draggingIdx === idx}
                onDragStart={() => setDraggingIdx(idx)}
                onDragOver={(e) => { e.preventDefault(); dropRef.current = idx; }}
                onDrop={() => handleVariantDrop(idx)}
              />
            ))
          )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 px-3 py-2 bg-slate-200 border-t border-slate-300 shrink-0">
          <button
            onClick={() => setShowPriorityPopup(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all bg-white shadow-sm text-slate-700 hover:text-[#1e6091] border border-slate-300"
          >
            <GripVertical size={12} />
          Priority
        </button>
        <button
          onClick={() => setShowHidden(false)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
            !showHidden ? 'text-[#1e6091] bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${!showHidden ? 'bg-[#1e6091]' : 'bg-slate-300'}`} />
          All
        </button>
        <button
          onClick={() => setShowHidden(true)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
            showHidden ? 'text-pink-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${showHidden ? 'bg-pink-500' : 'bg-slate-300'}`} />
          Hidden
        </button>
      </div>

      {showPriorityPopup && (
        <ModelPriorityPopup
          card={card}
          onClose={() => setShowPriorityPopup(false)}
          onSave={(newOrder, hiddenStates) => {
            const newBlocks = card.variant_blocks.map(v => {
              const rank = new Map<string, number>();
              newOrder.forEach((n, i) => rank.set(n, i));
              const newFeatures = [...v.features].map(f => ({
                ...f,
                is_hidden: hiddenStates[f.feature_name] !== undefined ? hiddenStates[f.feature_name] : f.is_hidden
              })).sort((a, b) => {
                const rA = rank.has(a.feature_name) ? rank.get(a.feature_name)! : 999;
                const rB = rank.has(b.feature_name) ? rank.get(b.feature_name)! : 999;
                return rA - rB;
              }).map((f, i) => ({ ...f, display_order: i }));
              return { ...v, features: newFeatures };
            });
            onCardUpdate({ ...card, variant_blocks: newBlocks });
            setShowPriorityPopup(false);
          }}
        />
      )}
      </div>
    </div>
  );
};

// ─── Mapping Popup ────────────────────────────────────────────────────────────

interface MappingPopupProps {
  compCard: ModelStackCard;
  allCards: ModelStackCard[];
  mappingState: { targetModelKey: string; map: Record<string, string> };
  onSave: (targetModelKey: string, map: Record<string, string>) => void;
  onClose: () => void;
}

const MappingPopup: React.FC<MappingPopupProps> = ({ compCard, allCards, mappingState, onSave, onClose }) => {
  const [targetModelKey, setTargetModelKey] = useState<string>(mappingState.targetModelKey);
  const [localMap, setLocalMap] = useState<Record<string, string>>({ ...mappingState.map });

  const setMap = (compId: string, baseId: string) => setLocalMap((prev) => ({ ...prev, [compId]: baseId }));
  
  const targetCard = allCards.find(c => c.model_key === targetModelKey);
  const availableTargets = allCards.filter(c => c.model_key !== compCard.model_key);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="relative bg-[#f8f5d0] border-[6px] border-black rounded-[40px] px-6 py-8 min-w-[380px] max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        
        <button onClick={onClose} className="absolute top-4 right-5 text-slate-500 hover:text-black font-black text-lg">✕</button>

        <div className="flex items-end justify-between mb-8 gap-4 px-2">
          <div className="flex flex-col items-center flex-1">
            <div className="w-full bg-slate-100 border border-slate-400 rounded px-2 py-1.5 text-[12px] font-bold text-center text-slate-500 cursor-not-allowed mb-2 flex justify-between items-center">
              <span>{compCard.brand}</span>
              <ChevronDown size={14} className="opacity-50" />
            </div>
            <div className="bg-[#679ba1] text-slate-900 font-bold px-4 py-1.5 rounded shadow-sm text-sm">
              {compCard.model_name}
            </div>
          </div>

          <div className="flex flex-col items-center flex-1">
            <div className="w-full relative mb-2">
              <select 
                value={targetModelKey} 
                onChange={(e) => { setTargetModelKey(e.target.value); setLocalMap({}); }}
                className="w-full appearance-none bg-white border border-slate-400 rounded px-2 py-1.5 text-[12px] font-bold text-center outline-none cursor-pointer"
              >
                <option value="">— Select Target —</option>
                {availableTargets.map(c => <option key={c.model_key} value={c.model_key}>{c.brand} — {c.model_name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-2 pointer-events-none text-slate-500" />
            </div>
            {targetCard && (
              <div className="bg-[#679ba1] text-slate-900 font-bold px-4 py-1.5 rounded shadow-sm text-sm">
                {targetCard.model_name}
              </div>
            )}
          </div>
        </div>

        {targetCard ? (
          <div className="flex justify-center mb-6">
            <div className="flex flex-col gap-2">
              {compCard.variant_blocks.map((cv) => {
                const currentBase = localMap[cv.variant_id] || '';
                return (
                  <div key={cv.variant_id} className="flex items-center gap-4">
                    <div className="w-16 bg-[#679ba1] text-slate-900 font-bold py-2 rounded text-center text-[13px] shadow-sm">
                      {cv.variant_class}
                    </div>
                    <ArrowLeft size={28} className="text-[#2b4c3b] font-black shrink-0" strokeWidth={3.5} />
                    <div className="relative w-16">
                      <select
                        value={currentBase}
                        onChange={(e) => setMap(cv.variant_id, e.target.value)}
                        className="w-full appearance-none text-[13px] font-bold rounded py-2 text-center outline-none cursor-pointer shadow-sm"
                        style={{ background: '#679ba1', color: '#1e293b' }}
                      >
                        <option value="">—</option>
                        {targetCard.variant_blocks.map((bv) => (
                          <option key={bv.variant_id} value={bv.variant_id}>{bv.variant_class}</option>
                        ))}
                      </select>
                      {!currentBase && <ChevronDown size={12} className="absolute right-1 top-[10px] pointer-events-none text-slate-700" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-500 text-xs font-bold py-8">
            Please select a target model from the dropdown above.
          </div>
        )}

        <button
          onClick={() => { onSave(targetModelKey, localMap); onClose(); }}
          disabled={!targetModelKey}
          className={`w-full text-sm font-black py-3 rounded-xl transition-colors shadow-sm ${targetModelKey ? 'bg-[#2b4c3b] hover:bg-[#1a3125] text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
        >
          Confirm Mapping
        </button>
      </div>
    </div>
  );
};

// ─── Comparison Block ─────────────────────────────────────────────────────────

interface CompBlockProps {
  compVariant: VariantBlockData;
  baseVariant: VariantBlockData;
  label: string;
  idx: number;
  total: number;
  activeFilters: Record<CompColor, boolean>;
  targetFeatureNames: Set<string>;
  showHidden: boolean;
  onVariantUpdate: (v: VariantBlockData) => void;
}

const ComparisonBlock: React.FC<CompBlockProps> = ({ compVariant, baseVariant, label, idx, total, activeFilters, targetFeatureNames, showHidden, onVariantUpdate }) => {
  const staggerL = (total - idx - 1) * 16;

  const baseFeatMap = new Map<string, string>();
  baseVariant.features.forEach((f) => baseFeatMap.set(f.feature_name.trim().toLowerCase(), f.value));

  const mappedFeatures = compVariant.features
    .map(f => {
      const fName = f.feature_name.trim().toLowerCase();
      const bv2 = baseFeatMap.get(fName);
      const inBase = targetFeatureNames.has(fName);
      const color = classify(f.value, bv2, inBase);
      return { f, color, baseVal: bv2 };
    })
    .filter(r => {
      const compVal = r.f.value;
      const baseVal = r.baseVal;
      const hC = !!compVal && compVal.trim() !== '' && compVal.toLowerCase() !== 'no' && compVal.toLowerCase() !== 'no information found';
      const hB = !!baseVal && baseVal.trim() !== '' && baseVal.toLowerCase() !== 'no' && baseVal.toLowerCase() !== 'no information found';
      return hC || hB;
    });

  const shown = mappedFeatures.filter(r => activeFilters[r.color] && (showHidden ? r.f.is_hidden : !r.f.is_hidden));
  const diffCount = mappedFeatures.filter(r => r.color !== 'same').length;

  const toggleHide = async (row: StackUpFeatureRow) => {
    const next = !row.is_hidden;
    onVariantUpdate({ ...compVariant, features: compVariant.features.map((f) => f.feature_name === row.feature_name ? { ...f, is_hidden: next } : f) });
    try { await upsertFeatureStackUpPref({ variant_ref_type: compVariant.variant_ref_type, variant_id: compVariant.variant_id, feature_id: row.feature_id, feature_name: row.feature_name, is_hidden: next }); } catch { }
  };

  return (
    <div className="flex items-start mb-2" style={{ marginLeft: staggerL }}>
      <div className="text-right shrink-0 pt-1 pr-2" style={{ width: 72 }}>
        <span className="text-[8.5px] font-black text-slate-600 leading-tight block">{label}</span>
      </div>
      <div className="rounded-xl border-2 border-slate-400 bg-white shadow-sm flex-shrink-0 overflow-hidden" style={{ width: 260 }}>
        <div className="flex items-center justify-between px-2 py-1 bg-slate-100 text-[8px] font-bold text-slate-600">
          <span className="font-bold text-slate-700 truncate">{compVariant.variant_class}</span>
        </div>
        <div style={{ maxHeight: 260, overflowY: 'auto' }}>
          {shown.length === 0 && <div className="text-center text-[9px] text-slate-400 py-3">No features to display</div>}
          {shown.map(({ f, color, baseVal }, fi) => (
            <div
              key={f.feature_name + '-' + fi}
              className={`group flex items-center px-1.5 py-0.5 border-b last:border-0 text-[9px] border ${COMP_COLORS[color].bg}`}
            >
              <span className={`flex-1 break-words leading-[1.2] font-medium ${COMP_COLORS[color].text}`}>{f.feature_name}</span>
              {color === 'change' && (
                <span className={`shrink-0 ml-1 max-w-[120px] break-words leading-[1.2] text-[8px] ${COMP_COLORS[color].text}`}>
                  {baseVal || 'No info'} ➔ {f.value || 'No info'}
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); toggleHide(f); }}
                className={`shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 ${COMP_COLORS[color].text}`}
              >
                {f.is_hidden ? <EyeOff size={9} /> : <Eye size={9} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Comparison Card ──────────────────────────────────────────────────────────

interface CompCardProps {
  compCard: ModelStackCard;
  allCards: ModelStackCard[];
  mappingState: { targetModelKey: string; map: Record<string, string> };
  onMappingUpdate: (targetKey: string, map: Record<string, string>) => void;
  onCardUpdate: (c: ModelStackCard) => void;
}

const ComparisonCard: React.FC<CompCardProps> = ({ compCard, allCards, mappingState, onMappingUpdate, onCardUpdate }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [showPriorityPopup, setShowPriorityPopup] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<CompColor, boolean>>({
    same: true, change: true, addition: true, deletion: true, absent: true
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setScale(s => Math.min(1.0, Math.max(0.5, s - e.deltaY * 0.005)));
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const targetCard = allCards.find(c => c.model_key === mappingState.targetModelKey);

  const compRows: { compVariant: VariantBlockData; baseVariant: VariantBlockData; label: string }[] = [];
  const targetFeatureNames = new Set<string>();

  if (targetCard) {
    targetCard.variant_blocks.forEach((bv) => bv.features.forEach((f) => {
      const val = f.value?.trim().toLowerCase();
      if (val && val !== 'no' && val !== 'no information found') {
        targetFeatureNames.add(f.feature_name.trim().toLowerCase());
      }
    }));
    compCard.variant_blocks.forEach((cv) => {
      const baseVarId = mappingState.map[cv.variant_id];
      const bv = baseVarId ? targetCard.variant_blocks.find(b => b.variant_id === baseVarId) : undefined;
      if (bv) {
        compRows.push({ compVariant: cv, baseVariant: bv, label: `${cv.variant_class} wrt ${bv.variant_class}` });
      }
    });
  }

  const toggleFilter = (c: CompColor) => setActiveFilters(p => ({ ...p, [c]: !p[c] }));

  return (
    <div className="flex flex-col shrink-0 flex-1 min-w-[340px] max-w-[450px] h-full border-r border-slate-400/50 pr-4 mr-3 last:border-0 last:pr-0 last:mr-0 relative">
      <div className="flex-1 rounded-2xl border-2 border-slate-400 overflow-hidden shadow bg-[#e0e0e0] flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 bg-slate-500 shrink-0 h-9">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowPopup(true)}
              className="flex items-center justify-center w-5 h-5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors shadow-sm"
              title="Map variants"
            >
              <ArrowRightLeft size={10} strokeWidth={2.5} />
            </button>
            <div className="flex items-center gap-1.5">
              {(Object.keys(COMP_COLORS) as CompColor[]).map((c) => (
                <button
                  key={c}
                  onClick={() => toggleFilter(c)}
                  title={COMP_COLORS[c].label}
                  className={`w-2.5 h-2.5 rounded-full shadow-sm transition-all ${
                    activeFilters[c] ? `${COMP_COLORS[c].circleBg || COMP_COLORS[c].bg}` : 'bg-slate-300 border-slate-400 opacity-50 grayscale'
                  }`}
                  style={{ backgroundColor: activeFilters[c] ? COMP_COLORS[c].circleBg || COMP_COLORS[c].bg : undefined }}
                />
              ))}
            </div>
          </div>
          <div className="text-[11px] font-black text-white truncate max-w-[150px] uppercase tracking-wide text-right">
             {compCard.brand === 'NM' ? 'NM' : compCard.brand} {compCard.model_name}
          </div>
        </div>
        <div ref={containerRef} className="p-4 overflow-y-auto overflow-x-auto custom-scrollbar flex-1">
          <div style={{ zoom: scale } as React.CSSProperties}>
            {compRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                <ArrowRightLeft size={28} className="text-slate-300" />
                <div className="text-slate-400 text-[11px] font-bold">No mapping set</div>
                <div className="text-slate-400 text-[10px]">Click "Map" to map variants for comparison</div>
              </div>
            ) : (
            <div>
              {compRows.map(({ compVariant, baseVariant, label }, idx) => (
                <ComparisonBlock
                  key={compVariant.variant_id}
                  compVariant={compVariant}
                  baseVariant={baseVariant}
                  label={label}
                  idx={idx}
                  total={compRows.length}
                  activeFilters={activeFilters}
                  targetFeatureNames={targetFeatureNames}
                  showHidden={showHidden}
                  onVariantUpdate={(updatedVar) => {
                    onCardUpdate({
                      ...compCard,
                      variant_blocks: compCard.variant_blocks.map(v => v.variant_id === updatedVar.variant_id ? updatedVar : v)
                    });
                  }}
                />
              ))}
            </div>
          )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 px-3 py-2 bg-slate-200 border-t border-slate-300 shrink-0">
          <button
            onClick={() => setShowPriorityPopup(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all bg-white shadow-sm text-slate-700 hover:text-[#1e6091] border border-slate-300"
          >
            <GripVertical size={12} />
            Priority
          </button>
          <button
            onClick={() => setShowHidden(false)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
              !showHidden ? 'text-[#1e6091] bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${!showHidden ? 'bg-[#1e6091]' : 'bg-slate-300'}`} />
            All
          </button>
          <button
            onClick={() => setShowHidden(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
              showHidden ? 'text-pink-600 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${showHidden ? 'bg-pink-500' : 'bg-slate-300'}`} />
            Hidden
          </button>
        </div>
      </div>

      {showPopup && (
        <MappingPopup
          compCard={compCard}
          allCards={allCards}
          mappingState={mappingState}
          onSave={onMappingUpdate}
          onClose={() => setShowPopup(false)}
        />
      )}

      {showPriorityPopup && (
        <ModelPriorityPopup
          card={compCard}
          onClose={() => setShowPriorityPopup(false)}
          onSave={(newOrder, hiddenStates) => {
            const newBlocks = compCard.variant_blocks.map(v => {
              const rank = new Map<string, number>();
              newOrder.forEach((n, i) => rank.set(n, i));
              const newFeatures = [...v.features].map(f => ({
                ...f,
                is_hidden: hiddenStates[f.feature_name] !== undefined ? hiddenStates[f.feature_name] : f.is_hidden
              })).sort((a, b) => {
                const rA = rank.has(a.feature_name) ? rank.get(a.feature_name)! : 999;
                const rB = rank.has(b.feature_name) ? rank.get(b.feature_name)! : 999;
                return rA - rB;
              }).map((f, i) => ({ ...f, display_order: i }));
              return { ...v, features: newFeatures };
            });
            onCardUpdate({ ...compCard, variant_blocks: newBlocks });
            setShowPriorityPopup(false);
          }}
        />
      )}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

type StackTab = 'model' | 'comparison';

interface FeatureStackUpPageProps {
  initialSelections?: SelectionState[];
}

const FeatureStackUpPage: React.FC<FeatureStackUpPageProps> = ({ initialSelections }) => {
  // ── Tab state — persisted across page renders ──
  const [activeTab, setActiveTab] = useState<StackTab>(() => {
    return (sessionStorage.getItem('stackup_activeTab') as StackTab) || 'model';
  });

  // ── All data state lives here so it survives tab switches ──
  const [selections, setSelections] = useState<StackUpSelection[]>([]);
  const [loadedBlocks, setLoadedBlocks] = useState<Record<string, VariantBlockData>>({});
  const [compMappings, setCompMappings] = useState<Record<string, { targetModelKey: string; map: Record<string, string> }>>(() => {
    const saved = sessionStorage.getItem('stackup_compMappings');
    return saved ? JSON.parse(saved) : {};
  });
  const [loadingVariantIds, setLoadingVariantIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    sessionStorage.setItem('stackup_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem('stackup_compMappings', JSON.stringify(compMappings));
  }, [compMappings]);

  const cardsShells = groupSelectionsIntoCards(selections);
  const cards: ModelStackCard[] = cardsShells.map(shell => {
    const blocks: VariantBlockData[] = [];
    selections.forEach(sel => {
      const key = `${sel.source}__${sel.car_id}`;
      if (key === shell.model_key) {
        const vid = sel.variant_id || sel.variant_class;
        const loaded = loadedBlocks[`${key}__${vid}`];
        if (loaded) blocks.push(loaded);
      }
    });
    return { ...shell, variant_blocks: blocks };
  });

  // ── Fetch data only for new selections ──
  useEffect(() => {
    const fetchNewSelections = async () => {
      const needed = selections.filter(sel => {
        const key = `${sel.source}__${sel.car_id}__${sel.variant_id || sel.variant_class}`;
        return !loadedBlocks[key] && !loadingVariantIds.has(key);
      });

      if (needed.length === 0) return;

      const newLoading = new Set(loadingVariantIds);
      needed.forEach(sel => newLoading.add(`${sel.source}__${sel.car_id}__${sel.variant_id || sel.variant_class}`));
      setLoadingVariantIds(newLoading);

      const newBlocks: Record<string, VariantBlockData> = {};

      await Promise.all(needed.map(async (sel) => {
        try {
          let raw: any[] = [];
          const vid = sel.variant_id || sel.variant_class;

          if (sel.source === 'production') {
            const d = await fetchVariantClassDetails(sel.variant_class, 1);
            raw = (d.features || []).map((f: any) => {
              const vals = Object.values(f.sub_variant_values || {}).filter((v) => v !== null && v !== undefined && v !== '');
              const value = vals.length ? Array.from(new Set(vals)).join(' / ') : 'No information found';
              return { feature_id: f.feature_id, feature_name: f.feature_name, category: f.category, value };
            });
          } else {
            const r = await getNMVariantFeatures(vid);
            raw = (r.data || []).map((f: any) => ({
              feature_id: f.feature_id, feature_name: f.feature_name, category: f.category,
              value: f.feature_value || 'No information found',
            }));
          }

          const prefsResp = await fetchFeatureStackUpPrefsBulk(sel.source, [sel.car_id]);
          const prefs = prefsResp[sel.car_id] || [];

          newBlocks[`${sel.source}__${sel.car_id}__${vid}`] = {
            variant_ref_type: sel.source,
            variant_id: vid,
            variant_class: sel.variant_class,
            car_id: sel.car_id,
            features: applyPrefs(raw, prefs)
          };
        } catch (e) {
          console.error("Failed to load", sel, e);
        }
      }));

      setLoadedBlocks(prev => ({ ...prev, ...newBlocks }));
      setLoadingVariantIds(prev => {
        const next = new Set(prev);
        needed.forEach(sel => next.delete(`${sel.source}__${sel.car_id}__${sel.variant_id || sel.variant_class}`));
        return next;
      });
    };

    fetchNewSelections();
  }, [selections]);

  const updateCard = (u: ModelStackCard) => {
    const newBlocks = { ...loadedBlocks };
    u.variant_blocks.forEach(b => {
      newBlocks[`${u.source}__${u.car_id}__${b.variant_id}`] = b;
    });
    setLoadedBlocks(newBlocks);
  };

  const anyLoading = loadingVariantIds.size > 0;
  const mappedCount = Object.keys(compMappings).filter(k => compMappings[k].targetModelKey).length;

  return (
    <div className="flex h-screen font-sans text-slate-900 bg-[#c0ccd4] overflow-hidden">
      <StackUpSidebar initialSelections={initialSelections} onSelectionChange={setSelections} />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* ── Header ── */}
        <header className="flex-shrink-0 bg-white border-b border-slate-200 shadow-sm z-20">
          <div className="flex items-center justify-between h-12">
            <div className="flex h-full">
              <button
                onClick={() => setActiveTab('model')}
                className={`flex items-center gap-2 px-6 h-full text-[12px] font-bold border-b-2 transition-all ${
                  activeTab === 'model'
                    ? 'border-[#1e6091] text-[#1e6091] bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Layers size={14} />
                Model Stack
                {cards.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === 'model' ? 'bg-[#1e6091] text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {cards.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`flex items-center gap-2 px-6 h-full text-[12px] font-bold border-b-2 transition-all ${
                  activeTab === 'comparison'
                    ? 'border-[#6878a0] text-[#6878a0] bg-indigo-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ArrowRightLeft size={14} />
                Comparison Stack
                {mappedCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === 'comparison' ? 'bg-[#6878a0] text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {mappedCount}
                  </span>
                )}
              </button>
              {anyLoading && (
                <div className="flex items-center gap-1.5 ml-4 text-[10px] text-slate-500 font-semibold">
                  <div className="w-3 h-3 border-2 border-[#1e6091] border-t-transparent rounded-full animate-spin" />
                  Loading...
                </div>
              )}
            </div>
            {/* Color legend */}
            <div className="hidden lg:flex items-center gap-2 text-[8px] font-bold text-slate-500 uppercase bg-slate-50 px-3 py-1 rounded-full border border-slate-200 mr-5">
              {Object.entries(COMP_COLORS).map(([k, v]) => (
                <span key={k} className={`flex items-center gap-1 ${v.text}`}>
                  <span className={`w-2 h-2 rounded-sm inline-block border ${v.circleBg}`} />{v.label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Tabs Content ── */}
        </header>

        {/* ── Model Stack Tab ── */}
        <div
          className={`flex-1 overflow-hidden ${activeTab === 'model' ? 'flex' : 'hidden'}`}
          style={{ background: '#b8c8d4' }}
        >
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
            {cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <Layers size={48} className="text-slate-400" />
                <p className="text-base font-black text-slate-500">No Models Selected</p>
                <p className="text-[11px] text-slate-400 max-w-xs">Use the sidebar on the left to select variant classes to stack up.</p>
              </div>
            ) : (
              <div className="flex gap-0 min-w-max h-full">
                {cards.map((card) => {
                  const isLoad = Array.from(loadingVariantIds).some(id => id.startsWith(card.model_key));
                  return (
                    <ModelColumn
                      key={card.model_key}
                      card={card}
                      onCardUpdate={updateCard}
                      loadingVariantId={isLoad ? 'loading' : undefined}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Comparison Stack Tab ── */}
        <div
          className={`flex-1 overflow-hidden ${activeTab === 'comparison' ? 'flex' : 'hidden'}`}
          style={{ background: '#c8d0e0' }}
        >
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
            {cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <ArrowRightLeft size={48} className="text-slate-400" />
                <p className="text-base font-black text-slate-500">No Models to Compare</p>
                <p className="text-[11px] text-slate-400 max-w-xs">First select models in the "Model Stack" tab, then switch here to map and compare them.</p>
              </div>
            ) : (
              <div className="flex gap-0 min-w-max h-full">
                {cards.map((card) => {
                  const modelMapping = compMappings[card.model_key] || { targetModelKey: '', map: {} };
                  return (
                    <ComparisonCard
                      key={card.model_key}
                      compCard={card}
                      allCards={cards}
                      mappingState={modelMapping}
                      onMappingUpdate={(tk, m) => setCompMappings((prev) => ({ ...prev, [card.model_key]: { targetModelKey: tk, map: m } }))}
                      onCardUpdate={updateCard}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default FeatureStackUpPage;
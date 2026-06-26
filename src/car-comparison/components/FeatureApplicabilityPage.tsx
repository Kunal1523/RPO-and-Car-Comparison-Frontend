// src/car-comparison/components/FeatureApplicabilityPage.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Check, Search, ChevronDown, Loader2, X } from 'lucide-react';
import {
  fetchBrandsList,
  fetchFeaturesList,
  fetchFeatureApplicability,
  FeatureApplicabilityRow,
} from '../services/api';

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPTY_VALUES = new Set(['no', 'no information available', 'no information found', 'n/a', '-', '']);

// ─── Pivot Builder ────────────────────────────────────────────────────────────

interface PivotRow {
  body_type: string;
  sub_body_type: string;
  brand: string;
  model: string;
  cells: Record<string, { has_feature: boolean | null; sub_variants: { name: string; value: string }[] }>;
}

function buildPivot(
  rows: FeatureApplicabilityRow[],
  showBodyType: boolean,
  showSubBodyType: boolean,
  showModels: boolean
) {
  const gradeCols: string[] = [];
  const pivotMap = new Map<string, PivotRow>();

  for (const r of rows) {
    if (!gradeCols.includes(r.variant_class)) gradeCols.push(r.variant_class);

    // Grouping key strictly depends on what is visible
    const bt = showBodyType ? r.body_type : '';
    const sbt = showSubBodyType ? r.sub_body_type : '';
    const m = showModels ? r.model : '';
    const key = `${bt}||${sbt}||${m}`;
    
    if (!pivotMap.has(key)) {
      pivotMap.set(key, {
        body_type: bt,
        sub_body_type: sbt,
        brand: r.brand,
        model: m,
        cells: {},
      });
    }
    
    const rowGroup = pivotMap.get(key)!;
    
    if (!rowGroup.cells[r.variant_class]) {
      rowGroup.cells[r.variant_class] = { has_feature: null, sub_variants: [] };
    }
    
    const cell = rowGroup.cells[r.variant_class];
    
    // If ANY model in this aggregated group has the feature, it's checked
    if (r.has_feature === true) cell.has_feature = true;
    else if (r.has_feature === false && cell.has_feature === null) cell.has_feature = false;
    
    if (r.sub_variants.length > 0) {
      cell.sub_variants.push(...r.sub_variants.map(sv => ({
        ...sv,
        // Prefix with model name if we are aggregating models together, so tooltip makes sense
        name: showModels ? sv.name : `[${r.model}] ${sv.name}`
      })));
    }
  }

  return { gradeCols, pivotRows: Array.from(pivotMap.values()) };
}

// Compute rowSpan indices based on visible body_type
function computeBodySpans(rows: PivotRow[], showBodyType: boolean) {
  const spans: Record<number, number> = {};
  if (!showBodyType) return spans;
  
  let i = 0;
  while (i < rows.length) {
    const bt = rows[i].body_type;
    let count = 0;
    let j = i;
    while (j < rows.length && rows[j].body_type === bt) { count++; j++; }
    spans[i] = count;
    i = j;
  }
  return spans;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipData {
  model: string;
  variantClass: string;
  subVariants: { name: string; value: string }[];
  x: number;
  y: number;
}

const SubVariantTooltip: React.FC<{ data: TooltipData; onClose: () => void }> = ({ data, onClose }) => {
  const isNearRightEdge = typeof window !== 'undefined' && data.x > window.innerWidth - 260;
  return (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        className="fixed z-[9999] bg-white border border-slate-200 shadow-2xl rounded-lg p-3 text-xs min-w-[220px] max-w-xs"
        style={{ 
          top: data.y + 12, 
          left: isNearRightEdge ? 'auto' : data.x,
          right: isNearRightEdge ? 16 : 'auto'
        }}
      >
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
          <span className="font-bold text-slate-800">{data.model}</span>
          <span className="text-blue-600 font-semibold ml-2">{data.variantClass}</span>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-700 pl-2">
            <X size={12} />
          </button>
        </div>
        <div className="space-y-1">
          {data.subVariants.map((sv, i) => {
            const avail = sv.value && !EMPTY_VALUES.has(sv.value.trim().toLowerCase());
            return (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-slate-400 mt-px">{i === data.subVariants.length - 1 ? '└' : '├'}─</span>
                <span className="text-slate-600 flex-1 leading-tight">{sv.name}</span>
                <span className={`font-semibold ${avail ? 'text-green-600' : 'text-red-400'}`}>
                  {sv.value || 'No'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

// ─── Feature Search Dropdown ──────────────────────────────────────────────────

interface FeatureSearchProps {
  features: { feature_id: string; feature_name: string; category: string }[];
  selectedId: string;
  onSelect: (id: string, name: string) => void;
  onClear: () => void;
}

const FeatureSearch: React.FC<FeatureSearchProps> = ({ features, selectedId, onSelect, onClear }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = features.find(f => f.feature_id === selectedId);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const grouped = useMemo(() => {
    const q = query.toLowerCase();
    const map = new Map<string, typeof features>();
    for (const f of features) {
      if (!f.feature_name.toLowerCase().includes(q) && !f.category.toLowerCase().includes(q)) continue;
      if (!map.has(f.category)) map.set(f.category, []);
      map.get(f.category)!.push(f);
    }
    return map;
  }, [features, query]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-300 rounded shadow-sm text-xs hover:border-blue-400 transition-colors min-w-[180px]"
      >
        <Search size={12} className="text-slate-400 flex-shrink-0" />
        <span className={`flex-1 text-left truncate ${selected ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
          {selected ? selected.feature_name : 'Search feature...'}
        </span>
        {selected
          ? <button onClick={e => { e.stopPropagation(); onClear(); setQuery(''); }} className="text-slate-400 hover:text-slate-700"><X size={11} /></button>
          : <ChevronDown size={12} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden w-72">
          <div className="p-2 border-b border-slate-100">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {grouped.size === 0
              ? <div className="py-6 text-center text-xs text-slate-400">No features match</div>
              : Array.from(grouped.entries()).map(([cat, items]) => (
                <div key={cat}>
                  <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-500 bg-slate-50 border-b border-slate-100">
                    {cat}
                  </div>
                  {items.map(f => (
                    <button
                      key={f.feature_id}
                      onClick={() => { onSelect(f.feature_id, f.feature_name); setOpen(false); setQuery(''); }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors flex items-center gap-2 hover:bg-blue-50 ${f.feature_id === selectedId ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`}
                    >
                      {f.feature_id === selectedId
                        ? <Check size={11} className="text-blue-600 flex-shrink-0" />
                        : <span className="w-[11px]" />}
                      {f.feature_name}
                    </button>
                  ))}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const FeatureApplicabilityPage: React.FC = () => {
  // Meta
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [features, setFeatures] = useState<{ feature_id: string; feature_name: string; category: string }[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);

  // Filters
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [featureId, setFeatureId] = useState('');
  const [featureName, setFeatureName] = useState('');
  const [showBodyType, setShowBodyType] = useState(true);
  const [showSubBodyType, setShowSubBodyType] = useState(false);
  const [showModels, setShowModels] = useState(true);
  const [unselectedModels, setUnselectedModels] = useState<string[]>([]);

  // Table data
  const [tableRows, setTableRows] = useState<FeatureApplicabilityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Tooltip
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // ── Load brands + features ──────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([fetchBrandsList(), fetchFeaturesList()])
      .then(([b, f]) => {
        setBrands(b);
        setFeatures(f);
        setSelectedBrands(b.map(br => br.name)); // select all by default
      })
      .catch(e => setError(e.message))
      .finally(() => setMetaLoading(false));
  }, []);

  // ── Fetch table when brands change (or feature changes) ────────────────────
  const fetchTable = useCallback((fId: string, bNames: string[]) => {
    if (bNames.length === 0) { setTableRows([]); return; }
    setLoading(true);
    setError('');
    fetchFeatureApplicability(fId || undefined as any, bNames)
      .then(setTableRows)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!metaLoading) fetchTable(featureId, selectedBrands);
  }, [selectedBrands, featureId, metaLoading, fetchTable]);

  // ── Brand toggles ───────────────────────────────────────────────────────────
  const toggleBrand = (name: string) =>
    setSelectedBrands(prev => prev.includes(name) ? prev.filter(b => b !== name) : [...prev, name]);
  const allSelected = brands.length > 0 && selectedBrands.length === brands.length;
  const toggleAll = () => setSelectedBrands(allSelected ? [] : brands.map(b => b.name));

  // Extract available models from fetched rows
  const availableModels = useMemo(() => {
    const s = new Set<string>();
    tableRows.forEach(r => s.add(r.model));
    return Array.from(s).sort();
  }, [tableRows]);

  const toggleModel = (model: string) => {
    setUnselectedModels(prev => prev.includes(model) ? prev.filter(m => m !== model) : [...prev, model]);
  };

  // Keep unselected models clean
  useEffect(() => {
    setUnselectedModels(prev => prev.filter(m => availableModels.includes(m)));
  }, [availableModels]);

  const filteredRows = useMemo(() => {
    if (unselectedModels.length === 0) return tableRows;
    return tableRows.filter(r => !unselectedModels.includes(r.model));
  }, [tableRows, unselectedModels]);

  // ── Pivot ───────────────────────────────────────────────────────────────────
  const { gradeCols, pivotRows } = useMemo(
    () => buildPivot(filteredRows, showBodyType, showSubBodyType, showModels),
    [filteredRows, showBodyType, showSubBodyType, showModels]
  );
  const bodySpans = useMemo(() => computeBodySpans(pivotRows, showBodyType), [pivotRows, showBodyType]);

  const featureSearched = !!featureId;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>

      {/* ── Controls Bar ── */}
      <div className="flex-shrink-0 border-b border-slate-300 bg-slate-50 px-4 py-2">
        <div className="flex flex-wrap items-start gap-6">

          {/* Feature Search */}
          <div>
            <div className="text-[10px] font-bold text-slate-600 mb-1">Feature to be searched</div>
            {metaLoading
              ? <div className="flex items-center gap-1.5 text-slate-400 text-xs"><Loader2 size={12} className="animate-spin" /> Loading...</div>
              : <FeatureSearch
                  features={features}
                  selectedId={featureId}
                  onSelect={(id, name) => { setFeatureId(id); setFeatureName(name); }}
                  onClear={() => { setFeatureId(''); setFeatureName(''); }}
                />
            }
          </div>

          {/* OEM */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-slate-600">OEM</span>
              <button onClick={toggleAll} className="text-[9px] text-blue-600 hover:underline">
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {brands.map(b => (
                <label key={b.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(b.name)}
                    onChange={() => toggleBrand(b.name)}
                    className="w-3 h-3 accent-blue-600"
                  />
                  <span className="text-[11px] font-semibold text-slate-700">{b.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Columns to include */}
          <div>
            <div className="text-[10px] font-bold text-slate-600 mb-1">Columns to be included</div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Body Type',     state: showBodyType,    setter: setShowBodyType },
                { label: 'Sub Body Type', state: showSubBodyType, setter: setShowSubBodyType },
                { label: 'Models',        state: showModels,      setter: setShowModels },
              ].map(({ label, state, setter }) => (
                <label key={label} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state}
                    onChange={e => setter(e.target.checked)}
                    className="w-3 h-3 accent-blue-600"
                  />
                  <span className="text-[11px] font-semibold text-slate-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* ── Models Filter (Appears below OEMs) ── */}
        {availableModels.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-slate-600">Specific Models</span>
              <button 
                onClick={() => setUnselectedModels(unselectedModels.length === 0 ? availableModels : [])} 
                className="text-[9px] text-blue-600 hover:underline"
              >
                {unselectedModels.length === 0 ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 max-w-4xl">
              {availableModels.map(m => (
                <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!unselectedModels.includes(m)}
                    onChange={() => toggleModel(m)}
                    className="w-3 h-3 accent-blue-600"
                  />
                  <span className="text-[11px] font-semibold text-slate-700">{m}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Table Area ── */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-slate-500 text-sm">
            <Loader2 size={18} className="animate-spin text-blue-500" />
            Loading...
          </div>
        ) : error ? (
          <div className="p-6 text-red-600 text-sm font-medium">Error: {error}</div>
        ) : pivotRows.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
            Select at least one OEM to see the table.
          </div>
        ) : (
          <table className="border-collapse text-[11px]" style={{ width: 'auto', minWidth: '100%' }}>
            <thead>
              <tr style={{ background: '#fff', borderBottom: '2px solid #94a3b8' }}>
                {showBodyType && (
                  <th
                    style={{ border: '1px solid #cbd5e1', padding: '6px 12px', textAlign: 'left', fontWeight: 700, background: '#f8fafc', whiteSpace: 'nowrap', color: '#334155', minWidth: 100 }}
                  >
                    Body Type
                  </th>
                )}
                {showSubBodyType && (
                  <th style={{ border: '1px solid #cbd5e1', padding: '6px 12px', textAlign: 'left', fontWeight: 700, background: '#f8fafc', whiteSpace: 'nowrap', color: '#334155' }}>
                    Sub Body
                  </th>
                )}
                {showModels && (
                  <th style={{ border: '1px solid #cbd5e1', padding: '4px 6px', textAlign: 'left', fontWeight: 700, background: '#f8fafc', whiteSpace: 'nowrap', color: '#334155', minWidth: 100 }}>
                    Models &amp; Grades
                  </th>
                )}
                {gradeCols.map((gc, i) => {
                  const isOptional = gc.toLowerCase().includes('(o)');
                  return (
                    <th
                      key={i}
                      style={{
                        border: '1px solid #cbd5e1',
                        padding: '4px 6px',
                        textAlign: 'center',
                        fontWeight: 700,
                        background: isOptional ? '#fdf4ff' : '#f8fafc',
                        whiteSpace: 'nowrap',
                        color: isOptional ? '#9333ea' : '#334155',
                        fontSize: '10px',
                        minWidth: 40,
                      }}
                    >
                      {gc || '—'}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pivotRows.map((row, ri) => {
                const isBodyStart = bodySpans[ri] !== undefined;
                return (
                  <tr
                    key={ri}
                    style={{ background: ri % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
                  >
                    {/* Body Type — merged */}
                    {showBodyType && isBodyStart && (
                      <td
                        rowSpan={bodySpans[ri]}
                        style={{
                          border: '1px solid #cbd5e1',
                          padding: '4px 6px',
                          fontWeight: 700,
                          color: '#475569',
                          background: '#f1f5f9',
                          verticalAlign: 'middle',
                          whiteSpace: 'nowrap',
                          borderRight: '2px solid #94a3b8',
                        }}
                      >
                        {row.body_type || '—'}
                      </td>
                    )}

                    {/* Sub Body Type */}
                    {showSubBodyType && (
                      <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', color: '#64748b' }}>
                        {row.sub_body_type || '—'}
                      </td>
                    )}

                    {/* Model Name */}
                    {showModels && (
                      <td style={{ border: '1px solid #e2e8f0', padding: '4px 6px', fontWeight: 500, color: '#1e293b', whiteSpace: 'nowrap' }}>
                        {row.model}
                      </td>
                    )}

                    {/* Grade Cells */}
                    {gradeCols.map((gc, ci) => {
                      const cell = row.cells[gc];

                      // No data for this model × grade at all
                      if (!cell) {
                        return (
                          <td
                            key={ci}
                            style={{ border: '1px solid #e2e8f0', background: '#f1f5f9', textAlign: 'center', color: '#94a3b8', fontSize: 10 }}
                          />
                        );
                      }

                      // Feature not yet searched → show empty cell (structure only)
                      if (!featureSearched || cell.has_feature === null) {
                        return (
                          <td
                            key={ci}
                            style={{ border: '1px solid #e2e8f0', background: '#fff', textAlign: 'center', minWidth: 40, height: 24 }}
                          />
                        );
                      }

                      // Feature searched → show tick or empty
                      const hasTick = cell.has_feature === true;
                      return (
                        <td
                          key={ci}
                          onClick={e => {
                            if (!hasTick || cell.sub_variants.length === 0) return;
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setTooltip({
                              model: row.model,
                              variantClass: gc,
                              subVariants: cell.sub_variants,
                              x: rect.left,
                              y: rect.bottom,
                            });
                          }}
                          style={{
                            border: '1px solid #e2e8f0',
                            background: '#fff',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            cursor: hasTick ? 'pointer' : 'default',
                            minWidth: 40,
                            height: 24,
                            position: 'relative',
                          }}
                          title={hasTick ? `Click to see sub-variant breakdown` : ''}
                        >
                          {hasTick && (
                            <svg viewBox="0 0 24 24" width="12" height="12" style={{ display: 'inline-block' }} fill="none" stroke="#16a34a" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Tooltip */}
      {tooltip && <SubVariantTooltip data={tooltip} onClose={() => setTooltip(null)} />}
    </div>
  );
};

export default FeatureApplicabilityPage;

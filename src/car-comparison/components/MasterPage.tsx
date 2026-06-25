import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Plus, Trash2, GripVertical } from 'lucide-react';
import {
  fetchFeatureMasterCategoryWise,
  fetchMasterValues,
  addMasterValue,
  deleteMasterValue,
  fetchNewModels,
  createNewModel,
  addNewModelVariant,
  updateNewModelVariant,
  deleteNewModelVariant
} from '../services/api';
import FeatureMasterSection from './FeatureMasterSection';

const BODY_TYPES = [
  'Hatch', 'Sedan', 'SUV', 'MUV', 'MPV',
  'Coupe', 'Convertible', 'Wagon', 'Pickup', 'Van', 'Crossover'
];
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

type MappedCar = { oem: string; model: string; bodyType: string; subBodyType: string };

// ─────────────────────────────────────────────────────────────────────────────
// ChipPicker
// ─────────────────────────────────────────────────────────────────────────────
interface ChipPickerProps {
  options: string[];
  selected: string[];
  onChange: (vals: string[]) => void;
  readOnly?: boolean;
}
const ChipPicker: React.FC<ChipPickerProps> = ({ options, selected, onChange, readOnly }) => {
  const toggle = (val: string) => {
    if (readOnly) return;
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };
  if (!options.length) return <span className="text-[10px] text-slate-400 italic">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <button key={opt} type="button" onClick={() => toggle(opt)} disabled={readOnly}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm text-[11px] font-semibold border transition-all
              ${active
                ? 'bg-[#104a7a] text-white border-[#104a7a] shadow-sm'
                : readOnly
                  ? 'bg-[#f0f0f0] text-[#aaa] border-[#ddd] cursor-default'
                  : 'bg-white text-slate-600 border-[#ccc] hover:border-[#104a7a] hover:text-[#104a7a] cursor-pointer'
              }`}>
            {active && <CheckCircle2 size={9} className="flex-shrink-0" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SubBodyTypePopover — floating card anchored to a trigger element
// Uses a fixed-position card rendered at window level so it's never clipped
// ─────────────────────────────────────────────────────────────────────────────
interface SubBodyTypePopoverProps {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  onClose: () => void;
  current: string;
  options: string[];
  saving: boolean;
  onSelect: (val: string | null) => void;
}
const SubBodyTypePopover: React.FC<SubBodyTypePopoverProps> = ({
  anchorRef, open, onClose, current, options, saving, onSelect
}) => {
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // Position the popover below the anchor button
  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > 160 ? rect.bottom + 4 : rect.top - 4; // flip up if not enough space below
    const shouldFlipUp = spaceBelow <= 160;
    setPos({
      top: shouldFlipUp ? rect.top - 4 : rect.bottom + 4,
      left: Math.min(rect.left, window.innerWidth - 160),
    });
  }, [open, anchorRef]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popRef.current && !popRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  // Render into body via a portal-style fixed div
  return (
    <div
      ref={popRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="bg-white border border-[#bbb] rounded shadow-xl min-w-[130px] py-1"
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide border-b border-[#f0f0f0] mb-0.5">
        Sub Body Type
      </div>
      {current && (
        <button type="button" onClick={() => onSelect(null)}
          className="w-full text-left px-2.5 py-1.5 text-[11px] text-red-500 hover:bg-red-50 flex items-center gap-1.5 border-b border-[#f0f0f0]">
          <span className="text-[10px]">✕</span> Clear
        </button>
      )}
      {options.length === 0 && (
        <div className="px-2.5 py-2 text-[10px] text-slate-400 italic">No options defined</div>
      )}
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => onSelect(opt)}
          className={`w-full text-left px-2.5 py-1.5 text-[11px] transition-colors flex items-center gap-1.5
            ${current === opt ? 'bg-[#104a7a] text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'}`}>
          {current === opt && <CheckCircle2 size={9} />}
          {opt}
        </button>
      ))}
      {saving && (
        <div className="px-2.5 py-1.5 text-[10px] text-blue-500 flex items-center gap-1 border-t border-[#f0f0f0]">
          <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Saving…
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// CarChip — draggable chip; sub-body-type opens a floating popover
// ─────────────────────────────────────────────────────────────────────────────
interface CarChipProps {
  oem: string;
  model: string;
  subBodyType?: string;
  isUnassigned?: boolean;
  subBodyTypeOptions: string[];
  onDragStart: (e: React.DragEvent, oem: string, model: string) => void;
  onSubBodyTypeChange: (oem: string, model: string, val: string | null) => void;
}
const CarChip: React.FC<CarChipProps> = ({
  oem, model, subBodyType, isUnassigned,
  subBodyTypeOptions, onDragStart, onSubBodyTypeChange
}) => {
  const [popOpen, setPopOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleSelect = async (val: string | null) => {
    setPopOpen(false);
    setSaving(true);
    await onSubBodyTypeChange(oem, model, val);
    setSaving(false);
  };

  const stopDrag = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      <div
        draggable={!popOpen}
        onDragStart={e => { if (popOpen) { e.preventDefault(); return; } onDragStart(e, oem, model); }}
        className={`flex items-center gap-0 rounded-sm text-[11px] font-semibold border cursor-grab active:cursor-grabbing select-none transition-all overflow-hidden
          ${isUnassigned
            ? 'bg-amber-50 text-amber-800 border-amber-300 hover:border-amber-500'
            : 'bg-[#e8f2fa] text-[#0a385c] border-[#96c1e3] hover:border-[#4a90c4]'
          }`}
      >
        {/* Drag grip */}
        <span className="px-1 py-0.5 opacity-30 flex-shrink-0">
          <GripVertical size={9} />
        </span>

        {/* Model name */}
        <span className="pr-0.5 py-0.5 leading-none">{model}</span>

        {/* Sub body type badge — only for assigned */}
        {!isUnassigned && (
          <button
            ref={btnRef}
            type="button"
            onMouseDown={stopDrag}
            onClick={e => { e.stopPropagation(); setPopOpen(o => !o); }}
            disabled={saving}
            title="Set sub body type"
            className={`self-stretch flex items-center px-1.5 text-[9px] font-semibold border-l transition-all leading-none min-w-[20px]
              ${subBodyType
                ? 'bg-[#b6d9f5] text-[#0a3d6b] border-[#7ab8e0] hover:bg-[#9ecef0]'
                : 'bg-white/60 text-slate-400 border-[#c5ddf0] hover:bg-white hover:text-slate-600'
              } ${saving ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
          >
            {saving
              ? <svg className="animate-spin w-2 h-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
              : <span className="whitespace-nowrap">{subBodyType || '＋'}</span>
            }
          </button>
        )}

        {isUnassigned && (
          <AlertCircle size={9} className="text-amber-500 flex-shrink-0 mr-1" />
        )}
      </div>

      {/* Floating popover — outside all scroll containers */}
      <SubBodyTypePopover
        anchorRef={btnRef}
        open={popOpen}
        onClose={() => setPopOpen(false)}
        current={subBodyType || ''}
        options={subBodyTypeOptions}
        saving={saving}
        onSelect={handleSelect}
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DropCell
// ─────────────────────────────────────────────────────────────────────────────
interface DropCellProps {
  oem: string;
  bodyType: string;
  cars: MappedCar[];
  subBodyTypeOptions: string[];
  onDrop: (oem: string, model: string, bodyType: string) => void;
  onDragStart: (e: React.DragEvent, oem: string, model: string) => void;
  onSubBodyTypeChange: (oem: string, model: string, val: string | null) => void;
  dragOver: boolean;
  dragOverInvalid: boolean;
  onDragOver: (e: React.DragEvent, oem: string, bodyType: string) => void;
  onDragLeave: () => void;
}
const DropCell: React.FC<DropCellProps> = ({
  oem, bodyType, cars, subBodyTypeOptions, onDrop, onDragStart,
  onSubBodyTypeChange, dragOver, dragOverInvalid, onDragOver, onDragLeave
}) => (
  <td
    onDragOver={e => onDragOver(e, oem, bodyType)}
    onDragLeave={onDragLeave}
    onDrop={e => {
      e.preventDefault();
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;
      const { oem: fromOem, model } = JSON.parse(data);
      onDrop(fromOem, model, bodyType);
    }}
    className={`border border-[#bbb] p-0 align-top min-w-[130px] max-w-[160px] transition-all
      ${dragOver ? 'bg-blue-50 outline outline-1 outline-[#378add] outline-dashed' : ''}
      ${dragOverInvalid ? 'bg-red-50 outline outline-1 outline-red-400 outline-dashed' : ''}
    `}
  >
    <div className="max-h-[90px] overflow-y-auto p-1.5 flex flex-col gap-1.5 custom-scrollbar">
      {cars.map(car => (
        <CarChip key={car.model} oem={car.oem} model={car.model} subBodyType={car.subBodyType}
          subBodyTypeOptions={subBodyTypeOptions} onDragStart={onDragStart}
          onSubBodyTypeChange={onSubBodyTypeChange} />
      ))}
      {cars.length === 0 && !dragOver && (
        <span className="text-[10px] text-[#d1d1d1] italic pl-0.5">—</span>
      )}
      {dragOver && (
        <div className="flex items-center justify-center text-[10px] text-blue-400 italic pointer-events-none py-1">drop here</div>
      )}
    </div>
  </td>
);

// ─────────────────────────────────────────────────────────────────────────────
// DeleteModelConfirm — inline confirmation row shown when trash is clicked
// ─────────────────────────────────────────────────────────────────────────────
interface DeleteModelConfirmProps {
  modelName: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}
const DeleteModelConfirm: React.FC<DeleteModelConfirmProps> = ({ modelName, onConfirm, onCancel, deleting }) => (
  <tr className="bg-red-50 border-b border-red-200">
    <td colSpan={10} className="px-4 py-3">
      <div className="flex items-center gap-3 flex-wrap">
        <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
        <span className="text-[12px] text-red-700 font-semibold">
          Delete <span className="font-bold">"{modelName}"</span>?
        </span>
        <span className="text-[11px] text-red-500">
          This will permanently delete the model and all its variants from the system. This cannot be undone.
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={onCancel} disabled={deleting}
            className="px-3 py-1 text-[11px] border border-[#ccc] rounded-sm bg-white hover:bg-slate-50 text-slate-600 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1 text-[11px] bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-sm font-semibold transition-colors">
            {deleting
              ? <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
              : <Trash2 size={11} />
            }
            Yes, delete model
          </button>
        </div>
      </div>
    </td>
  </tr>
);

// ─────────────────────────────────────────────────────────────────────────────
// Draft types
// ─────────────────────────────────────────────────────────────────────────────
interface NewVariantDraft {
  id: string;
  variant_name: string;
  engine_types: string[];
  powertrain_types: string[];
  drive_types: string[];
  fuel_types: string[];
  price: string;
}
interface NewModelDraft {
  id: string;
  name: string;
  body_type: string;
  sub_body_type: string;
  variants: NewVariantDraft[];
}
const emptyVariant = (): NewVariantDraft => ({
  id: `v-${Date.now()}-${Math.random()}`,
  variant_name: '', engine_types: [], powertrain_types: [], drive_types: [], fuel_types: [], price: '',
});

// ─────────────────────────────────────────────────────────────────────────────
// MasterPage
// ─────────────────────────────────────────────────────────────────────────────
const MasterPage: React.FC = () => {
  const [brandsCars, setBrandsCars] = useState<Record<string, string[]>>({});
  const [mappedCars, setMappedCars] = useState<MappedCar[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const dragPayloadRef = useRef<{ oem: string; model: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ oem: string; bodyType: string } | null>(null);

  const [featuresMaster, setFeaturesMaster] = useState<Record<string, { id: string; name: string; isMerged?: boolean }[]>>({});
  const [masterValues, setMasterValues] = useState<Record<string, { id: string; category: string; value: string; is_active: boolean }[]>>({});
  const [newMasterInputs, setNewMasterInputs] = useState<Record<string, string>>({
    Engine: '', Powertrain: '', 'Drive Type': '', Fuel: '',
  });
  const [newModels, setNewModels] = useState<any[]>([]);
  const [draftModels, setDraftModels] = useState<NewModelDraft[]>([]);
  const [subBodyTypeOptions, setSubBodyTypeOptions] = useState<string[]>([]);

  // Which model is pending delete confirmation + whether API call is in flight
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingModelId, setDeletingModelId] = useState<string | null>(null);

  useEffect(() => {
    fetchBrandsCars();
    loadFeaturesMaster();
    loadMasterValues();
    loadNewModels();
    loadSubBodyTypes();
  }, []);

  const loadSubBodyTypes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/sub-body-types`);
      const data = await res.json();
      if (data.success) setSubBodyTypeOptions(data.data || []);
    } catch (e) { console.error(e); }
  };
  const loadMasterValues = async () => {
    try { const d = await fetchMasterValues(); setMasterValues(d.data || {}); }
    catch (e) { console.error(e); }
  };
  const loadNewModels = async () => {
    try { const d = await fetchNewModels(); setNewModels(d.data || []); }
    catch (e) { console.error(e); }
  };
  const loadFeaturesMaster = async () => {
    try { const d = await fetchFeatureMasterCategoryWise(); setFeaturesMaster(d); }
    catch (e) { console.error(e); }
  };

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBrandsCars = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/brands-cars`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.brands) {
        const map: Record<string, string[]> = {};
        const cars: MappedCar[] = [];
        data.brands.forEach((b: any) => {
          map[b.brand_name] = b.cars.map((c: any) => c.car_name);
          b.cars.forEach((c: any) => {
            if (c.body_type) cars.push({ oem: b.brand_name, model: c.car_name, bodyType: c.body_type, subBodyType: c.sub_body_type || '' });
          });
        });
        setBrandsCars(map);
        setMappedCars(cars);
      }
    } catch (e) { console.error(e); }
  };

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent, oem: string, model: string) => {
    dragPayloadRef.current = { oem, model };
    e.dataTransfer.setData('application/json', JSON.stringify({ oem, model }));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, oem: string, bodyType: string) => {
    e.preventDefault();
    const payload = dragPayloadRef.current;
    e.dataTransfer.dropEffect = payload?.oem === oem ? 'move' : 'none';
    setDropTarget({ oem, bodyType });
  }, []);

  const handleDragLeave = useCallback(() => setDropTarget(null), []);

  const handleDrop = async (fromOem: string, model: string, toBodyType: string) => {
    setDropTarget(null);
    if (!fromOem || !model) return;
    setMappedCars(prev => [
      ...prev.filter(c => !(c.oem === fromOem && c.model === model)),
      { oem: fromOem, model, bodyType: toBodyType, subBodyType: '' },
    ]);
    try {
      const res = await fetch(`${API_BASE}/api/cars/body-type`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_name: fromOem, car_name: model, body_type: toBodyType, sub_body_type: null }),
      });
      const data = await res.json();
      if (res.ok && data.success) showToast('success', `${model} → ${toBodyType}`);
      else { showToast('error', data.detail || 'Failed to save'); fetchBrandsCars(); }
    } catch { showToast('error', 'Network error'); fetchBrandsCars(); }
  };

  // ── Sub body type ──────────────────────────────────────────────────────────
  const handleSubBodyTypeChange = async (oem: string, model: string, val: string | null) => {
    setMappedCars(prev => prev.map(c =>
      c.oem === oem && c.model === model ? { ...c, subBodyType: val || '' } : c
    ));
    try {
      const res = await fetch(`${API_BASE}/api/cars/sub-body-type`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_name: oem, car_name: model, sub_body_type: val }),
      });
      const data = await res.json();
      if (res.ok && data.success) showToast('success', val ? `${model} → ${val}` : `${model} sub type cleared`);
      else { showToast('error', data.detail || 'Failed'); fetchBrandsCars(); }
    } catch { showToast('error', 'Network error'); fetchBrandsCars(); }
  };

  // ── Master values ──────────────────────────────────────────────────────────
  const handleAddMasterValue = async (category: string) => {
    const val = newMasterInputs[category];
    if (!val?.trim()) return;
    try {
      await addMasterValue(category, val.trim());
      showToast('success', `Added ${val} to ${category}`);
      setNewMasterInputs(prev => ({ ...prev, [category]: '' }));
      loadMasterValues();
    } catch (e: any) { showToast('error', e.message || 'Failed'); }
  };

  const handleDeleteMasterValue = async (id: string) => {
    try { await deleteMasterValue(id); showToast('success', 'Deleted'); loadMasterValues(); }
    catch (e: any) { showToast('error', e.message || 'Failed'); }
  };

  // ── Update persisted model body_type / sub_body_type ──────────────────────
  const handleUpdateModelField = (modelId: string, field: string, value: string) => {
    setNewModels(prev => prev.map(m => m.id === modelId ? { ...m, [field]: value } : m));
  };

  const handleSaveModelMeta = async (model: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/new-models/${model.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body_type: model.body_type, sub_body_type: model.sub_body_type || null }),
      });
      const data = await res.json();
      if (res.ok && data.success) showToast('success', 'Model updated');
      else showToast('error', typeof data.detail === 'string' ? data.detail : 'Failed to update model');
    } catch { showToast('error', 'Network error'); }
  };

  // ── Unassign a car — DELETE /api/cars/body-type?brand_name=X&car_name=Y ────
  const handleUnassignCar = async (oem: string, model: string) => {
    setMappedCars(prev => prev.filter(c => !(c.oem === oem && c.model === model)));
    try {
      const params = new URLSearchParams({ brand_name: oem, car_name: model });
      const res = await fetch(`${API_BASE}/api/cars/body-type?${params}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) showToast('success', `${model} unassigned`);
      else { showToast('error', typeof data.detail === 'string' ? data.detail : 'Failed to unassign'); fetchBrandsCars(); }
    } catch { showToast('error', 'Network error'); fetchBrandsCars(); }
  };

  // ── Delete entire new model ────────────────────────────────────────────────
  const handleDeleteModel = async (modelId: string) => {
    setDeletingModelId(modelId);
    try {
      const res = await fetch(`${API_BASE}/api/new-models/${modelId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'Model deleted');
        setPendingDeleteId(null);
        loadNewModels();
      } else {
        showToast('error', data.detail || 'Failed to delete model');
      }
    } catch { showToast('error', 'Network error'); }
    finally { setDeletingModelId(null); }
  };

  // ── Section 4 persisted chips ──────────────────────────────────────────────
  const [persistedChips, setPersistedChips] = useState<Record<string, string[]>>({});

  const getChips = (modelId: string, variantId: string, field: string, fallback: string): string[] => {
    const key = `${modelId}::${variantId}::${field}`;
    if (persistedChips[key]) return persistedChips[key];
    // comma-separated stored value → array
    return fallback ? fallback.split(',').map(s => s.trim()).filter(Boolean) : [];
  };

  const setChips = (modelId: string, variantId: string, field: string, vals: string[]) => {
    setPersistedChips(prev => ({ ...prev, [`${modelId}::${variantId}::${field}`]: vals }));
  };

  const handleUpdateVariantLocal = (modelId: string, variantId: string, field: string, value: any) => {
    setNewModels(prev => prev.map(m => {
      if (m.id !== modelId) return m;
      return { ...m, variants: m.variants.map((v: any) => v.id === variantId ? { ...v, [field]: value } : v) };
    }));
  };

  const handleSaveVariant = async (modelId: string, variant: any) => {
    const eng = getChips(modelId, variant.id, 'engine', variant.engine_type || '');
    const pt = getChips(modelId, variant.id, 'powertrain', variant.powertrain_type || '');
    const dr = getChips(modelId, variant.id, 'drive', variant.drive_type || '');
    const fu = getChips(modelId, variant.id, 'fuel', variant.fuel_type || '');
    try {
      await updateNewModelVariant(variant.id, {
        variant_name: variant.variant_name,
        engine_type: eng.join(','),
        powertrain_type: pt.join(','),
        drive_type: dr.join(','),
        fuel_type: fu.join(','),
        price: parseFloat(variant.price) || 0,
      });
      showToast('success', 'Variant saved');
      loadNewModels();
    } catch (e: any) { showToast('error', e.message || 'Failed'); }
  };

  const handleDeleteVariant = async (variantId: string) => {
    try { await deleteNewModelVariant(variantId); showToast('success', 'Variant deleted'); loadNewModels(); }
    catch (e: any) { showToast('error', e.message || 'Failed'); }
  };

  const handleAddVariantToModel = async (modelId: string) => {
    try { await addNewModelVariant(modelId, { variant_name: 'New Variant' }); showToast('success', 'Added variant'); loadNewModels(); }
    catch (e: any) { showToast('error', e.message || 'Failed'); }
  };

  // ── Section 4 drafts ───────────────────────────────────────────────────────
  const addDraftModel = () =>
    setDraftModels(prev => [{
      id: `draft-${Date.now()}`, name: '', body_type: BODY_TYPES[2], sub_body_type: '', variants: [emptyVariant()],
    }, ...prev]);

  const updateDraftModel = (draftId: string, field: keyof NewModelDraft, value: any) =>
    setDraftModels(prev => prev.map(d => d.id === draftId ? { ...d, [field]: value } : d));

  const updateDraftVariant = (draftId: string, variantId: string, field: keyof NewVariantDraft, value: any) =>
    setDraftModels(prev => prev.map(d => {
      if (d.id !== draftId) return d;
      return { ...d, variants: d.variants.map(v => v.id === variantId ? { ...v, [field]: value } : v) };
    }));

  const addDraftVariant = (draftId: string) =>
    setDraftModels(prev => prev.map(d => d.id !== draftId ? d : { ...d, variants: [...d.variants, emptyVariant()] }));

  const removeDraftVariant = (draftId: string, variantId: string) =>
    setDraftModels(prev => prev.map(d => {
      if (d.id !== draftId) return d;
      const updated = d.variants.filter(v => v.id !== variantId);
      return { ...d, variants: updated.length ? updated : [emptyVariant()] };
    }));

  const saveDraftModel = async (draft: NewModelDraft) => {
    if (!draft.name.trim()) { showToast('error', 'Model name is required'); return; }
    try {
      const created = await createNewModel(draft.name, draft.body_type, draft.sub_body_type);
      const modelId = created?.data?.id || created?.id;
      for (const v of draft.variants) {
        if (!v.variant_name.trim()) continue;
        await addNewModelVariant(modelId, {
          variant_name: v.variant_name,
          engine_type: v.engine_types.join(','),
          powertrain_type: v.powertrain_types.join(','),
          drive_type: v.drive_types.join(','),
          fuel_type: v.fuel_types.join(','),
          price: parseFloat(v.price) || 0,
        });
      }
      showToast('success', `Model "${draft.name}" created`);
      setDraftModels(prev => prev.filter(d => d.id !== draft.id));
      loadNewModels();
    } catch (e: any) { showToast('error', e.message || 'Failed'); }
  };

  const discardDraft = (draftId: string) => setDraftModels(prev => prev.filter(d => d.id !== draftId));

  // ── Derived ────────────────────────────────────────────────────────────────
  const assignedKeys = new Set(mappedCars.map(c => `${c.oem}::${c.model}`));
  const allBrandsFullyAssigned = Object.keys(brandsCars).every(brand =>
    (brandsCars[brand] || []).every(m => assignedKeys.has(`${brand}::${m}`))
  );

  const engineOpts = masterValues['Engine']?.map(o => o.value) || [];
  const powertrainOpts = masterValues['Powertrain']?.map(o => o.value) || [];
  const driveOpts = masterValues['Drive Type']?.map(o => o.value) || [];
  const fuelOpts = masterValues['Fuel']?.map(o => o.value) || [];

  const sectionTitle = "bg-[#e2e2e2] px-3 py-2 font-bold text-black text-[13px] border-b border-[#bbb]";
  const colHeader = "bg-[#e2e2e2] px-3 py-1.5 font-semibold text-black text-[12px] text-center border border-[#bbb] whitespace-nowrap";
  const thCls = "border border-[#bbb] px-2 py-2 text-[12px] font-semibold bg-[#e2e2e2]";
  const tdCls = "border border-[#bbb] px-2 py-1 align-top";

  return (
    <div className="flex-1 overflow-y-auto bg-[#f5f5f5] p-5 font-sans text-slate-800">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[10000] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium
          ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-[1400px] mx-auto space-y-10">

        {/* ── SECTION 1 ─────────────────────────────────────────────────────── */}
        <div className="bg-white border border-[#ccc] rounded-sm shadow-sm">
          <div className={sectionTitle}>1. Define Body Type</div>
          <div className="p-4">
            {/* Hint */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 italic mb-3">
              <GripVertical size={11} />
              Drag any car chip into a body type column to assign it — or drag it back to the <strong className="not-italic text-slate-500">Unassigned</strong> column to remove the assignment. Click the <strong className="not-italic text-slate-500">＋</strong> pill on a chip to set its sub body type.
            </div>

            <div className="overflow-auto max-h-[320px] border border-[#bbb] rounded-sm bg-white custom-scrollbar">
              <table className="border-collapse text-xs text-left w-full">
                <thead className="sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className={`${colHeader} text-left sticky left-0 bg-[#e2e2e2] z-20 min-w-[110px]`}>Brand</th>
                    {/* Unassigned column — green if all assigned, amber if any missing */}
                    <th className={`${colHeader} min-w-[140px] ${allBrandsFullyAssigned
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : 'bg-amber-100 text-amber-700 border-amber-300'
                      }`}>
                      {allBrandsFullyAssigned ? '✓ All Assigned' : '⚠ Unassigned'}
                    </th>
                    {BODY_TYPES.map(bt => <th key={bt} className={colHeader}>{bt}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(brandsCars).map(brand => {
                    const assignedCars = mappedCars.filter(c => c.oem === brand);
                    const unassignedModels = (brandsCars[brand] || []).filter(m => !assignedKeys.has(`${brand}::${m}`));
                    const brandFullyAssigned = unassignedModels.length === 0;

                    return (
                      <tr key={brand} className="border-b border-[#bbb] hover:bg-slate-50 transition-colors">
                        {/* Brand label */}
                        <td className="px-3 py-2 font-semibold text-[13px] text-slate-800 sticky left-0 bg-white border-r border-[#bbb] z-10 shadow-[1px_0_0_#bbb] align-top">
                          {brand}
                          {unassignedModels.length > 0 && (
                            <span className="ml-1 text-[10px] text-amber-500 font-normal">({unassignedModels.length})</span>
                          )}
                        </td>

                        {/* Unassigned cell — green tint if brand fully assigned; accepts drops to unassign */}
                        <td
                          className={`border-r border-[#bbb] p-0 align-top min-w-[130px] max-w-[150px] transition-all
                            ${dropTarget?.oem === brand && dropTarget?.bodyType === '__unassign__'
                              ? 'bg-blue-50 outline outline-1 outline-[#378add] outline-dashed'
                              : brandFullyAssigned ? 'bg-green-50' : 'bg-amber-50'}`}
                          onDragOver={e => {
                            const payload = dragPayloadRef.current;
                            if (payload?.oem === brand) {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              setDropTarget({ oem: brand, bodyType: '__unassign__' });
                            } else {
                              e.dataTransfer.dropEffect = 'none';
                            }
                          }}
                          onDragLeave={handleDragLeave}
                          onDrop={e => {
                            e.preventDefault();
                            setDropTarget(null);
                            const raw = e.dataTransfer.getData('application/json');
                            if (!raw) return;
                            const { oem: fromOem, model: fromModel } = JSON.parse(raw);
                            if (fromOem === brand) handleUnassignCar(fromOem, fromModel);
                          }}
                        >
                          <div className="max-h-[90px] overflow-y-auto p-1.5 flex flex-col gap-1.5 custom-scrollbar">
                            {brandFullyAssigned ? (
                              <span className="text-[10px] text-green-500 font-medium flex items-center gap-1">
                                <CheckCircle2 size={10} /> all assigned
                              </span>
                            ) : (
                              unassignedModels.map(model => (
                                <CarChip key={model} oem={brand} model={model} isUnassigned
                                  subBodyTypeOptions={subBodyTypeOptions}
                                  onDragStart={handleDragStart}
                                  onSubBodyTypeChange={handleSubBodyTypeChange} />
                              ))
                            )}
                          </div>
                        </td>

                        {/* Body type drop cells */}
                        {BODY_TYPES.map(bt => {
                          const carsInBt = assignedCars.filter(c => c.bodyType === bt);
                          const isOver = dropTarget?.oem === brand && dropTarget?.bodyType === bt;
                          const isInvalid = isOver && dragPayloadRef.current?.oem !== brand;
                          return (
                            <DropCell key={bt} oem={brand} bodyType={bt} cars={carsInBt}
                              subBodyTypeOptions={subBodyTypeOptions}
                              onDrop={handleDrop} onDragStart={handleDragStart}
                              onSubBodyTypeChange={handleSubBodyTypeChange}
                              dragOver={isOver && !isInvalid} dragOverInvalid={isInvalid}
                              onDragOver={handleDragOver} onDragLeave={handleDragLeave} />
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>


        {/* ── ROW: Sections 2 + 3 ───────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <FeatureMasterSection featuresMaster={featuresMaster} onRefresh={loadFeaturesMaster} showToast={showToast} />
          </div>
          <div className="flex-shrink-0 w-full lg:w-[380px] bg-white border border-[#ccc] rounded-sm shadow-sm flex flex-col">
            <div className={sectionTitle}>3. Define Masters for E/G, Powertrain, Fuel type and Drive type</div>
            <div className="p-4 grid grid-cols-4 gap-3 flex-1 overflow-y-auto custom-scrollbar">
              {['Engine', 'Powertrain', 'Drive Type', 'Fuel'].map(cat => (
                <div key={cat} className="flex flex-col gap-2">
                  <div className="text-[11px] font-bold text-center border-b pb-1 mb-1">
                    {cat === 'Powertrain' ? 'P/T Type' : cat === 'Engine' ? 'E/G Type' : cat}
                  </div>
                  {masterValues[cat]?.map(item => (
                    <div key={item.id} className="relative group bg-black text-white text-center py-1 text-[12px] font-bold rounded-sm cursor-default">
                      {item.value}
                      <button onClick={() => handleDeleteMasterValue(item.id)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md" title="Delete">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                  <div className="mt-auto pt-2 flex items-center border border-[#ccc] rounded-sm bg-[#f9f9f9]">
                    <input type="text" value={newMasterInputs[cat] || ''}
                      onChange={e => setNewMasterInputs(prev => ({ ...prev, [cat]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddMasterValue(cat); }}
                      placeholder="Add..." className="w-full text-[10px] px-1.5 py-1 bg-transparent focus:outline-none" />
                    <button onClick={() => handleAddMasterValue(cat)} disabled={!newMasterInputs[cat]?.trim()}
                      className="px-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* ── SECTION 4 ─────────────────────────────────────────────────────── */}
        <div className="bg-white border border-[#ccc] rounded-sm shadow-sm mb-6">
          <div className={sectionTitle}>4. Define New Model Variants</div>
          <div className="overflow-auto max-h-[600px]">
            <table className="w-full border-collapse text-[12px] text-left" style={{ minWidth: '980px' }}>
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#e2e2e2]">
                  <th className={`${thCls} w-[90px]`}>
                    <div className="flex items-center gap-2">
                      <button onClick={addDraftModel}
                        className="flex-shrink-0 w-5 h-5 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-sm" title="Add new model">
                        <Plus size={12} />
                      </button>
                      Name
                    </div>
                  </th>
                  <th className={`${thCls} w-[110px]`}>Body Type</th>
                  <th className={`${thCls} w-[90px]`}>Sub Body<br />Type (O)</th>
                  <th className={`${thCls} w-[80px]`}>Variants</th>
                  <th className={thCls}>E/G Type</th>
                  <th className={thCls}>P/T Type</th>
                  <th className={thCls}>Drive Type</th>
                  <th className={thCls}>Fuel Type</th>
                  <th className={`${thCls} w-[90px]`}>Price</th>
                  <th className={`${thCls} w-[90px] text-center`}>Actions</th>
                </tr>
              </thead>
              <tbody>

                {/* Draft rows */}
                {draftModels.map(draft => (
                  <React.Fragment key={draft.id}>
                    {draft.variants.map((v, idx) => (
                      <tr key={v.id} className="border-b border-[#bbb] bg-blue-50">
                        {idx === 0 && (
                          <>
                            <td className={`${tdCls} bg-blue-100`} rowSpan={draft.variants.length}>
                              <input autoFocus type="text" value={draft.name}
                                onChange={e => updateDraftModel(draft.id, 'name', e.target.value)}
                                placeholder="Model name"
                                className="w-full border border-[#bbb] text-[11px] px-1 py-0.5 focus:border-[#104a7a] focus:outline-none bg-white rounded-sm" />
                            </td>
                            <td className={`${tdCls} bg-blue-100`} rowSpan={draft.variants.length}>
                              <select value={draft.body_type} onChange={e => updateDraftModel(draft.id, 'body_type', e.target.value)}
                                className="w-full border border-[#bbb] text-[11px] py-0.5 px-1 focus:border-[#104a7a] focus:outline-none bg-white rounded-sm">
                                {BODY_TYPES.map(bt => <option key={bt}>{bt}</option>)}
                              </select>
                            </td>
                            <td className={`${tdCls} bg-blue-100`} rowSpan={draft.variants.length}>
                              <select value={draft.sub_body_type}
                                onChange={e => updateDraftModel(draft.id, 'sub_body_type', e.target.value)}
                                className="w-full border border-[#bbb] text-[11px] py-0.5 px-1 focus:border-[#104a7a] focus:outline-none bg-white rounded-sm">
                                <option value="">— optional —</option>
                                {subBodyTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            </td>
                          </>
                        )}
                        <td className={tdCls}>
                          <input type="text" value={v.variant_name}
                            onChange={e => updateDraftVariant(draft.id, v.id, 'variant_name', e.target.value)}
                            placeholder="e.g. L"
                            className="w-16 border border-[#bbb] text-[11px] px-1 py-0.5 focus:border-[#104a7a] focus:outline-none bg-white rounded-sm" />
                        </td>
                        <td className={tdCls}>
                          <ChipPicker options={engineOpts} selected={v.engine_types}
                            onChange={vals => updateDraftVariant(draft.id, v.id, 'engine_types', vals)} />
                        </td>
                        <td className={tdCls}>
                          <ChipPicker options={powertrainOpts} selected={v.powertrain_types}
                            onChange={vals => updateDraftVariant(draft.id, v.id, 'powertrain_types', vals)} />
                        </td>
                        <td className={tdCls}>
                          <ChipPicker options={driveOpts} selected={v.drive_types}
                            onChange={vals => updateDraftVariant(draft.id, v.id, 'drive_types', vals)} />
                        </td>
                        <td className={tdCls}>
                          <ChipPicker options={fuelOpts} selected={v.fuel_types}
                            onChange={vals => updateDraftVariant(draft.id, v.id, 'fuel_types', vals)} />
                        </td>
                        <td className={tdCls}>
                          <input type="number" value={v.price}
                            onChange={e => updateDraftVariant(draft.id, v.id, 'price', e.target.value)}
                            placeholder="Price"
                            className="w-20 border border-[#bbb] text-[11px] px-1 py-0.5 focus:border-[#104a7a] focus:outline-none bg-white rounded-sm" />
                        </td>
                        <td className={`${tdCls} text-center`}>
                          <div className="flex items-center justify-center gap-1.5">
                            {idx === 0 && (
                              <>
                                <button onClick={() => saveDraftModel(draft)} className="text-blue-600 hover:text-blue-800" title="Save model">
                                  <CheckCircle2 size={14} />
                                </button>
                                <button onClick={() => discardDraft(draft.id)} className="text-red-500 hover:text-red-700" title="Discard">
                                  <Trash2 size={14} />
                                </button>
                                <button onClick={() => addDraftVariant(draft.id)}
                                  className="bg-green-500 hover:bg-green-600 rounded-full w-4 h-4 flex items-center justify-center text-white text-[11px] font-bold" title="Add variant row">+</button>
                              </>
                            )}
                            {idx > 0 && (
                              <button onClick={() => removeDraftVariant(draft.id, v.id)} className="text-red-400 hover:text-red-600" title="Remove row">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}

                {/* Empty state */}
                {newModels.length === 0 && draftModels.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-6 text-slate-400 italic border-b border-[#bbb]">
                      No models yet. Click the <strong>+</strong> next to "Name" to add one.
                    </td>
                  </tr>
                )}

                {/* Persisted rows */}
                {newModels.map(model => (
                  <React.Fragment key={model.id}>

                    {/* Delete confirmation row — shown above the model's rows */}
                    {pendingDeleteId === model.id && (
                      <DeleteModelConfirm
                        modelName={model.name}
                        onConfirm={() => handleDeleteModel(model.id)}
                        onCancel={() => setPendingDeleteId(null)}
                        deleting={deletingModelId === model.id}
                      />
                    )}

                    {model.variants.length === 0 ? (
                      <tr className="border-b border-[#bbb] hover:bg-slate-50">
                        <td className={`${tdCls} font-medium bg-slate-50`}>
                          <div className="flex items-center gap-1.5">
                            {/* Delete whole model button */}
                            <button
                              onClick={() => setPendingDeleteId(pendingDeleteId === model.id ? null : model.id)}
                              title="Delete entire model"
                              className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors
                                ${pendingDeleteId === model.id
                                  ? 'bg-red-600 text-white'
                                  : 'bg-red-100 text-red-500 hover:bg-red-500 hover:text-white'}`}>
                              <Trash2 size={9} />
                            </button>
                            {model.name}
                          </div>
                        </td>
                        <td className={`${tdCls} bg-slate-50`}>
                          <select value={model.body_type}
                            onChange={e => {
                              handleUpdateModelField(model.id, 'body_type', e.target.value);
                              handleSaveModelMeta({ ...model, body_type: e.target.value });
                            }}
                            className="w-full border border-[#bbb] text-[11px] py-0.5 px-1 focus:border-[#104a7a] focus:outline-none bg-white rounded-sm">
                            {BODY_TYPES.map(bt => <option key={bt}>{bt}</option>)}
                          </select>
                        </td>
                        <td className={`${tdCls} bg-slate-50`}>
                          <select value={model.sub_body_type || ''}
                            onChange={e => {
                              handleUpdateModelField(model.id, 'sub_body_type', e.target.value);
                              handleSaveModelMeta({ ...model, sub_body_type: e.target.value });
                            }}
                            className="w-full border border-[#bbb] text-[11px] py-0.5 px-1 focus:border-[#104a7a] focus:outline-none bg-white rounded-sm">
                            <option value="">— none —</option>
                            {subBodyTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </td>
                        <td colSpan={6} className="border border-[#bbb] px-2 py-1 text-slate-400 italic text-center">No variants added</td>
                        <td className={`${tdCls} text-center`}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => handleAddVariantToModel(model.id)}
                              className="bg-green-500 hover:bg-green-600 rounded-full w-4 h-4 flex items-center justify-center text-white text-[11px] font-bold" title="Add Variant">+</button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      model.variants.map((v: any, idx: number) => (
                        <tr key={v.id} className="border-b border-[#bbb] hover:bg-slate-50">
                          {idx === 0 && (
                            <>
                              <td className={`${tdCls} font-medium bg-slate-50`} rowSpan={model.variants.length}>
                                <div className="flex items-center gap-1.5">
                                  {/* Delete whole model button — only on first row */}
                                  <button
                                    onClick={() => setPendingDeleteId(pendingDeleteId === model.id ? null : model.id)}
                                    title="Delete entire model"
                                    className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-colors
                                      ${pendingDeleteId === model.id
                                        ? 'bg-red-600 text-white'
                                        : 'bg-red-100 text-red-500 hover:bg-red-500 hover:text-white'}`}>
                                    <Trash2 size={9} />
                                  </button>
                                  {model.name}
                                </div>
                              </td>
                              <td className={`${tdCls} bg-slate-50`} rowSpan={model.variants.length}>
                                <select value={model.body_type}
                                  onChange={e => {
                                    handleUpdateModelField(model.id, 'body_type', e.target.value);
                                    handleSaveModelMeta({ ...model, body_type: e.target.value });
                                  }}
                                  className="w-full border border-[#bbb] text-[11px] py-0.5 px-1 focus:border-[#104a7a] focus:outline-none bg-white rounded-sm">
                                  {BODY_TYPES.map(bt => <option key={bt}>{bt}</option>)}
                                </select>
                              </td>
                              <td className={`${tdCls} bg-slate-50`} rowSpan={model.variants.length}>
                                <select value={model.sub_body_type || ''}
                                  onChange={e => {
                                    handleUpdateModelField(model.id, 'sub_body_type', e.target.value);
                                    handleSaveModelMeta({ ...model, sub_body_type: e.target.value });
                                  }}
                                  className="w-full border border-[#bbb] text-[11px] py-0.5 px-1 focus:border-[#104a7a] focus:outline-none bg-white rounded-sm">
                                  <option value="">— none —</option>
                                  {subBodyTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              </td>
                            </>
                          )}
                          <td className={tdCls}>
                            <input type="text" value={v.variant_name}
                              onChange={e => handleUpdateVariantLocal(model.id, v.id, 'variant_name', e.target.value)}
                              className="w-16 border border-[#bbb] bg-white text-[11px] px-1 py-0.5 focus:border-[#555] focus:outline-none" />
                          </td>
                          <td className={tdCls}>
                            <ChipPicker options={engineOpts}
                              selected={getChips(model.id, v.id, 'engine', v.engine_type || '')}
                              onChange={vals => setChips(model.id, v.id, 'engine', vals)} />
                          </td>
                          <td className={tdCls}>
                            <ChipPicker options={powertrainOpts}
                              selected={getChips(model.id, v.id, 'powertrain', v.powertrain_type || '')}
                              onChange={vals => setChips(model.id, v.id, 'powertrain', vals)} />
                          </td>
                          <td className={tdCls}>
                            <ChipPicker options={driveOpts}
                              selected={getChips(model.id, v.id, 'drive', v.drive_type || '')}
                              onChange={vals => setChips(model.id, v.id, 'drive', vals)} />
                          </td>
                          <td className={tdCls}>
                            <ChipPicker options={fuelOpts}
                              selected={getChips(model.id, v.id, 'fuel', v.fuel_type || '')}
                              onChange={vals => setChips(model.id, v.id, 'fuel', vals)} />
                          </td>
                          <td className={tdCls}>
                            <input type="number" value={v.price || ''}
                              onChange={e => handleUpdateVariantLocal(model.id, v.id, 'price', e.target.value)}
                              className="w-20 border border-[#bbb] bg-white text-[11px] px-1 py-0.5 focus:border-[#555] focus:outline-none" placeholder="Price" />
                          </td>
                          <td className={`${tdCls} text-center`}>
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              <button onClick={() => handleSaveVariant(model.id, v)} className="text-blue-600 hover:text-blue-800" title="Save Variant">
                                <CheckCircle2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteVariant(v.id)} className="text-red-500 hover:text-red-700" title="Delete Variant">
                                <Trash2 size={14} />
                              </button>
                              {idx === 0 && (
                                <button onClick={() => handleAddVariantToModel(model.id)}
                                  className="bg-green-500 hover:bg-green-600 rounded-full w-4 h-4 flex items-center justify-center text-white text-[11px] font-bold ml-1" title="Add Variant">+</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </React.Fragment>
                ))}

              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MasterPage;
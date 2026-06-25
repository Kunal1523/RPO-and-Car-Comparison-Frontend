import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { updateNMVariantFeature } from '../services/api';

interface NMFeatureCellProps {
    nmVariantId: string;
    featureId: string;
    value: string;
    subVariantValues?: Record<string, string>;
    costDelta: number;
    isEdited: boolean;
    copiedFrom?: string | null;
    onSaved?: (featureId: string, newValue: string, newCost: number) => void;
}

const NMFeatureCell: React.FC<NMFeatureCellProps> = ({
    nmVariantId,
    featureId,
    value,
    subVariantValues,
    costDelta,
    isEdited,
    copiedFrom,
    onSaved,
}) => {
    const [localValue, setLocalValue] = useState(value);
    const [localCost, setLocalCost] = useState(String(costDelta ?? 0));
    const [savingValue, setSavingValue] = useState(false);
    const [savingCost, setSavingCost] = useState(false);
    // Track if THIS session has edited the value (for highlight even before parent refresh)
    const [locallyEdited, setLocallyEdited] = useState(false);

    // Sync from parent only when not actively editing
    useEffect(() => { setLocalValue(value); setLocallyEdited(false); }, [value]);
    useEffect(() => { setLocalCost(String(costDelta ?? 0)); }, [costDelta]);

    const saveValue = useCallback(async () => {
        if (localValue === value && !locallyEdited) return;
        if (localValue === value) return; // unchanged
        setSavingValue(true);
        try {
            await updateNMVariantFeature(nmVariantId, featureId, { feature_value: localValue });
            setLocallyEdited(true);
            // Tell parent the new value immediately — no page refresh needed
            onSaved?.(featureId, localValue, parseFloat(localCost) || 0);
        } catch (e) {
            console.error(e);
            alert(e instanceof Error ? e.message : 'Failed to save value');
            setLocalValue(value); // revert
        } finally {
            setSavingValue(false);
        }
    }, [localValue, value, locallyEdited, nmVariantId, featureId, localCost, onSaved]);

    const saveCost = useCallback(async () => {
        const parsed = parseFloat(localCost);
        if (isNaN(parsed) || parsed === costDelta) return;
        setSavingCost(true);
        try {
            await updateNMVariantFeature(nmVariantId, featureId, { cost_delta: parsed });
            // Tell parent the new cost immediately
            onSaved?.(featureId, localValue, parsed);
        } catch (e) {
            console.error(e);
            alert(e instanceof Error ? e.message : 'Failed to save cost');
            setLocalCost(String(costDelta ?? 0));
        } finally {
            setSavingCost(false);
        }
    }, [localCost, costDelta, nmVariantId, featureId, localValue, onSaved]);

    const subEntries = subVariantValues
        ? Object.entries(subVariantValues).filter(([, v]) => v && v.trim() !== '')
        : [];
    const hasMultipleSubValues = subEntries.length > 1 &&
        new Set(subEntries.map(([, v]) => v.trim())).size > 1;

    const showEdited = isEdited || locallyEdited;

    return (
        <div className="flex flex-col gap-1 w-full py-1">
            {/* Single editable value input only — no sub-variant breakdown */}
            <div className="flex items-center gap-1 w-full">
                <input
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={saveValue}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveValue(); }}
                    placeholder="Enter value..."
                    className={`text-[10px] px-1.5 py-0.5 rounded border outline-none transition-all flex-1 min-w-0 font-medium
          ${showEdited
                            ? 'border-amber-400 bg-amber-50 text-amber-900'
                            : 'border-transparent bg-indigo-50/30 hover:border-indigo-300'
                        } focus:border-indigo-500 focus:bg-white`}
                />
                {savingValue && <Loader2 size={10} className="animate-spin text-indigo-400 shrink-0" />}
            </div>

            {/* Badges + cost delta */}
            <div className="flex items-center gap-1.5 flex-wrap">
                {showEdited && (
                    <span className="text-[6px] font-black uppercase tracking-wider px-1 py-0.5 bg-amber-100 text-amber-700 rounded-sm shrink-0">
                        Edited
                    </span>
                )}
                <div className="flex items-center gap-0.5 ml-auto shrink-0" title="Cost delta for this feature">
                    <span className="text-[7px] text-slate-400 uppercase font-black">C:</span>
                    <input
                        type="number"
                        value={localCost}
                        onChange={(e) => setLocalCost(e.target.value)}
                        onBlur={saveCost}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                        placeholder="0"
                        className={`text-[8px] font-bold w-12 bg-white/60 border border-slate-200 rounded px-1 outline-none text-right
            focus:border-blue-400 focus:bg-white
            ${parseFloat(localCost) > 0 ? 'text-red-500' : parseFloat(localCost) < 0 ? 'text-emerald-500' : 'text-slate-400'}`}
                    />
                    {savingCost && <Loader2 size={9} className="animate-spin text-indigo-400" />}
                </div>
            </div>
        </div>
    );
};

export default NMFeatureCell;
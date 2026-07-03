// src/components/StackUpSidebar.tsx
//
// Sidebar for the Feature Stack-Up page — rebuilt around ONE bulk fetch:
//   GET /api/catalog/full-pricing
//
// This mirrors exactly how the original Sidebar.tsx works
// (fetchSidebarFilters -> one big array -> filter client-side). Everything
// below — Body Type / Brand / Model / Variant — is pure client-side
// filtering over that single payload. No cascading per-body-type or
// per-car API calls, and the Variant popup opens INSTANTLY since every
// variant_class's sub_variants (price, transmission, fuel, drive) are
// already sitting in memory.
//
// Color coding (same scheme as Sidebar.tsx, applied everywhere):
//   Dark grey  = selectable (falls within current price range / filters)
//   Light grey = NOT selectable
//   Blue       = once selected

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, ChevronLeft, Filter, Plus, X, Sparkles } from 'lucide-react';
import { fetchFullCatalogPricing, CatalogEntry } from '../services/stackUpApi';
import { StackUpSelection } from '../stackUpTypes';
import { SelectionState } from '../types';

interface StackUpSidebarProps {
    onSelectionChange: (selections: StackUpSelection[]) => void;
    initialSelections?: SelectionState[];
}

const CUSTOM_PLAN_BRAND = 'NM';
const BODY_TYPES = ['Hatch', 'Sedan', 'SUV', 'MPV', 'Van']; // same fixed list as Sidebar.tsx
const LAKH = 100000;

interface VariantRow {
    variant_class: string;
    variant_id: string; // a representative sub_variant_id for this class
    engine: string;
    pt: string; // transmission, joined e.g. "5MT/6AT"
    fuel: string; // joined e.g. "Petrol/CNG"
    drive: string;
    minPrice: number; // lakhs
    maxPrice: number; // lakhs
}

const makeCarId = (brand: string, model: string) => `${brand}__${model}`;

const priceRangeLakhs = (entry: CatalogEntry): [number, number] => {
    const prices = entry.sub_variants.map((sv) => sv.ex_showroom_price / LAKH);
    if (prices.length === 0) return [0, 0];
    return [Math.min(...prices), Math.max(...prices)];
};

const overlapsRange = (entry: CatalogEntry, min: number, max: number) => {
    const [lo, hi] = priceRangeLakhs(entry);
    return hi >= min && lo <= max;
};

const StackUpSidebar: React.FC<StackUpSidebarProps> = ({ onSelectionChange, initialSelections }) => {
    // Synchronize filters on initial render if fc has updated
    const fcUpdated = sessionStorage.getItem('fc_filters_updated_at');
    const stackupSync = sessionStorage.getItem('stackup_last_sync_time');
    if (fcUpdated && fcUpdated !== stackupSync) {
        // Sync all keys from fc to stackup
        const mappings = {
            fc_priceMin: 'stackup_priceMin',
            fc_priceMax: 'stackup_priceMax',
            fc_selectedBodyTypes: 'stackup_selectedBodyTypes',
            fc_selectedBrands: 'stackup_selectedBrands',
            fc_openDropdownBrands: 'stackup_openDropdownBrands',
            fc_selectedModels: 'stackup_selectedModels'
        };
        Object.entries(mappings).forEach(([fcKey, suKey]) => {
            const val = sessionStorage.getItem(fcKey);
            if (val !== null) {
                sessionStorage.setItem(suKey, val);
            } else {
                sessionStorage.removeItem(suKey);
            }
        });

        // Also map selections
        const fcSels = sessionStorage.getItem('app_currentSelections');
        if (fcSels) {
            try {
                const parsed = JSON.parse(fcSels);
                const mapped = parsed.map((sel: any) => {
                    const isNM = !!sel.plan_id;
                    return {
                        source: isNM ? 'new_model' : 'production',
                        brand: sel.brand,
                        model: sel.model,
                        car_id: `${sel.brand}__${sel.model}`,
                        variant_class: sel.variant,
                        variant_id: sel.plan_id || sel.variant_id
                    };
                });
                sessionStorage.setItem('stackup_selections', JSON.stringify(mapped));
            } catch (e) {
                console.error(e);
            }
        }
        sessionStorage.setItem('stackup_last_sync_time', fcUpdated);
    }

    const [isOpen, setIsOpen] = useState<boolean>(true);

    const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
    const [dataLoaded, setDataLoaded] = useState<boolean>(false);

    // Filters
    const [priceMin, setPriceMin] = useState<number>(() => {
        const saved = sessionStorage.getItem('stackup_priceMin');
        return saved ? parseFloat(saved) : 0;
    });
    const [priceMax, setPriceMax] = useState<number>(() => {
        const saved = sessionStorage.getItem('stackup_priceMax');
        return saved ? parseFloat(saved) : 100;
    });
    const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>(() => {
        const saved = sessionStorage.getItem('stackup_selectedBodyTypes');
        return saved ? JSON.parse(saved) : [];
    });
    const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
        const saved = sessionStorage.getItem('stackup_selectedBrands');
        return saved ? JSON.parse(saved) : [];
    });

    // Model dropdown state
    const [openDropdownBrands, setOpenDropdownBrands] = useState<string[]>(() => {
        const saved = sessionStorage.getItem('stackup_openDropdownBrands');
        return saved ? JSON.parse(saved) : [];
    });
    const [selectedModels, setSelectedModels] = useState<Array<{ brand: string; model: string }>>(() => {
        const saved = sessionStorage.getItem('stackup_selectedModels');
        return saved ? JSON.parse(saved) : [];
    });

    // Variant popup + final selections
    const [modalBrand, setModalBrand] = useState<string>('');
    const [modalModel, setModalModel] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selections, setSelections] = useState<StackUpSelection[]>(() => {
        const saved = sessionStorage.getItem('stackup_selections');
        return saved ? JSON.parse(saved) : [];
    });

    // Persist all state
    useEffect(() => {
        sessionStorage.setItem('stackup_priceMin', priceMin.toString());
        sessionStorage.setItem('stackup_priceMax', priceMax.toString());
        sessionStorage.setItem('stackup_selectedBodyTypes', JSON.stringify(selectedBodyTypes));
        sessionStorage.setItem('stackup_selectedBrands', JSON.stringify(selectedBrands));
        sessionStorage.setItem('stackup_openDropdownBrands', JSON.stringify(openDropdownBrands));
        sessionStorage.setItem('stackup_selectedModels', JSON.stringify(selectedModels));
        sessionStorage.setItem('stackup_selections', JSON.stringify(selections));
    }, [priceMin, priceMax, selectedBodyTypes, selectedBrands, openDropdownBrands, selectedModels, selections]);

    // Also support dynamic sync on updates/mount if fc updated while mounted
    useEffect(() => {
        const fcUp = sessionStorage.getItem('fc_filters_updated_at');
        const suSync = sessionStorage.getItem('stackup_last_sync_time');
        if (fcUp && fcUp !== suSync) {
            const pMin = sessionStorage.getItem('fc_priceMin');
            if (pMin !== null) setPriceMin(parseFloat(pMin));
            const pMax = sessionStorage.getItem('fc_priceMax');
            if (pMax !== null) setPriceMax(parseFloat(pMax));
            const bTypes = sessionStorage.getItem('fc_selectedBodyTypes');
            if (bTypes !== null) setSelectedBodyTypes(JSON.parse(bTypes));
            const brands = sessionStorage.getItem('fc_selectedBrands');
            if (brands !== null) setSelectedBrands(JSON.parse(brands));
            const openBrands = sessionStorage.getItem('fc_openDropdownBrands');
            if (openBrands !== null) setOpenDropdownBrands(JSON.parse(openBrands));
            const selModels = sessionStorage.getItem('fc_selectedModels');
            if (selModels !== null) setSelectedModels(JSON.parse(selModels));

            const fcSels = sessionStorage.getItem('app_currentSelections');
            if (fcSels) {
                try {
                    const parsed = JSON.parse(fcSels);
                    const mapped = parsed.map((sel: any) => {
                        const isNM = !!sel.plan_id;
                        return {
                            source: isNM ? 'new_model' : 'production',
                            brand: sel.brand,
                            model: sel.model,
                            car_id: `${sel.brand}__${sel.model}`,
                            variant_class: sel.variant,
                            variant_id: sel.plan_id || sel.variant_id
                        };
                    });
                    setSelections(mapped);
                    sessionStorage.setItem('stackup_selections', JSON.stringify(mapped));
                } catch (e) {
                    console.error(e);
                }
            }
            sessionStorage.setItem('stackup_last_sync_time', fcUp);
        }
    }, [catalog, initialSelections]);

    // ====================== Single bulk fetch ======================
    useEffect(() => {
        fetchFullCatalogPricing()
            .then((data) => {
                setCatalog(data);
                setDataLoaded(true);
                const allPrices = data.flatMap((e) => e.sub_variants.map((sv) => sv.ex_showroom_price / LAKH));
                const maxP = allPrices.length ? Math.ceil(Math.max(...allPrices)) : 100;
                if (!sessionStorage.getItem('stackup_priceMax')) {
                    setPriceMax(maxP > 0 ? maxP : 100);
                }
            })
            .catch((e) => console.error('Failed to load Stack-Up catalog', e));
    }, []);

    useEffect(() => {
        onSelectionChange(selections);
    }, [selections, onSelectionChange]);

    const toggleBodyType = (bt: string) => {
        setSelectedBodyTypes((prev) => (prev.includes(bt) ? prev.filter((b) => b !== bt) : [...prev, bt]));
    };

    // ====================== Derived: price-filtered views ======================

    const variantsInPriceRange = useMemo(
        () => catalog.filter((e) => overlapsRange(e, priceMin, priceMax)),
        [catalog, priceMin, priceMax]
    );

    const availableBodyTypesInPrice = useMemo(
        () => Array.from(new Set(variantsInPriceRange.map((e) => e.body_type))),
        [variantsInPriceRange]
    );

    const filteredCatalog = useMemo(() => {
        if (selectedBodyTypes.length === 0) return [];
        return catalog.filter(
            (e) =>
                overlapsRange(e, priceMin, priceMax) &&
                selectedBodyTypes.includes(e.body_type)
        );
    }, [catalog, priceMin, priceMax, selectedBodyTypes]);

    const availableBrandsInFilter = useMemo(() => {
        return new Set(filteredCatalog.map((e) => e.brand));
    }, [filteredCatalog]);

    const isModelSelectable = (brand: string, model: string) => {
        if (!selectedBrands.includes(brand)) return false;
        return filteredCatalog.some((e) => e.brand === brand && e.model === model);
    };

    // Auto-remove selections that fall outside the active filters (Price/BodyType/Hierarchy)
    useEffect(() => {
        if (!dataLoaded) return;

        setSelections((prev) => {
            const valid = prev.filter(sel => 
                filteredCatalog.some(e => e.brand === sel.brand && e.model === sel.model && e.variant_class === sel.variant_class)
            );
            return valid.length !== prev.length ? valid : prev;
        });

        setSelectedModels((prev) => {
            const valid = prev.filter(m => 
                filteredCatalog.some(e => e.brand === m.brand && e.model === m.model)
            );
            return valid.length !== prev.length ? valid : prev;
        });

        setSelectedBrands((prev) => {
            const valid = prev.filter(b => availableBrandsInFilter.has(b));
            return valid.length !== prev.length ? valid : prev;
        });

    }, [filteredCatalog, availableBrandsInFilter, dataLoaded]);

    const allBrands = useMemo(() => {
        const brands = Array.from(new Set(catalog.map((e) => e.brand)));
        return brands.sort((a, b) => {
            if (a === CUSTOM_PLAN_BRAND) return -1;
            if (b === CUSTOM_PLAN_BRAND) return 1;
            return a.localeCompare(b);
        });
    }, [catalog]);

    const modelsForBrand = (brand: string) => Array.from(new Set(catalog.filter((e) => e.brand === brand).map((e) => e.model)));

    // ====================== Brand / Model selection ======================

    const toggleBrand = (brand: string) => {
        const isSelected = selectedBrands.includes(brand);
        const isSelectable = availableBrandsInFilter.has(brand);
        if (isSelected) {
            setSelectedBrands((prev) => prev.filter((b) => b !== brand));
            setOpenDropdownBrands((prev) => prev.filter((b) => b !== brand));
        } else if (isSelectable) {
            setSelectedBrands((prev) => [...prev, brand]);
            if (!openDropdownBrands.includes(brand)) {
                setOpenDropdownBrands((prev) => [...prev, brand]);
            }
        }
    };

    const isModelSelected = (brand: string, model: string) => selectedModels.some((m) => m.brand === brand && m.model === model);

    const toggleModelSelection = (brand: string, model: string) => {
        if (isModelSelected(brand, model)) {
            setSelectedModels((prev) => prev.filter((m) => !(m.brand === brand && m.model === model)));
            const carId = makeCarId(brand, model);
            setSelections((prev) => prev.filter((s) => s.car_id !== carId));
        } else {
            setSelectedModels((prev) => [...prev, { brand, model }]);
        }
    };

    // ====================== Variant popup (instant, no fetch — data already in memory) ======================

    const openVariantModal = (brand: string, model: string) => {
        setModalBrand(brand);
        setModalModel(model);
        setIsModalOpen(true);
    };

    const closeVariantModal = () => {
        setIsModalOpen(false);
        setModalBrand('');
        setModalModel('');
    };

    const activeVariantRows: VariantRow[] = useMemo(() => {
        if (!modalBrand || !modalModel) return [];
        return filteredCatalog
            .filter((e) => e.brand === modalBrand && e.model === modalModel)
            .map((e) => {
                const transmissions = Array.from(new Set(e.sub_variants.map((sv) => sv.transmission_type).filter(Boolean)));
                const fuels = Array.from(new Set(e.sub_variants.map((sv) => sv.fuel_type).filter(Boolean)));
                const drives = Array.from(new Set(e.sub_variants.map((sv) => sv.drive_type).filter(Boolean)));
                const engines = Array.from(new Set(e.sub_variants.map((sv) => sv.engine_type).filter(Boolean)));
                const [minPrice, maxPrice] = priceRangeLakhs(e);
                return {
                    variant_class: e.variant_class,
                    variant_id: e.sub_variants[0]?.sub_variant_id || e.variant_class,
                    engine: engines.join(' / '),
                    pt: transmissions.join('/'),
                    fuel: fuels.join('/'),
                    drive: drives.join('/'),
                    minPrice,
                    maxPrice,
                };
            });
    }, [filteredCatalog, modalBrand, modalModel]);

    const isVariantSelected = (brand: string, model: string, variantClass: string) => {
        const carId = makeCarId(brand, model);
        return selections.some((s) => s.car_id === carId && s.variant_class === variantClass);
    };

    const selectAllVariants = () => {
        setSelections((prev) => {
            const carId = makeCarId(modalBrand, modalModel);
            const otherSelections = prev.filter((s) => s.car_id !== carId);
            const newSels = activeVariantRows.map((row) => ({
                source: modalBrand === CUSTOM_PLAN_BRAND ? ('new_model' as const) : ('production' as const),
                brand: modalBrand,
                model: modalModel,
                car_id: carId,
                variant_class: row.variant_class,
                variant_id: row.variant_id,
            }));
            
            if (!isModelSelected(modalBrand, modalModel)) {
                setSelectedModels((prevModels) => [...prevModels, { brand: modalBrand, model: modalModel }]);
            }
            
            return [...otherSelections, ...newSels];
        });
    };

    const clearAllVariants = () => {
        setSelections((prev) => {
            const carId = makeCarId(modalBrand, modalModel);
            return prev.filter((s) => s.car_id !== carId);
        });
    };

    const toggleVariantSelection = (brand: string, model: string, row: VariantRow) => {
        const carId = makeCarId(brand, model);
        const isSelected = isVariantSelected(brand, model, row.variant_class);
        if (isSelected) {
            setSelections((prev) => prev.filter((s) => !(s.car_id === carId && s.variant_class === row.variant_class)));
        } else {
            // Make sure the model chip exists so it shows under the Variant row
            if (!isModelSelected(brand, model)) {
                setSelectedModels((prev) => [...prev, { brand, model }]);
            }
            setSelections((prev) => [
                ...prev,
                {
                    source: brand === CUSTOM_PLAN_BRAND ? 'new_model' : 'production',
                    brand,
                    model,
                    car_id: carId,
                    variant_class: row.variant_class,
                    variant_id: row.variant_id,
                },
            ]);
        }
    };

    if (!isOpen) {
        return (
            <aside className="w-10 md:w-12 lg:w-14 bg-blue-700 text-slate-900 flex-shrink-0 h-full border-r border-slate-200 flex items-center justify-center">
                <button
                    onClick={() => setIsOpen(true)}
                    className="h-[80%] w-full flex flex-col items-center justify-center gap-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-colors"
                >
                    <ChevronRight size={18} className="text-blue-700" />
                    <span className="text-[11px] font-bold tracking-wide text-slate-700 transform -rotate-90 whitespace-nowrap">
                        Open Filters
                    </span>
                </button>
            </aside>
        );
    }

    return (
        <>
            <aside className="w-[380px] bg-white flex-shrink-0 flex flex-col h-full border-r border-slate-300 shadow-xl z-30 font-sans">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 -ml-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                            title="Collapse Sidebar"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <Filter size={16} className="text-blue-600" />
                        Stack-Up Filters
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {!dataLoaded ? (
                        <div className="p-8 text-center text-slate-500 text-sm">Loading catalog...</div>
                    ) : (
                        <div className="flex flex-col h-full bg-white">
                            <div className="flex-1 overflow-y-auto custom-scrollbar border-b border-slate-300">
                                <div className="flex flex-col border-t border-slate-300">
                                    {/* 1. Price Range Slicer */}
                                    <div className="grid grid-cols-[85px_1fr] border-b border-blue-200">
                                        <div className="border-r border-slate-300 bg-slate-50 p-2 text-[10px] font-bold flex items-center justify-center text-center text-slate-800">
                                            Ex Showroom
                                            <br />
                                            Price
                                        </div>
                                        <div className="p-4 flex flex-col gap-2 justify-center bg-white">
                                            <div className="relative px-2">
                                                <div className="relative h-1.5 bg-slate-200 rounded-full">
                                                    <div
                                                        className="absolute h-full bg-slate-600 rounded-full"
                                                        style={{
                                                            left: `${(priceMin / Math.ceil(Math.max(...catalog.flatMap((e) => e.sub_variants.map((sv) => sv.ex_showroom_price / LAKH)), 100))) * 100}%`,
                                                            right: `${100 - (priceMax / Math.ceil(Math.max(...catalog.flatMap((e) => e.sub_variants.map((sv) => sv.ex_showroom_price / LAKH)), 100))) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={Math.ceil(Math.max(...catalog.flatMap((e) => e.sub_variants.map((sv) => sv.ex_showroom_price / LAKH)), 100))}
                                                    step={0.5}
                                                    value={priceMin}
                                                    onChange={(e) => {
                                                        const v = parseFloat(e.target.value);
                                                        if (v < priceMax) setPriceMin(v);
                                                    }}
                                                    className="absolute top-0 left-0 w-full h-1.5 opacity-0 cursor-pointer"
                                                />
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={Math.ceil(Math.max(...catalog.flatMap((e) => e.sub_variants.map((sv) => sv.ex_showroom_price / LAKH)), 100))}
                                                    step={0.5}
                                                    value={priceMax}
                                                    onChange={(e) => {
                                                        const v = parseFloat(e.target.value);
                                                        if (v > priceMin) setPriceMax(v);
                                                    }}
                                                    className="absolute top-0 left-0 w-full h-1.5 opacity-0 cursor-pointer"
                                                />
                                                <div
                                                    className="absolute top-1/2 -translate-y-1/2 -ml-2 w-4 h-4 rounded-full bg-[#cc4400] border-2 border-white shadow pointer-events-none"
                                                    style={{
                                                        left: `${(priceMin / Math.ceil(Math.max(...catalog.flatMap((e) => e.sub_variants.map((sv) => sv.ex_showroom_price / LAKH)), 100))) * 100}%`,
                                                    }}
                                                />
                                                <div
                                                    className="absolute top-1/2 -translate-y-1/2 -mr-2 w-4 h-4 rounded-full bg-[#006600] border-2 border-white shadow pointer-events-none"
                                                    style={{
                                                        left: `${(priceMax / Math.ceil(Math.max(...catalog.flatMap((e) => e.sub_variants.map((sv) => sv.ex_showroom_price / LAKH)), 100))) * 100}%`,
                                                    }}
                                                />
                                            </div>

                                            <div className="flex justify-between items-center text-[10px] font-bold mt-2">
                                                <div className="flex flex-col gap-1 items-center">
                                                    <span className="text-[9px] font-semibold text-slate-500">Min</span>
                                                    <div className="border border-slate-400 bg-slate-100 rounded px-1.5 py-0.5 flex items-center">
                                                        <input
                                                            type="number"
                                                            className="w-10 outline-none text-center bg-transparent"
                                                            value={priceMin}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                if (!isNaN(val) && val < priceMax) setPriceMin(val);
                                                            }}
                                                        />
                                                        <span>L</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 items-center">
                                                    <span className="text-[9px] font-semibold text-slate-500">Max</span>
                                                    <div className="border border-slate-400 bg-slate-100 rounded px-1.5 py-0.5 flex items-center">
                                                        <input
                                                            type="number"
                                                            className="w-10 outline-none text-center bg-transparent"
                                                            value={priceMax}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value);
                                                                if (!isNaN(val) && val > priceMin) setPriceMax(val);
                                                            }}
                                                        />
                                                        <span>L</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Body Type */}
                                    <div className="grid grid-cols-[85px_1fr] border-b border-blue-200">
                                        <div className="border-r border-slate-300 bg-slate-50 p-2 text-[10px] font-bold flex items-center justify-center text-slate-800">
                                            Body Type
                                        </div>
                                        <div className="p-3 flex gap-2 flex-wrap items-center bg-white">
                                            {BODY_TYPES.map((bt) => {
                                                const isSelected = selectedBodyTypes.includes(bt);
                                                const hasInRange = availableBodyTypesInPrice.includes(bt);

                                                let cls = '';
                                                if (isSelected) {
                                                    cls = 'bg-blue-500 text-white border-blue-600 shadow-sm';
                                                } else if (hasInRange) {
                                                    cls = 'bg-slate-700 text-white hover:bg-slate-800 shadow-sm';
                                                } else {
                                                    cls = 'bg-slate-200 text-slate-500 cursor-not-allowed';
                                                }

                                                return (
                                                    <button
                                                        key={bt}
                                                        disabled={!hasInRange && !isSelected}
                                                        onClick={() => {
                                                            if (hasInRange || isSelected) toggleBodyType(bt);
                                                        }}
                                                        className={`px-3 py-1 text-[10px] font-bold rounded-sm transition-all ${cls}`}
                                                    >
                                                        {bt}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* 3. Brand */}
                                    <div className="grid grid-cols-[85px_1fr] border-b border-blue-200">
                                        <div className="border-r border-slate-300 bg-slate-50 p-2 text-[10px] font-bold flex items-center justify-center text-slate-800">
                                            Brand
                                        </div>
                                        <div className="p-3 flex justify-center gap-1.5 items-center bg-white overflow-x-auto custom-scrollbar">
                                            {allBrands.map((brand) => {
                                                const isSelected = selectedBrands.includes(brand);
                                                const isSelectable = availableBrandsInFilter.has(brand);

                                                let bgColor = 'bg-slate-200 border-slate-300 opacity-50 cursor-not-allowed';
                                                if (isSelected) bgColor = 'bg-blue-600 border-blue-700 shadow-sm';
                                                else if (isSelectable) bgColor = 'bg-slate-700 border-slate-800 hover:bg-slate-800 shadow-sm';

                                                return (
                                                    <div key={brand} className="w-[84px] shrink-0 flex justify-center">
                                                        <button
                                                            disabled={!isSelectable && !isSelected}
                                                            onClick={() => toggleBrand(brand)}
                                                            className={`w-12 h-8 shrink-0 flex items-center justify-center border rounded shadow-sm transition-all ${bgColor}`}
                                                        >
                                                            {brand === CUSTOM_PLAN_BRAND ? (
                                                                <div
                                                                    className={`flex items-center gap-0.5 font-black text-[10px] tracking-wider ${isSelected || isSelectable ? 'text-white' : 'text-slate-500'
                                                                        }`}
                                                                >
                                                                    <Sparkles size={9} /> NM
                                                                </div>
                                                            ) : brand.toLowerCase().includes('maruti') ? (
                                                                <img
                                                                    src="/maruti_logo.png"
                                                                    alt={brand}
                                                                    className="w-8 h-4 object-contain bg-white rounded-[2px] p-[2px] shadow-sm"
                                                                />
                                                            ) : brand.toLowerCase().includes('hyundai') ? (
                                                                <img
                                                                    src="/hyundai_logo.png"
                                                                    alt={brand}
                                                                    className="w-8 h-4 object-contain bg-white rounded-[2px] p-[2px] shadow-sm"
                                                                />
                                                            ) : (
                                                                <div
                                                                    className={`text-[8px] font-bold text-center leading-tight ${isSelected || isSelectable ? 'text-white' : 'text-slate-500'
                                                                        }`}
                                                                >
                                                                    {brand}
                                                                </div>
                                                            )}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* 4. Model */}
                                    <div className="grid grid-cols-[85px_1fr] border-b border-blue-200">
                                        <div className="border-r border-slate-300 bg-slate-50 p-2 flex flex-col items-center justify-center text-center">
                                            <span className="text-[10px] font-bold text-slate-800">Model</span>
                                        </div>
                                        <div className="p-3 flex justify-center gap-1.5 items-start bg-white min-h-[40px] overflow-x-auto custom-scrollbar">
                                            {allBrands.map((brand) => {
                                                const brandModels = modelsForBrand(brand);
                                                return (
                                                    <div key={brand} className="w-[84px] shrink-0 flex flex-col items-center">
                                                        <button
                                                            onClick={() => {
                                                                setOpenDropdownBrands((prev) =>
                                                                    prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
                                                                );
                                                            }}
                                                            className="w-10 h-5 border border-slate-300 bg-slate-50 rounded shadow-sm text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
                                                        >
                                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                                <path d="M6 9l6 6 6-6" />
                                                            </svg>
                                                        </button>

                                                        {openDropdownBrands.includes(brand) && (
                                                            <div className="mt-1.5 bg-white border border-slate-300 shadow-md flex flex-col w-[80px] rounded py-0.5 z-10">
                                                                {brandModels.length === 0 && (
                                                                    <div className="px-2 py-1 text-[9px] text-slate-400">No models</div>
                                                                )}
                                                                {brandModels.map((model) => {
                                                                    const isSelected = isModelSelected(brand, model);
                                                                    const isSelectable = isModelSelectable(brand, model);

                                                                    let bgColor = 'bg-slate-200 text-slate-500 cursor-not-allowed';
                                                                    if (isSelected) bgColor = 'bg-blue-600 text-white hover:bg-blue-700 shadow-inner';
                                                                    else if (isSelectable) bgColor = 'bg-slate-700 text-white hover:bg-slate-800 shadow-sm';

                                                                    return (
                                                                        <button
                                                                            key={model}
                                                                            disabled={!isSelectable && !isSelected}
                                                                            onClick={() => toggleModelSelection(brand, model)}
                                                                            className={`px-1 py-1 mx-0.5 my-0.5 text-[8.5px] font-bold text-center transition-all rounded ${bgColor} leading-[1.1]`}
                                                                        >
                                                                            {model}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* 5. Variant */}
                                    <div className="grid grid-cols-[85px_1fr]">
                                        <div className="border-r border-slate-300 bg-slate-50 p-2 flex flex-col items-center justify-start pt-4 text-center">
                                            <span className="text-[10px] font-bold text-slate-800">Variant</span>
                                            <span className="text-[7px] text-slate-400 font-bold uppercase tracking-tighter mt-1">CLICK HERE</span>
                                        </div>
                                        <div className="p-3 flex justify-center gap-1.5 items-start bg-slate-50/50 min-h-[100px] overflow-x-auto relative">
                                            {allBrands.map((brand) => {
                                                const brandSelectedModels = selectedModels.filter((sm) => sm.brand === brand);
                                                return (
                                                    <div key={brand} className="w-[84px] shrink-0 flex flex-col items-center gap-1 px-0.5">
                                                        {brandSelectedModels.map((sm, idx) => {
                                                            const carId = makeCarId(sm.brand, sm.model);
                                                            const selectedCount = selections.filter((s) => s.car_id === carId).length;
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="flex items-stretch bg-blue-500 text-white rounded shadow-sm w-full hover:shadow transition-shadow"
                                                                >
                                                                    <button
                                                                        onClick={() => openVariantModal(sm.brand, sm.model)}
                                                                        className="w-4 hover:bg-blue-600 rounded-l transition-colors border-r border-blue-400 flex items-center justify-center shrink-0"
                                                                        title={`Select variants for ${sm.model}`}
                                                                    >
                                                                        <Plus size={8} strokeWidth={3} className="text-white" />
                                                                    </button>
                                                                    <div className="flex-1 px-1 py-1 text-[8.5px] font-bold flex flex-col items-center justify-center bg-blue-500 rounded-r text-center leading-[1.1]">
                                                                        <span className="truncate w-full">{sm.model}</span>
                                                                        {selectedCount > 0 && (
                                                                            <span className="bg-white text-blue-700 text-[7px] px-1 rounded-full shadow-sm mt-[1px]">
                                                                                {selectedCount}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                            {selectedModels.length === 0 && (
                                                <div className="absolute left-[85px] right-0 text-[10px] text-slate-400 italic py-1 text-center pointer-events-none mt-2">
                                                    Select a model from the dropdowns above
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Color Coding Legend */}
                            <div className="p-4 bg-slate-100 flex-shrink-0 border-t border-slate-300">
                                <div className="bg-slate-200/50 p-3 rounded border border-slate-300 text-[10px] text-slate-700 space-y-1.5">
                                    <div className="font-bold text-slate-800 mb-2 border-b border-slate-300 pb-1">Color Coding:</div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3.5 h-3.5 bg-slate-700 rounded-sm shadow-sm"></div>{' '}
                                        <span className="font-medium">1) Dark grey</span> — Selectable as it is falling in price range
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3.5 h-3.5 bg-slate-200 border border-slate-300 rounded-sm"></div>{' '}
                                        <span className="font-medium text-slate-500">2) Light grey</span>{' '}
                                        <span className="text-slate-500">— NON-Selectable</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3.5 h-3.5 bg-blue-600 rounded-sm shadow-sm"></div>{' '}
                                        <span className="font-medium text-blue-700">3) Blue</span> — ONCE Selected
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* POPUP WINDOW FOR VARIANTS */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
                            <h3 className="font-bold text-sm flex items-center gap-2">
                                Select Variants: <span className="text-blue-300">{modalBrand === CUSTOM_PLAN_BRAND ? 'NM' : modalBrand} {modalModel}</span>
                            </h3>
                            <button onClick={closeVariantModal} className="text-slate-300 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-0 overflow-auto max-h-[60vh] custom-scrollbar">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="bg-slate-100 sticky top-0 shadow-sm z-10">
                                    <tr>
                                        <th className="p-2 border-b border-slate-200 w-10 text-center"></th>
                                        <th className="p-2 border-b border-slate-200 border-l border-slate-200 font-bold text-slate-800">V Name</th>
                                        <th className="p-2 border-b border-slate-200 border-l border-slate-200 font-bold text-slate-800">Engine</th>
                                        <th className="p-2 border-b border-slate-200 border-l border-slate-200 font-bold text-slate-800">PT</th>
                                        <th className="p-2 border-b border-slate-200 border-l border-slate-200 font-bold text-slate-800">Fuel Type</th>
                                        <th className="p-2 border-b border-slate-200 border-l border-slate-200 font-bold text-slate-800">Drive Type</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {activeVariantRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-500">
                                                No variants available for this model in the current price range
                                            </td>
                                        </tr>
                                    ) : (
                                        activeVariantRows.map((row, i) => {
                                            const isSelected = isVariantSelected(modalBrand, modalModel, row.variant_class);
                                            return (
                                                <tr
                                                    key={i}
                                                    className={`transition-colors cursor-pointer ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-slate-50 text-slate-800'
                                                        }`}
                                                    onClick={() => toggleVariantSelection(modalBrand, modalModel, row)}
                                                >
                                                    <td className="p-2 border-l border-slate-200 text-center align-middle w-10">
                                                        <div
                                                            className={`w-3.5 h-3.5 border flex items-center justify-center mx-auto transition-colors ${isSelected ? 'bg-white border-white' : 'bg-white border-slate-400'
                                                                }`}
                                                        >
                                                            {isSelected && (
                                                                <svg
                                                                    className="w-3 h-3 text-blue-600"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth={3}
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className={`p-2 border-l border-slate-200 font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                                        {row.variant_class}
                                                    </td>
                                                    <td className={`p-2 border-l border-slate-200 ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>
                                                        {row.engine || '—'}
                                                    </td>
                                                    <td className={`p-2 border-l border-slate-200 ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>
                                                        {row.pt || '—'}
                                                    </td>
                                                    <td className={`p-2 border-l border-slate-200 ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>
                                                        {row.fuel || '—'}
                                                    </td>
                                                    <td className={`p-2 border-l border-slate-200 ${isSelected ? 'text-blue-100' : 'text-slate-400 italic'}`}>
                                                        {row.drive || '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={selectAllVariants}
                                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded text-xs transition-colors border border-blue-200"
                                >
                                    Select All
                                </button>
                                <button
                                    type="button"
                                    onClick={clearAllVariants}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded text-xs transition-colors border border-slate-250"
                                >
                                    Clear All
                                </button>
                            </div>
                            <button
                                onClick={closeVariantModal}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded text-sm transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StackUpSidebar;

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, TrendingUp, List, LayoutGrid, ChevronDown, Upload, Plus } from 'lucide-react';
import ChartView from '../components/ChartView';
import TableView from '../components/TableView';
import DownloadExcelButton from '../components/DownloadExcelButton';

/* ================= TYPES & HELPERS ================= */
interface CatalogBrand { brand_id: string; brand_name: string; cars: { car_id: string; car_name: string }[]; }
interface PricingData {
  variant_id: string;
  variant_name: string;
  pricing_id: string;
  ex_showroom_price: number;
  currency: string;
  fuel_type: string | null;
  engine_type: string | null;
  transmission_type: string | null;
  paint_type: string | null;
  edition: string | null;
  pricing_version: number;
  created_at: string;
}
interface GroupedVariant { variant_id: string; variant_name: string; avg_price: number; min_price: number; max_price: number; types: { type: string; price: number }[]; }
interface SelectedCar { id: string; brand: string; model: string; pricing?: PricingData[]; }

// Use environment variable or relative API URL
const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:8000/api';

const groupByVariant = (pricing: PricingData[]): GroupedVariant[] => {
  const grouped = new Map<string, GroupedVariant>();
  pricing.forEach(p => {
    if (!grouped.has(p.variant_id)) {
      grouped.set(p.variant_id, { variant_id: p.variant_id, variant_name: p.variant_name, avg_price: 0, min_price: p.ex_showroom_price, max_price: p.ex_showroom_price, types: [] });
    }
    const variant = grouped.get(p.variant_id)!;
    const typeLabel = [p.fuel_type, p.engine_type, p.transmission_type].filter(Boolean).join(' ');
    variant.types.push({ type: typeLabel || 'Standard', price: p.ex_showroom_price });
    variant.min_price = Math.min(variant.min_price, p.ex_showroom_price);
    variant.max_price = Math.max(variant.max_price, p.ex_showroom_price);
  });
  return Array.from(grouped.values()).map(v => ({
    ...v,
    avg_price: v.types.reduce((sum, t) => sum + t.price, 0) / v.types.length
  })).sort((a, b) => a.avg_price - b.avg_price);
};

const formatPrice = (p: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);
const formatPriceShort = (p: number) => {
  if (p >= 10000000) return `₹${(p / 10000000).toFixed(1)}Cr`;
  if (p >= 100000) return `₹${(p / 100000).toFixed(1)}L`;
  return `₹${(p / 1000).toFixed(0)}K`;
};

/* ================= SHARED COMPONENTS ================= */

export const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const raw = payload[0]?.payload;

  if (!raw || !raw.variant_name || !Array.isArray(raw.types)) {
    return null;
  }

  const data = raw as GroupedVariant;

  return (
    <div className="bg-white border-2 border-slate-300 rounded-lg shadow-xl p-3 max-w-xs pointer-events-none text-xs text-slate-800">
      <p className="font-bold mb-2">{data.variant_name}</p>

      <div className="flex justify-between">
        <span className="text-slate-500">Price Range:</span>
        <span className="font-bold text-blue-600">
          {formatPrice(data.min_price)} - {formatPrice(data.max_price)}
        </span>
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-slate-500">Configurations:</span>
        <span className="font-bold">{data.types.length}</span>
      </div>

      <div className="text-slate-400 text-[10px] mt-2 pt-2 border-t">
        Click to see all configurations
      </div>
    </div>
  );
};

const VariantModal = ({
  variant,
  onClose,
  brandColor
}: {
  variant: GroupedVariant | null;
  onClose: () => void;
  brandColor: string;
}) => {
  if (!variant) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${brandColor} text-white p-5 flex items-start justify-between shrink-0`}>
          <div>
            <h3 className="font-bold text-xl">{variant.variant_name}</h3>
            <p className="text-sm opacity-80">{variant.types.length} Configuration{variant.types.length > 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 border-b">
              <tr>
                <th className="p-3 text-left text-xs font-bold text-slate-500 uppercase">
                  Configuration
                </th>
                <th className="p-3 text-right text-xs font-bold text-slate-500 uppercase">
                  Price
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {variant.types.map((t, i) => {
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-700 font-medium">
                      {t.type}
                    </td>

                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatPrice(t.price)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */

const PriceComparisonPage = () => {
  const [catalog, setCatalog] = useState<CatalogBrand[]>([]);
  const [globalViewMode, setGlobalViewMode] = useState<'chart' | 'table'>('chart');
  const [cars, setCars] = useState<SelectedCar[]>([
    { id: '1', brand: 'Maruti', model: 'Grand Vitara' },
    { id: '2', brand: '', model: '' }
  ]);
  const [selectedVariant, setSelectedVariant] = useState<{ variant: GroupedVariant; carId: string } | null>(null);
  const [domReady, setDomReady] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  const carColors = { '1': 'bg-blue-600', '2': 'bg-red-600' };

  interface CommonFilters {
    selectedFuelTypes: Set<string>;
    selectedTransmissions: Set<string>;
    selectedVariants: Set<string>;
    selectedPaintTypes: Set<string>;
    selectedEditions: Set<string>;
  }

  const [commonFilters, setCommonFilters] = useState<CommonFilters>({
    selectedFuelTypes: new Set<string>(),
    selectedTransmissions: new Set<string>(),
    selectedVariants: new Set<string>(),
    selectedPaintTypes: new Set<string>(),
    selectedEditions: new Set<string>()
  });

  useEffect(() => {
    setDomReady(true);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/catalog`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        return r.json();
      })
      .then(d => {
        setCatalog(d.brands);
        setCatalogLoaded(true);
      })
      .catch(err => console.error('Catalog Error:', err));
  }, []);

  const fetchPricing = async (car: SelectedCar) => {
    try {
      const res = await fetch(`${API_BASE_URL}/v1/pricing?brand_name=${encodeURIComponent(car.brand)}&car_name=${encodeURIComponent(car.model)}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.success && data.pricing) {
        setCars(p => p.map(c => (c.id === car.id ? { ...c, pricing: data.pricing } : c)));
      }
    } catch (err) {
      console.error('Pricing Error:', err);
    }
  };

  useEffect(() => {
    if (!catalogLoaded) return;

    cars.forEach(car => {
      if (car.brand && car.model && !car.pricing) {
        fetchPricing(car);
      }
    });
  }, [catalogLoaded, cars.map(c => `${c.id}-${c.brand}-${c.model}-${!!c.pricing}`).join(',')]);

  useEffect(() => {
    if (!catalogLoaded || catalog.length === 0) return;
    if (cars[1].brand !== '' || cars[1].model !== '') return;

    const vehicle2Brand = catalog.find(b => b.brand_name !== cars[0].brand) || catalog[0];
    const vehicle2Car = vehicle2Brand?.cars[0];

    if (vehicle2Brand && vehicle2Car) {
      setCars(prev => prev.map(c =>
        c.id === '2'
          ? { ...c, brand: vehicle2Brand.brand_name, model: vehicle2Car.car_name }
          : c
      ));
    }
  }, [catalogLoaded, catalog.length]);

  const updateCar = (id: string, key: 'brand' | 'model', value: string) => {
    setCars(p => p.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [key]: value, ...(key === 'brand' && { model: '', pricing: undefined }) };
      if (key === 'model' && updated.brand && value) fetchPricing(updated);
      return updated;
    }));
  };

  useEffect(() => {
    const allPricing = cars.flatMap(c => c.pricing || []);
    if (allPricing.length === 0) return;

    const uniqueFuelTypes: string[] = Array.from(new Set(allPricing.map(p => p.fuel_type).filter((t): t is string => !!t)));
    const uniqueTransmissions: string[] = Array.from(new Set(allPricing.map(p => p.transmission_type).filter((t): t is string => !!t)));
    const uniqueVariants: string[] = Array.from(new Set(allPricing.map(p => p.variant_id)));
    const uniquePaintTypes: string[] = Array.from(new Set(allPricing.map(p => p.paint_type).filter((t): t is string => !!t)));
    const uniqueEditions: string[] = Array.from(new Set(allPricing.map(p => p.edition).filter((t): t is string => !!t)));

    const defaultFuel = uniqueFuelTypes.filter((f) => f.toLowerCase() === 'petrol');
    const defaultTrans = uniqueTransmissions.filter((t) => ['at', 'dct', 'ivt'].includes(t.toLowerCase()));
    const defaultPaint = uniquePaintTypes.filter((p) => ['dual tone', 'dual_tone'].includes(p.toLowerCase()));
    const defaultEdition = uniqueEditions.filter((e) => ['limited edition', 'limited_edition'].includes(e.toLowerCase()));

    setCommonFilters({
      selectedFuelTypes: new Set(defaultFuel.length > 0 ? defaultFuel : uniqueFuelTypes),
      selectedTransmissions: new Set(defaultTrans.length > 0 ? defaultTrans : uniqueTransmissions),
      selectedVariants: new Set(uniqueVariants),
      selectedPaintTypes: new Set(defaultPaint.length > 0 ? defaultPaint : uniquePaintTypes),
      selectedEditions: new Set(defaultEdition.length > 0 ? defaultEdition : uniqueEditions)
    });
  }, [cars.map(c => c.pricing?.length || 0).join(',')]);

  const toggleCommonFilter = (filterType: keyof CommonFilters, value: string) => {
    setCommonFilters(prev => {
      const filterSet = new Set(prev[filterType]);

      if (filterSet.has(value)) {
        filterSet.delete(value);
      } else {
        filterSet.add(value);
      }

      return {
        ...prev,
        [filterType]: filterSet
      };
    });
  };

  const updateCommonFilter = (filterType: keyof CommonFilters, newSet: Set<string>) => {
    setCommonFilters(prev => ({
      ...prev,
      [filterType]: newSet
    }));
  };

  const getFilteredPricingForCar = (carId: string): PricingData[] => {
    const car = cars.find(c => c.id === carId);
    if (!car || !car.pricing) return [];

    return car.pricing.filter(p => {
      const fuelMatch = !p.fuel_type || commonFilters.selectedFuelTypes.has(p.fuel_type);
      const transmissionMatch = !p.transmission_type || commonFilters.selectedTransmissions.has(p.transmission_type);
      const variantMatch = commonFilters.selectedVariants.has(p.variant_id);
      const paintMatch = !p.paint_type || commonFilters.selectedPaintTypes.has(p.paint_type);
      const editionMatch = !p.edition || commonFilters.selectedEditions.has(p.edition);
      return fuelMatch && transmissionMatch && variantMatch && paintMatch && editionMatch;
    });
  };

  const carsWithPricing = cars.filter(c => c.pricing && c.pricing.length > 0);
  const bothCarsLoaded = carsWithPricing.length === 2;
  const showCombinedView = bothCarsLoaded && globalViewMode === 'chart';

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-col">
      <div className="hidden" />
      {domReady && typeof document !== 'undefined' && document.getElementById('header-action-bar') && createPortal(
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border">
            <button
              onClick={() => setGlobalViewMode('chart')}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all ${globalViewMode === 'chart' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <TrendingUp size={14} /> Chart
            </button>
            <button
              onClick={() => setGlobalViewMode('table')}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all ${globalViewMode === 'table' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List size={14} /> Table
            </button>
          </div>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <DownloadExcelButton
            carsData={cars
              .filter(c => c.brand && c.model && c.pricing && c.pricing.length > 0)
              .map(c => ({
                brand: c.brand,
                model: c.model,
                data: getFilteredPricingForCar(c.id)
              }))
            }
          />
          <button
            onClick={() => alert("Coming Soon")}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors border border-dashed border-slate-300 hover:border-blue-400"
            title="Upload New Car (Prices)"
          >
            <Upload size={16} /> <span className="hidden sm:inline">Upload New Car (Prices)</span>
          </button>
        </div>,
        document.getElementById('header-action-bar')!
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="w-96 bg-white border-r p-4 space-y-4 overflow-y-auto">
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Vehicle Selection</p>

            {cars.map((c, idx) => {
              const brand = catalog.find(b => b.brand_name === c.brand);
              const carVariants = c.pricing ? Array.from(new Map(c.pricing.map(p => [p.variant_id, p.variant_name])).entries()).map(([id, name]: [string, unknown]) => ({ id, name: name as string })).sort((a, b) => a.name.localeCompare(b.name)) : [];

              return (
                <div key={c.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-5 h-5 ${carColors[c.id as '1' | '2']} rounded flex items-center justify-center text-white font-bold text-[10px] shrink-0`}>
                      {idx + 1}
                    </div>
                    <span className="font-bold text-slate-700 text-xs">Vehicle {idx + 1}</span>

                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <select
                      className="w-full bg-white border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={c.brand}
                      onChange={e => updateCar(c.id, 'brand', e.target.value)}
                    >
                      <option value="">Brand</option>
                      {catalog.map(b => <option key={b.brand_id} value={b.brand_name}>{b.brand_name}</option>)}
                    </select>

                    <select
                      className="w-full bg-white border rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                      value={c.model}
                      disabled={!c.brand}
                      onChange={e => updateCar(c.id, 'model', e.target.value)}
                    >
                      <option value="">Model</option>
                      {brand?.cars.map(m => <option key={m.car_id} value={m.car_name}>{m.car_name}</option>)}
                    </select>

                    <div className="relative">
                      <details className="bg-white border rounded-lg">
                        <summary className="px-2 py-1.5 cursor-pointer text-xs list-none flex items-center justify-between">
                          <span className={carVariants.length === 0 ? 'text-slate-400' : 'text-slate-700'}>
                            Variants ({carVariants.filter(v => commonFilters.selectedVariants.has(v.id)).length}/{carVariants.length})
                          </span>
                          <ChevronDown size={12} className="text-slate-400" />
                        </summary>
                        {carVariants.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                            <div className="p-2 space-y-1">
                              {carVariants.map(v => (
                                <label key={v.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={commonFilters.selectedVariants.has(v.id)}
                                    onChange={() => toggleCommonFilter('selectedVariants', v.id)}
                                    className="rounded border-slate-300 w-3 h-3"
                                  />
                                  <span className={commonFilters.selectedVariants.has(v.id) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                                    {v.name}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </details>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => alert("Coming Soon")}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-dashed border-slate-300 flex items-center justify-center gap-2 text-xs font-bold transition-all"
              title="Add New Vehicle"
            >
              <Plus size={14} /> Add New Vehicle (Max 5)
            </button>
          </div>

          {carsWithPricing.length > 0 && (() => {
            const allPricing = cars.flatMap(c => c.pricing || []);
            const uniqueFuelTypes: string[] = Array.from(new Set(allPricing.map(p => p.fuel_type).filter((t): t is string => !!t))).sort();
            const uniqueTransmissions: string[] = Array.from(new Set(allPricing.map(p => p.transmission_type).filter((t): t is string => !!t))).sort();
            const uniquePaintTypes: string[] = Array.from(new Set(allPricing.map(p => p.paint_type).filter((t): t is string => !!t))).sort();
            const uniqueEditions: string[] = Array.from(new Set(allPricing.map(p => p.edition).filter((t): t is string => !!t))).sort();

            return (
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Filters</p>

                </div>

                <div className="grid grid-cols-3 gap-2">
                  {uniqueFuelTypes.length > 0 && (
                    <div className="relative">
                      <details className="bg-slate-50 border rounded-lg">
                        <summary className="px-2 py-1.5 cursor-pointer text-xs list-none flex items-center justify-between">
                          <span className="text-slate-700 font-semibold">Fuel</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">{commonFilters.selectedFuelTypes.size}/{uniqueFuelTypes.length}</span>
                            <ChevronDown size={12} className="text-slate-400" />
                          </div>
                        </summary>
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            {uniqueFuelTypes.map((fuel) => (
                              <label key={fuel} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded transition-colors">
                                <input
                                  type="checkbox"
                                  checked={commonFilters.selectedFuelTypes.has(fuel)}
                                  onChange={() => toggleCommonFilter('selectedFuelTypes', fuel)}
                                  className="rounded border-slate-300 w-3 h-3"
                                />
                                <span className={commonFilters.selectedFuelTypes.has(fuel) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                                  {fuel}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>
                  )}

                  {uniqueTransmissions.length > 0 && (
                    <div className="relative">
                      <details className="bg-slate-50 border rounded-lg">
                        <summary className="px-2 py-1.5 cursor-pointer text-xs list-none flex items-center justify-between">
                          <span className="text-slate-700 font-semibold">Trans.</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">{commonFilters.selectedTransmissions.size}/{uniqueTransmissions.length}</span>
                            <ChevronDown size={12} className="text-slate-400" />
                          </div>
                        </summary>
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            {uniqueTransmissions.map((transmission) => (
                              <label key={transmission} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded transition-colors">
                                <input
                                  type="checkbox"
                                  checked={commonFilters.selectedTransmissions.has(transmission)}
                                  onChange={() => toggleCommonFilter('selectedTransmissions', transmission)}
                                  className="rounded border-slate-300 w-3 h-3"
                                />
                                <span className={commonFilters.selectedTransmissions.has(transmission) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                                  {transmission}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>
                  )}

                  {uniquePaintTypes.length > 0 && (
                    <div className="relative">
                      <details className="bg-slate-50 border rounded-lg">
                        <summary className="px-2 py-1.5 cursor-pointer text-xs list-none flex items-center justify-between">
                          <span className="text-slate-700 font-semibold">Paint</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">{commonFilters.selectedPaintTypes.size}/{uniquePaintTypes.length}</span>
                            <ChevronDown size={12} className="text-slate-400" />
                          </div>
                        </summary>
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            {uniquePaintTypes.map((paint) => (
                              <label key={paint} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded transition-colors">
                                <input
                                  type="checkbox"
                                  checked={commonFilters.selectedPaintTypes.has(paint)}
                                  onChange={() => toggleCommonFilter('selectedPaintTypes', paint)}
                                  className="rounded border-slate-300 w-3 h-3"
                                />
                                <span className={commonFilters.selectedPaintTypes.has(paint) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                                  {paint}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>
                  )}
                </div>

                {uniqueEditions.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                      <details className="bg-slate-50 border rounded-lg">
                        <summary className="px-2 py-1.5 cursor-pointer text-xs list-none flex items-center justify-between">
                          <span className="text-slate-700 font-semibold">Edition</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">{commonFilters.selectedEditions.size}/{uniqueEditions.length}</span>
                            <ChevronDown size={12} className="text-slate-400" />
                          </div>
                        </summary>
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            {uniqueEditions.map((edition) => (
                              <label key={edition} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded transition-colors">
                                <input
                                  type="checkbox"
                                  checked={commonFilters.selectedEditions.has(edition)}
                                  onChange={() => toggleCommonFilter('selectedEditions', edition)}
                                  className="rounded border-slate-300 w-3 h-3"
                                />
                                <span className={commonFilters.selectedEditions.has(edition) ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                                  {edition}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {carsWithPricing.length === 2 && globalViewMode === 'chart' ? (
          <div className="flex-1 bg-white overflow-hidden flex flex-col">
            <div className="flex-1 p-1">
              <ChartView
                rawPricing={getFilteredPricingForCar('1')}
                chartColor="#2563eb"
                formatPriceShort={formatPriceShort}
                onPricingClick={(p) => {
                  const carId = cars[0].pricing?.some(cp => cp.pricing_id === p.pricing_id) ? '1' : '2';
                  const grouped = groupByVariant(cars[carId === '1' ? 0 : 1].pricing || []);
                  const variant = grouped.find(v => v.variant_id === p.variant_id);
                  if (variant) {
                    setSelectedVariant({ variant, carId });
                  }
                }}
                carId="1"
                carName={`${cars[0].brand} ${cars[0].model}`}
                isCombinedMode={true}
                allCarsData={[
                  { carId: '1', carName: `${cars[0].brand} ${cars[0].model}`, pricing: getFilteredPricingForCar('1'), color: '#2563eb' },
                  { carId: '2', carName: `${cars[1].brand} ${cars[1].model}`, pricing: getFilteredPricingForCar('2'), color: '#dc2626' }
                ]}
                onOrderChange={(newOrder) => {
                  console.log('New car order:', newOrder);
                }}
              />
            </div>
          </div>
        ) : (
          <div className={`flex-1 grid ${carsWithPricing.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-px bg-slate-200 overflow-hidden`}>
            {cars.map(car => {
              const filteredPricing = getFilteredPricingForCar(car.id);
              const chartColor = car.id === '1' ? '#2563eb' : '#dc2626';

              if (!car.pricing || car.pricing.length === 0) {
                return (
                  <div key={car.id} className="bg-white flex flex-col items-center justify-center text-slate-300 p-10 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <LayoutGrid size={32} />
                    </div>
                    <p className="font-medium">Configure vehicle {car.id} to view data</p>
                  </div>
                );
              }

              return (
                <div key={car.id} className="flex flex-col bg-white overflow-hidden">
                  <div className={`${carColors[car.id as '1' | '2']} text-white p-4 shadow-md z-10`}>
                    <h3 className="font-bold uppercase tracking-tight">{car.brand} {car.model}</h3>
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col">
                    {globalViewMode === 'chart' ? (
                      <div className="flex-1 p-6">
                        <ChartView
                          rawPricing={filteredPricing}
                          chartColor={chartColor}
                          formatPriceShort={formatPriceShort}
                          onPricingClick={(p) => {
                            const grouped = groupByVariant(car.pricing || []);
                            const variant = grouped.find(v => v.variant_id === p.variant_id);
                            if (variant) {
                              setSelectedVariant({ variant, carId: car.id });
                            }
                          }}
                          carId={car.id}
                          carName={`${car.brand} ${car.model}`}
                        />
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto">
                        <TableView
                          rawPricing={filteredPricing}
                          formatPrice={formatPrice}
                          onPricingClick={(p) => {
                            const grouped = groupByVariant(car.pricing || []);
                            const variant = grouped.find(v => v.variant_id === p.variant_id);
                            if (variant) {
                              setSelectedVariant({ variant, carId: car.id });
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedVariant && (
        <VariantModal
          variant={selectedVariant.variant}
          brandColor={carColors[selectedVariant.carId as '1' | '2']}
          onClose={() => setSelectedVariant(null)}
        />
      )}
    </div>
  );
};

export default PriceComparisonPage;

// // src/services/api.ts
// import { ComparisonResponse, ModelDetails, SelectionState, DropdownOption } from '../types';

// const BASE_API = import.meta.env.VITE_BASE_API || 'http://localhost:8000';

// // ---------- Backend response types (NEW /get-model-details) ----------

// interface BackendVersionMeta {
//   version: string;         // e.g. "v1"
//   version_label: string;   // e.g. "Dec 2025"
//   table: string;
//   timestamp: string;
//   variants: string[];
// }

// interface BackendCarMeta {
//   brand: string;
//   model: string;
//   car_slug: string;
//   total_versions: number;
//   versions: BackendVersionMeta[];
// }

// interface GetModelDetailsApiResponse {
//   status: string;
//   total_models: number;
//   cars: BackendCarMeta[];
// }

// // ---------- Backend response types (/get-comparison-details) ----------

// interface BackendFeatureRow {
//   feature: string;
//   variants: Record<string, string | null>;
// }

// interface BackendCarComparison {
//   brand: string;
//   model: string;
//   table_name: string;
//   variants: string[];
//   data: BackendFeatureRow[];
// }

// interface RawComparisonApiResponse {
//   status: string;
//   car1: BackendCarComparison;
//   car2: BackendCarComparison;
// }

// // ---------- News API types ----------

// export interface NewsArticle {
//   title: string;
//   description: string | null;
//   url: string;
//   source: {
//     name: string;
//     icon?: string;
//   };
//   published: string;
// }

// export interface NewsResponse {
//   car: string;
//   total: number;
//   top5_news: NewsArticle[];
// }

// // ---------------- Helpers ----------------

// // Helper: clean markdown like **Exterior - Headlamps**
// const normaliseFeatureName = (raw: string): string => {
//   const cleaned = (raw || '').replace(/\*\*/g, '').trim();
//   const lower = cleaned.toLowerCase();

//   // Merge "Price Range" and "Price Range (Ex-showroom Delhi)" into one row
//   if (lower.startsWith('price range')) return 'Price Range';

//   return cleaned;
// };

// // ---------------- API Calls ----------------

// /**
//  * GET /get_model_details  (your endpoint: /get-model-details)
//  * Builds:
//  * - brands[]
//  * - models[brand] = [model...]
//  * - versions[brand__model] = [{value: "v1", label:"Dec 2025"}, ...]
//  * - variants[brand__model__version] = ["Asta", "Sportz", ...]
//  */
// export const fetchModelDetails = async (): Promise<ModelDetails> => {
//   const res = await fetch(`${BASE_API}/get-model-details`);
//   if (!res.ok) throw new Error(`Failed to fetch model details: ${res.status}`);

//   const json: GetModelDetailsApiResponse = await res.json();
//   const cars = json.cars || [];

//   const brandsSet = new Set<string>();
//   const models: Record<string, string[]> = {};
//   const versions: Record<string, DropdownOption[]> = {};
//   const variants: Record<string, string[]> = {};

//   cars.forEach((car) => {
//     brandsSet.add(car.brand);

//     // models by brand
//     if (!models[car.brand]) models[car.brand] = [];
//     if (!models[car.brand].includes(car.model)) models[car.brand].push(car.model);

//     // versions by brand+model
//     const bmKey = `${car.brand}__${car.model}`;
//     versions[bmKey] = (car.versions || []).map((v) => ({
//       value: v.version,        // send to backend (v1/v2)
//       label: v.version_label,  // show in UI (Dec 2025 / Sep 2025)
//     }));

//     // variants by brand+model+version
//     (car.versions || []).forEach((v) => {
//       const bmvKey = `${car.brand}__${car.model}__${v.version}`;
//       variants[bmvKey] = v.variants || [];
//     });
//   });

//   return {
//     brands: Array.from(brandsSet),
//     models,
//     versions,
//     variants,
//   };
// };

// /**
//  * POST /get_comparision_details (your endpoint: /get-comparison-details)
//  * Now: ALWAYS includes version1/version2 (version is mandatory).
//  */
// export const fetchComparisonDetails = async (
//   sel1: SelectionState,
//   sel2: SelectionState
// ): Promise<ComparisonResponse> => {
//   const payload: any = {
//     brand1: sel1.brand,
//     model1: sel1.model,
//     version1: sel1.version,       // ✅ always included
//     variants1: [sel1.variant],

//     brand2: sel2.brand,
//     model2: sel2.model,
//     version2: sel2.version,       // ✅ always included
//     variants2: [sel2.variant],
//   };

//   const res = await fetch(`${BASE_API}/get-comparison-details`, {
//     method: 'POST', headers: { 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
//     headers: { 'Content-Type': 'application/json', 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
//     body: JSON.stringify(payload),
//   });

//   console.log('comparison payload:', payload);

//   if (!res.ok) throw new Error(`Failed to fetch comparison details: ${res.status}`);

//   const json: RawComparisonApiResponse = await res.json();
//   const { car1, car2 } = json;

//   // ✅ show version in headers so user knows which snapshot/version is being compared
//   const variantHeadersCar1 = (car1.variants || []).map(
//     (v) => `${car1.brand} ${car1.model} (${sel1.version}) - ${v}`
//   );
//   const variantHeadersCar2 = (car2.variants || []).map(
//     (v) => `${car2.brand} ${car2.model} (${sel2.version}) - ${v}`
//   );

//   const allVariantHeaders = [...variantHeadersCar1, ...variantHeadersCar2];
//   const columns: string[] = ['Feature', ...allVariantHeaders];

//   const rowMap = new Map<string, { feature: string; values: Record<string, string> }>();

//   const ingestCar = (car: BackendCarComparison, variantHeaders: string[]) => {
//     const variantNames = car.variants || [];

//     const headerByVariantName: Record<string, string> = {};
//     variantNames.forEach((variantName, idx) => {
//       headerByVariantName[variantName] = variantHeaders[idx];
//     });

//     (car.data || []).forEach((row) => {
//       const feature = normaliseFeatureName(row.feature || '');
//       if (!feature) return;

//       let entry = rowMap.get(feature);
//       if (!entry) {
//         entry = { feature, values: {} };
//         rowMap.set(feature, entry);
//       }

//       Object.entries(row.variants || {}).forEach(([variantName, value]) => {
//         const header = headerByVariantName[variantName];
//         if (!header) return;
//         entry!.values[header] = value ?? '';
//       });
//     });
//   };

//   ingestCar(car1, variantHeadersCar1);
//   ingestCar(car2, variantHeadersCar2);

//   const data = Array.from(rowMap.values()).map((entry) => {
//     const row: any = { feature: entry.feature };
//     allVariantHeaders.forEach((header) => {
//       if (entry.values[header] !== undefined) row[header] = entry.values[header];
//     });
//     return row;
//   });

//   return { columns, data };
// };

// /**
//  * GET /news?car={carModel}
//  * Fetches top 5 news articles about a specific car model
//  */
// export const fetchCarNews = async (carModel: string): Promise<NewsResponse> => {
//   const url = `${BASE_API}/news?car=${encodeURIComponent(carModel)}`;

//   const res = await fetch(url);
//   if (!res.ok) throw new Error(`Failed to fetch news for ${carModel}: ${res.status}`);

//   const json: NewsResponse = await res.json();
//   return json;
// };

// src/services/api.ts
import {
  ComparisonResponse,
  ModelDetails,
  SelectionState,
  DropdownOption,
  NewsResponse,
  Brand,
  Variant,
  CompactVariant,
  VariantClassData,
  VariantClassDetailsResponse,
  ModelPlan,
  PlanFeature
} from '../types';


const BASE_API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// ============== OLD API TYPES (for reference/fallback) ==============

interface BackendVersionMeta {
  version: string;
  version_label: string;
  table: string;
  timestamp: string;
  variants: string[];
}

interface BackendCarMeta {
  brand: string;
  model: string;
  car_slug: string;
  total_versions: number;
  versions: BackendVersionMeta[];
}

interface GetModelDetailsApiResponse {
  status: string;
  total_models: number;
  cars: BackendCarMeta[];
}

export interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  source: {
    name: string;
    icon?: string;
  };
  published: string;
}

// ============== FETCH MODEL DETAILS (UPDATED) ==============

/**
 * Fetches model details from NEW API: /api/brands-cars + /api/cars/{id}/variants
 * Builds the same structure as before for compatibility with Sidebar
 */
export const fetchModelDetails = async (): Promise<ModelDetails> => {
  try {
    // Step 1: Get all brands and cars
    const brandsRes = await fetch(`${BASE_API}/api/brands-cars`);
    if (!brandsRes.ok) throw new Error(`Failed to fetch brands: ${brandsRes.status}`);

    const brandsData: { success: boolean; brands: Brand[] } = await brandsRes.json();
    const brands = brandsData.brands || [];

    const brandsSet = new Set<string>();
    const models: Record<string, string[]> = {};
    const versions: Record<string, DropdownOption[]> = {};
    const variants: Record<string, string[]> = {};
    const variantIds: Record<string, string> = {}; // ✅ NEW: Store variant IDs
    const carIds: Record<string, string> = {}; // ✅ NEW: Store car IDs

    // Always include the Custom Plan brand
    brandsSet.add("CUSTOM_PLAN");
    models["CUSTOM_PLAN"] = [];

    // Step 2: For each car, fetch variant classes in parallel
    const carPromises = brands.flatMap(brand =>
      brand.cars.map(async car => {
        try {
          // ✅ Use classes API instead of variants API
          const classesRes = await fetch(`${BASE_API}/variants/classes/${car.car_id}`);
          if (!classesRes.ok) return null;
          const classesData = await classesRes.json();
          if (!classesData.success) return null;
          return {
            brandName: brand.brand_name,
            carName: car.car_name,
            carId: car.car_id,
            classes: classesData.data as VariantClassData[]
          };
        } catch (e) {
          console.error(`Error fetching variant classes for ${car.car_name}:`, e);
          return null;
        }
      })
    );

    const allCarData = await Promise.all(carPromises);

    allCarData.forEach(data => {
      if (!data) return;
      const { brandName, carName, carId, classes } = data;

      brandsSet.add(brandName);
      if (!models[brandName]) models[brandName] = [];
      if (!models[brandName].includes(carName)) {
        models[brandName].push(carName);
      }

      const bmKey = `${brandName}__${carName}`;
      carIds[bmKey] = carId;

      // Group by version
      const versionMap = new Map<number, { className: string, variantId: string }[]>();

      classes.forEach(cls => {
        cls.variants.forEach(v => {
          if (!versionMap.has(v.version)) versionMap.set(v.version, []);
          versionMap.get(v.version)!.push({
            className: cls.variant_class,
            variantId: v.id
          });
        });
      });

      const versionOptions: DropdownOption[] = Array.from(versionMap.keys())
        .sort((a, b) => b - a)
        .map(versionNum => ({
          value: `v${versionNum}`,
          label: `Version ${versionNum}`,
        }));

      versions[bmKey] = versionOptions;

      versionMap.forEach((classList, versionNum) => {
        const bmvKey = `${brandName}__${carName}__v${versionNum}`;
        // Store class names as the selectable "variants"
        variants[bmvKey] = Array.from(new Set(classList.map(c => c.className)));

        // Map the class name to its first variant ID for that version
        classList.forEach(c => {
          const variantKey = `${bmvKey}__${c.className}`;
          // Only set if not already set (to pick the first variant in the class)
          if (!variantIds[variantKey]) {
            variantIds[variantKey] = c.variantId;
          }
        });
      });
    });

    // Step 3: Fetch plans and group them under "New Model Plan"
    try {
      const plansRes = await fetch(`${BASE_API}/api/model-plans`);
      if (plansRes.ok) {
        const plans = await plansRes.json();
        const planBrand = "CUSTOM_PLAN";

        if (plans && plans.length > 0) {
          plans.forEach((plan: any) => {
            const planModelName = plan.name;
            if (!models[planBrand].includes(planModelName)) {
              models[planBrand].push(planModelName);
            }

            // For plans, we use a special version 'plan'
            const bmKey = `${planBrand}__${planModelName}`;
            versions[bmKey] = [{ value: 'plan', label: 'Draft Plan' }];

            // Map the plan ID
            const variantKey = `${planBrand}__${planModelName}__plan__${planModelName}`;
            variantIds[variantKey] = `plan_${plan.plan_id}`;
          });
        }
      }
    } catch (err) {
      console.error("Error fetching plans for sidebar:", err);
    }

    return {
      brands: Array.from(brandsSet),
      models,
      versions,
      variants,
      variantIds,
      carIds,
    };

  } catch (error) {
    console.error('Error fetching model details:', error);
    throw error;
  }
};

/**
 * UPDATED: Uses /api/compare/mixed endpoint
 * Accepts multiple selections (2-20 items, can be classes or plans)
 */
export const fetchComparisonDetails = async (
  selections: SelectionState[],
  priceFilter?: { min: number; max: number }
): Promise<ComparisonResponse> => {

  if (selections.length < 2) {
    throw new Error('At least 2 vehicles required for comparison');
  }

  const variantClasses = selections
    .filter(sel => !sel.plan_id)
    .map(sel => sel.variant)
    .filter(name => name);

  const planIds = selections
    .filter(sel => sel.plan_id)
    .map(sel => sel.plan_id as string);

  if (variantClasses.length + planIds.length !== selections.length) {
    throw new Error('Some variant classes or plans are missing. Please reselect the vehicles.');
  }

  const payload: Record<string, unknown> = {
    variant_classes: variantClasses,
    plan_ids: planIds,
    version: 1,
  };

  if (priceFilter) {
    payload.price_min_lakhs = priceFilter.min;
    payload.price_max_lakhs = priceFilter.max;
  }

  console.log('Comparison payload (Mixed):', payload);

  const res = await fetch(`${BASE_API}/api/compare/mixed`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch comparison details: ${res.status}`);
  }

  const result = await res.json();
  if (!result.success) {
    throw new Error(result.message || 'Failed to fetch comparison details');
  }

  const classDataArray = result.data || [];

  const sortedClassData = selections.map(sel => {
    if (sel.plan_id) {
      return classDataArray.find((cls: any) => cls.plan_id === sel.plan_id);
    }
    return classDataArray.find((cls: any) => cls.variant_class === sel.variant);
  }).filter(Boolean);

  const columns = ['Feature', ...sortedClassData.map((cls: any) => cls.variant_class)];

  const featureMap: Map<string, { feature: string, category: string, [key: string]: any }> = new Map();

  sortedClassData.forEach((cls: any) => {
    const className = cls.variant_class;

    (cls.features || []).forEach((feat: any) => {
      const featureKey = `${feat.category}__${feat.feature_name}`;
      if (!featureMap.has(featureKey)) {
        featureMap.set(featureKey, {
          feature: feat.feature_name,
          category: feat.category,
          feature_id: feat.feature_id,
        });
      }

      const row = featureMap.get(featureKey)!;
      row[className] = feat.sub_variant_values || { "Value": feat.value };
      if (feat.cost_delta !== undefined) {
        if (!row.cost_deltas) row.cost_deltas = {};
        row.cost_deltas[className] = feat.cost_delta;
      }
      if (feat.price_delta !== undefined) {
        if (!row.price_deltas) row.price_deltas = {};
        row.price_deltas[className] = feat.price_delta;
      }
      if (feat.tag) {
        if (!row.tags) row.tags = {};
        row.tags[className] = feat.tag;
      }
      if (feat.is_deleted !== undefined) {
        if (!row.is_deleted) row.is_deleted = {};
        row.is_deleted[className] = feat.is_deleted;
      }
      if (feat.original_value !== undefined) {
        if (!row.original_values) row.original_values = {};
        row.original_values[className] = feat.original_value;
      }
      if (feat.plan_feature_id) {
        if (!row.plan_feature_ids) row.plan_feature_ids = {};
        row.plan_feature_ids[className] = feat.plan_feature_id;
      }
    });

    const priceKey = 'Price & Basic Info__Price Value';
    if (!featureMap.has(priceKey)) {
      featureMap.set(priceKey, {
        feature: 'Price Value',
        category: 'Price & Basic Info',
      });
    }
    const priceRow = featureMap.get(priceKey)!;
    priceRow[className] = {
      is_price_class: true,
      sub_variants: cls.sub_variants.map((sv: any) => ({
        name: sv.variant_name,
        pricing: sv.pricing
      }))
    };
  });

  return {
    columns,
    data: Array.from(featureMap.values()),
    base_variant_classes: sortedClassData.reduce((acc: any, cls: any) => {
      if (cls.base_variant_class) {
        acc[cls.variant_class] = cls.base_variant_class;
      }
      return acc;
    }, {}),
    // ✅ FIX: pass nm_variant_ids and variant_meta from backend response
    nm_variant_ids: result.nm_variant_ids ?? {},
    variant_meta: result.variant_meta ?? {},
  };
};

// ============== NEWS API (UNCHANGED) ==============

export const fetchCarNews = async (carModel: string): Promise<NewsResponse> => {
  const url = `${BASE_API}/news?car=${encodeURIComponent(carModel)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch news for ${carModel}: ${res.status}`);

  const json: NewsResponse = await res.json();
  return json;
};

// ============== FETCH VARIANT CLASSES (NEW) ==============

export const fetchVariantClasses = async (carId: string): Promise<VariantClassData[]> => {
  const res = await fetch(`${BASE_API}/variants/classes/${carId}`);
  if (!res.ok) throw new Error(`Failed to fetch variant classes: ${res.status}`);
  const json = await res.json();
  return json.data;
};

export const fetchVariantClassDetails = async (variantClass: string, version: number = 1): Promise<VariantClassDetailsResponse> => {
  const res = await fetch(`${BASE_API}/api/variant-class/${variantClass}?version=${version}`);
  if (!res.ok) throw new Error(`Failed to fetch class details: ${res.status}`);
  const json = await res.json();
  return json.data;
};

// ============== MODEL PLANNING API ==============

export const createModelPlan = async (name: string, variantClass: string, version: number = 1): Promise<ModelPlan> => {
  const res = await fetch(`${BASE_API}/api/model-plans`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
    body: JSON.stringify({ name, base_variant_class: variantClass, version }),
  });
  if (!res.ok) throw new Error(`Failed to create plan: ${res.status}`);
  const json = await res.json();
  return json.data;
};

export const fetchModelPlans = async (variantClass?: string): Promise<ModelPlan[]> => {
  const url = variantClass
    ? `${BASE_API}/api/model-plans?base_variant_class=${variantClass}`
    : `${BASE_API}/api/model-plans`;
  const res = await fetch(url);
  const json = await res.json();
  return json.data;
};

export const fetchModelPlanById = async (planId: string): Promise<ModelPlan> => {
  const res = await fetch(`${BASE_API}/api/model-plans/${planId}`);
  const json = await res.json();
  return json.data;
};

export const addPlanFeature = async (planId: string, feature: { feature_name: string, category: string, value: string, cost_delta: number, price_delta: number, after_feature?: string }) => {
  const res = await fetch(`${BASE_API}/api/model-plans/${planId}/features`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
    body: JSON.stringify(feature)
  });
  if (!res.ok) throw new Error('Failed to add plan feature');
  return res.json();
};

export const updatePlanFeature = async (planId: string, planFeatureId: string, updates: { value?: string, cost_delta?: number, price_delta?: number, is_deleted?: boolean }) => {
  const res = await fetch(`${BASE_API}/api/model-plans/${planId}/features/${planFeatureId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update plan feature');
  return res.json();
};

export const deletePlanFeature = async (planId: string, planFeatureId: string): Promise<any> => {
  const res = await fetch(`${BASE_API}/api/model-plans/${planId}/features/${planFeatureId}`, {
    method: 'DELETE', headers: { 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
  });
  return await res.json();
};

// ============== FEATURE MASTER MANAGEMENT API ==============

export const fetchFeatureMasterCategoryWise = async (): Promise<Record<string, { id: string, name: string, isMerged?: boolean }[]>> => {
  const res = await fetch(`${BASE_API}/features/master/category-wise`);
  if (!res.ok) throw new Error(`Failed to fetch master features: ${res.status}`);
  return await res.json();
};

export const renameFeatureMaster = async (featureId: string, newName: string): Promise<any> => {
  const res = await fetch(`${BASE_API}/features/master/${featureId}/rename`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
    body: JSON.stringify({ new_name: newName })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Failed to rename feature');
  }
  return await res.json();
};

export const moveFeatureMaster = async (featureId: string, newCategory: string): Promise<any> => {
  const res = await fetch(`${BASE_API}/features/master/${featureId}/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
    body: JSON.stringify({ new_category: newCategory })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Failed to move feature');
  }
  return await res.json();
};

export const deleteFeatureMaster = async (featureId: string, auditMsg?: string, auditEntityName?: string): Promise<any> => {
  const headers: Record<string, string> = {
    'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '')
  };
  if (auditMsg) headers['X-Audit-Message'] = auditMsg;
  if (auditEntityName) headers['X-Audit-Entity-Name'] = auditEntityName;

  const res = await fetch(`${BASE_API}/features/master/${featureId}`, {
    method: 'DELETE', headers,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to delete feature');
  }
  return await res.json();
};

export const addFeatureMaster = async (name: string, category: string): Promise<any> => {
  const res = await fetch(`${BASE_API}/features/master`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
    body: JSON.stringify({ name, category })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Failed to add feature');
  }
  return await res.json();
};

export const mergeFeatureMaster = async (featureIds: string[], targetName: string, targetCategory: string): Promise<any> => {
  const res = await fetch(`${BASE_API}/features/master/merge`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
    body: JSON.stringify({ feature_ids: featureIds, target_name: targetName, target_category: targetCategory })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Failed to merge features');
  }
  return await res.json();
};

export const unmergeFeatureMaster = async (featureId: string, auditMsg?: string, auditEntityName?: string): Promise<any> => {
  const headers: any = {
    'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '')
  };
  if (auditMsg) headers['X-Audit-Message'] = auditMsg;
  if (auditEntityName) headers['X-Audit-Entity-Name'] = auditEntityName;

  const res = await fetch(`${BASE_API}/features/master/${featureId}/unmerge`, {
    method: 'POST', headers
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Failed to unmerge features');
  }
  return await res.json();
};

// --- SECTION 3: Master Dropdown Values ---

export const fetchMasterValues = async (): Promise<any> => {
  const res = await fetch(`${BASE_API}/api/master-values`);
  if (!res.ok) throw new Error('Failed to fetch master values');
  return await res.json();
};

export const addMasterValue = async (category: string, value: string): Promise<any> => {
  const res = await fetch(`${BASE_API}/api/master-values`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
    body: JSON.stringify({ category, value })
  });
  if (!res.ok) throw new Error('Failed to add master value');
  return await res.json();
};

export const deleteMasterValue = async (id: string, auditMsg?: string, auditEntityName?: string): Promise<any> => {
  const headers: Record<string, string> = {
    'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '')
  };
  if (auditMsg) headers['X-Audit-Message'] = auditMsg;
  if (auditEntityName) headers['X-Audit-Entity-Name'] = auditEntityName;

  const res = await fetch(`${BASE_API}/api/master-values/${id}`, { 
    method: 'DELETE', 
    headers
  });
  if (!res.ok) throw new Error('Failed to delete master value');
  return await res.json();
};

// --- SECTION 4: New Model Planning ---

export const fetchNewModels = async (): Promise<any> => {
  const res = await fetch(`${BASE_API}/api/new-models`);
  if (!res.ok) throw new Error('Failed to fetch new models');
  return await res.json();
};

export const createNewModel = async (name: string, bodyType: string, subBodyType: string): Promise<any> => {
  const res = await fetch(`${BASE_API}/api/new-models`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
    body: JSON.stringify({ name, body_type: bodyType, sub_body_type: subBodyType })
  });
  if (!res.ok) throw new Error('Failed to create new model');
  return await res.json();
};

export const addNewModelVariant = async (modelId: string, variantData: any): Promise<any> => {
  const res = await fetch(`${BASE_API}/api/new-models/${modelId}/variants`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
    body: JSON.stringify(variantData)
  });
  if (!res.ok) throw new Error('Failed to add variant');
  return await res.json();
};

export const updateNewModelVariant = async (variantId: string, variantData: any): Promise<any> => {
  const res = await fetch(`${BASE_API}/api/new-models/variants/${variantId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
    body: JSON.stringify(variantData)
  });
  if (!res.ok) throw new Error('Failed to update variant');
  return await res.json();
};

export const deleteNewModelVariant = async (variantId: string): Promise<any> => {
  const res = await fetch(`${BASE_API}/api/new-models/variants/${variantId}`, { 
    method: 'DELETE',
    headers: { 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') }
  });
  if (!res.ok) throw new Error('Failed to delete variant');
  return await res.json();
};

export const fetchSidebarFilters = async (): Promise<any> => {
  const res = await fetch(`${BASE_API}/api/sidebar-filters`);
  if (!res.ok) throw new Error('Failed to fetch sidebar filters');
  const json = await res.json();
  return json.data;
};


/**
 * Bulk-update sort_order for features within a category.
 * Called after drag-and-drop reorder within the same category.
 *
 * PATCH /features/master/reorder
 */
export const reorderFeatures = async (
  updates: { id: string; sort_order: number }[]
): Promise<void> => {
  const res = await fetch(`${BASE_API}/features/master/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to reorder features');
  }
};

/**
 * Move a feature to a different category.
 * Called after drag-and-drop across categories.
 *
 * PATCH /features/master/{feature_id}/move
 */
export const moveFeatureCategory = async (
  featureId: string,
  newCategory: string
): Promise<void> => {
  const res = await fetch(`${BASE_API}/features/master/${featureId}/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
    body: JSON.stringify({ new_category: newCategory }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to move feature');
  }
};


// ============== NM VARIANT FEATURES (Copy / Inline Edit) ==============

// services/api.ts — ye already hona chahiye, verify karo URL sahi hai
export const updateNMVariantFeature = async (
  nmVariantId: string,
  featureId: string,
  payload: { feature_value?: string; cost_delta?: number }
) => {
  const res = await fetch(
    `${BASE_API}/api/new-models/variants/${nmVariantId}/features/${featureId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to update feature');
  return data;
};

// Copy features API
export const copyFeaturesToNMVariant = async (
  nmVariantId: string,
  carId: string,
  variantClass: string,
  version: number = 1
) => {
  const res = await fetch(
    `${BASE_API}/api/new-models/variants/${nmVariantId}/copy-features`,
    {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') },
      body: JSON.stringify({ car_id: carId, variant_class: variantClass, version }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to copy features');
  return data;
};


export const clearNMVariantFeatures = async (nmVariantId: string) => {
  const res = await fetch(
    `${BASE_API}/api/new-models/variants/${nmVariantId}/features`,
    { 
      method: 'DELETE',
      headers: { 'X-User-Email': (sessionStorage.getItem('manualLoginUser') ? JSON.parse(sessionStorage.getItem('manualLoginUser') as string).username : '') }
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to clear features');
  return data;
};

export const getNMVariantFeatures = async (nmVariantId: string) => {
  const res = await fetch(
    `${BASE_API}/api/new-models/variants/${nmVariantId}/features`,
    { method: 'GET' }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Failed to fetch features');
  return data; // { success: true, data: [ { feature_id, feature_value, cost_delta, sub_variant_values, copied_from_variant_class, ... } ] }
};

// ─── Feature Wise Applicability APIs ───────────────────────────────────────

export const fetchBrandsList = async (): Promise<{ id: string; name: string }[]> => {
  const res = await fetch(`${BASE_API}/api/brands-list`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error('Failed to fetch brands');
  return data.data;
};

export const fetchFeaturesList = async (): Promise<{ feature_id: string; feature_name: string; category: string }[]> => {
  const res = await fetch(`${BASE_API}/api/features-list`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error('Failed to fetch features list');
  return data.data;
};

export interface FeatureApplicabilityRow {
  body_type: string;
  sub_body_type: string;
  brand: string;
  model: string;
  variant_class: string;
  has_feature: boolean;
  sub_variants: { name: string; value: string }[];
}

export const fetchFeatureApplicability = async (
  featureId: string | undefined,
  brandNames: string[]
): Promise<FeatureApplicabilityRow[]> => {
  const params = new URLSearchParams();
  if (featureId) params.set('feature_id', featureId);
  if (brandNames.length > 0) params.set('brand_names', brandNames.join(','));
  const res = await fetch(`${BASE_API}/api/feature-applicability?${params.toString()}`);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error('Failed to fetch feature applicability');
  return data.data;
};
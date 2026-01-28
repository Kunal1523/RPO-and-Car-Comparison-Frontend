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
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
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
  Variant
} from '../types';

const BASE_API = import.meta.env.VITE_BASE_API || 'http://localhost:8000';

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

    // Step 2: For each car, fetch variants
    for (const brand of brands) {
      brandsSet.add(brand.brand_name);
      
      if (!models[brand.brand_name]) {
        models[brand.brand_name] = [];
      }

      for (const car of brand.cars) {
        if (!models[brand.brand_name].includes(car.car_name)) {
          models[brand.brand_name].push(car.car_name);
        }

        // Fetch variants for this car
        try {
          const variantsRes = await fetch(`${BASE_API}/api/cars/${car.car_id}/variants`);
          if (!variantsRes.ok) continue;

          const variantsData: { 
            success: boolean; 
            brand_name: string;
            car_name: string;
            variants: Variant[];
          } = await variantsRes.json();

          if (!variantsData.success) continue;

          const carVariants = variantsData.variants || [];

          // Group by version
          const versionMap = new Map<number, Variant[]>();
          carVariants.forEach(v => {
            if (!versionMap.has(v.version)) {
              versionMap.set(v.version, []);
            }
            versionMap.get(v.version)!.push(v);
          });

          const bmKey = `${brand.brand_name}__${car.car_name}`;

          // Build versions dropdown
          const versionOptions: DropdownOption[] = Array.from(versionMap.keys())
            .sort((a, b) => b - a) // Latest first
            .map(versionNum => ({
              value: `v${versionNum}`,
              label: `Version ${versionNum}`,
            }));

          versions[bmKey] = versionOptions;

          // Build variants for each version
          versionMap.forEach((variantList, versionNum) => {
            const bmvKey = `${brand.brand_name}__${car.car_name}__v${versionNum}`;
            variants[bmvKey] = variantList.map(v => v.variant_name);

            // Store variant IDs for lookup
            variantList.forEach(v => {
              const variantKey = `${bmvKey}__${v.variant_name}`;
              variantIds[variantKey] = v.variant_id;
            });
          });

        } catch (error) {
          console.error(`Error fetching variants for car ${car.car_id}:`, error);
        }
      }
    }

    return {
      brands: Array.from(brandsSet),
      models,
      versions,
      variants,
      variantIds,
    };

  } catch (error) {
    console.error('Error fetching model details:', error);
    throw error;
  }
};

// ============== FETCH COMPARISON DETAILS (NEW API) ==============

/**
 * NEW: Uses /api/compare/variants endpoint
 * Accepts multiple selections (2-5 cars)
 */
export const fetchComparisonDetails = async (
  selections: SelectionState[]
): Promise<ComparisonResponse> => {
  
  if (selections.length < 2) {
    throw new Error('At least 2 vehicles required for comparison');
  }

  if (selections.length > 5) {
    throw new Error('Maximum 5 vehicles can be compared');
  }

  // Extract variant IDs from selections
  const variantIds = selections
    .map(sel => sel.variant_id)
    .filter(id => id) as string[];

  if (variantIds.length !== selections.length) {
    throw new Error('Some variant IDs are missing. Please reselect the variants.');
  }

  const payload = {
    variant_ids: variantIds,
    version: 1, // Always use version 1 for now
  };

  console.log('Comparison payload:', payload);

  const res = await fetch(`${BASE_API}/api/compare/variants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch comparison details: ${res.status}`);
  }

  const data = await res.json();
  
  // The new API already returns in the correct format
  return {
    columns: data.columns,
    data: data.data,
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
// // src/types.ts

// export interface SelectionState {
//   brand: string;
//   model: string;
//   variant: string;
//   version?: string;
// }

// export interface ModelDetails {
//   brands: string[];
//   models: Record<string, string[]>;
//   variants: Record<string, string[]>;
//   versions: Record<string, string[]>;
// }

// export interface ComparisonResponse {
//   columns: string[];
//   data: Record<string, any>[];
// }

// export interface GroupedFeature {
//   featureName: string;
//   values: Record<string, string>;
// }

// export interface FeatureGroup {
//   groupName: string;
//   items: GroupedFeature[];
// }

// // News related types
// export interface NewsArticle {
//   title: string;
//   description: string | null;
//   url: string;
//   source: {
//     name: string;
//     icon?: string;
//     authors?: string[];
//   };
//   published: string;
// }

// export interface NewsResponse {
//   car: string;
//   total: number;
//   top5_news: NewsArticle[];
// }















// src/types.ts

// export interface SelectionState {
//   brand: string;
//   model: string;
//   version: string;   // ✅ now compulsory (not optional)
//   variant: string;
// }

// export interface DropdownOption {
//   value: string;
//   label: string;
// }

// export interface ModelDetails {
//   brands: string[];
//   models: Record<string, string[]>;

//   // ✅ key = `${brand}__${model}` -> versions (value=id, label=version_label)
//   versions: Record<string, DropdownOption[]>;

//   // ✅ key = `${brand}__${model}__${version}` -> variants list
//   variants: Record<string, string[]>;
// }

// export interface ComparisonResponse {
//   columns: string[];
//   data: Record<string, any>[];
// }

// export interface GroupedFeature {
//   featureName: string;
//   values: Record<string, string>;
// }

// export interface FeatureGroup {
//   groupName: string;
//   items: GroupedFeature[];
// }

// export interface NewsArticle {
//   title: string;
//   description: string | null;
//   url: string;
//   source: {
//     name: string;
//     icon?: string;
//     authors?: string[];
//   };
//   published: string;
// }

// export interface NewsResponse {
//   car: string;
//   total: number;
//   top5_news: NewsArticle[];
// }


// src/types.ts

export interface SelectionState {
  brand: string;
  model: string;
  version: string;
  variant: string;
  variant_id?: string; // ✅ NEW: Store variant_id for new API
}

export interface DropdownOption {
  value: string;
  label: string;
}

export interface ModelDetails {
  brands: string[];
  models: Record<string, string[]>;
  versions: Record<string, DropdownOption[]>;
  variants: Record<string, string[]>;
  variantIds: Record<string, string>; // ✅ NEW: Map variant name to ID
}

export interface ComparisonResponse {
  columns: string[];
  data: Record<string, any>[];
}

export interface GroupedFeature {
  featureName: string;
  values: Record<string, string>;
}

export interface FeatureGroup {
  groupName: string;
  items: GroupedFeature[];
}

export interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  source: {
    name: string;
    icon?: string;
    authors?: string[];
  };
  published: string;
}

export interface NewsResponse {
  car: string;
  total: number;
  top5_news: NewsArticle[];
}

// ============== NEW API RESPONSE TYPES ==============

export interface Brand {
  brand_id: string;
  brand_name: string;
  cars: Car[];
}

export interface Car {
  car_id: string;
  car_name: string;
}

export interface Variant {
  variant_id: string;
  variant_name: string;
  version: number;
  car_name: string;
  brand_name: string;
  ex_showroom_price: number | null;
  currency: string;
  type: string;
  price_display: string;
}
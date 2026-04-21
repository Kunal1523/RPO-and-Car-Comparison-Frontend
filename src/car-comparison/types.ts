// src/types.ts

// ============== CORE SELECTION TYPES ==============

export interface SelectionState {
  brand: string;
  model: string;
  version: string;
  variant: string;
  variant_id?: string;
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
  variantIds: Record<string, string>;
  carIds: Record<string, string>;
}

// ============== API RESPONSE TYPES ==============

export interface Brand {
  brand_id: string;
  brand_name: string;
  cars: Car[];
}

export interface Car {
  car_id: string;
  car_name: string;
}

export interface CompactVariant {
  id: string;
  name: string;
  version: number;
  is_latest: boolean;
}

export interface VariantClassData {
  variant_class: string;
  variants: CompactVariant[];
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

// ============== COMPARISON & PRICING ==============

export interface PriceDetail {
  type: string;
  currency: string;
  ex_showroom_price: number;
  price_display: string;
}

export interface VariantPriceData {
  variant_id: string;
  variant_name: string;
  prices: PriceDetail[];
  avg_price: {
    value: number;
    display: string;
  };
}

export interface ComparisonResponse {
  columns: string[];
  data: Record<string, any>[];
  variant_pricing?: Record<string, VariantPriceData>;
}

export interface GroupedFeature {
  featureName: string;
  values: Record<string, string>;
}

export interface FeatureGroup {
  groupName: string;
  items: GroupedFeature[];
  hasDifferences?: boolean;
}

// ============== NEWS TYPES ==============

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

// ============== FEATURE STACK-UP TYPES ==============

export interface SubVariantPricing {
  currency: string;
  ex_showroom_price: number;
  fuel_type?: string | null;
  engine_type?: string | null;
  transmission_type?: string | null;
  paint_type?: string | null;
  edition?: string | null;
}

export interface SubVariantMeta {
  variant_id: string;
  variant_name: string;
  pricing: SubVariantPricing[];
}

export interface MergedFeature {
  feature_id: string;
  feature_name: string;
  category: string;
  sub_variant_values: Record<string, string>;
}

export interface VariantClassDetailsResponse {
  variant_class: string;
  car_id: string;
  sub_variants: SubVariantMeta[];
  features: MergedFeature[];
}

export interface PlanFeature {
  plan_feature_id: string;
  feature_id: string | null;
  feature_name: string;
  category: string;
  value: string | null;
  is_inherited: boolean;
  is_deleted: boolean;
  cost_delta: number;
  tag?: string;
  available_options?: string[];
}

export interface ModelPlan {
  plan_id: string;
  name: string;
  base_variant_class: string;
  base_car_id: string;
  created_at: string;
  updated_at?: string;
  features?: PlanFeature[];
  total_delta_cost?: number;
}
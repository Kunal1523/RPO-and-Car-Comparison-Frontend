// src/types/stackUpTypes.ts
//
// Types for the NEW "Feature Stack-Up" page (Model Stack section).
// Kept in a separate file from the existing `types.ts` so nothing in the
// old Feature Comparison / Model Planning pages breaks.
//
// Reuses existing concepts (MergedFeature, VariantClassDetailsResponse,
// CompactVariant, VariantClassData) wherever possible — only new shapes
// that don't already exist are defined here.

import { CompactVariant } from './types';

// ============== SIDEBAR SELECTION (Body Type gated) ==============

/**
 * One row picked in the sidebar: a Brand + Model + Variant Class,
 * for either a production car or a New Model (NM).
 */
export interface StackUpSelection {
    source: 'production' | 'new_model';
    brand: string;
    model: string;          // car name (production) OR new_model name (NM)
    car_id: string;         // cars.id OR new_models.id
    variant_class: string;  // variants.variant_class OR new_model_variants.variant_name
    variant_id: string;     // a representative variants.id OR new_model_variants.id
}

/**
 * Sidebar gating: nothing in Brand/Model/Variant is selectable
 * until a Body Type is chosen.
 */
export interface SidebarFilterState {
    bodyType: string | null;     // must be set first — gates everything below
    priceMin: number;            // in lakhs, from the price slider
    priceMax: number;
    selectedBrand: string | null;
    selectedModels: string[];    // multi-select models within the brand
    selectedVariants: StackUpSelection[]; // checked variant rows -> feed Model Stack
}

// ============== MODEL STACK ==============

/**
 * A single feature row inside a Variant Block, merged with the
 * logged-in user's saved preference (order + hidden state).
 */
export interface StackUpFeatureRow {
    feature_id: string | null;   // features_master.id (production) — null for NM if unmatched
    feature_name: string;
    category: string;
    value: string;               // the value this variant actually has in the DB
    display_order: number;       // resolved order (user pref if present, else natural order)
    is_hidden: boolean;          // resolved from user_feature_stackup_prefs
}

/**
 * One Variant Block (e.g. "Z+", "Z", "Sigma") rendered inside a Model card.
 * Always rendered expanded by default, showing only features that HAVE
 * a value in the DB for this variant (no blank rows).
 */
export interface VariantBlockData {
    variant_ref_type: 'production' | 'new_model';
    variant_id: string;          // variants.id OR new_model_variants.id
    variant_class: string;       // display label, e.g. "Z+"
    car_id: string;
    features: StackUpFeatureRow[];
}

/**
 * One Model card in the Model Stack (e.g. "Fronx").
 * Holds every selected Variant Block for that model, stacked vertically.
 */
export interface ModelStackCard {
    model_key: string;           // `${source}__${car_id}` — unique per card
    source: 'production' | 'new_model';
    brand: string;
    model_name: string;
    car_id: string;
    variant_blocks: VariantBlockData[];
}

// ============== USER PREFERENCES (reorder / hide) ==============

export interface FeatureStackUpPref {
    id: string;
    variant_ref_type: 'production' | 'new_model';
    variant_id: string;
    feature_id: string | null;
    feature_name: string;
    is_hidden: boolean;
    display_order: number;
}

/** Request body for the per-action auto-save calls. */
export interface UpdateFeaturePrefPayload {
    variant_ref_type: 'production' | 'new_model';
    variant_id: string;
    feature_id: string | null;
    feature_name: string;
    is_hidden?: boolean;
    display_order?: number;
}

// Re-export so consumers of this file don't also need to import from '../types'
export type { CompactVariant };
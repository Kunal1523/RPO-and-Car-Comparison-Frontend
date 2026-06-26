// src/services/stackUpApi.ts
const BASE_API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

import { VariantClassData, VariantClassDetailsResponse, Brand } from '../types';
import {
    StackUpSelection,
    FeatureStackUpPref,
    UpdateFeaturePrefPayload,
} from '../stackUpTypes'

/** Helper to get authentication headers */
const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const userStr = sessionStorage.getItem('manualLoginUser');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.username) {
                headers['X-User-Email'] = user.username;
            } else if (user.email) {
                headers['X-User-Email'] = user.email;
            }
        } catch (e) {
            console.error("Failed to parse user session", e);
        }
    }
    if (!headers['X-User-Email']) {
        headers['X-User-Email'] = 'admin@amlgolabs.com';
    }
    return headers;
};

export const fetchBodyTypes = async (): Promise<string[]> => {
    const res = await fetch(`${BASE_API}/api/body-types`);
    if (!res.ok) throw new Error(`Failed to fetch body types: ${res.status}`);
    const json = await res.json();
    return json.data ?? json;
};

export const fetchBrandsCarsByBodyType = async (
    bodyType: string,
    priceMin?: number,
    priceMax?: number
): Promise<Brand[]> => {
    const params = new URLSearchParams({ body_type: bodyType });
    if (priceMin !== undefined) params.set('price_min', String(priceMin));
    if (priceMax !== undefined) params.set('price_max', String(priceMax));

    const res = await fetch(`${BASE_API}/api/brands-cars?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch brands/cars: ${res.status}`);
    const json = await res.json();
    return json.brands ?? [];
};

export const fetchNewModelsByBodyType = async (bodyType: string): Promise<any[]> => {
    const res = await fetch(`${BASE_API}/api/new-models?body_type=${encodeURIComponent(bodyType)}`);
    if (!res.ok) throw new Error(`Failed to fetch new models: ${res.status}`);
    const json = await res.json();
    return json.data ?? json;
};

// ============== FULL CATALOG (single bulk fetch for the sidebar) ==============
//
// One call returns every brand/model/body_type/variant_class with its
// sub_variants (each carrying its own price + engine/transmission/fuel/drive),
// exactly mirroring how the OLD Sidebar.tsx's fetchSidebarFilters() works.
// This lets StackUpSidebar filter everything client-side instead of making a
// cascade of per-body-type / per-car API calls.

export interface CatalogSubVariant {
    sub_variant_id: string;
    pricing_id: string;
    ex_showroom_price: number;
    currency: string;
    paint_type: string;
    engine_type: string;
    transmission_type: string;
    fuel_type: string;
    drive_type: string;
}

export interface CatalogEntry {
    brand: string;
    model: string;
    body_type: string;
    version: string;
    variant_class: string;
    is_new_model: boolean;
    sub_variants: CatalogSubVariant[];
}

export const fetchFullCatalogPricing = async (): Promise<CatalogEntry[]> => {
    const res = await fetch(`${BASE_API}/api/catalog/full-pricing`);
    if (!res.ok) throw new Error(`Failed to fetch catalog: ${res.status}`);
    const json = await res.json();
    return json.data ?? [];
};

export const fetchVariantClasses = async (carId: string): Promise<VariantClassData[]> => {
    const res = await fetch(`${BASE_API}/variants/classes/${carId}`);
    if (!res.ok) throw new Error(`Failed to fetch variant classes: ${res.status}`);
    const json = await res.json();
    return json.data;
};

export const fetchVariantClassDetails = async (
    variantClass: string,
    version: number = 1
): Promise<VariantClassDetailsResponse> => {
    const res = await fetch(`${BASE_API}/api/variant-class/${variantClass}?version=${version}`);
    if (!res.ok) throw new Error(`Failed to fetch class details: ${res.status}`);
    const json = await res.json();
    return json.data;
};

export const getNMVariantFeatures = async (nmVariantId: string): Promise<any> => {
    const res = await fetch(`${BASE_API}/api/new-models/variants/${nmVariantId}/features`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to fetch NM features');
    return data;
};

export const fetchFeatureStackUpPrefs = async (
    variantRefType: 'production' | 'new_model',
    variantId: string
): Promise<FeatureStackUpPref[]> => {
    const res = await fetch(
        `${BASE_API}/api/stackup/prefs?variant_ref_type=${variantRefType}&variant_id=${variantId}`,
        {
            headers: getAuthHeaders(),
        }
    );
    if (!res.ok) throw new Error(`Failed to fetch stack-up prefs: ${res.status}`);
    const json = await res.json();
    return json.data ?? [];
};

export const fetchFeatureStackUpPrefsBulk = async (
    variantRefType: 'production' | 'new_model',
    variantIds: string[]
): Promise<Record<string, FeatureStackUpPref[]>> => {
    const res = await fetch(`${BASE_API}/api/stackup/prefs/bulk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ variant_ref_type: variantRefType, variant_ids: variantIds }),
    });
    if (!res.ok) throw new Error(`Failed to fetch bulk stack-up prefs: ${res.status}`);
    const json = await res.json();
    return json.data ?? {};
};

export const upsertFeatureStackUpPref = async (
    payload: UpdateFeaturePrefPayload
): Promise<FeatureStackUpPref> => {
    const res = await fetch(`${BASE_API}/api/stackup/prefs`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Failed to save preference');
    return json.data;
};

export const reorderFeatureStackUpPrefsBulk = async (
    variantRefType: 'production' | 'new_model',
    variantId: string,
    orderedFeatureNames: string[],
    hiddenStates?: Record<string, boolean>
): Promise<void> => {
    const res = await fetch(`${BASE_API}/api/stackup/prefs/reorder`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            variant_ref_type: variantRefType,
            variant_id: variantId,
            ordered_feature_names: orderedFeatureNames,
            hidden_states: hiddenStates,
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to save reorder');
    }
};

export const resetFeatureStackUpPrefs = async (
    variantRefType: 'production' | 'new_model',
    variantId: string
): Promise<void> => {
    const res = await fetch(
        `${BASE_API}/api/stackup/prefs?variant_ref_type=${variantRefType}&variant_id=${variantId}`,
        {
            method: 'DELETE',
            headers: getAuthHeaders(),
        }
    );
    if (!res.ok) throw new Error('Failed to reset preferences');
};
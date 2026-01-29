import { Draft, PlanData, FinalPlanResponse } from "../utils/types";
// import { API_BASE_URL } from "./config";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const getHeaders = (email?: string, accessToken?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (email) headers["X-User-Email"] = email;
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  return headers;
};

export const api = {
  // --- DRAFTS ---
  fetchDrafts: async (userEmail: string): Promise<Draft[]> => {
    const response = await fetch(`${API_BASE_URL}/drafts`, {
      headers: getHeaders(userEmail),
    });
    if (!response.ok) throw new Error("Failed to fetch drafts");
    return response.json();
  },

  saveDraft: async (draft: Draft, userEmail: string): Promise<Draft> => {
    const payload = {
      id: draft.id,
      name: draft.name,
      updatedAt: draft.updatedAt,
      data: draft.data,
    };

    const response = await fetch(`${API_BASE_URL}/drafts`, {
      method: "POST",
      headers: getHeaders(userEmail),
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Failed to save draft");
    return response.json();
  },

  deleteDraft: async (id: string, userEmail: string): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/drafts/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: getHeaders(userEmail),
      }
    );
    if (!response.ok) throw new Error("Failed to delete draft");
  },

  // --- FINAL PLAN ---
  fetchFinalPlan: async (userEmail: string): Promise<FinalPlanResponse | null> => {
    const response = await fetch(`${API_BASE_URL}/final-plan`, {
      headers: getHeaders(userEmail),
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Failed to fetch final plan");
    return response.json();
  },

  // ✅ CHANGED: publish returns the same schema as fetchFinalPlan
  // because backend can also return missingByReg in POST response (recommended).
  publishFinalPlan: async (
    plan: { publishedAt: number; data: PlanData },
    userEmail: string
  ): Promise<FinalPlanResponse> => {
    const response = await fetch(`${API_BASE_URL}/final-plan`, {
      method: "POST",
      headers: getHeaders(userEmail),
      body: JSON.stringify(plan),
    });
    if (!response.ok) throw new Error("Failed to publish plan");
    return response.json();
  },

  shareFinalPlan: async (
    emails: string[],
    subject: string,
    body: string,
    userEmail: string,
    accessToken: string
  ): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/final-plan/share`, {
      method: "POST",
      headers: getHeaders(userEmail, accessToken),
      body: JSON.stringify({ emails, subject, body }),
    });
    if (!response.ok) throw new Error("Failed to share plan");
  },

  // --- TENANT USERS ---
  fetchTenantUsers: async (
    userEmail: string,
    accessToken?: string
  ): Promise<{ email: string; name: string }[]> => {
    const response = await fetch(`${API_BASE_URL}/tenant-users`, {
      headers: getHeaders(userEmail, accessToken),
    });
    if (!response.ok) throw new Error("Failed to fetch tenant users");
    return response.json();
  },

  // --- REGULATIONS ---
  fetchRegulations: async (userEmail: string): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/regulations`, {
      headers: getHeaders(userEmail),
    });
    if (!response.ok) throw new Error("Failed to fetch regulations");
    return response.json();
  },

  addRegulation: async (name: string, userEmail: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/regulations`, {
      method: "POST",
      headers: getHeaders(userEmail),
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error("Failed to add regulation");
  },

  deleteRegulation: async (name: string, userEmail: string): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/regulations/${encodeURIComponent(name)}`,
      {
        method: "DELETE",
        headers: getHeaders(userEmail),
      }
    );
    if (!response.ok) throw new Error("Failed to delete regulation");
  },

  // --- MODELS ---
  fetchModels: async (userEmail: string): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/models`, {
      headers: getHeaders(userEmail),
    });
    if (!response.ok) throw new Error("Failed to fetch models");
    return response.json();
  },

  addModel: async (name: string, userEmail: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/models`, {
      method: "POST",
      headers: getHeaders(userEmail),
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error("Failed to add model");
  },

  deleteModel: async (name: string, userEmail: string): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/models/${encodeURIComponent(name)}`,
      {
        method: "DELETE",
        headers: getHeaders(userEmail),
      }
    );
    if (!response.ok) throw new Error("Failed to delete model");
  },

  // --- SYNC ---
  syncTenantUsers: async (userEmail: string, accessToken: string) => {
    const response = await fetch(`${API_BASE_URL}/tenant-users/sync`, {
      method: "POST",
      headers: getHeaders(userEmail, accessToken),
    });
    if (!response.ok) throw new Error("Failed to sync tenant users");
    return response.json();
  },

  // --- AUDIT LOG ---
  fetchAuditLog: async (userEmail: string) => {
    const response = await fetch(`${API_BASE_URL}/audit-log`, {
      headers: getHeaders(userEmail),
    });
    if (!response.ok) throw new Error("Failed to fetch audit log");
    return response.json();
  },

  // --- SETTINGS ---
  fetchUserSettings: async (userEmail: string) => {
    const response = await fetch(`${API_BASE_URL}/me/settings`, {
      headers: getHeaders(userEmail),
    });
    if (!response.ok) throw new Error("Failed to fetch settings");
    return response.json();
  },

  updateUserSettings: async (payload: any, userEmail: string) => {
    const response = await fetch(`${API_BASE_URL}/me/settings`, {
      method: "PUT",
      headers: getHeaders(userEmail),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to update settings");
    return response.json();
  },
};

// App.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { NavTab, ViewMode, PlanData, Draft } from "./utils/types";

import {
  deriveModelData,
  validatePlanning,
  getCellKey,
  isModel,
  getCurrentFinancialYears,
  getUniqueModels,
  getDraftRegList,
  getDraftModelList,
} from "./utils/utils";

import PlanningGrid from "./components/PlanningGrid";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ComplianceSidebar from "./components/ComplianceSidebar";
import DrillDownModal from "./components/DrillDownModal";
import LoginPage from "./components/LoginPage";
import ShareModal from "./components/ShareModal";
import SaveDraftModal from "./components/SaveDraftModal";
import { getAllowedEmails, BACKEND_BASE_URL } from "./authConfig";
import { Settings2 } from "lucide-react";
import { api } from "./apiService/api";

const INITIAL_PLAN_DATA: PlanData = {
  regulationCells: {},
  regOrder: [],
  modelOrder: [],
  customModels: [],
  customRegulations: [],
  itemColors: {}
};

type FinalPlanResponse = {
  publishedAt: number;
  publishedBy?: string;
  data: PlanData;
  missingByReg?: Record<string, string[]>;
};

type AuthUser = {
  email: string;
  name?: string;
  loginType: "microsoft" | "manual";
};

const stableStringify = (obj: any) => {
  try {
    const sorter = (_k: string, v: any) => {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        return Object.keys(v)
          .sort()
          .reduce((acc: any, key) => {
            acc[key] = v[key];
            return acc;
          }, {});
      }
      if (Array.isArray(v)) {
        // Sort arrays of primitives to ensure stable comparison for lists
        if (v.every(item => typeof item === 'string' || typeof item === 'number')) {
          return [...v].sort();
        }
      }
      return v;
    };
    return JSON.stringify(obj, sorter) || "";
  } catch {
    return JSON.stringify(obj) || "";
  }
};

type UnsavedAction = 'SAVE_AS_NEW' | 'UPDATE' | 'DISCARD';

const App: React.FC = () => {
  // ✅ Auth state (no MSAL)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  // Pending navigation state (to resume after save/discard)
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<NavTab>("Draft");
  const [viewMode, setViewMode] = useState<ViewMode>("Regulation");
  const [viewResolution, setViewResolution] = useState<"Month" | "Quarter" | "Year">("Month");

  // Drafts (DB)
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentPlan, setCurrentPlan] = useState<PlanData>(INITIAL_PLAN_DATA);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // Track "last saved" snapshot for unsaved indicator
  const [lastSavedPlanSnapshot, setLastSavedPlanSnapshot] = useState<string>(
    stableStringify(INITIAL_PLAN_DATA)
  );

  // Final (DB)
  const [finalPlan, setFinalPlan] = useState<PlanData | null>(null);
  const [finalModels, setFinalModels] = useState<string[]>([]);
  const [finalCompliance, setFinalCompliance] = useState<Record<string, string[]>>({});

  // Final regulations (from backend)
  const [finalRegulations, setFinalRegulations] = useState<string[]>([]);

  // Draft regulations (LOCAL ONLY, ORDERED using currentPlan.regOrder + cell keys)
  const draftRegulations = useMemo(() => getDraftRegList(currentPlan), [currentPlan]);

  // Regulation list used by UI depends on tab
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Regulation list used by UI depends on tab
  const regulationsForUI = useMemo(
    () => (activeTab === "Draft" ? draftRegulations : finalRegulations),
    [activeTab, draftRegulations, finalRegulations]
  );

  const [newRegName, setNewRegName] = useState("");

  // Global Master List & Colors (Persistent across draft switches/clearing)
  const [masterModels, setMasterModels] = useState<string[]>([]);
  const [masterRegs, setMasterRegs] = useState<string[]>([]);
  const [archivedModels, setArchivedModels] = useState<string[]>([]);
  const [archivedRegs, setArchivedRegs] = useState<string[]>([]);
  const [masterColors, setMasterColors] = useState<Record<string, string>>({});

  // Point 3: Global Library uses Master State + currentPlan
  const globalLibrary = useMemo(() => {
    const modelsSet = new Set([...masterModels, ...(currentPlan.customModels || [])]);
    const regsSet = new Set([...masterRegs, ...(currentPlan.customRegulations || [])]);

    const colorsMap: Record<string, string> = {};
    const normalizeKey = (s: string) => (s || "").replace(/\s+/g, ' ').trim().toLowerCase();

    const applyToMap = (source: Record<string, string>) => {
      Object.entries(source).forEach(([name, color]) => {
        if (!color) return;
        const norm = normalizeKey(name);
        colorsMap[name] = color; // exact match
        colorsMap[name.toLowerCase()] = color; // lowercase
        colorsMap[norm] = color; // normalized spaces + lowercase
      });
    };

    applyToMap(masterColors);
    applyToMap(currentPlan.itemColors || {});

    return {
      models: Array.from(modelsSet).sort(),
      regs: Array.from(regsSet).sort(),
      colors: colorsMap
    };
  }, [masterModels, masterRegs, masterColors, currentPlan]);

  // Final drilldown modal
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // Share token
  const [accessToken, setAccessToken] = useState("");

  // Years
  const [years] = useState(getCurrentFinancialYears());

  // Sidebars
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  // Highlighting state for double-click on model/regulation in sidebar
  const [highlightedModel, setHighlightedModel] = useState<string | null>(null);
  const [highlightedRegulation, setHighlightedRegulation] = useState<string | null>(null);

  // ✅ Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1️⃣ Check manual login first (frontend-only)
        const manualUser = sessionStorage.getItem('manualLoginUser');
        if (manualUser) {
          const parsed = JSON.parse(manualUser);
          setAuthUser({
            email: parsed.username,
            name: parsed.name,
            loginType: 'manual'
          });
          setAuthLoading(false);
          return;
        }

        // 2️⃣ Check backend for Microsoft OAuth
        const response = await fetch(`${BACKEND_BASE_URL}/auth/me`, {
          credentials: 'include'
        });

        if (response.ok) {
          const user = await response.json();
          setAuthUser(user);
        } else {
          setAuthUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setAuthUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Get user details
  const userEmail = authUser?.email?.toLowerCase() || "";
  const userName = authUser?.name || authUser?.email?.split('@')[0] || "User";

  // Auth
  const allowedEmails = getAllowedEmails();
  const isAuthorized = allowedEmails.length > 0 ? allowedEmails.includes(userEmail) : true;

  // -----------------------
  // Unsaved indicator
  // -----------------------
  const isDraftDirty = useMemo(() => {
    if (activeTab !== "Draft") return false;
    return stableStringify(currentPlan) !== lastSavedPlanSnapshot;
  }, [activeTab, currentPlan, lastSavedPlanSnapshot]);

  // -----------------------
  // Unsaved Changes Prompt (BeforeUnload)
  // -----------------------
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if there are unsaved changes (isDraftDirty is true)
      if (isDraftDirty) {
        // Prevent default behavior (some browsers require this)
        e.preventDefault();
        // Set returnValue to trigger the prompt (text is usually ignored by modern browsers)
        e.returnValue = '';
      }
    };

    // Add event listener when component mounts or isDraftDirty changes
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Clean up event listener when component unmounts or isDraftDirty changes
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDraftDirty]);

  // -----------------------
  // Helpers
  // -----------------------
  const removeRegFromPlan = useCallback((plan: PlanData, reg: string): PlanData => {
    const prefix = `${reg}|`;
    const nextCells: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(plan.regulationCells || {})) {
      if (!k.startsWith(prefix)) nextCells[k] = v;
    }
    const nextOrder = (plan.regOrder || []).filter((r) => r !== reg);
    return { ...plan, regulationCells: nextCells, regOrder: nextOrder };
  }, []);

  const addRegulationDraftOnly = useCallback(() => {
    const name = newRegName.trim();
    if (!name) return;

    setCurrentPlan((prev) => {
      const cells = prev.regulationCells || {};
      const seedKey = getCellKey(name, years[0].label, 4);

      const nextCells = { ...cells };
      if (!nextCells[seedKey]) nextCells[seedKey] = [];

      const nextOrder = Array.from(new Set([...(prev.regOrder || []), name]));
      return { ...prev, regulationCells: nextCells, regOrder: nextOrder };
    });

    setNewRegName("");
  }, [newRegName, years]);

  const deleteRegulationDraftOnly = useCallback(
    (reg: string) => {
      setCurrentPlan((prev) => removeRegFromPlan(prev, reg));
    },
    [removeRegFromPlan]
  );

  const handleDraftRegReorder = useCallback((newOrder: string[]) => {
    setCurrentPlan((prev) => ({ ...prev, regOrder: newOrder }));
  }, []);

  // -----------------------
  // Load backend data
  // -----------------------
  useEffect(() => {
    if (!userEmail) return;

    const loadAll = async () => {
      const [d, f, r, m, ar, am] = await Promise.all([
        api.fetchDrafts(userEmail).catch(() => []),
        api.fetchFinalPlan(userEmail).catch(() => null as FinalPlanResponse | null),
        api.fetchRegulations(userEmail).catch(() => []),
        api.fetchModels(userEmail).catch(() => []),
        api.fetchArchivedRegulations(userEmail).catch(() => []),
        api.fetchArchivedModels(userEmail).catch(() => []),
      ]);

      setDrafts(d);
      setFinalRegulations(Array.isArray(r) ? r : []);
      setFinalModels(Array.isArray(m) ? m : []);
      setArchivedRegs(Array.isArray(ar) ? ar : []);
      setArchivedModels(Array.isArray(am) ? am : []);

      if (f) {
        setFinalPlan(f.data);
        setFinalCompliance(f.missingByReg || {});
      } else {
        setFinalPlan(null);
        setFinalCompliance({});
      }

      // Initialize Master Lists from all drafts AND final plan
      const mModelsCanon = new Map<string, string>(); // lowercase -> original
      const mRegsCanon = new Map<string, string>();   // lowercase -> original
      const mColors: Record<string, string> = {};

      const normalize = (s: string) => (s || "").replace(/\s+/g, ' ').trim();

      const processContent = (content: PlanData | null | undefined) => {
        if (!content) return;
        (content.customModels || []).forEach(m => {
          const norm = normalize(m);
          const low = norm.toLowerCase();
          if (low && !mModelsCanon.has(low)) mModelsCanon.set(low, norm);
        });
        (content.customRegulations || []).forEach(r => {
          const norm = normalize(r);
          const low = norm.toLowerCase();
          if (low && !mRegsCanon.has(low)) mRegsCanon.set(low, norm);
        });
        if (content.itemColors) {
          Object.entries(content.itemColors).forEach(([name, color]) => {
            const low = normalize(name).toLowerCase();
            if (low && color) mColors[low] = color;
          });
        }
      };

      // 1. Process drafts
      d.forEach((dr: Draft) => {
        try {
          const content: PlanData = typeof dr.data === 'string' ? JSON.parse(dr.data as any) : dr.data;
          processContent(content);
        } catch (e) { console.error("Error parsing draft data", e); }
      });

      // 2. Process final plan
      if (f && f.data) {
        processContent(f.data);
      }

      // Populate master lists with original casing (first found)
      setMasterModels(Array.from(mModelsCanon.values()));
      setMasterRegs(Array.from(mRegsCanon.values()));

      setMasterColors(mColors);
    };

    loadAll();
  }, [userEmail]);

  // -----------------------
  // Draft editing (state only)
  // -----------------------
  const handleCellChange = useCallback(
    (rowId: string, year: string, month: number, value: string) => {
      setCurrentPlan((prev) => {
        let newValues = value
          .split(",")
          .map((v) => v.replace(/\s+/g, ' ').trim()) // normalize internal spaces
          .filter(Boolean);

        if (newValues.length > 5) {
          alert("Maximum of 5 models allowed per cell.");
          newValues = newValues.slice(0, 5);
        }

        if (viewMode === "Regulation") {
          const key = getCellKey(rowId, year, month);
          return {
            ...prev,
            regulationCells: {
              ...prev.regulationCells,
              [key]: newValues,
            },
          };
        } else {
          // Model centric editing
          // rowId is ModelID, value is list of RegulationIDs
          const nextCells = { ...(prev.regulationCells || {}) };

          // 1. Identify what regulations this model was previously in for this slot
          const modelId = rowId;
          const oldRegs: string[] = [];
          Object.entries(nextCells).forEach(([cellKey, models]) => {
            const [reg, y, m] = cellKey.split('|');
            if (y === year && Number(m) === month && models.includes(modelId)) {
              oldRegs.push(reg);
            }
          });

          // 2. Remove model from old regulations in this slot
          oldRegs.forEach(regId => {
            const k = getCellKey(regId, year, month);
            if (nextCells[k]) {
              nextCells[k] = nextCells[k].filter(m => m !== modelId);
            }
          });

          // 3. Add model to new regulations in this slot
          newValues.forEach(regId => {
            const k = getCellKey(regId, year, month);
            if (!nextCells[k]) nextCells[k] = [];
            if (!nextCells[k].includes(modelId)) {
              nextCells[k] = [...nextCells[k], modelId];
            }
          });

          return { ...prev, regulationCells: nextCells };
        }
      });
    },
    [viewMode]
  );

  const handleDraftModelReorder = useCallback((newOrder: string[]) => {
    setCurrentPlan((prev) => ({ ...prev, modelOrder: newOrder }));
  }, []);

  const handleRenameRow = useCallback((oldName: string, newName: string) => {
    setCurrentPlan((prev) => {
      if (viewMode === "Regulation") {
        const existing = prev.regOrder || [];
        if (existing.includes(newName)) {
          alert(`Regulation "${newName}" already exists.`);
          return prev;
        }

        const newOrder = existing.map(r => r === oldName ? newName : r);

        const newCells: Record<string, string[]> = {};
        const oldPrefix = `${oldName}|`;
        const newPrefix = `${newName}|`;

        const cells: Record<string, string[]> = prev.regulationCells || {};
        for (const [k, v] of Object.entries(cells)) {
          if (k.startsWith(oldPrefix)) {
            const suffix = k.substring(oldPrefix.length);
            newCells[newPrefix + suffix] = v;
          } else {
            newCells[k] = v;
          }
        }

        const newRowHeights: Record<string, number> = { ...(prev.layout?.rowHeights || {}) };
        if (newRowHeights[oldName]) {
          newRowHeights[newName] = newRowHeights[oldName];
          delete newRowHeights[oldName];
        }

        return {
          ...prev,
          regOrder: newOrder,
          regulationCells: newCells,
          layout: {
            ...prev.layout,
            rowHeights: newRowHeights,
            colWidths: prev.layout?.colWidths || {}
          }
        };
      } else {
        // Model rename
        const existing = prev.modelOrder || [];
        if (existing.includes(newName)) {
          alert(`Model "${newName}" already exists.`);
          return prev;
        }

        const newOrder = existing.map(m => m === oldName ? newName : m);

        const newCells: Record<string, string[]> = {};
        const cells: Record<string, string[]> = prev.regulationCells || {};
        for (const [k, v] of Object.entries(cells)) {
          newCells[k] = (v || []).map(val => val === oldName ? newName : val);
        }

        // update customModels
        const newCustom = (prev.customModels || []).map(m => m === oldName ? newName : m);

        return {
          ...prev,
          modelOrder: newOrder,
          regulationCells: newCells,
          customModels: newCustom
        };
      }
    });
  }, [viewMode]);

  const handleSetItemColor = useCallback((name: string, color: string) => {
    const norm = (name || "").replace(/\s+/g, ' ').trim().toLowerCase();

    setMasterColors(prev => ({
      ...prev,
      [name]: color,
      [name.toLowerCase()]: color,
      [norm]: color
    }));

    setCurrentPlan(prev => ({
      ...prev,
      itemColors: {
        ...(prev.itemColors || {}),
        [name]: color,
        [name.toLowerCase()]: color,
        [norm]: color
      }
    }));
  }, []);

  const handleLayoutChange = useCallback(
    (colWidths: Record<string, number>, rowHeights: Record<string, number>) => {
      setCurrentPlan((prev) => ({
        ...prev,
        layout: { colWidths, rowHeights },
      }));
    },
    []
  );

  const handleUpdateCustomLists = useCallback((models: string[], regs: string[]) => {
    setMasterModels(models);
    setMasterRegs(regs);

    setCurrentPlan(prev => ({
      ...prev,
      customModels: models,
      customRegulations: regs
    }));
  }, []);

  const handleAddRegulationRow = useCallback((name: string) => {
    if (!name.trim()) return;
    setCurrentPlan((prev) => {
      // Check if exists in regOrder
      if ((prev.regOrder || []).includes(name)) return prev;

      const cells = prev.regulationCells || {};
      const seedKey = getCellKey(name, years[0].label, 4);

      const nextCells = { ...cells };
      if (!nextCells[seedKey]) nextCells[seedKey] = [];

      const nextOrder = Array.from(new Set([...(prev.regOrder || []), name]));
      return { ...prev, regulationCells: nextCells, regOrder: nextOrder };
    });
  }, [years]);

  const handleAddRegulationToCell = useCallback((modelId: string, year: string, month: number, reg: string) => {
    handleCellChange(modelId, year, month, reg); // Using the model-centric update logic in handleCellChange
  }, [handleCellChange]);

  const handleAddModelRow = useCallback((name: string) => {
    if (!name.trim()) return;
    setCurrentPlan((prev) => {
      if ((prev.modelOrder || []).includes(name)) return prev;
      const nextOrder = Array.from(new Set([...(prev.modelOrder || []), name]));
      return { ...prev, modelOrder: nextOrder };
    });
  }, []);

  const handleAddModelToCell = useCallback((rowId: string, year: string, month: number, model: string) => {
    setCurrentPlan((prev) => {
      const key = getCellKey(rowId, year, month);
      const currentVals = prev.regulationCells[key] || [];

      if (currentVals.length >= 5) {
        alert("Maximum of 5 models allowed per cell.");
        return prev;
      }

      // Avoid duplicates if desired, or allow. Requirement says "added to that cell". Let's avoid exact dupes.
      if (currentVals.includes(model)) return prev;

      return {
        ...prev,
        regulationCells: {
          ...prev.regulationCells,
          [key]: [...currentVals, model],
        },
      };
    });
  }, []);

  const deleteModelDraftOnly = useCallback((model: string) => {
    setCurrentPlan((prev) => {
      const nextCells: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(prev.regulationCells || {})) {
        nextCells[k] = (v || []).filter(m => m !== model);
      }
      const nextOrder = (prev.modelOrder || []).filter(m => m !== model);
      const nextCustom = (prev.customModels || []).filter(m => m !== model);
      return { ...prev, regulationCells: nextCells, modelOrder: nextOrder, customModels: nextCustom };
    });
  }, []);

  const handleRenameDraft = useCallback(async (id: string, newName: string) => {
    if (!userEmail) return;

    const draftToUpdate = drafts.find(d => d.id === id);
    if (!draftToUpdate) return;

    // If renaming current draft, use currentPlan to avoid data loss
    let dataToSave = draftToUpdate.data;
    if (currentDraftId === id) {
      dataToSave = currentPlan;
    }

    const payload: Draft = {
      ...draftToUpdate,
      name: newName,
      updatedAt: Date.now(),
      data: dataToSave
    };

    try {
      const saved = await api.saveDraft(payload, userEmail);
      setDrafts(prev => prev.map(d => d.id === id ? saved : d));

      if (currentDraftId === id) {
        setCurrentPlan(saved.data as PlanData);
        setLastSavedPlanSnapshot(stableStringify(saved.data));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to rename draft");
    }
  }, [drafts, currentDraftId, currentPlan, userEmail]);

  // -----------------------
  // Helper: Check if model is used in plan cells
  // -----------------------
  const isModelInUse = useCallback((modelName: string): boolean => {
    const cells = currentPlan.regulationCells || {};
    for (const key of Object.keys(cells)) {
      if ((cells[key] || []).includes(modelName)) return true;
    }
    return false;
  }, [currentPlan]);

  // -----------------------
  // Helper: Check if regulation is used in plan  
  // -----------------------
  const isRegulationInUse = useCallback((regName: string): boolean => {
    const cells = currentPlan.regulationCells || {};
    const order = currentPlan.regOrder || [];
    // Check if it's in regOrder or has cells
    if (order.includes(regName)) return true;
    for (const key of Object.keys(cells)) {
      if (key.startsWith(regName + "|")) return true;
    }
    return false;
  }, [currentPlan]);

  // -----------------------
  // Rename model everywhere in the plan
  // -----------------------
  const renameModelInPlan = useCallback((oldName: string, newName: string) => {
    if (oldName === newName || !newName.trim()) return;

    // Update masterModels state
    setMasterModels(prev => prev.map(m => m === oldName ? newName.trim() : m));

    setCurrentPlan(prev => {
      const newCells: Record<string, string[]> = {};

      for (const [key, values] of Object.entries(prev.regulationCells || {})) {
        newCells[key] = (values || []).map(v => v === oldName ? newName.trim() : v);
      }

      // Also update customModels list
      const newCustomModels = (prev.customModels || []).map(m => m === oldName ? newName.trim() : m);

      // Update modelOrder
      const newModelOrder = (prev.modelOrder || []).map(m => m === oldName ? newName.trim() : m);

      return {
        ...prev,
        regulationCells: newCells,
        customModels: newCustomModels,
        modelOrder: newModelOrder
      };
    });
  }, []);

  // -----------------------
  // Rename regulation everywhere in the plan
  // -----------------------
  const renameRegulationInPlan = useCallback((oldName: string, newName: string) => {
    if (oldName === newName || !newName.trim()) return;

    // Update masterRegs state
    setMasterRegs(prev => prev.map(r => r === oldName ? newName.trim() : r));

    setCurrentPlan(prev => {
      const newCells: Record<string, string[]> = {};

      // Rename keys in regulationCells
      for (const [key, values] of Object.entries(prev.regulationCells || {})) {
        const [reg, ...rest] = key.split("|");
        if (reg === oldName) {
          const newKey = [newName.trim(), ...rest].join("|");
          newCells[newKey] = values;
        } else {
          newCells[key] = values;
        }
      }

      // Update regOrder
      const newOrder = (prev.regOrder || []).map(r => r === oldName ? newName.trim() : r);

      // Update customRegulations
      const newCustomRegs = (prev.customRegulations || []).map(r => r === oldName ? newName.trim() : r);

      return {
        ...prev,
        regulationCells: newCells,
        regOrder: newOrder,
        customRegulations: newCustomRegs
      };
    });
  }, []);

  // -----------------------
  // Archive/Restore Logic
  // -----------------------
  const handleArchiveModel = useCallback(async (name: string) => {
    if (!userEmail) return;
    try {
      await api.archiveModel(name, userEmail);
      setMasterModels(prev => prev.filter(m => m !== name));
      setArchivedModels(prev => [...prev, name]);
      // Update current plan if it's in custom list or order
      setCurrentPlan(prev => ({
        ...prev,
        customModels: (prev.customModels || []).filter(m => m !== name),
        modelOrder: (prev.modelOrder || []).filter(m => m !== name)
      }));
    } catch (e) {
      console.error(e);
      alert("Failed to archive model");
    }
  }, [userEmail]);

  const handleArchiveRegulation = useCallback(async (name: string) => {
    if (!userEmail) return;
    try {
      await api.archiveRegulation(name, userEmail);
      setMasterRegs(prev => prev.filter(r => r !== name));
      setArchivedRegs(prev => [...prev, name]);
      // Update current plan if it's in custom list
      setCurrentPlan(prev => ({
        ...prev,
        customRegulations: (prev.customRegulations || []).filter(r => r !== name)
      }));
    } catch (e) {
      console.error(e);
      alert("Failed to archive regulation");
    }
  }, [userEmail]);

  const handleRestoreModel = useCallback(async (name: string) => {
    if (!userEmail) return;
    try {
      await api.restoreModel(name, userEmail);
      setArchivedModels(prev => prev.filter(m => m !== name));
      setMasterModels(prev => [...prev, name]);
      // We don't automatically add it back to customModels of currentPlan unless user re-adds it
    } catch (e) {
      console.error(e);
      alert("Failed to restore model");
    }
  }, [userEmail]);

  const handleRestoreRegulation = useCallback(async (name: string) => {
    if (!userEmail) return;
    try {
      await api.restoreRegulation(name, userEmail);
      setArchivedRegs(prev => prev.filter(r => r !== name));
      setMasterRegs(prev => [...prev, name]);
    } catch (e) {
      console.error(e);
      alert("Failed to restore regulation");
    }
  }, [userEmail]);

  const handlePermanentDeleteModel = useCallback(async (name: string) => {
    if (!userEmail) return;
    try {
      await api.permanentlyDeleteModel(name, userEmail);
      setArchivedModels(prev => prev.filter(m => m !== name));
      // Also ensure it's removed from master list if it was there (shouldn't be if it's archived, but safe)
      setMasterModels(prev => prev.filter(m => m !== name));
    } catch (e) {
      console.error(e);
      alert("Failed to permanently delete model");
    }
  }, [userEmail]);

  const handlePermanentDeleteRegulation = useCallback(async (name: string) => {
    if (!userEmail) return;
    try {
      await api.permanentlyDeleteRegulation(name, userEmail);
      setArchivedRegs(prev => prev.filter(r => r !== name));
      // Also ensure it's removed from master list if it was there
      setMasterRegs(prev => prev.filter(r => r !== name));
    } catch (e) {
      console.error(e);
      alert("Failed to permanently delete regulation");
    }
  }, [userEmail]);

  // -----------------------
  // Enhanced custom lists update with rename & delete protection
  // -----------------------
  const handleUpdateCustomListsWithRename = useCallback((
    models: string[],
    regs: string[],
    renamedModel?: { oldName: string; newName: string },
    renamedReg?: { oldName: string; newName: string }
  ) => {
    // Handle model rename
    if (renamedModel) {
      renameModelInPlan(renamedModel.oldName, renamedModel.newName);
    }

    // Handle regulation rename
    if (renamedReg) {
      renameRegulationInPlan(renamedReg.oldName, renamedReg.newName);
    }

    // If no rename, just update the lists
    if (!renamedModel && !renamedReg) {
      setCurrentPlan(prev => ({
        ...prev,
        customModels: models,
        customRegulations: regs
      }));
    }
  }, [renameModelInPlan, renameRegulationInPlan]);
  // Active plan per tab
  // -----------------------
  const activePlan: PlanData = activeTab === "Draft" ? currentPlan : finalPlan || INITIAL_PLAN_DATA;

  // -----------------------
  // Models per tab
  // -----------------------
  // -----------------------
  // Sidebar Lists (Derived from Active Plan)
  // -----------------------
  // -----------------------
  // Sidebar Lists (Derived from Active Plan)
  // -----------------------
  const sidebarModels = useMemo(() => {
    // For Final, strictly show what is in the table
    if (activeTab === "Final") {
      return getUniqueModels(activePlan);
    }
    // For Draft, show merge of table + custom lists
    const tableModels = getUniqueModels(activePlan);
    const customModels = activePlan.customModels || [];
    const all = Array.from(new Set([...tableModels, ...customModels]));
    return all.filter(m => !archivedModels.includes(m)).sort();
  }, [activePlan, activeTab, archivedModels]);

  const sidebarRegulations = useMemo(() => {
    // For Final, strictly show what is in the table
    if (activeTab === "Final") {
      return getDraftRegList(activePlan); // This gets regs that have cells or are in order
    }
    // For Draft, show merge of table + custom lists
    const tableRegs = getDraftRegList(activePlan);
    const customRegs = activePlan.customRegulations || [];
    const all = Array.from(new Set([...tableRegs, ...customRegs]));
    return all.filter(r => !archivedRegs.includes(r)).sort();
  }, [activePlan, activeTab, archivedRegs]);

  const missingRegulations = useMemo(() => {
    if (activeTab !== 'Draft') return [];
    // "Missing" means they are in the sidebar list (sidebarRegulations) but NOT used in the table (getDraftRegList).
    // Warning: sidebarRegulations depends on getDraftRegList.
    // sidebarRegulations = tableRegs U customRegs.
    // So missing = (tableRegs U customRegs) - tableRegs = customRegs - tableRegs.
    const tableRegs = new Set(getDraftRegList(activePlan));
    // We re-calculate sidebar list or just use customRegulations prop directly? 
    // sidebarRegulations is memoized.
    return sidebarRegulations.filter(r => !tableRegs.has(r));
  }, [activePlan, activeTab, sidebarRegulations]);

  // -----------------------
  // Models per tab
  // -----------------------
  const draftModels = useMemo(() => {
    return getDraftModelList(currentPlan);
  }, [currentPlan]);
  const modelsForUI = activeTab === "Draft" ? draftModels : finalModels;

  const modelData = useMemo(() => {
    return deriveModelData(activePlan, modelsForUI);
  }, [activePlan, modelsForUI]);

  // -----------------------
  // Compliance
  // -----------------------
  const draftCompliance = useMemo(() => {
    return validatePlanning(currentPlan, draftRegulations, draftModels);
  }, [currentPlan, draftRegulations, draftModels]);

  const validationForSidebar = activeTab === "Final" ? finalCompliance : draftCompliance;

  // -----------------------
  // Draft save/update
  // -----------------------
  const saveDraft = async () => {
    if (!userEmail) return;

    const draftId = currentDraftId || crypto.randomUUID();

    // Determine name: 
    // If name is strict format "Draft <Date/Time>", update the timestamp.
    // Otherwise keep the custom name (even if it starts with "Draft ").
    const existingDraft = drafts.find(d => d.id === currentDraftId);
    let draftName = `Draft ${new Date().toLocaleString()}`;

    if (existingDraft) {
      const oldName = existingDraft.name;
      if (!oldName.startsWith("Draft ")) {
        // Completely custom name -> Keep
        draftName = oldName;
      } else {
        // Starts with "Draft ". Check if the rest is a valid date.
        // If it is NOT a date (e.g. "Draft Final"), keep it.
        // If it IS a date (e.g. "Draft 2/5/2026..."), let it update to new timestamp.
        const datePart = oldName.substring(6); // Remove "Draft "
        const timestamp = Date.parse(datePart);

        // Valid timestamp AND contains ':' (to distinguish "Draft 1" vs "Draft 2/5/2026 10:00:00")
        const isTimestamp = !isNaN(timestamp) && datePart.includes(':');

        if (!isTimestamp) {
          draftName = oldName;
        }
      }
    }

    const payload: Draft = {
      id: draftId,
      name: draftName,
      updatedAt: Date.now(),
      data: {
        ...currentPlan,
        customModels: masterModels,
        customRegulations: masterRegs,
        itemColors: masterColors
      },
    };

    try {
      const saved = await api.saveDraft(payload, userEmail);

      setCurrentPlan(saved.data as PlanData);
      setCurrentDraftId(saved.id);
      setLastSavedPlanSnapshot(stableStringify(saved.data));

      setDrafts((prev) => {
        const idx = prev.findIndex((x) => x.id === saved.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = saved;
          copy.sort((a, b) => b.updatedAt - a.updatedAt);
          return copy;
        }
        return [saved, ...prev];
      });
    } catch (e) {
      console.error(e);
      alert("Failed to save draft");
    }
  };

  const handleSaveDraftConfirmed = async (name: string) => {
    if (!userEmail) return;

    const draftId = crypto.randomUUID();
    const payload: Draft = {
      id: draftId,
      name: name,
      updatedAt: Date.now(),
      data: {
        ...currentPlan,
        customModels: masterModels,
        customRegulations: masterRegs,
        itemColors: masterColors
      },
    };

    try {
      const saved = await api.saveDraft(payload, userEmail);

      setCurrentPlan(saved.data as PlanData);
      setCurrentDraftId(saved.id);
      setLastSavedPlanSnapshot(stableStringify(saved.data));

      setDrafts((prev) => {
        const next = [saved, ...prev];
        next.sort((a, b) => b.updatedAt - a.updatedAt);
        return next;
      });

      setIsSaveModalOpen(false);

      // Handle pending navigation if any
      if (pendingNavigation) {
        pendingNavigation();
        setPendingNavigation(null);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save draft");
    }
  };

  const saveDraftAsNew = () => {
    setIsSaveModalOpen(true);
  };

  // -----------------------
  // Navigation Guards
  // -----------------------

  const handleTabChange = (tab: NavTab) => {
    if (activeTab === "Draft" && isDraftDirty) {
      setPendingNavigation(() => () => setActiveTab(tab));
      setShowUnsavedPrompt(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleLoadDraft = (draft: Draft) => {
    if (activeTab === "Draft" && isDraftDirty) {
      setPendingNavigation(() => () => loadDraft(draft));
      setShowUnsavedPrompt(true);
    } else {
      loadDraft(draft);
    }
  };

  const loadDraft = (draft: Draft) => {
    const data = typeof draft.data === 'string' ? JSON.parse(draft.data as any) : draft.data;
    const mergedPlan = {
      ...data,
      customModels: Array.from(new Set([...masterModels, ...(data.customModels || [])])),
      customRegulations: Array.from(new Set([...masterRegs, ...(data.customRegulations || [])])),
      itemColors: { ...masterColors, ...(data.itemColors || {}) },
      modelOrder: data.modelOrder || []
    };
    setCurrentPlan(mergedPlan);
    setCurrentDraftId(draft.id);
    setLastSavedPlanSnapshot(stableStringify(mergedPlan));
    setActiveTab("Draft");
    setViewMode("Regulation");
  };

  // Wrap actions to clear prompt
  const performSaveAsNew = async () => {
    setShowUnsavedPrompt(false);
    setIsSaveModalOpen(true);
  };

  const performUpdate = async () => {
    await saveDraft();
    setShowUnsavedPrompt(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const performDiscard = () => {
    if (lastSavedPlanSnapshot) {
      setCurrentPlan(JSON.parse(lastSavedPlanSnapshot));
    } else {
      setCurrentPlan(INITIAL_PLAN_DATA);
    }
    setShowUnsavedPrompt(false);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };


  const deleteDraft = async (id: string) => {
    if (!userEmail) return;
    try {
      await api.deleteDraft(id, userEmail);
      setDrafts((prev) => prev.filter((d) => d.id !== id));

      if (currentDraftId === id) {
        setCurrentPlan(INITIAL_PLAN_DATA);
        setCurrentDraftId(null);
        setLastSavedPlanSnapshot(stableStringify(INITIAL_PLAN_DATA));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete draft");
    }
  };

  const handleNewDraft = useCallback(() => {
    const freshPlan: PlanData = {
      ...INITIAL_PLAN_DATA,
      customModels: [...masterModels],
      customRegulations: [...masterRegs],
      itemColors: { ...masterColors },
      regOrder: [], // user freedom to add self
      modelOrder: [],
    };
    setCurrentPlan(freshPlan);
    setCurrentDraftId(null);
    setLastSavedPlanSnapshot(stableStringify(freshPlan));
    setActiveTab("Draft");
    setViewMode("Regulation");
  }, [masterModels, masterRegs, masterColors]);

  const handleNewDraftClick = useCallback(() => {
    if (activeTab === "Draft" && isDraftDirty) {
      setPendingNavigation(() => () => handleNewDraft());
      setShowUnsavedPrompt(true);
    } else {
      handleNewDraft();
    }
  }, [activeTab, isDraftDirty, handleNewDraft]);

  const clearDraft = () => {
    if (!window.confirm("Are you sure you want to clear all data in the cells? Rows and layout will be preserved.")) return;

    const clearedPlan: PlanData = {
      ...currentPlan,
      regulationCells: {},
      customModels: [...masterModels],
      customRegulations: [...masterRegs],
      itemColors: { ...masterColors }
    };

    setCurrentPlan(clearedPlan);
    // keep currentDraftId as requested: "clear draft option is now only for current draft"
    setLastSavedPlanSnapshot(stableStringify(clearedPlan));
  };

  // -----------------------
  // Publish
  // -----------------------
  const publishToFinal = async () => {
    if (!userEmail) return;

    try {
      const [existingRegs, existingModels] = await Promise.all([
        api.fetchRegulations(userEmail).catch(() => [] as string[]),
        api.fetchModels(userEmail).catch(() => [] as string[])
      ]);

      const currentRegs = new Set(existingRegs);
      const currentModels = new Set(existingModels);

      const draftRegs = getDraftRegList(currentPlan);
      const draftModelsList = getUniqueModels(currentPlan);

      const regsToAdd = draftRegs.filter(r => !currentRegs.has(r));
      if (regsToAdd.length > 0) {
        await Promise.all(regsToAdd.map(r => api.addRegulation(r, userEmail)));
      }

      const modelsToAdd = draftModelsList.filter(m => !currentModels.has(m));
      if (modelsToAdd.length > 0) {
        await Promise.all(modelsToAdd.map(m => api.addModel(m, userEmail)));
      }

    } catch (e) {
      console.error("Error syncing Master Lists:", e);
    }

    const plan = { publishedAt: Date.now(), data: currentPlan };

    try {
      await api.publishFinalPlan(plan, userEmail);

      const f = await api.fetchFinalPlan(userEmail);
      if (f) {
        setFinalPlan(f.data);
        setFinalCompliance(f.missingByReg || {});
      } else {
        setFinalPlan(null);
        setFinalCompliance({});
      }

      const [m, r] = await Promise.all([
        api.fetchModels(userEmail).catch(() => []),
        api.fetchRegulations(userEmail).catch(() => []),
      ]);

      setFinalModels(Array.isArray(m) ? m : []);
      setFinalRegulations(Array.isArray(r) ? r : []);

      setActiveTab("Final");
      setViewMode("Regulation");
    } catch (e) {
      console.error(e);
      alert("Failed to publish plan");
    }
  };

  const copyToDraft = () => {
    if (!finalPlan) return;
    setCurrentPlan(JSON.parse(JSON.stringify(finalPlan)));
    setCurrentDraftId(null);
    setLastSavedPlanSnapshot(stableStringify(INITIAL_PLAN_DATA));
    setActiveTab("Draft");
    setViewMode("Regulation");
  };

  // -----------------------
  // Regulation add
  // -----------------------
  const addRegulation = () => {
    if (activeTab === "Draft") {
      addRegulationDraftOnly();
      return;
    }
    setNewRegName("");
  };

  const handleFinalCellClick = (rowId: string, values: string[]) => {
    const onlyModels = values.map((v) => String(v || "").trim()).filter((v) => isModel(v));
    const allowed = new Set(finalModels.map((m) => (m || "").trim()).filter(Boolean));
    const filtered = onlyModels.filter((m) => allowed.has(m));
    if (filtered.length > 0) setSelectedModels(filtered);
  };

  // Export
  const handleDownloadExcel = () => {
    const rowIds = viewMode === "Regulation" ? regulationsForUI : modelsForUI;
    const cellData = viewMode === "Regulation" ? activePlan.regulationCells : modelData;

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
    const fileName = `ReguPlan_${activeTab}_${viewMode}_${dateStr}_${timeStr}`;

    import("./exportUtils").then((module) => {
      module.exportToExcel(viewMode, rowIds, cellData, years, fileName);
    });
  };

  // ✅ Logout handler
  const handleLogout = async () => {
    try {
      // Clear shared frontend auth used by global shell
      sessionStorage.removeItem('manualLoginUser');
      sessionStorage.removeItem('isLoggedIn');

      // Clear Microsoft login (backend cookie) if present
      await fetch(`${BACKEND_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {
        // Ignore network errors here; local logout is enough for UI
      });

      setAuthUser(null);
      // Go back to global login page
      window.location.href = '/login';
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // -----------------------
  // Auth guards
  // -----------------------
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!authUser) {
    return <LoginPage />;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="p-8 bg-white rounded-xl shadow-lg border border-red-100 text-center max-w-md">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Settings2 className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            The account{" "}
            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{userEmail}</span>{" "}
            is not authorized to access this application.
          </p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // -----------------------
  // Main UI
  // -----------------------
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
      <Sidebar
        isOpen={leftSidebarOpen}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        setSelectedModels={setSelectedModels}
        drafts={drafts}
        loadDraft={handleLoadDraft}
        deleteDraft={deleteDraft}
        newRegName={newRegName}
        setNewRegName={setNewRegName}
        addRegulation={addRegulation}
        user={{
          name: userName,
          username: userEmail,
        }}
        onLogout={handleLogout}
        customModels={globalLibrary.models}
        customRegulations={globalLibrary.regs}
        onUpdateCustomLists={handleUpdateCustomLists}
        renameDraft={handleRenameDraft}
        isModelInUse={isModelInUse}
        isRegulationInUse={isRegulationInUse}
        onRenameModel={renameModelInPlan}
        onRenameRegulation={renameRegulationInPlan}
        highlightedModel={highlightedModel}
        highlightedRegulation={highlightedRegulation}
        setHighlightedModel={setHighlightedModel}
        setHighlightedRegulation={setHighlightedRegulation}
        // NEW: Colors
        itemColors={globalLibrary.colors}
        onSetItemColor={handleSetItemColor}
        currentDraftId={currentDraftId}
        onNewDraft={handleNewDraftClick}
        archivedModels={archivedModels}
        archivedRegulations={archivedRegs}
        onArchiveModel={handleArchiveModel}
        onArchiveRegulation={handleArchiveRegulation}
        onRestoreModel={handleRestoreModel}
        onRestoreRegulation={handleRestoreRegulation}
        onPermanentDeleteModel={handlePermanentDeleteModel}
        onPermanentDeleteRegulation={handlePermanentDeleteRegulation}
      />

      <main className="flex-grow flex flex-col overflow-hidden relative">
        <Header
          leftSidebarOpen={leftSidebarOpen}
          setLeftSidebarOpen={setLeftSidebarOpen}
          rightSidebarOpen={rightSidebarOpen}
          setRightSidebarOpen={setRightSidebarOpen}
          activeTab={activeTab}
          viewMode={viewMode}
          setViewMode={setViewMode}
          handleDownloadExcel={handleDownloadExcel}
          copyToDraft={copyToDraft}
          clearDraft={clearDraft}
          saveDraft={saveDraft}
          saveDraftAsNew={saveDraftAsNew}
          publishToFinal={publishToFinal}
          onShare={() => setShareModalOpen(true)}
          isDraftDirty={activeTab === "Draft" && isDraftDirty}
        />

        <div className="px-6 pt-2 pb-0 flex items-center justify-between relative">

          {/* Draft Status / Unsaved Prompt Area */}
          <div className="flex items-center">
            {activeTab === 'Draft' && (
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold text-blue-900 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-blue-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  {currentDraftId
                    ? drafts.find(d => d.id === currentDraftId)?.name || 'Untitled Draft'
                    : 'New Draft'}
                  {isDraftDirty && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ml-1">Unsaved</span>}
                </div>

                {/* Unsaved Changes Prompt Modal/Popover */}
                {/* Unsaved Changes Prompt Modal/Popover - Fixed Overlay */}
                {showUnsavedPrompt && (
                  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                    <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 w-80 animate-in fade-in zoom-in-95 duration-200 relative">
                      <h4 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Unsaved Changes
                      </h4>
                      <p className="text-sm text-gray-600 mb-6">You have unsaved changes in this draft. What would you like to do?</p>
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={performSaveAsNew}
                          className="w-full text-left px-4 py-3 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                        >
                          Save as New Draft
                        </button>
                        {currentDraftId && (
                          <button
                            onClick={performUpdate}
                            className="w-full text-left px-4 py-3 text-sm font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-100"
                          >
                            Update Current Draft
                          </button>
                        )}
                        <button
                          onClick={performDiscard}
                          className="w-full text-left px-4 py-3 text-sm font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                        >
                          Discard Changes
                        </button>
                      </div>
                      {/* Close X */}
                      <button
                        onClick={() => { setShowUnsavedPrompt(false); setPendingNavigation(null); }}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
                      >
                        <Settings2 className="w-5 h-5 rotate-45" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewResolution("Month")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewResolution === "Month" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              Months
            </button>
            <button
              onClick={() => setViewResolution("Quarter")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewResolution === "Quarter" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              Quarters
            </button>
            <button
              onClick={() => setViewResolution("Year")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewResolution === "Year" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              Years
            </button>
          </div>
        </div>

        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          userEmail={userEmail}
          accessToken={accessToken}
        />

        <SaveDraftModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleSaveDraftConfirmed}
          initialName={`Draft ${new Date().toLocaleString()}`}
        />

        <div className="flex-grow p-1 overflow-hidden flex flex-col gap-6">
          <div className="flex h-full gap-6">
            <div className="flex-grow flex flex-col min-w-0">
              <div className="flex-grow bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col overflow-hidden relative">
                <div className="flex-grow overflow-hidden">
                  <PlanningGrid
                    viewMode={viewMode}
                    rowIds={viewMode === "Regulation" ? regulationsForUI : modelsForUI}
                    cellData={viewMode === "Regulation" ? activePlan.regulationCells : modelData}
                    isEditable={activeTab === "Draft"}
                    onCellChange={handleCellChange}
                    onCellClick={
                      activeTab === "Final" && viewMode === "Regulation" ? handleFinalCellClick : undefined
                    }
                    financialYears={years}
                    onDeleteRow={
                      activeTab === "Draft"
                        ? (viewMode === "Regulation" ? deleteRegulationDraftOnly : deleteModelDraftOnly)
                        : undefined
                    }
                    onRowReorder={
                      activeTab === "Draft"
                        ? (viewMode === "Regulation" ? handleDraftRegReorder : handleDraftModelReorder)
                        : undefined
                    }
                    layout={viewMode === "Regulation" ? activePlan.layout : undefined}
                    onLayoutChange={
                      activeTab === "Draft" && viewMode === "Regulation" ? handleLayoutChange : undefined
                    }
                    onRenameRow={
                      activeTab === "Draft" ? handleRenameRow : undefined
                    }
                    onAddRegulationFromDrag={
                      activeTab === "Draft" && viewMode === "Regulation" ? handleAddRegulationRow : undefined
                    }
                    onAddModelRowFromDrag={
                      activeTab === "Draft" && viewMode === "Model" ? handleAddModelRow : undefined
                    }
                    onAddModelToCell={
                      activeTab === "Draft" && viewMode === "Regulation" ? handleAddModelToCell : undefined
                    }
                    onAddRegulationToCell={
                      activeTab === "Draft" && viewMode === "Model" ? handleAddRegulationToCell : undefined
                    }
                    viewResolution={viewResolution}
                    highlightedModel={highlightedModel}
                    highlightedRegulation={highlightedRegulation}
                    itemColors={globalLibrary.colors}
                  />
                </div>
              </div>

              <DrillDownModal
                isOpen={activeTab === "Final" && selectedModels.length > 0}
                selectedModels={selectedModels}
                onClose={() => setSelectedModels([])}
                modelData={modelData}
                years={years}
              />
            </div>

            <ComplianceSidebar
              isOpen={rightSidebarOpen}
              regulations={regulationsForUI}
              validation={validationForSidebar}
              activeTab={activeTab}
              deleteRegulation={activeTab === "Draft" ? deleteRegulationDraftOnly : (() => { })}
              missingRegulations={missingRegulations}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
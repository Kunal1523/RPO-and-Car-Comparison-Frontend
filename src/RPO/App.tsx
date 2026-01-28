// // App.tsx
// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { useMsal } from "@azure/msal-react";
// import { NavTab, ViewMode, PlanData, Draft } from "./types";

// import {
//   deriveModelData,
//   validatePlanning,
//   getCellKey,
//   isModel,
//   getCurrentFinancialYears,
//   getUniqueModels,
//   getDraftRegList, // ✅ you added in utils
// } from "./utils";

// import PlanningGrid from "./components/PlanningGrid";
// import Sidebar from "./components/Sidebar";
// import Header from "./components/Header";
// import ComplianceSidebar from "./components/ComplianceSidebar";
// import DrillDownModal from "./components/DrillDownModal";
// import LoginPage from "./components/LoginPage";
// import ShareModal from "./components/ShareModal";
// import { getAllowedEmails } from "./authConfig";
// import { Settings2 } from "lucide-react";
// import { api } from "./apiService/api";

// const INITIAL_PLAN_DATA: PlanData = { regulationCells: {}, regOrder: [] };

// type FinalPlanResponse = {
//   publishedAt: number;
//   publishedBy?: string;
//   data: PlanData;
//   missingByReg?: Record<string, string[]>;
// };

// const stableStringify = (obj: any) => {
//   try {
//     const sorter = (_k: string, v: any) => {
//       if (v && typeof v === "object" && !Array.isArray(v)) {
//         return Object.keys(v)
//           .sort()
//           .reduce((acc: any, key) => {
//             acc[key] = v[key];
//             return acc;
//           }, {});
//       }
//       return v;
//     };
//     return JSON.stringify(obj, sorter);
//   } catch {
//     return JSON.stringify(obj);
//   }
// };

// const App: React.FC = () => {
//   // const { instance } = useMsal();
//   // const activeAccount = instance.getActiveAccount();
//   // const userEmail = activeAccount?.username?.toLowerCase() || "";
//   const { instance } = useMsal();
//   const activeAccount = instance.getActiveAccount();

//   const manualLoginUser = sessionStorage.getItem('manualLoginUser');
//   const manualUser = manualLoginUser ? JSON.parse(manualLoginUser) : null;
//   const userEmail = manualUser?.username || activeAccount?.username?.toLowerCase() || "";

//   const [activeTab, setActiveTab] = useState<NavTab>("Draft");
//   const [viewMode, setViewMode] = useState<ViewMode>("Regulation");
//   const [viewResolution, setViewResolution] = useState<"Month" | "Quarter" | "Year">("Month");

//   // Drafts (DB)
//   const [drafts, setDrafts] = useState<Draft[]>([]);
//   const [currentPlan, setCurrentPlan] = useState<PlanData>(INITIAL_PLAN_DATA);
//   const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

//   // Track "last saved" snapshot for unsaved indicator
//   const [lastSavedPlanSnapshot, setLastSavedPlanSnapshot] = useState<string>(
//     stableStringify(INITIAL_PLAN_DATA)
//   );

//   // Final (DB)
//   const [finalPlan, setFinalPlan] = useState<PlanData | null>(null);
//   const [finalModels, setFinalModels] = useState<string[]>([]);
//   const [finalCompliance, setFinalCompliance] = useState<Record<string, string[]>>({});

//   // Final regulations (from backend)
//   const [finalRegulations, setFinalRegulations] = useState<string[]>([]);

//   // Draft regulations (LOCAL ONLY, ORDERED using currentPlan.regOrder + cell keys)
//   const draftRegulations = useMemo(() => getDraftRegList(currentPlan), [currentPlan]);

//   // Regulation list used by UI depends on tab
//   const regulationsForUI = useMemo(
//     () => (activeTab === "Draft" ? draftRegulations : finalRegulations),
//     [activeTab, draftRegulations, finalRegulations]
//   );

//   const [newRegName, setNewRegName] = useState("");

//   // Final drilldown modal
//   const [selectedModels, setSelectedModels] = useState<string[]>([]);

//   // Share token
//   const [shareModalOpen, setShareModalOpen] = useState(false);
//   const [accessToken, setAccessToken] = useState("");

//   // Years
//   const [years] = useState(getCurrentFinancialYears());

//   // Sidebars
//   const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
//   const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

//   // Auth
//   const allowedEmails = getAllowedEmails();
//   const isAuthorized = allowedEmails.length > 0 ? allowedEmails.includes(userEmail) : true;

//   // -----------------------
//   // Unsaved indicator
//   // -----------------------
//   const isDraftDirty = useMemo(() => {
//     if (activeTab !== "Draft") return false;
//     return stableStringify(currentPlan) !== lastSavedPlanSnapshot;
//   }, [activeTab, currentPlan, lastSavedPlanSnapshot]);

//   // -----------------------
//   // Helpers
//   // -----------------------
//   const removeRegFromPlan = useCallback((plan: PlanData, reg: string): PlanData => {
//     const prefix = `${reg}|`;
//     const nextCells: Record<string, string[]> = {};
//     for (const [k, v] of Object.entries(plan.regulationCells || {})) {
//       if (!k.startsWith(prefix)) nextCells[k] = v;
//     }
//     const nextOrder = (plan.regOrder || []).filter((r) => r !== reg);
//     return { ...plan, regulationCells: nextCells, regOrder: nextOrder };
//   }, []);

//   // ensure a new regulation "appears" immediately by seeding an empty cell + adding to regOrder
//   const addRegulationDraftOnly = useCallback(() => {
//     const name = newRegName.trim();
//     if (!name) return;

//     setCurrentPlan((prev) => {
//       const cells = prev.regulationCells || {};
//       const seedKey = getCellKey(name, years[0].label, 4);

//       const nextCells = { ...cells };
//       if (!nextCells[seedKey]) nextCells[seedKey] = [];

//       const nextOrder = Array.from(new Set([...(prev.regOrder || []), name]));
//       return { ...prev, regulationCells: nextCells, regOrder: nextOrder };
//     });

//     setNewRegName("");
//   }, [newRegName, years]);

//   // Draft delete regulation: LOCAL ONLY
//   const deleteRegulationDraftOnly = useCallback(
//     (reg: string) => {
//       setCurrentPlan((prev) => removeRegFromPlan(prev, reg));
//     },
//     [removeRegFromPlan]
//   );

//   // Draft reorder: LOCAL ONLY (stored in currentPlan.regOrder and saved inside Draft row)
//   const handleDraftRegReorder = useCallback((newOrder: string[]) => {
//     setCurrentPlan((prev) => ({ ...prev, regOrder: newOrder }));
//   }, []);

//   // -----------------------
//   // Graph token for Share
//   // -----------------------
//   useEffect(() => {
//     if (!shareModalOpen || !instance || !activeAccount) return;

//     instance
//       .acquireTokenSilent({
//         scopes: ["Mail.Send", "User.Read", "User.Read.All"],
//         account: activeAccount,
//       })
//       .then((res) => setAccessToken(res.accessToken))
//       .catch(() => {
//         instance
//           .acquireTokenPopup({
//             scopes: ["Mail.Send", "User.Read", "User.Read.All"],
//             account: activeAccount,
//           })
//           .then((res) => setAccessToken(res.accessToken));
//       });
//   }, [shareModalOpen, instance, activeAccount]);

//   // -----------------------
//   // Load backend data
//   // -----------------------
//   useEffect(() => {
//     if (!userEmail) return;

//     const loadAll = async () => {
//       const [d, f, r, m] = await Promise.all([
//         api.fetchDrafts(userEmail).catch(() => []),
//         api.fetchFinalPlan(userEmail).catch(() => null as FinalPlanResponse | null),
//         api.fetchRegulations(userEmail).catch(() => []),
//         api.fetchModels(userEmail).catch(() => []),
//       ]);

//       setDrafts(d);
//       setFinalRegulations(Array.isArray(r) ? r : []);
//       setFinalModels(Array.isArray(m) ? m : []);

//       if (f) {
//         setFinalPlan(f.data);
//         setFinalCompliance(f.missingByReg || {});
//       } else {
//         setFinalPlan(null);
//         setFinalCompliance({});
//       }
//     };

//     loadAll();
//   }, [userEmail]);

//   // -----------------------
//   // Draft editing (state only)
//   // -----------------------
//   const handleCellChange = useCallback(
//     (rowId: string, year: string, month: number, value: string) => {
//       setCurrentPlan((prev) => {
//         const key = getCellKey(rowId, year, month);
//         const newValues = value
//           .split(",")
//           .map((v) => v.trim())
//           .filter(Boolean);

//         return {
//           ...prev,
//           regulationCells: {
//             ...prev.regulationCells,
//             [key]: newValues,
//           },
//         };
//       });
//     },
//     []
//   );

//   const handleRenameRow = useCallback((oldName: string, newName: string) => {
//     // 1. Check duplicate
//     setCurrentPlan((prev) => {
//       const existing = prev.regOrder || [];
//       if (existing.includes(newName)) {
//         alert(`Regulation "${newName}" already exists.`);
//         return prev;
//       }

//       // 2. Update regOrder
//       const newOrder = existing.map(r => r === oldName ? newName : r);

//       // 3. Update cells
//       const newCells: Record<string, string[]> = {};
//       const oldPrefix = `${oldName}|`;
//       const newPrefix = `${newName}|`;

//       const cells: Record<string, string[]> = prev.regulationCells || {};
//       for (const [k, v] of Object.entries(cells)) {
//         if (k.startsWith(oldPrefix)) {
//           // Replace prefix
//           const suffix = k.substring(oldPrefix.length);
//           newCells[newPrefix + suffix] = v;
//         } else {
//           newCells[k] = v;
//         }
//       }

//       // 4. Update row heights (layout)
//       const newRowHeights: Record<string, number> = { ...(prev.layout?.rowHeights || {}) };
//       if (newRowHeights[oldName]) {
//         newRowHeights[newName] = newRowHeights[oldName];
//         delete newRowHeights[oldName];
//       }

//       return {
//         ...prev,
//         regOrder: newOrder,
//         regulationCells: newCells,
//         layout: {
//           ...prev.layout,
//           rowHeights: newRowHeights,
//           colWidths: prev.layout?.colWidths || {}
//         }
//       };
//     });
//   }, []);

//   // Layout change helper (updates current draft state only, saves when user clicks Save)
//   const handleLayoutChange = useCallback(
//     (colWidths: Record<string, number>, rowHeights: Record<string, number>) => {
//       // Avoid spamming state updates if no change (checking reference equality handled by caller usually, but good practice)
//       setCurrentPlan((prev) => ({
//         ...prev,
//         layout: { colWidths, rowHeights },
//       }));
//     },
//     []
//   );

//   // -----------------------
//   // Active plan per tab
//   // -----------------------
//   const activePlan: PlanData = activeTab === "Draft" ? currentPlan : finalPlan || INITIAL_PLAN_DATA;

//   // -----------------------
//   // Models per tab
//   // -----------------------
//   const draftModels = useMemo(() => getUniqueModels(currentPlan), [currentPlan]);
//   const modelsForUI = activeTab === "Draft" ? draftModels : finalModels;

//   const modelData = useMemo(() => {
//     return deriveModelData(activePlan, modelsForUI);
//   }, [activePlan, modelsForUI]);

//   // -----------------------
//   // Compliance
//   // -----------------------
//   const draftCompliance = useMemo(() => {
//     return validatePlanning(currentPlan, draftRegulations, draftModels);
//   }, [currentPlan, draftRegulations, draftModels]);

//   const validationForSidebar = activeTab === "Final" ? finalCompliance : draftCompliance;

//   // -----------------------
//   // Draft save/update (updates current draft if currentDraftId exists)
//   // -----------------------
//   const saveDraft = async () => {
//     if (!userEmail) return;

//     const draftId = currentDraftId || crypto.randomUUID();

//     const payload: Draft = {
//       id: draftId,
//       name: currentDraftId
//         ? `Draft (updated) ${new Date().toLocaleString()}`
//         : `Draft ${new Date().toLocaleString()}`,
//       updatedAt: Date.now(),
//       data: { ...currentPlan },
//     };

//     try {
//       const saved = await api.saveDraft(payload, userEmail);

//       setCurrentDraftId(saved.id);
//       setLastSavedPlanSnapshot(stableStringify(saved.data));

//       setDrafts((prev) => {
//         const idx = prev.findIndex((x) => x.id === saved.id);
//         if (idx >= 0) {
//           const copy = [...prev];
//           copy[idx] = saved;
//           copy.sort((a, b) => b.updatedAt - a.updatedAt);
//           return copy;
//         }
//         return [saved, ...prev];
//       });
//     } catch (e) {
//       console.error(e);
//       alert("Failed to save draft");
//     }
//   };

//   // ✅ Save as NEW draft (always creates new row)
//   const saveDraftAsNew = async () => {
//     if (!userEmail) return;

//     const draftId = crypto.randomUUID();
//     const payload: Draft = {
//       id: draftId,
//       name: `Draft ${new Date().toLocaleString()}`,
//       updatedAt: Date.now(),
//       data: { ...currentPlan },
//     };

//     try {
//       const saved = await api.saveDraft(payload, userEmail);

//       setCurrentDraftId(saved.id);
//       setLastSavedPlanSnapshot(stableStringify(saved.data));

//       setDrafts((prev) => {
//         const next = [saved, ...prev];
//         next.sort((a, b) => b.updatedAt - a.updatedAt);
//         return next;
//       });
//     } catch (e) {
//       console.error(e);
//       alert("Failed to save draft");
//     }
//   };

//   const loadDraft = (draft: Draft) => {
//     setCurrentPlan(draft.data);
//     setCurrentDraftId(draft.id);
//     setLastSavedPlanSnapshot(stableStringify(draft.data));
//     setActiveTab("Draft");
//     setViewMode("Regulation");
//   };

//   const deleteDraft = async (id: string) => {
//     if (!userEmail) return;
//     try {
//       await api.deleteDraft(id, userEmail);
//       setDrafts((prev) => prev.filter((d) => d.id !== id));

//       if (currentDraftId === id) {
//         setCurrentPlan(INITIAL_PLAN_DATA);
//         setCurrentDraftId(null);
//         setLastSavedPlanSnapshot(stableStringify(INITIAL_PLAN_DATA));
//       }
//     } catch (e) {
//       console.error(e);
//       alert("Failed to delete draft");
//     }
//   };

//   const clearDraft = () => {
//     if (!window.confirm("Are you sure you want to clear all data in the cells? Rows and layout will be preserved.")) return;

//     const clearedPlan: PlanData = {
//       ...currentPlan,
//       regulationCells: {},
//     };

//     setCurrentPlan(clearedPlan);
//     setCurrentDraftId(null);
//     setLastSavedPlanSnapshot(stableStringify(clearedPlan));
//   };

//   // -----------------------
//   // Publish
//   // -----------------------
//   const publishToFinal = async () => {
//     if (!userEmail) return;

//     // Sync Regulations and Models to DB
//     try {
//       // 1. Fetch current lists
//       const [existingRegs, existingModels] = await Promise.all([
//         api.fetchRegulations(userEmail).catch(() => [] as string[]),
//         api.fetchModels(userEmail).catch(() => [] as string[])
//       ]);

//       const currentRegs = new Set(existingRegs);
//       const currentModels = new Set(existingModels);

//       const draftRegs = getDraftRegList(currentPlan);
//       const draftModelsList = getUniqueModels(currentPlan);

//       // 2. Add missing regs
//       const regsToAdd = draftRegs.filter(r => !currentRegs.has(r));
//       if (regsToAdd.length > 0) {
//         await Promise.all(regsToAdd.map(r => api.addRegulation(r, userEmail)));
//       }

//       // 3. Add missing models
//       const modelsToAdd = draftModelsList.filter(m => !currentModels.has(m));
//       if (modelsToAdd.length > 0) {
//         await Promise.all(modelsToAdd.map(m => api.addModel(m, userEmail)));
//       }

//     } catch (e) {
//       console.error("Error syncing Master Lists:", e);
//       // Continue to publish anyway? User might expect sync. 
//       // If sync fails, plan might refer to non-existent master items if backend enforces referential integrity.
//       // Assuming loose coupling, we proceed but log.
//     }

//     const plan = { publishedAt: Date.now(), data: currentPlan };

//     try {
//       await api.publishFinalPlan(plan, userEmail);

//       const f = await api.fetchFinalPlan(userEmail);
//       if (f) {
//         setFinalPlan(f.data);
//         setFinalCompliance(f.missingByReg || {});
//       } else {
//         setFinalPlan(null);
//         setFinalCompliance({});
//       }

//       // Re-fetch master lists to ensure UI is in sync
//       const [m, r] = await Promise.all([
//         api.fetchModels(userEmail).catch(() => []),
//         api.fetchRegulations(userEmail).catch(() => []),
//       ]);

//       setFinalModels(Array.isArray(m) ? m : []);
//       setFinalRegulations(Array.isArray(r) ? r : []);

//       setActiveTab("Final");
//       setViewMode("Regulation");
//     } catch (e) {
//       console.error(e);
//       alert("Failed to publish plan");
//     }
//   };

//   // Copy Final -> Draft: create NEW draft when saved
//   const copyToDraft = () => {
//     if (!finalPlan) return;
//     setCurrentPlan(JSON.parse(JSON.stringify(finalPlan)));
//     setCurrentDraftId(null);
//     setLastSavedPlanSnapshot(stableStringify(INITIAL_PLAN_DATA)); // new unsaved draft
//     setActiveTab("Draft");
//     setViewMode("Regulation");
//   };

//   // -----------------------
//   // Regulation add
//   // Draft-only local add (Final tab does nothing)
//   // -----------------------
//   const addRegulation = () => {
//     if (activeTab === "Draft") {
//       addRegulationDraftOnly();
//       return;
//     }
//     setNewRegName("");
//   };

//   // Final cell click -> drilldown only for models in frozen models list
//   const handleFinalCellClick = (rowId: string, values: string[]) => {
//     const onlyModels = values.map((v) => String(v || "").trim()).filter((v) => isModel(v));
//     const allowed = new Set(finalModels.map((m) => (m || "").trim()).filter(Boolean));
//     const filtered = onlyModels.filter((m) => allowed.has(m));
//     if (filtered.length > 0) setSelectedModels(filtered);
//   };

//   // Export
//   const handleDownloadExcel = () => {
//     const rowIds = viewMode === "Regulation" ? regulationsForUI : modelsForUI;
//     const cellData = viewMode === "Regulation" ? activePlan.regulationCells : modelData;

//     const now = new Date();
//     const dateStr = now.toISOString().split("T")[0];
//     const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
//     const fileName = `ReguPlan_${activeTab}_${viewMode}_${dateStr}_${timeStr}`;

//     import("./exportUtils").then((module) => {
//       module.exportToExcel(viewMode, rowIds, cellData, years, fileName);
//     });
//   };

//   // -----------------------
//   // Auth guard
//   // -----------------------
//   // if (!activeAccount) return <LoginPage />;
//   if (!activeAccount && !manualUser) return <LoginPage />;

//   if (!isAuthorized) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
//         <div className="p-8 bg-white rounded-xl shadow-lg border border-red-100 text-center max-w-md">
//           <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
//             <Settings2 className="w-6 h-6 text-red-600" />
//           </div>
//           <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
//           <p className="text-gray-600 mb-6">
//             The account{" "}
//             <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{userEmail}</span>{" "}
//             is not authorized to access this application.
//           </p>
//           <button
//             onClick={() => instance.logoutPopup()}
//             className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-medium"
//           >
//             Sign Out
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // -----------------------
//   // UI
//   // -----------------------
//   return (
//     <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans">
//       <Sidebar
//         isOpen={leftSidebarOpen}
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         setSelectedModels={setSelectedModels}
//         drafts={drafts}
//         loadDraft={loadDraft}
//         deleteDraft={deleteDraft}
//         newRegName={newRegName}
//         setNewRegName={setNewRegName}
//         addRegulation={addRegulation}
//         user={{
//           name: manualUser?.name || activeAccount?.name || "User",
//           username: manualUser?.username || activeAccount?.username || "",
//         }}
//         onLogout={() => {
//           if (manualUser) {
//             sessionStorage.removeItem('manualLoginUser');
//             window.location.reload();
//           } else {
//             instance.logoutPopup();
//           }
//         }}
//       />

//       <main className="flex-grow flex flex-col overflow-hidden relative">
//         <Header
//           leftSidebarOpen={leftSidebarOpen}
//           setLeftSidebarOpen={setLeftSidebarOpen}
//           rightSidebarOpen={rightSidebarOpen}
//           setRightSidebarOpen={setRightSidebarOpen}
//           activeTab={activeTab}
//           viewMode={viewMode}
//           setViewMode={setViewMode}
//           handleDownloadExcel={handleDownloadExcel}
//           copyToDraft={copyToDraft}
//           clearDraft={clearDraft}
//           saveDraft={saveDraft}
//           saveDraftAsNew={saveDraftAsNew} // ✅ NEW for split-button option
//           publishToFinal={publishToFinal}
//           onShare={() => setShareModalOpen(true)}
//           isDraftDirty={activeTab === "Draft" && isDraftDirty}
//         />

//         <div className="px-6 pt-2 pb-0 flex items-center justify-center">
//           <div className="flex bg-gray-100 p-1 rounded-lg">
//             <button
//               onClick={() => setViewResolution("Month")}
//               className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewResolution === "Month" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
//             >
//               Months
//             </button>
//             <button
//               onClick={() => setViewResolution("Quarter")}
//               className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewResolution === "Quarter" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
//             >
//               Quarters
//             </button>
//             <button
//               onClick={() => setViewResolution("Year")}
//               className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewResolution === "Year" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
//             >
//               Years
//             </button>
//           </div>
//         </div>

//         <ShareModal
//           isOpen={shareModalOpen}
//           onClose={() => setShareModalOpen(false)}
//           userEmail={userEmail}
//           accessToken={accessToken}
//         />

//         <div className="flex-grow p-1  overflow-hidden flex flex-col gap-6">
//           <div className="flex h-full gap-6">
//             <div className="flex-grow flex flex-col min-w-0">
//               <div className="flex-grow bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col overflow-hidden relative">
//                 <div className="flex-grow overflow-hidden">
//                   <PlanningGrid
//                     viewMode={viewMode}
//                     rowIds={viewMode === "Regulation" ? regulationsForUI : modelsForUI}
//                     cellData={viewMode === "Regulation" ? activePlan.regulationCells : modelData}
//                     isEditable={activeTab === "Draft" && viewMode === "Regulation"}
//                     onCellChange={handleCellChange}
//                     onCellClick={
//                       activeTab === "Final" && viewMode === "Regulation" ? handleFinalCellClick : undefined
//                     }
//                     financialYears={years}
//                     onDeleteRow={
//                       activeTab === "Draft" && viewMode === "Regulation" ? deleteRegulationDraftOnly : undefined
//                     }
//                     // ✅ Draft reorder enabled and stored in draft (regOrder)
//                     onRowReorder={
//                       activeTab === "Draft" && viewMode === "Regulation" ? handleDraftRegReorder : undefined
//                     }
//                     layout={viewMode === "Regulation" ? activePlan.layout : undefined}
//                     onLayoutChange={
//                       activeTab === "Draft" && viewMode === "Regulation" ? handleLayoutChange : undefined
//                     }
//                     onRenameRow={
//                       activeTab === "Draft" && viewMode === "Regulation" ? handleRenameRow : undefined
//                     }
//                     viewResolution={viewResolution}
//                   />
//                 </div>
//               </div>

//               <DrillDownModal
//                 isOpen={activeTab === "Final" && selectedModels.length > 0}
//                 selectedModels={selectedModels}
//                 onClose={() => setSelectedModels([])}
//                 modelData={modelData}
//                 years={years}
//               />
//             </div>

//             <ComplianceSidebar
//               isOpen={rightSidebarOpen}
//               regulations={regulationsForUI}
//               validation={validationForSidebar}
//               activeTab={activeTab}
//               deleteRegulation={activeTab === "Draft" ? deleteRegulationDraftOnly : (() => { })}
//             />
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default App;






// App.tsx - Fixed for backend OAuth
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
} from "./utils/utils";

import PlanningGrid from "./components/PlanningGrid";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ComplianceSidebar from "./components/ComplianceSidebar";
import DrillDownModal from "./components/DrillDownModal";
import LoginPage from "./components/LoginPage";
import ShareModal from "./components/ShareModal";
import { getAllowedEmails, BACKEND_BASE_URL } from "./authConfig";
import { Settings2 } from "lucide-react";
import { api } from "./apiService/api";

const INITIAL_PLAN_DATA: PlanData = { regulationCells: {}, regOrder: [] };

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
      return v;
    };
    return JSON.stringify(obj, sorter);
  } catch {
    return JSON.stringify(obj);
  }
};

const App: React.FC = () => {
  // ✅ Auth state (no MSAL)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
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
  const regulationsForUI = useMemo(
    () => (activeTab === "Draft" ? draftRegulations : finalRegulations),
    [activeTab, draftRegulations, finalRegulations]
  );

  const [newRegName, setNewRegName] = useState("");

  // Final drilldown modal
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // Share token
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [accessToken, setAccessToken] = useState("");

  // Years
  const [years] = useState(getCurrentFinancialYears());

  // Sidebars
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

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
      const [d, f, r, m] = await Promise.all([
        api.fetchDrafts(userEmail).catch(() => []),
        api.fetchFinalPlan(userEmail).catch(() => null as FinalPlanResponse | null),
        api.fetchRegulations(userEmail).catch(() => []),
        api.fetchModels(userEmail).catch(() => []),
      ]);

      setDrafts(d);
      setFinalRegulations(Array.isArray(r) ? r : []);
      setFinalModels(Array.isArray(m) ? m : []);

      if (f) {
        setFinalPlan(f.data);
        setFinalCompliance(f.missingByReg || {});
      } else {
        setFinalPlan(null);
        setFinalCompliance({});
      }
    };

    loadAll();
  }, [userEmail]);

  // -----------------------
  // Draft editing (state only)
  // -----------------------
  const handleCellChange = useCallback(
    (rowId: string, year: string, month: number, value: string) => {
      setCurrentPlan((prev) => {
        const key = getCellKey(rowId, year, month);
        const newValues = value
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);

        return {
          ...prev,
          regulationCells: {
            ...prev.regulationCells,
            [key]: newValues,
          },
        };
      });
    },
    []
  );

  const handleRenameRow = useCallback((oldName: string, newName: string) => {
    setCurrentPlan((prev) => {
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
    });
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

  // -----------------------
  // Active plan per tab
  // -----------------------
  const activePlan: PlanData = activeTab === "Draft" ? currentPlan : finalPlan || INITIAL_PLAN_DATA;

  // -----------------------
  // Models per tab
  // -----------------------
  const draftModels = useMemo(() => getUniqueModels(currentPlan), [currentPlan]);
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

    const payload: Draft = {
      id: draftId,
      name: currentDraftId
        ? `Draft (updated) ${new Date().toLocaleString()}`
        : `Draft ${new Date().toLocaleString()}`,
      updatedAt: Date.now(),
      data: { ...currentPlan },
    };

    try {
      const saved = await api.saveDraft(payload, userEmail);

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

  const saveDraftAsNew = async () => {
    if (!userEmail) return;

    const draftId = crypto.randomUUID();
    const payload: Draft = {
      id: draftId,
      name: `Draft ${new Date().toLocaleString()}`,
      updatedAt: Date.now(),
      data: { ...currentPlan },
    };

    try {
      const saved = await api.saveDraft(payload, userEmail);

      setCurrentDraftId(saved.id);
      setLastSavedPlanSnapshot(stableStringify(saved.data));

      setDrafts((prev) => {
        const next = [saved, ...prev];
        next.sort((a, b) => b.updatedAt - a.updatedAt);
        return next;
      });
    } catch (e) {
      console.error(e);
      alert("Failed to save draft");
    }
  };

  const loadDraft = (draft: Draft) => {
    setCurrentPlan(draft.data);
    setCurrentDraftId(draft.id);
    setLastSavedPlanSnapshot(stableStringify(draft.data));
    setActiveTab("Draft");
    setViewMode("Regulation");
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

  const clearDraft = () => {
    if (!window.confirm("Are you sure you want to clear all data in the cells? Rows and layout will be preserved.")) return;

    const clearedPlan: PlanData = {
      ...currentPlan,
      regulationCells: {},
    };

    setCurrentPlan(clearedPlan);
    setCurrentDraftId(null);
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
        setActiveTab={setActiveTab}
        setSelectedModels={setSelectedModels}
        drafts={drafts}
        loadDraft={loadDraft}
        deleteDraft={deleteDraft}
        newRegName={newRegName}
        setNewRegName={setNewRegName}
        addRegulation={addRegulation}
        user={{
          name: userName,
          username: userEmail,
        }}
        onLogout={handleLogout}
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

        <div className="px-6 pt-2 pb-0 flex items-center justify-center">
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

        <div className="flex-grow p-1 overflow-hidden flex flex-col gap-6">
          <div className="flex h-full gap-6">
            <div className="flex-grow flex flex-col min-w-0">
              <div className="flex-grow bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col overflow-hidden relative">
                <div className="flex-grow overflow-hidden">
                  <PlanningGrid
                    viewMode={viewMode}
                    rowIds={viewMode === "Regulation" ? regulationsForUI : modelsForUI}
                    cellData={viewMode === "Regulation" ? activePlan.regulationCells : modelData}
                    isEditable={activeTab === "Draft" && viewMode === "Regulation"}
                    onCellChange={handleCellChange}
                    onCellClick={
                      activeTab === "Final" && viewMode === "Regulation" ? handleFinalCellClick : undefined
                    }
                    financialYears={years}
                    onDeleteRow={
                      activeTab === "Draft" && viewMode === "Regulation" ? deleteRegulationDraftOnly : undefined
                    }
                    onRowReorder={
                      activeTab === "Draft" && viewMode === "Regulation" ? handleDraftRegReorder : undefined
                    }
                    layout={viewMode === "Regulation" ? activePlan.layout : undefined}
                    onLayoutChange={
                      activeTab === "Draft" && viewMode === "Regulation" ? handleLayoutChange : undefined
                    }
                    onRenameRow={
                      activeTab === "Draft" && viewMode === "Regulation" ? handleRenameRow : undefined
                    }
                    viewResolution={viewResolution}
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
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
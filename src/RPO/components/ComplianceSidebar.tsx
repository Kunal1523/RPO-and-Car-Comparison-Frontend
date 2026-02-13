import React from "react";
import { NavTab } from "../utils/types";
import { AlertCircle, CheckCircle, X } from "lucide-react";
import { stringToColor } from "../utils/utils";

interface ComplianceSidebarProps {
  isOpen: boolean;
  regulations: string[];
  validation: Record<string, string[]>;
  activeTab: NavTab;
  deleteRegulation?: (reg: string) => void;
  missingRegulations?: string[]; // Regulations in sidebar list but NOT in table data
  // New props for status
  archivedRegulations?: string[];
  archivedModels?: string[];
  allActiveRegulations?: string[];
  allActiveModels?: string[];
}

const ComplianceSidebar: React.FC<ComplianceSidebarProps> = ({
  isOpen,
  regulations,
  validation,
  activeTab,
  deleteRegulation,
  missingRegulations = [],
  archivedRegulations = [],
  archivedModels = [],
  allActiveRegulations = [],
  allActiveModels = [],
}) => {
  const norm = (s: string) => (s || "").replace(/\s+/g, ' ').trim().toLowerCase();

  const getStatus = (name: string, type: 'model' | 'reg') => {
    const n = norm(name);
    const archived = type === 'reg' ? archivedRegulations : archivedModels;
    const active = type === 'reg' ? allActiveRegulations : allActiveModels;

    const isArchived = archived.some(a => norm(a) === n);
    const isActive = active.some(a => norm(a) === n);

    if (isArchived) return 'archived';
    if (!isActive) return 'deleted';
    return 'active';
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl flex flex-col shadow-sm transition-all duration-300 ease-in-out ${isOpen ? "w-80 p-5 opacity-100" : "w-0 p-0 opacity-0 overflow-hidden border-none"
        }`}
    >
      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2 uppercase tracking-tighter whitespace-nowrap">
        <AlertCircle className="w-4 h-4 text-orange-500" />
        Compliance Tracking
      </h3>

      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {regulations.map((reg) => {
          const missing = validation[reg] || [];
          const isDone = missing.length === 0;

          return (
            <div
              key={reg}
              className={`group relative rounded-lg p-3 border ${isDone ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"
                }`}
            >
              {/* ✅ Delete only in FINAL tab */}
              {activeTab === "Final" && deleteRegulation && (
                <button
                  onClick={() => deleteRegulation(reg)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-white rounded shadow-sm text-gray-400 hover:text-red-500 transition-all z-10"
                  title="Delete Regulation"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              <div className="flex items-start justify-between mb-1 gap-2">
                <span className="font-bold text-sm text-gray-700 leading-tight" title={reg}>{reg}</span>
                {isDone ? (
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold uppercase shrink-0 mt-0.5">
                    Incomplete
                  </span>
                )}
              </div>

              {/* Status Badges Row */}
              <div className="flex flex-wrap gap-1 mb-2">
                {(() => {
                  const status = getStatus(reg, 'reg');
                  const isMissingFromTable = missingRegulations.some(m => norm(m) === norm(reg));

                  const badges = [];
                  if (status === 'archived') badges.push(<span key="archived" className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold" title="Archived">ARCHIVED</span>);
                  if (status === 'deleted') badges.push(<span key="deleted" className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold" title="Permanently Deleted">DELETED</span>);
                  if (activeTab === "Draft" && isMissingFromTable) badges.push(<span key="notinuse" className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold" title="Not yet added to draft grid">NOT IN USE</span>);

                  return badges;
                })()}
              </div>

              {!isDone && (
                <div className="mt-2">
                  <p className="text-[10px] text-gray-500 mb-1 font-medium">Compliance Issues:</p>
                  <div className="flex flex-wrap gap-1">
                    {missing.map((m) => (
                      <span
                        key={m}
                        className="px-1.5 py-0.5 border border-gray-200 text-gray-900 text-[9px] font-bold rounded shadow-sm"
                        style={{ backgroundColor: stringToColor(m) }}
                      >
                        {m}
                        {(() => {
                          const status = getStatus(m, 'model');
                          if (status === 'archived') return <span className="ml-1 text-[8px] text-amber-600">(A)</span>;
                          if (status === 'deleted') return <span className="ml-1 text-[8px] text-red-600">(D)</span>;
                          return null;
                        })()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 whitespace-nowrap">
        {/* Box removed - now showing as 'NOT IN USE' badges in the list above */}
      </div>
    </div>
  );
};

export default ComplianceSidebar;

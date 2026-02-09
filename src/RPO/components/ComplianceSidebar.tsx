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
}

const ComplianceSidebar: React.FC<ComplianceSidebarProps> = ({
  isOpen,
  regulations,
  validation,
  activeTab,
  deleteRegulation,
  missingRegulations = [],
}) => {
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

              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-gray-700 truncate mr-2">{reg}</span>
                {isDone ? (
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                    Incomplete
                  </span>
                )}
              </div>

              {!isDone && (
                <div className="mt-2">
                  <p className="text-[10px] text-gray-500 mb-1 font-medium">Missing Models:</p>
                  <div className="flex flex-wrap gap-1">
                    {missing.map((m) => (
                      <span
                        key={m}
                        className="px-1.5 py-0.5 border border-gray-200 text-gray-900 text-[9px] font-bold rounded shadow-sm"
                        style={{ backgroundColor: stringToColor(m) }}
                      >
                        {m}
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
        {/* Missing Regulations Box (Draft Only) */}
        {activeTab === "Draft" && missingRegulations.length > 0 && (
          <div className="mt-1">
            <h4 className="text-[10px] text-gray-400 uppercase font-black mb-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-red-500" />
              Missing Regulations
            </h4>
            <div className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 space-y-1">
              <p className="font-medium mb-1">Not used in plan:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {missingRegulations.map(r => (
                  <li key={r} className="truncate">{r}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceSidebar;

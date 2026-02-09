// components/Header.tsx
import React from "react";
import { NavTab, ViewMode } from "../utils/types";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Download,
  Copy,
  Eraser,
  Plus,
  Save,
  PanelRightClose,
  PanelRightOpen,
  ChevronDown,
} from "lucide-react";

interface HeaderProps {
  leftSidebarOpen: boolean;
  setLeftSidebarOpen: (open: boolean) => void;
  rightSidebarOpen: boolean;
  setRightSidebarOpen: (open: boolean) => void;
  activeTab: NavTab;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  handleDownloadExcel: () => void;
  copyToDraft: () => void;
  clearDraft: () => void;
  saveDraft: () => void;
  saveDraftAsNew: () => void;
  publishToFinal: () => void;
  onShare: () => void;
  isDraftDirty?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  leftSidebarOpen,
  setLeftSidebarOpen,
  rightSidebarOpen,
  setRightSidebarOpen,
  activeTab,
  viewMode,
  setViewMode,
  handleDownloadExcel,
  copyToDraft,
  clearDraft,
  saveDraft,
  saveDraftAsNew,
  publishToFinal,
  onShare,
  isDraftDirty = false,
}) => {
  const [draftMenuOpen, setDraftMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!draftMenuOpen) return;

    const onDown = (e: MouseEvent) => {
      if (!menuRef.current) return;
      const target = e.target as Node;
      if (!menuRef.current.contains(target)) setDraftMenuOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDraftMenuOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [draftMenuOpen]);

  return (
    <header className="h-16 bg-gradient-to-r from-blue-900 to-blue-900 flex items-center justify-between px-6 shrink-0 shadow-lg z-50">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
          className="p-2 text-white hover:bg-white/10 rounded-lg transition-all"
          title={leftSidebarOpen ? "Close sidebar" : "Open sidebar"}
          type="button"
        >
          {leftSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5" />
          ) : (
            <PanelLeftOpen className="w-5 h-5" />
          )}
        </button>

        <h2 className="text-lg font-bold text-white hidden sm:block drop-shadow-sm">
          {activeTab === "Draft" ? "Draft Workspace" : "Final Planning"}
        </h2>

        <div className="flex items-center bg-white/10 backdrop-blur-sm p-1 rounded-lg ml-1 border border-white/20">
          <button
            onClick={() => setViewMode("Regulation")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === "Regulation"
              ? "bg-white text-blue-700 shadow-md"
              : "text-white hover:bg-white/10"
              }`}
            type="button"
          >
            REGULATION VIEW
          </button>
          <button
            onClick={() => setViewMode("Model")}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === "Model"
              ? "bg-white text-blue-700 shadow-md"
              : "text-white hover:bg-white/10"
              }`}
            type="button"
          >
            MODEL VIEW
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Unsaved indicator */}
        {/* {activeTab === "Draft" && isDraftDirty && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-100 text-amber-800 border border-amber-300 shadow-sm"
            title="You have unsaved draft changes"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            UNSAVED
          </div>
        )} */}

        <button
          onClick={handleDownloadExcel}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 rounded-lg transition-all shadow-sm border border-white/20"
          title="Download Current View as Excel"
          type="button"
        >
          <Download className="w-4 h-4" />
          EXPORT
        </button>

        {activeTab === "Final" && (
          <>
            <button
              onClick={onShare}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-purple-700 bg-white hover:bg-purple-50 rounded-lg transition-all shadow-sm border border-white/20"
              type="button"
            >
              <span className="w-4 h-4">✉️</span>
              SHARE
            </button>

            <button
              onClick={copyToDraft}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 rounded-lg transition-all shadow-sm border border-white/20"
              type="button"
            >
              <Copy className="w-4 h-4" />
              COPY TO DRAFT
            </button>
          </>
        )}

        {activeTab === "Draft" && (
          <>
            <button
              onClick={clearDraft}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-700 bg-white hover:bg-red-50 rounded-lg transition-all shadow-sm border border-white/20"
              title="Clear all inputs"
              type="button"
            >
              <Eraser className="w-4 h-4" />
              CLEAR
            </button>

            {/* Split-button */}
            <div className="relative" ref={menuRef}>
              <div className="inline-flex rounded-lg overflow-hidden shadow-sm border border-white/20">
                <button
                  onClick={() => {
                    setDraftMenuOpen(false);
                    saveDraft();
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 transition-all"
                  type="button"
                  title="Save Draft"
                >
                  <Plus className="w-4 h-4" />
                  DRAFT
                </button>

                <button
                  onClick={() => setDraftMenuOpen((v) => !v)}
                  className="px-2 py-1.5 text-blue-700 bg-white hover:bg-blue-50 transition-all border-l border-blue-200"
                  type="button"
                  title="More draft options"
                  aria-haspopup="menu"
                  aria-expanded={draftMenuOpen}
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {draftMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-[80] overflow-hidden"
                  role="menu"
                >
                  <button
                    onClick={() => {
                      setDraftMenuOpen(false);
                      saveDraft();
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    type="button"
                    role="menuitem"
                  >
                    Save (update current)
                  </button>

                  <button
                    onClick={() => {
                      setDraftMenuOpen(false);
                      saveDraftAsNew();
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors border-t border-gray-100"
                    type="button"
                    role="menuitem"
                  >
                    Save as new draft
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={publishToFinal}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded-lg shadow-md transition-all hover:shadow-lg"
              type="button"
              title="Publish to Final"
            >
              <Save className="w-4 h-4" />
              PUBLISH
            </button>
          </>
        )}

        <button
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          className={`p-2 rounded-lg transition-all ${rightSidebarOpen
            ? "bg-white text-blue-700 shadow-sm"
            : "text-white hover:bg-white/10"
            }`}
          title="Toggle Status Panel"
          type="button"
        >
          {rightSidebarOpen ? (
            <PanelRightClose className="w-5 h-5" />
          ) : (
            <PanelRightOpen className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
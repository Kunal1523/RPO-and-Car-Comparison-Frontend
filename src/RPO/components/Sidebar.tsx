import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NavTab, Draft } from '../utils/types';
import { stringToColor } from '../utils/utils';
import {
    CheckCircle,
    FileText,
    Plus,
    Trash2,
    LogOut,
    ArrowLeft,
    Pencil,
    X,
    Check,
    Archive,
    RotateCcw
} from 'lucide-react';
import Logo from '../Images/amlgolabslogowhite.png';

interface SidebarProps {
    isOpen: boolean;
    activeTab: NavTab;
    setActiveTab: (tab: NavTab) => void;
    setSelectedModels: (models: string[]) => void;
    drafts: Draft[];
    loadDraft: (draft: Draft) => void;
    deleteDraft: (id: string) => void;
    newRegName: string;
    setNewRegName: (name: string) => void;
    addRegulation: () => void;
    user: {
        name: string;
        username: string;
    };
    onLogout: () => void;
    // New props for custom lists and renaming
    customModels: string[];
    customRegulations: string[];
    onUpdateCustomLists: (models: string[], regs: string[]) => void;
    renameDraft: (id: string, newName: string) => void;
    // NEW: Deletion prevention and rename cascade
    isModelInUse: (modelName: string) => boolean;
    isRegulationInUse: (regName: string) => boolean;
    onRenameModel: (oldName: string, newName: string) => void;
    onRenameRegulation: (oldName: string, newName: string) => void;
    // NEW: Highlighting
    highlightedModel: string | null;
    highlightedRegulation: string | null;
    setHighlightedModel: (model: string | null) => void;
    setHighlightedRegulation: (reg: string | null) => void;
    // NEW: Colors
    itemColors: Record<string, string>;
    onSetItemColor: (name: string, color: string) => void;
    // NEW: Active draft highlighting
    currentDraftId: string | null;
    onNewDraft: () => void;
    // NEW: Archiving
    archivedModels: string[];
    archivedRegulations: string[];
    onArchiveModel: (name: string) => void;
    onArchiveRegulation: (name: string) => void;
    onRestoreModel: (name: string) => void;
    onRestoreRegulation: (name: string) => void;
    onPermanentDeleteModel: (name: string) => void;
    onPermanentDeleteRegulation: (name: string) => void;
    onAddMasterModel: (name: string) => void;
    onAddMasterRegulation: (name: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    activeTab,
    setActiveTab,
    setSelectedModels,
    drafts,
    loadDraft,
    deleteDraft,
    newRegName,
    setNewRegName,
    addRegulation,
    user,
    onLogout,
    customModels = [],
    customRegulations = [],
    onUpdateCustomLists,
    renameDraft,
    isModelInUse,
    isRegulationInUse,
    onRenameModel,
    onRenameRegulation,
    highlightedModel,
    highlightedRegulation,
    setHighlightedModel,
    setHighlightedRegulation,
    itemColors,
    onSetItemColor,
    currentDraftId,
    onNewDraft,
    archivedModels = [],
    archivedRegulations = [],
    onArchiveModel,
    onArchiveRegulation,
    onRestoreModel,
    onRestoreRegulation,
    onPermanentDeleteModel,
    onPermanentDeleteRegulation,
    onAddMasterModel,
    onAddMasterRegulation
}) => {
    const navigate = useNavigate();
    const [editingDraftId, setEditingDraftId] = React.useState<string | null>(null);
    const [editDraftName, setEditDraftName] = React.useState("");

    const [newCustomModel, setNewCustomModel] = React.useState("");
    const [newCustomReg, setNewCustomReg] = React.useState("");
    const [editingListItem, setEditingListItem] = React.useState<{ type: 'model' | 'reg', index: number, value: string } | null>(null);
    const [showArchived, setShowArchived] = React.useState(false);

    const handleUpdateListItem = (type: 'model' | 'reg', index: number, newValue: string) => {
        // Normalize the new value: trim + collapse spaces
        const normalizedNewValue = newValue.replace(/\s+/g, ' ').trim();
        if (!normalizedNewValue) return;

        const oldValue = type === 'model' ? customModels[index] : customRegulations[index];

        // Check for duplicates using the same logic as add functions
        // Remove ALL spaces and compare in lowercase
        if (type === 'model') {
            const normalizedInput = normalizedNewValue.replace(/\s+/g, '').toLowerCase();
            const exists = customModels.some((m, i) =>
                i !== index && m.replace(/\s+/g, '').toLowerCase() === normalizedInput
            );

            if (exists) {
                alert(`"${normalizedNewValue}" already exists in the model list!`);
                return;
            }
            // Cascade rename in plan
            onRenameModel(oldValue, normalizedNewValue);
        } else {
            const normalizedInput = normalizedNewValue.replace(/\s+/g, '').toLowerCase();
            const exists = customRegulations.some((r, i) =>
                i !== index && r.replace(/\s+/g, '').toLowerCase() === normalizedInput
            );

            if (exists) {
                alert(`"${normalizedNewValue}" already exists in the regulation list!`);
                return;
            }
            // Cascade rename in plan
            onRenameRegulation(oldValue, normalizedNewValue);
        }
        setEditingListItem(null);
    };

    const handleDeleteListItem = (type: 'model' | 'reg', index: number) => {
        const itemName = type === 'model' ? customModels[index] : customRegulations[index];

        // Check if in use
        if (type === 'model' && isModelInUse(itemName)) {
            alert(`Cannot delete "${itemName}" - it is currently used in the draft table. Remove it from all cells first.`);
            return;
        }
        if (type === 'reg' && isRegulationInUse(itemName)) {
            alert(`Cannot delete "${itemName}" - it is currently used in the draft table. Remove the regulation row first.`);
            return;
        }

        if (type === 'model') {
            const next = customModels.filter((_, i) => i !== index);
            onUpdateCustomLists(next, customRegulations);
        } else {
            const next = customRegulations.filter((_, i) => i !== index);
            onUpdateCustomLists(customModels, next);
        }
    };

    // Handle adding items to custom lists
    const handleAddCustomModel = () => {
        // Normalize: trim + collapse internal spaces
        const name = newCustomModel.replace(/\s+/g, ' ').trim();
        if (!name) return;

        // Normalize for comparison: remove ALL spaces and convert to lowercase
        // This treats "Model A", "ModelA", "model a", "MODEL  A" as duplicates
        const normalizedInput = name.replace(/\s+/g, '').toLowerCase();
        const exists = customModels.some(m =>
            m.replace(/\s+/g, '').toLowerCase() === normalizedInput
        );

        if (exists) {
            alert(`"${name}" already exists in the model list!`);
            return;
        }

        // Check if exists in archived list
        const archivedExists = archivedModels.some(m =>
            m.replace(/\s+/g, '').toLowerCase() === normalizedInput
        );

        if (archivedExists) {
            const originalName = archivedModels.find(m => m.replace(/\s+/g, '').toLowerCase() === normalizedInput) || name;
            if (confirm(`"${originalName}" is in the archive. Restore it?`)) {
                onRestoreModel(originalName);
                setNewCustomModel("");
            }
            return;
        }

        // Add via API
        onAddMasterModel(name);

        // Optimistically set color locally? Or App handles it via refresh? 
        // App handles adding to local list, but color might need setting if not default.
        onSetItemColor(name, stringToColor(name));
        setNewCustomModel("");
    };

    const handleAddCustomReg = () => {
        // Normalize: trim + collapse internal spaces
        const name = newCustomReg.replace(/\s+/g, ' ').trim();
        if (!name) return;

        // Normalize for comparison: remove ALL spaces and convert to lowercase
        // This treats "Regulation A", "RegulationA", "regulation a" as duplicates
        const normalizedInput = name.replace(/\s+/g, '').toLowerCase();
        const exists = customRegulations.some(r =>
            r.replace(/\s+/g, '').toLowerCase() === normalizedInput
        );

        if (exists) {
            alert(`"${name}" already exists in the regulation list!`);
            return;
        }

        // Check if exists in archived list
        const archivedExists = archivedRegulations.some(r =>
            r.replace(/\s+/g, '').toLowerCase() === normalizedInput
        );

        if (archivedExists) {
            const originalName = archivedRegulations.find(r => r.replace(/\s+/g, '').toLowerCase() === normalizedInput) || name;
            if (confirm(`"${originalName}" is in the archive. Restore it?`)) {
                onRestoreRegulation(originalName);
                setNewCustomReg("");
            }
            return;
        }

        // Add via API
        onAddMasterRegulation(name);

        onSetItemColor(name, stringToColor(name));
        setNewCustomReg("");
    };


    const startEditing = (draft: Draft, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingDraftId(draft.id);
        setEditDraftName(draft.name);
    };

    const saveEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (editingDraftId && editDraftName.trim()) {
            renameDraft(editingDraftId, editDraftName.trim());
        }
        setEditingDraftId(null);
        setEditDraftName("");
    };

    const cancelEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingDraftId(null);
        setEditDraftName("");
    };

    const getInitials = (name: string) => {
        if (!name) return '??';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <nav className={`bg-gradient-to-b from-blue-900 to-blue-900 flex flex-col shadow-xl transition-all duration-300 ease-in-out shrink-0 ${isOpen ? 'w-[400px]' : 'w-0 opacity-0 overflow-hidden'}`}>
            {/* Logo Section */}
            <div
                className="bg-gray-50/50 px-5 pl-16 py-3 shadow-lg relative group"
            >
                <div
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-all z-10 cursor-pointer"
                    onClick={() => navigate('/select')}
                    title="Back to Project Selection"
                >
                    <ArrowLeft size={24} className="text-white drop-shadow-md" />
                </div>
                <div className="h-8 w-full flex items-center justify-center">
                    <img src={Logo} alt="Logo" className="w-full object-contain object-center pointer-events-none" />
                </div>
            </div>

            {/* Main Navigation */}
            <div className="p-3 space-y-1.5 flex-grow overflow-hidden">
                <button
                    onClick={() => setActiveTab('Final')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'Final'
                        ? 'bg-white text-blue-700 shadow-md scale-102'
                        : 'text-blue-100 hover:bg-blue-500/30 hover:text-white'
                        }`}
                >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    Final Planning
                </button>

                <button
                    onClick={() => {
                        setActiveTab('Draft');
                        setSelectedModels([]);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'Draft'
                        ? 'bg-white text-blue-700 shadow-md scale-102'
                        : 'text-blue-100 hover:bg-blue-500/30 hover:text-white'
                        }`}
                >
                    <FileText className="w-4 h-4 shrink-0" />
                    Draft Planning
                </button>

                {/* Recent Drafts Section */}
                <div className="pt-2 border-t border-blue-500/30 mt-2">
                    <div className="flex items-center justify-between mb-1 px-1">
                        <h3 className="text-[14px] font-bold text-blue-200 uppercase tracking-wider">
                            Recent Drafts
                        </h3>
                        <button
                            onClick={onNewDraft}
                            className="p-1 hover:bg-white/10 rounded-md transition-colors text-blue-200 hover:text-white"
                            title="New Draft"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                        {drafts.length === 0 && (
                            <p className="text-xs text-blue-200/60 px-1 italic py-1">
                                No drafts saved yet
                            </p>
                        )}
                        {drafts.map(draft => (
                            <div
                                key={draft.id}
                                className={`group flex items-center justify-between p-1.5 hover:bg-white/10 rounded-md text-xs transition-all ${draft.id === currentDraftId ? 'bg-white/10 border-l-2 border-blue-400' : ''}`}
                            >
                                {editingDraftId === draft.id ? (
                                    <div className="flex items-center gap-1 flex-grow mr-2">
                                        <input
                                            type="text"
                                            value={editDraftName}
                                            onChange={(e) => setEditDraftName(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-full text-xs p-1 rounded text-black"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveEditing(e as any);
                                                if (e.key === 'Escape') cancelEditing(e as any);
                                            }}
                                        />
                                        <button onClick={saveEditing} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
                                        <button onClick={cancelEditing} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => loadDraft(draft)}
                                            className="truncate text-white font-medium hover:text-blue-100 text-left flex-grow mr-2 transition-colors"
                                        >
                                            {draft.name}
                                        </button>
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => startEditing(draft, e)}
                                                className="text-blue-200 hover:text-white p-1.5 transition-all hover:bg-blue-500/20 rounded mr-1"
                                                title="Rename Draft"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteDraft(draft.id); }}
                                                className="text-red-300 hover:text-red-100 p-1.5 transition-all hover:bg-red-500/20 rounded"
                                                title="Delete Draft"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Custom Lists Section */}
                {/* Custom Lists Section - Visible in both Draft and Final - using activePlan data if needed, but currently custom lists are passed in. For Final, we might need to derive them or pass them differently if they aren't in 'customModels' prop. Assuming App passes correct customModels for active tab */}
                {(activeTab === 'Draft' || activeTab === 'Final') && (
                    <div className="pt-2 border-t border-blue-500/30 mt-1">
                        <div className="flex items-center justify-between mb-1 px-1">
                            <h3 className="text-[14px] font-bold text-blue-200 uppercase tracking-wider">
                                {activeTab === 'Draft' ? 'Draft Lists' : 'Plan Lists'}
                            </h3>
                            <div className="flex items-center gap-1 bg-blue-800/50 p-0.5 rounded-lg border border-blue-500/20">
                                <button
                                    onClick={() => setShowArchived(false)}
                                    className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md font-bold transition-all ${!showArchived
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'text-blue-200 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setShowArchived(true)}
                                    className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-md font-bold transition-all ${showArchived
                                        ? 'bg-amber-500 text-white shadow-sm'
                                        : 'text-blue-200 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <Archive size={10} />
                                    Archived
                                </button>
                            </div>
                        </div>
                        {activeTab === 'Draft' && (
                            <p className="text-[12px] text-blue-300 px-1 mb-1 italic">Drag items to grid</p>
                        )}
                        <div className="grid grid-cols-2 gap-1.5 px-0.5">
                            {/* Regulations List */}
                            <div className="bg-blue-800/30 rounded p-1.5 flex flex-col gap-1.5">
                                <label className="text-[12px] text-blue-200 uppercase font-bold text-center block border-b border-blue-500/20 pb-0.5">REGULATIONS</label>
                                {activeTab === 'Draft' && !showArchived && (
                                    <input
                                        className="w-full text-xs p-1.5 rounded bg-white/90 text-black outline-none"
                                        placeholder="Add..."
                                        value={newCustomReg}
                                        onChange={e => setNewCustomReg(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddCustomReg()}
                                    />
                                )}
                                <div className="max-h-[120px] overflow-y-auto space-y-0.5 custom-scrollbar">
                                    {(showArchived ? archivedRegulations : customRegulations).map((item, i) => (
                                        <div
                                            key={i}
                                            className={`group flex items-center justify-between text-xs text-black p-1 rounded shadow-sm hover:brightness-110 cursor-alias my-0.5 ${highlightedRegulation === item ? 'ring-2 ring-violet-500 ring-offset-1' : ''}`}
                                            style={{ backgroundColor: stringToColor(item), opacity: showArchived ? 0.7 : 1 }}
                                            draggable={activeTab === 'Draft' && !showArchived}
                                            onDragStart={(e) => {
                                                if (activeTab !== 'Draft' || showArchived) { e.preventDefault(); return; }
                                                e.dataTransfer.setData("application/json", JSON.stringify({ type: 'regulation', name: item }));
                                            }}
                                            onClick={() => {
                                                if (highlightedRegulation === item) {
                                                    setHighlightedRegulation(null);
                                                }
                                            }}
                                            onDoubleClick={() => {
                                                if (showArchived) return;
                                                setHighlightedRegulation(highlightedRegulation === item ? null : item);
                                                setHighlightedModel(null);
                                            }}
                                        >
                                            {editingListItem?.type === 'reg' && editingListItem.index === i ? (
                                                <div className="flex items-center gap-1 w-full relative z-20">
                                                    <input
                                                        autoFocus
                                                        className="w-full bg-white text-black rounded px-1 outline-none border border-blue-400"
                                                        value={editingListItem.value}
                                                        onChange={e => setEditingListItem({ ...editingListItem, value: e.target.value })}
                                                        onClick={e => e.stopPropagation()}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') handleUpdateListItem('reg', i, editingListItem.value);
                                                            if (e.key === 'Escape') setEditingListItem(null);
                                                            e.stopPropagation();
                                                        }}
                                                    />
                                                    <button onClick={(e) => { e.stopPropagation(); handleUpdateListItem('reg', i, editingListItem.value) }} className="text-green-600 hover:text-green-800"><Check size={12} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 w-full relative group/item">
                                                    <span className="truncate flex-grow mr-1 font-medium">{item} {showArchived && <span className="text-[8px] opacity-60">(Archived)</span>}</span>
                                                    {activeTab === 'Draft' && (
                                                        <div className="flex gap-1 opacity-0 group-hover/item:opacity-100">
                                                            {!showArchived ? (
                                                                <>
                                                                    <button onClick={(e) => { e.stopPropagation(); setEditingListItem({ type: 'reg', index: i, value: item }) }} className="text-black/50 hover:text-black hover:bg-white/20 p-0.5 rounded transition-colors"><Pencil size={12} /></button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (confirm(`Archive "${item}"? It will remain in old drafts but hidden from fresh list.`)) {
                                                                                onArchiveRegulation(item);
                                                                            }
                                                                        }}
                                                                        className="text-amber-600 hover:text-amber-700 hover:bg-white/20 p-0.5 rounded transition-colors"
                                                                        title="Archive"
                                                                    >
                                                                        <Archive size={12} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); onRestoreRegulation(item); }}
                                                                        className="text-green-600 hover:text-green-700 hover:bg-white/20 p-0.5 rounded transition-colors"
                                                                        title="Restore"
                                                                    >
                                                                        <RotateCcw size={12} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (confirm(`Permanently delete "${item}"? This action cannot be undone.`)) {
                                                                                onPermanentDeleteRegulation(item);
                                                                            }
                                                                        }}
                                                                        className="text-red-600 hover:text-red-700 hover:bg-white/20 p-0.5 rounded transition-colors"
                                                                        title="Delete Permanently"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Models List */}
                            <div className="bg-blue-800/30 rounded p-1.5 flex flex-col gap-1.5">
                                <label className="text-[12px] text-blue-200 uppercase font-bold text-center block border-b border-blue-500/20 pb-0.5">MODELS</label>
                                {activeTab === 'Draft' && !showArchived && (
                                    <input
                                        className="w-full text-xs p-1.5 rounded bg-white/90 text-black outline-none"
                                        placeholder="Add..."
                                        value={newCustomModel}
                                        onChange={e => setNewCustomModel(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddCustomModel()}
                                    />
                                )}
                                <div className="max-h-[120px] overflow-y-auto space-y-0.5 custom-scrollbar">
                                    {(showArchived ? archivedModels : customModels).map((item, i) => (
                                        <div
                                            key={i}
                                            className={`group flex items-center justify-between text-xs text-black p-1 rounded shadow-sm hover:brightness-110 cursor-alias my-0.5 ${highlightedModel === item ? 'ring-2 ring-violet-500 ring-offset-1' : ''}`}
                                            style={{ backgroundColor: stringToColor(item), opacity: showArchived ? 0.7 : 1 }}
                                            draggable={activeTab === 'Draft' && !showArchived}
                                            onDragStart={(e) => {
                                                if (activeTab !== 'Draft' || showArchived) { e.preventDefault(); return; }
                                                e.dataTransfer.setData("application/json", JSON.stringify({ type: 'model', name: item }));
                                            }}
                                            onClick={() => {
                                                if (highlightedModel === item) {
                                                    setHighlightedModel(null);
                                                }
                                            }}
                                            onDoubleClick={() => {
                                                if (showArchived) return;
                                                setHighlightedModel(highlightedModel === item ? null : item);
                                                setHighlightedRegulation(null);
                                            }}
                                        >
                                            {editingListItem?.type === 'model' && editingListItem.index === i ? (
                                                <div className="flex items-center gap-1 w-full relative z-20">
                                                    <input
                                                        autoFocus
                                                        className="w-full bg-white text-black rounded px-1 outline-none border border-blue-400"
                                                        value={editingListItem.value}
                                                        onChange={e => setEditingListItem({ ...editingListItem, value: e.target.value })}
                                                        onClick={e => e.stopPropagation()}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') handleUpdateListItem('model', i, editingListItem.value);
                                                            if (e.key === 'Escape') setEditingListItem(null);
                                                            e.stopPropagation();
                                                        }}
                                                    />
                                                    <button onClick={(e) => { e.stopPropagation(); handleUpdateListItem('model', i, editingListItem.value) }} className="text-green-600 hover:text-green-800"><Check size={12} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 w-full relative group/item">
                                                    <span className="truncate flex-grow mr-1 font-medium">{item} {showArchived && <span className="text-[8px] opacity-60">(Archived)</span>}</span>
                                                    {activeTab === 'Draft' && (
                                                        <div className="flex gap-1 opacity-0 group-hover/item:opacity-100">
                                                            {!showArchived ? (
                                                                <>
                                                                    <button onClick={(e) => { e.stopPropagation(); setEditingListItem({ type: 'model', index: i, value: item }) }} className="text-black/50 hover:text-black hover:bg-white/20 p-0.5 rounded transition-colors"><Pencil size={12} /></button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (confirm(`Archive "${item}"? It will remain in old drafts but hidden from fresh list.`)) {
                                                                                onArchiveModel(item);
                                                                            }
                                                                        }}
                                                                        className="text-amber-600 hover:text-amber-700 hover:bg-white/20 p-0.5 rounded transition-colors"
                                                                        title="Archive"
                                                                    >
                                                                        <Archive size={12} />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); onRestoreModel(item); }}
                                                                        className="text-green-600 hover:text-green-700 hover:bg-white/20 p-0.5 rounded transition-colors"
                                                                        title="Restore"
                                                                    >
                                                                        <RotateCcw size={12} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (confirm(`Permanently delete "${item}"? This action cannot be undone.`)) {
                                                                                onPermanentDeleteModel(item);
                                                                            }
                                                                        }}
                                                                        className="text-red-600 hover:text-red-700 hover:bg-white/20 p-0.5 rounded transition-colors"
                                                                        title="Delete Permanently"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* User Profile Section */}
            <div className="border-t border-blue-500/30 p-4 bg-blue-800/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full bg-white text-blue-700 flex items-center justify-center font-bold shadow-lg ring-2 ring-blue-400/50 text-base">
                        {getInitials(user.name || user.username)}
                    </div>
                    <div className="flex-grow min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                            {user.name || 'User'}
                        </p>
                        <p className="text-xs text-blue-200 truncate" title={user.username}>
                            {user.username}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm font-semibold text-white hover:bg-red-500 hover:border-red-400 transition-all shadow-sm hover:shadow-lg"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </nav>
    );
};

export default Sidebar;

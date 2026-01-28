// import React from 'react';
// import { NavTab, Draft } from '../types';
// import {
//     CheckCircle,
//     FileText,
//     Plus,
//     Trash2,
//     LogOut
// } from 'lucide-react';
// import Logo from '../Images/amlgolabslogowhite.png';

// interface SidebarProps {
//     isOpen: boolean;
//     activeTab: NavTab;
//     setActiveTab: (tab: NavTab) => void;
//     setSelectedModels: (models: string[]) => void;
//     drafts: Draft[];
//     loadDraft: (draft: Draft) => void;
//     deleteDraft: (id: string) => void;
//     newRegName: string;
//     setNewRegName: (name: string) => void;
//     addRegulation: () => void;
//     user: {
//         name: string;
//         username: string;
//     };
//     onLogout: () => void;
// }

// const Sidebar: React.FC<SidebarProps> = ({
//     isOpen,
//     activeTab,
//     setActiveTab,
//     setSelectedModels,
//     drafts,
//     loadDraft,
//     deleteDraft,
//     newRegName,
//     setNewRegName,
//     addRegulation,
//     user,
//     onLogout
// }) => {
//     // Utility for initials: "Rohit Gupta" -> "RG"
//     const getInitials = (name: string) => {
//         if (!name) return '??';
//         const parts = name.trim().split(' ');
//         if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
//         return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
//     };

//     return (
//         <nav className={`bg-white border-r border-gray-200 flex flex-col shadow-sm transition-all duration-300 ease-in-out ${isOpen ? 'w-80' : 'w-0 opacity-0 overflow-hidden'}`}>
//             <div className="flex items-center gap-3 mb-4">
//                 <div className="bg-white px-5 py-3 shadow flex items-center justify-center w-full">
//                     <div className="h-10 w-full overflow-hidden flex items-center justify-center">
//                         <img src={Logo} alt="Logo" className="w-full object-contain object-center" />
//                     </div>
//                 </div>
//             </div>

//             <div className="p-4 space-y-2 flex-grow overflow-y-auto custom-scrollbar">
//                 <button
//                     onClick={() => setActiveTab('Final')}
//                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'Final'
//                         ? 'bg-blue-600 text-white shadow-md'
//                         : 'text-gray-600 hover:bg-gray-100'
//                         }`}
//                 >
//                     <CheckCircle className="w-5 h-5 shrink-0" />
//                     Final Planning
//                 </button>

//                 <button
//                     onClick={() => {
//                         setActiveTab('Draft');
//                         setSelectedModels([]);
//                     }}
//                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'Draft'
//                         ? 'bg-blue-600 text-white shadow-md'
//                         : 'text-gray-600 hover:bg-gray-100'
//                         }`}
//                 >
//                     <FileText className="w-5 h-5 shrink-0" />
//                     Draft Planning
//                 </button>

//                 {activeTab === 'Draft' && (
//                     <div className="pt-4 mt-4 border-t border-gray-100">
//                         <label className="text-xs font-bold text-gray-400 uppercase px-2 mb-2 block">Regulations</label>
//                         <div className="flex gap-2 px-2 mb-4">
//                             <input
//                                 type="text"
//                                 value={newRegName}
//                                 onChange={e => setNewRegName(e.target.value)}
//                                 onKeyDown={e => {
//                                     if (e.key === 'Enter') {
//                                         addRegulation();
//                                     }
//                                 }}
//                                 placeholder="New Reg"
//                                 className="w-full text-xs p-2 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
//                             />
//                             <button
//                                 onClick={addRegulation}
//                                 className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
//                             >
//                                 <Plus className="w-4 h-4" />
//                             </button>
//                         </div>
//                     </div>
//                 )}

//                 <div className="pt-4 border-t border-gray-100">
//                     <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
//                         Recent Drafts
//                     </h3>
//                     <div className="space-y-1">
//                         {drafts.length === 0 && <p className="text-xs text-gray-400 px-2 italic">No drafts saved</p>}
//                         {drafts.map(draft => (
//                             <div key={draft.id} className="group flex items-center justify-between p-2 hover:bg-gray-50 rounded text-sm transition-colors">
//                                 <button
//                                     onClick={() => loadDraft(draft)}
//                                     className="truncate text-gray-700 font-medium hover:text-blue-600 text-left flex-grow mr-2"
//                                 >
//                                     {draft.name}
//                                 </button>
//                                 <button
//                                     onClick={() => deleteDraft(draft.id)}
//                                     className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity"
//                                 >
//                                     <Trash2 className="w-4 h-4" />
//                                 </button>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>

//             {/* User Profile Section */}
//             <div className="border-t border-gray-200 p-4 bg-gray-50/50">
//                 <div className="flex items-center gap-3 mb-4">
//                     <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-md ring-2 ring-white">
//                         {getInitials(user.name || user.username)}
//                     </div>
//                     <div className="flex-grow min-w-0">
//                         <p className="text-sm font-bold text-gray-900 truncate">
//                             {user.name || 'User'}
//                         </p>
//                         <p className="text-xs text-gray-500 truncate" title={user.username}>
//                             {user.username}
//                         </p>
//                     </div>
//                 </div>
//                 <button
//                     onClick={onLogout}
//                     className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
//                 >
//                     <LogOut className="w-4 h-4" />
//                     Sign Out
//                 </button>
//             </div>
//         </nav>
//     );
// };

// export default Sidebar;

import React from 'react';
import { NavTab, Draft } from '../utils/types';
import {
    CheckCircle,
    FileText,
    Plus,
    Trash2,
    LogOut
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
    onLogout
}) => {
    const getInitials = (name: string) => {
        if (!name) return '??';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <nav className={`bg-gradient-to-b from-blue-900 to-blue-900 flex flex-col shadow-xl transition-all duration-300 ease-in-out ${isOpen ? 'w-80' : 'w-0 opacity-0 overflow-hidden'}`}>
            {/* Logo Section */}
            <div className="bg-gray-50/50 px-5 py-4 shadow-lg">
                <div className="h-8 w-full flex items-center justify-center">
                    <img src={Logo} alt="Logo" className="w-full object-contain object-center" />
                </div>
            </div>

            {/* Main Navigation */}
            <div className="p-4 space-y-2 flex-grow overflow-y-auto custom-scrollbar">
                <button
                    onClick={() => setActiveTab('Final')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === 'Final'
                        ? 'bg-white text-blue-700 shadow-lg scale-105'
                        : 'text-blue-100 hover:bg-blue-500/30 hover:text-white'
                        }`}
                >
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    Final Planning
                </button>

                <button
                    onClick={() => {
                        setActiveTab('Draft');
                        setSelectedModels([]);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${activeTab === 'Draft'
                        ? 'bg-white text-blue-700 shadow-lg scale-105'
                        : 'text-blue-100 hover:bg-blue-500/30 hover:text-white'
                        }`}
                >
                    <FileText className="w-5 h-5 shrink-0" />
                    Draft Planning
                </button>

                {/* Regulations Section */}
                {activeTab === 'Draft' && (
                    <div className="pt-4 mt-4 border-t border-blue-500/30">
                        <label className="text-xs font-bold text-blue-200 uppercase px-2 mb-2 block tracking-wider">
                            Add Regulation
                        </label>
                        <div className="flex gap-2 px-2 mb-4">
                            <input
                                type="text"
                                value={newRegName}
                                onChange={e => setNewRegName(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        addRegulation();
                                    }
                                }}
                                placeholder="Enter regulation name"
                                className="w-full text-sm p-2.5 bg-white/90 border-0 rounded-lg focus:ring-2 focus:ring-white/50 outline-none placeholder-gray-400 text-gray-800 shadow-sm"
                            />
                            <button
                                onClick={addRegulation}
                                className="p-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 shadow-sm transition-all hover:scale-105"
                                title="Add Regulation"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Recent Drafts Section */}
                <div className="pt-4 border-t border-blue-500/30">
                    <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-3 px-2">
                        Recent Drafts
                    </h3>
                    <div className="space-y-1.5">
                        {drafts.length === 0 && (
                            <p className="text-sm text-blue-200/60 px-2 italic py-2">
                                No drafts saved yet
                            </p>
                        )}
                        {drafts.map(draft => (
                            <div
                                key={draft.id}
                                className="group flex items-center justify-between p-2.5 hover:bg-white/10 rounded-lg text-sm transition-all"
                            >
                                <button
                                    onClick={() => loadDraft(draft)}
                                    className="truncate text-white font-medium hover:text-blue-100 text-left flex-grow mr-2 transition-colors"
                                >
                                    {draft.name}
                                </button>
                                <button
                                    onClick={() => deleteDraft(draft.id)}
                                    className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-100 p-1.5 transition-all hover:bg-red-500/20 rounded"
                                    title="Delete Draft"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
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

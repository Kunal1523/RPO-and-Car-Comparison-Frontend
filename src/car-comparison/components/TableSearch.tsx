import React from 'react';
import { Search, X } from 'lucide-react';

interface TableSearchProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
}

const TableSearch: React.FC<TableSearchProps> = ({ searchTerm, onSearchChange }) => {
    return (
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
                type="text"
                placeholder="Search features..." // Shortened placeholder for cleaner look
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 pr-8 py-1.5 w-full md:w-64 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-700 placeholder:text-slate-400 shadow-sm hover:border-slate-400"
            />
            {searchTerm && (
                <button
                    onClick={() => onSearchChange('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    title="Clear search"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
};

export default TableSearch;

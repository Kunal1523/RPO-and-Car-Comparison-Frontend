import React from 'react';
import { ArrowRightLeft, X } from 'lucide-react';
import PlanningGrid from './PlanningGrid';
import { FinancialYear } from '../utils/types';

interface DrillDownModalProps {
    isOpen: boolean;
    selectedModels: string[];
    onClose: () => void;
    modelData: any; // Type should be inferred or imported if available, using any for broad compatibility or PlanData derived type
    years: FinancialYear[];
}

const DrillDownModal: React.FC<DrillDownModalProps> = ({
    isOpen,
    selectedModels,
    onClose,
    modelData,
    years
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-10 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-7xl flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200 border border-gray-100">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-black text-blue-600 flex items-center gap-2 uppercase tracking-widest">
                        <ArrowRightLeft className="w-5 h-5" />
                        Model Drill-Down: {selectedModels.join(', ')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-grow overflow-hidden p-0 bg-white">
                    <PlanningGrid
                        viewMode="Model"
                        rowIds={selectedModels}
                        cellData={modelData}
                        isEditable={false}
                        financialYears={years}
                    />
                </div>
            </div>
        </div>
    );
};

export default DrillDownModal;

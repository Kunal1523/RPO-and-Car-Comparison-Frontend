import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface SaveDraftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
    initialName?: string;
}

const SaveDraftModal: React.FC<SaveDraftModalProps> = ({ isOpen, onClose, onSave, initialName = "" }) => {
    const [draftName, setDraftName] = useState(initialName);

    useEffect(() => {
        if (isOpen) {
            setDraftName(initialName || `Draft ${new Date().toLocaleString()}`);
        }
    }, [isOpen, initialName]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (draftName.trim()) {
            onSave(draftName.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Save className="w-5 h-5 text-blue-600" />
                        Save Draft As New
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    <div>
                        <label htmlFor="draftName" className="block text-sm font-medium text-gray-700 mb-1">
                            Draft Name
                        </label>
                        <input
                            id="draftName"
                            type="text"
                            autoFocus
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            placeholder="Enter draft name..."
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!draftName.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            Save Draft
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SaveDraftModal;

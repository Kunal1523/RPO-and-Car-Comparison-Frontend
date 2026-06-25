import React, { useEffect, useRef } from 'react';
import { Copy, ClipboardPaste, X } from 'lucide-react';

interface MenuItem {
    label: string;
    sublabel?: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger' | 'highlight';
}

interface ColumnContextMenuProps {
    x: number;
    y: number;
    items: MenuItem[];
    onClose: () => void;
}

const ColumnContextMenu: React.FC<ColumnContextMenuProps> = ({ x, y, items, onClose }) => {
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click or Escape
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [onClose]);

    // Flip if too close to edge
    const menuW = 220;
    const menuH = items.length * 44 + 16;
    const left = x + menuW > window.innerWidth ? x - menuW : x;
    const top = y + menuH > window.innerHeight ? y - menuH : y;

    return (
        <div
            ref={ref}
            style={{ position: 'fixed', top, left, zIndex: 9999, minWidth: menuW }}
            className="bg-white border border-slate-200 rounded-lg shadow-2xl py-1 overflow-hidden"
        >
            {items.map((item, i) => (
                <button
                    key={i}
                    onClick={() => { item.onClick(); onClose(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
            ${item.variant === 'highlight'
                            ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                            : item.variant === 'danger'
                                ? 'hover:bg-red-50 text-red-600'
                                : 'hover:bg-slate-50 text-slate-700'
                        }`}
                >
                    <span className="flex-shrink-0 opacity-70">{item.icon}</span>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-semibold truncate">{item.label}</span>
                        {item.sublabel && (
                            <span className="text-[10px] text-slate-400 truncate">{item.sublabel}</span>
                        )}
                    </div>
                </button>
            ))}
        </div>
    );
};

export default ColumnContextMenu;
export type { MenuItem };
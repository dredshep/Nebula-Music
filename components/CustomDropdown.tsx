import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface CustomDropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    icon?: React.ReactNode;
    className?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
    value,
    onChange,
    options,
    placeholder = 'Select...',
    icon,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({
        top: '100%',
        left: 0,
        marginTop: '0.5rem'
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Position dropdown to avoid going off-screen
    useLayoutEffect(() => {
        if (isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const style: React.CSSProperties = { top: '100%', left: 0, marginTop: '8px' };

            // Flip up if dropdown would go below viewport
            if (rect.bottom + 250 > window.innerHeight) {
                style.top = 'auto';
                style.bottom = '100%';
                style.marginTop = '0';
                style.marginBottom = '8px';
            }

            // Flip left if dropdown would go off right edge
            if (rect.left + 240 > window.innerWidth) {
                style.left = 'auto';
                style.right = 0;
            }

            setDropdownStyle(style);
        }
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.value === value);
    const displayText = selectedOption ? selectedOption.label : placeholder;

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 px-4 text-sm focus:border-white/20 focus:bg-white/10 focus:outline-none text-white transition-all hover:bg-white/10 flex items-center justify-between gap-2"
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {icon && <span className="text-neutral-500 shrink-0">{icon}</span>}
                    <span className={`truncate ${!selectedOption ? 'text-neutral-500' : 'text-white'}`}>
                        {displayText}
                    </span>
                </div>
                <ChevronDown
                    className={`w-3.5 h-3.5 text-neutral-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>

            {/* Dropdown menu */}
            {isOpen && (
                <div
                    className="absolute w-full min-w-[200px] bg-neutral-900 border border-white/10 rounded-2xl shadow-float-3 z-50 overflow-hidden animate-scale-in"
                    style={dropdownStyle}
                >
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm transition-all ${option.value === value
                                        ? 'bg-primary/20 text-primary font-semibold'
                                        : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {/* Clear button (optional, only if value is set) */}
                    {value && (
                        <div className="border-t border-white/5 p-2">
                            <button
                                type="button"
                                onClick={() => {
                                    onChange('');
                                    setIsOpen(false);
                                }}
                                className="w-full py-2 px-3 text-xs text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                <X className="w-3 h-3" />
                                Clear
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

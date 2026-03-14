'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
    label: string;
    value: string;
}

interface CustomDropdownProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    label?: string;
}

export function CustomDropdown({
    options,
    value,
    onChange,
    placeholder = 'Select option',
    className,
    label
}: CustomDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={cn("space-y-1.5", className)} ref={dropdownRef}>
            {label && (
                <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">
                    {label}
                </label>
            )
            }
            <div className="menu w-full">
                <div className={cn("item w-full", isOpen && "is-active")}>
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={cn(
                            "link w-full border border-border-custom bg-white",
                            isOpen && "border-primary text-white"
                        )}
                        style={{ justifyContent: 'space-between', padding: '12px 16px' }}
                    >
                        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                        <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", isOpen && "rotate-180")} />
                    </button>
                    <div 
                        className={cn(
                            "submenu w-full", 
                            isOpen && "opacity-100 visible translate-y-0 pointer-events-auto border-primary"
                        )}
                        style={{ width: '100%', minWidth: '100%' }}
                    >
                        {options.map((option) => (
                            <div key={option.value} className="submenu-item">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "submenu-link flex items-center justify-between",
                                        value === option.value && "text-white"
                                    )}
                                >
                                    <span>{option.label}</span>
                                    {value === option.value && <Check className="w-3 h-3" />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

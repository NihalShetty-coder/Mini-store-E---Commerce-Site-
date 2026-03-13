'use client';

import React, { useState } from 'react';
import { Tag, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeader } from './SectionHeader';
import { CLOTHING_SIZES, SHOE_SIZES } from './types';

interface ProductSizesSectionProps {
    sizes: string[];
    setSizes: React.Dispatch<React.SetStateAction<string[]>>;
}

export function ProductSizesSection({ sizes, setSizes }: ProductSizesSectionProps) {
    const [sizeMode, setSizeMode] = useState<'clothing' | 'shoes'>('clothing');
    const [customSize, setCustomSize] = useState('');

    const toggleSize = (size: string) => {
        setSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    };

    const addCustomSize = () => {
        const trimmed = customSize.trim().toUpperCase();
        if (trimmed && !sizes.includes(trimmed)) {
            setSizes(prev => [...prev, trimmed]);
            setCustomSize('');
        }
    };

    return (
        <section>
            <SectionHeader icon={Tag} title="Available Sizes" subtitle="Select all sizes this product is available in." />

            {/* Toggle Clothing / Shoes */}
            <div className="flex gap-2 mb-4">
                <button
                    type="button"
                    onClick={() => setSizeMode('clothing')}
                    className={cn(
                        "px-4 py-2 text-[9px] font-black uppercase tracking-widest border transition-all",
                        sizeMode === 'clothing' ? "bg-secondary text-white border-secondary" : "bg-white text-secondary border-border-custom hover:border-secondary"
                    )}
                >
                    Clothing Sizes
                </button>
                <button
                    type="button"
                    onClick={() => setSizeMode('shoes')}
                    className={cn(
                        "px-4 py-2 text-[9px] font-black uppercase tracking-widest border transition-all",
                        sizeMode === 'shoes' ? "bg-secondary text-white border-secondary" : "bg-white text-secondary border-border-custom hover:border-secondary"
                    )}
                >
                    Shoe Sizes
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {(sizeMode === 'clothing' ? CLOTHING_SIZES : SHOE_SIZES).map(size => (
                    <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={cn(
                            "w-12 h-12 flex items-center justify-center text-xs font-bold border-2 transition-all relative",
                            sizes.includes(size)
                                ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20"
                                : "bg-white text-secondary border-border-custom hover:border-secondary"
                        )}
                    >
                        {size}
                        {sizes.includes(size) && (
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center">
                                <Check className="w-2 h-2 text-white" />
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Custom size input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={customSize}
                    onChange={e => setCustomSize(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); addCustomSize(); } }}
                    placeholder="Custom size..."
                    className="flex-1 p-2.5 border border-border-custom outline-none focus:border-primary text-sm transition-colors"
                />
                <button type="button" onClick={addCustomSize} className="px-4 bg-surface border border-border-custom text-secondary text-[9px] font-black uppercase tracking-widest hover:bg-secondary hover:text-white hover:border-secondary transition-all">
                    Add
                </button>
            </div>

            {/* Selected sizes display */}
            {sizes.length > 0 && (
                <div className="mt-4 p-3 bg-surface border border-border-custom">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-custom mb-2">Selected ({sizes.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                        {sizes.map(s => (
                            <span key={s} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-border-custom text-[10px] font-bold text-secondary">
                                {s}
                                <button type="button" onClick={() => toggleSize(s)} className="hover:text-red-500 transition-colors"><X className="w-2.5 h-2.5" /></button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}

'use client';

import React, { useState } from 'react';
import { Tag, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeader } from './SectionHeader';
import { PRESET_COLORS } from './types';

interface ProductColorsSectionProps {
    colors: string[];
    setColors: React.Dispatch<React.SetStateAction<string[]>>;
}

export function ProductColorsSection({ colors, setColors }: ProductColorsSectionProps) {
    const [customColorName, setCustomColorName] = useState('');
    const [customColorHex, setCustomColorHex] = useState('#000000');

    const toggleColor = (colorName: string) => {
        setColors(prev => prev.includes(colorName) ? prev.filter(c => c !== colorName) : [...prev, colorName]);
    };

    const addCustomColor = () => {
        const trimmed = customColorName.trim();
        if (trimmed && !colors.includes(trimmed)) {
            setColors(prev => [...prev, trimmed]);
            setCustomColorName('');
        }
    };

    return (
        <section>
            <SectionHeader icon={Tag} title="Available Colors" subtitle="Select product colors from presets or add custom." />

            <div className="grid grid-cols-8 gap-3 mb-4">
                {PRESET_COLORS.map(color => (
                    <button
                        key={color.name}
                        type="button"
                        onClick={() => toggleColor(color.name)}
                        className={cn(
                            "flex flex-col items-center gap-1.5 p-2 border-2 transition-all group",
                            colors.includes(color.name)
                                ? "border-primary bg-primary/5"
                                : "border-transparent hover:border-border-custom"
                        )}
                        title={color.name}
                    >
                        <div
                            className={cn(
                                "w-8 h-8 rounded-full border-2 transition-all relative",
                                colors.includes(color.name) ? "border-primary scale-110" : "border-border-custom group-hover:scale-105",
                                color.hex === '#FFFFFF' && "border-gray-300"
                            )}
                            style={{ backgroundColor: color.hex }}
                        >
                            {colors.includes(color.name) && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Check className={cn("w-4 h-4", color.hex === '#FFFFFF' || color.hex === '#EAB308' || color.hex === '#D4C5A9' ? "text-black" : "text-white")} />
                                </div>
                            )}
                        </div>
                        <span className="text-[7px] font-bold uppercase tracking-tight text-secondary truncate w-full text-center">{color.name}</span>
                    </button>
                ))}
            </div>

            {/* Custom color */}
            <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-[0.15em] text-muted-custom">Custom Color Name</label>
                    <input
                        type="text"
                        value={customColorName}
                        onChange={e => setCustomColorName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); addCustomColor(); } }}
                        placeholder="e.g. Royal Blue"
                        className="w-full p-2.5 border border-border-custom outline-none focus:border-primary text-sm transition-colors"
                    />
                </div>
                <input
                    type="color"
                    value={customColorHex}
                    onChange={e => setCustomColorHex(e.target.value)}
                    className="w-10 h-10 p-0.5 border border-border-custom cursor-pointer"
                />
                <button type="button" onClick={addCustomColor} className="px-4 h-10 bg-surface border border-border-custom text-secondary text-[9px] font-black uppercase tracking-widest hover:bg-secondary hover:text-white hover:border-secondary transition-all">
                    Add
                </button>
            </div>

            {/* Selected colors display */}
            {colors.length > 0 && (
                <div className="mt-4 p-3 bg-surface border border-border-custom">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-custom mb-2">Selected ({colors.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                        {colors.map(c => {
                            const preset = PRESET_COLORS.find(p => p.name === c);
                            return (
                                <span key={c} className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-border-custom text-[10px] font-bold text-secondary">
                                    <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: preset?.hex || customColorHex }} />
                                    {c}
                                    <button type="button" onClick={() => toggleColor(c)} className="hover:text-red-500 transition-colors"><X className="w-2.5 h-2.5" /></button>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}

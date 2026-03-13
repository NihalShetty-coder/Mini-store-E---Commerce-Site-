'use client';

import React, { useState } from 'react';
import { Tag, X } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

interface ProductTagsSectionProps {
    tags: string[];
    setTags: React.Dispatch<React.SetStateAction<string[]>>;
}

export function ProductTagsSection({ tags, setTags }: ProductTagsSectionProps) {
    const [tagInput, setTagInput] = useState('');

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            e.stopPropagation();
            const trimmed = tagInput.trim();
            if (trimmed && !tags.includes(trimmed)) {
                setTags(prev => [...prev, trimmed]);
                setTagInput('');
            }
        } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            setTags(prev => prev.slice(0, -1));
        }
    };

    return (
        <section>
            <SectionHeader icon={Tag} title="Product Tags" subtitle="Keywords help customers find your product." />
            <div className="flex flex-wrap gap-2 p-3 border border-border-custom bg-white focus-within:border-primary transition-colors min-h-[48px] items-center">
                {tags.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-1 bg-surface text-secondary text-[10px] font-bold uppercase tracking-wider">
                        {tag}
                        <button type="button" onClick={() => setTags(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-500 transition-colors">
                            <X className="w-2.5 h-2.5" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={tags.length === 0 ? "Type and press Enter..." : ""}
                    className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
                />
            </div>
        </section>
    );
}

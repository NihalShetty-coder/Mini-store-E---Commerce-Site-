'use client';

import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
    label: string;
    placeholder?: string;
    tags: string[];
    onChange: (tags: string[]) => void;
    type?: 'text' | 'color';
}

export default function TagInput({ label, placeholder, tags, onChange, type = 'text' }: TagInputProps) {
    const [inputValue, setInputValue] = useState('');

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    const addTag = () => {
        const trimmed = inputValue.trim();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
            setInputValue('');
        }
    };

    const removeTag = (index: number) => {
        onChange(tags.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-secondary block">
                {label}
            </label>
            <div className="flex flex-wrap gap-2 p-3 border border-border-custom bg-white focus-within:border-primary transition-colors min-h-[48px] items-center">
                {tags.map((tag, index) => (
                    <span
                        key={index}
                        className="flex items-center gap-1.5 px-2 py-1 bg-surface text-secondary text-[10px] font-bold uppercase tracking-wider"
                    >
                        {type === 'color' && (
                            <span
                                className="w-2.5 h-2.5 rounded-full border border-black/10"
                                style={{ backgroundColor: tag }}
                            />
                        )}
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(index)}
                            className="hover:text-red-500 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <div className="flex-1 flex items-center gap-2">
                    <input
                        type={type === 'color' ? 'text' : 'text'}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={tags.length === 0 ? placeholder : ''}
                        className="flex-1 outline-none text-sm bg-transparent placeholder:text-muted-custom/50"
                    />
                    {type === 'color' && (
                        <input
                            type="color"
                            className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                            onChange={(e) => {
                                const color = e.target.value;
                                if (!tags.includes(color)) onChange([...tags, color]);
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

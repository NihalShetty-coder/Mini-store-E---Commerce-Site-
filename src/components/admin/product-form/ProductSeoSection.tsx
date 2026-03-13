'use client';

import React, { useState } from 'react';
import { Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductSeoSectionProps {
    seoTitle: string;
    setSeoTitle: (value: string) => void;
    seoDescription: string;
    setSeoDescription: (value: string) => void;
}

export function ProductSeoSection({
    seoTitle,
    setSeoTitle,
    seoDescription,
    setSeoDescription,
}: ProductSeoSectionProps) {
    const [showSeo, setShowSeo] = useState(false);

    return (
        <section>
            <button
                type="button"
                onClick={() => setShowSeo(!showSeo)}
                className="w-full flex items-center justify-between pb-4 border-b border-border-custom"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-surface border border-border-custom">
                        <Globe className="w-4 h-4 text-secondary" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary">SEO Settings</h3>
                        <p className="text-[10px] text-muted-custom mt-0.5">Optional — Optimize for search engines</p>
                    </div>
                </div>
                {showSeo ? <ChevronUp className="w-4 h-4 text-muted-custom" /> : <ChevronDown className="w-4 h-4 text-muted-custom" />}
            </button>
            <AnimatePresence>
                {showSeo && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">SEO Title</label>
                                <input
                                    type="text"
                                    value={seoTitle}
                                    onChange={e => setSeoTitle(e.target.value)}
                                    placeholder="Title for search results"
                                    className="w-full p-3 border border-border-custom outline-none focus:border-primary text-sm transition-colors"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">SEO Description</label>
                                <textarea
                                    value={seoDescription}
                                    onChange={e => setSeoDescription(e.target.value)}
                                    placeholder="Description for search snippets"
                                    className="w-full p-3 border border-border-custom outline-none focus:border-primary text-sm min-h-[70px] resize-none transition-colors"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

'use client';

import React from 'react';

interface SectionHeaderProps {
    icon: React.ElementType;
    title: string;
    subtitle?: string;
}

export const SectionHeader = ({ icon: Icon, title, subtitle }: SectionHeaderProps) => (
    <div className="flex items-center gap-3 pb-4 border-b border-border-custom mb-6">
        <div className="p-2 bg-surface border border-border-custom">
            <Icon className="w-4 h-4 text-secondary" />
        </div>
        <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary">{title}</h3>
            {subtitle && <p className="text-[10px] text-muted-custom mt-0.5">{subtitle}</p>}
        </div>
    </div>
);

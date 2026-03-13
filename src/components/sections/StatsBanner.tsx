import React from 'react';
import { useSettings } from '@/hooks/use-settings';

const StatsBanner = () => {
    const { statsConfig } = useSettings();

    return (
        <section className="container mx-auto px-6 md:px-10 lg:px-16 -mt-16 relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 bg-surface border border-border-custom shadow-xl">
                {statsConfig.map((stat) => (
                    <div
                        key={stat.label}
                        className="p-8 text-center border-r border-border-custom last:border-r-0 border-b lg:border-b-0"
                    >
                        <div className="font-playfair text-3xl font-black text-primary mb-1">
                            {stat.value}
                        </div>
                        <div className="text-[10px] uppercase font-black tracking-widest text-muted-custom">
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default StatsBanner;

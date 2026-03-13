'use client';

import React, { useState, useMemo } from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilter } from '@/hooks/use-filter';
import { useInventory } from '@/hooks/use-inventory';

// Available filter options
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = ['Black', 'White', 'Navy', 'Gray', 'Beige', 'Red', 'Blue', 'Green'];
const MATERIALS = ['Cotton', 'Polyester', 'Silk', 'Wool', 'Denim', 'Leather', 'Linen'];

const Sidebar = ({ className }: { className?: string }) => {
    const [mounted, setMounted] = useState(false);
    const { getActiveProducts } = useInventory();
    const activeProducts = getActiveProducts();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Calculate category counts dynamically
    const dynamicCategories = useMemo(() => {
        const counts: Record<string, number> = { "All": activeProducts.length };
        const subMap: Record<string, Set<string>> = {};

        activeProducts.forEach(p => {
            counts[p.category] = (counts[p.category] || 0) + 1;
            if (p.subCategory) {
                if (!subMap[p.category]) subMap[p.category] = new Set();
                subMap[p.category].add(p.subCategory);
            }
        });

        const generatedCategories = Object.keys(counts)
            .filter(cat => cat !== 'All')
            .map(cat => ({
                name: cat,
                count: counts[cat],
                sub: subMap[cat] ? Array.from(subMap[cat]).sort() : undefined
            }))
            .sort((a, b) => b.count - a.count);

        return [
            { name: "All", count: counts["All"], sub: undefined as string[] | undefined },
            ...generatedCategories
        ];
    }, [activeProducts]);

    // Extract available sizes, colors, materials from products
    const availableFilters = useMemo(() => {
        const sizes = new Set<string>();
        const colors = new Set<string>();
        const materials = new Set<string>();

        activeProducts.forEach(p => {
            p.sizes?.forEach(s => sizes.add(s));
            p.colors?.forEach(c => colors.add(c));
            if (p.material) materials.add(p.material);
        });

        return {
            sizes: SIZES.filter(s => sizes.has(s)),
            colors: COLORS.filter(c => colors.has(c)),
            materials: MATERIALS.filter(m => materials.has(m))
        };
    }, [activeProducts]);

    const [openSub, setOpenSub] = useState<string | null>(null);
    const { 
        selectedCategory, 
        setCategory, 
        selectedSizes, 
        selectedColors, 
        selectedMaterials,
        priceFilter,
        toggleSize,
        toggleColor,
        toggleMaterial,
        setPriceFilter
    } = useFilter();

    const handleCategoryClick = (catName: string) => {
        setCategory(catName);
        if (dynamicCategories.find(c => c.name === catName)?.sub) {
            setOpenSub(openSub === catName ? null : catName);
        }
    };

    return (
        <aside className={className}>
            <div className="space-y-12">
                {/* Categories */}
                <div className="sidebar-section">
                    <h3 className="font-inter text-[11px] font-black uppercase tracking-widest text-secondary border-b-2 border-primary inline-block pb-1 mb-6">
                        Categories
                    </h3>
                    <ul className="divide-y divide-border-custom">
                        {!mounted ? (
                            <div className="py-4 text-xs font-medium text-muted-custom animate-pulse">Loading categories...</div>
                        ) : dynamicCategories.map((cat) => (
                            <li key={cat.name} className="py-4">
                                <div
                                    className="flex items-center justify-between cursor-pointer group"
                                    onClick={() => handleCategoryClick(cat.name)}
                                >
                                    <span className={cn(
                                        "text-sm font-medium transition-colors hover:text-primary",
                                        selectedCategory === cat.name ? "text-primary font-bold" : "text-secondary"
                                    )}>
                                        {cat.name} {mounted && <span className="text-[10px] text-muted-custom ml-1">({cat.count})</span>}
                                    </span>
                                    {cat.sub ? (
                                        openSub === cat.name ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />
                                    ) : null}
                                </div>

                                {cat.sub && openSub === cat.name && (
                                    <ul className="mt-4 pl-4 space-y-3">
                                        {cat.sub.map(sub => (
                                            <li
                                                key={sub}
                                                onClick={() => setCategory(sub)}
                                                className={cn(
                                                    "text-xs cursor-pointer transition-colors hover:text-primary",
                                                    selectedCategory === sub ? "text-primary font-bold" : "text-muted-custom"
                                                )}
                                            >
                                                {sub}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Quick Price Filter */}
                <div className="sidebar-section">
                    <h3 className="font-inter text-[11px] font-black uppercase tracking-widest text-secondary border-b-2 border-primary inline-block pb-1 mb-6">
                        Price Range
                    </h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => setPriceFilter('all')}
                            className={cn(
                                "w-full px-4 py-3 text-xs font-bold uppercase tracking-wider border transition-all text-left",
                                priceFilter === 'all'
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-secondary border-border-custom hover:border-primary"
                            )}
                        >
                            All Prices
                        </button>
                        <button
                            onClick={() => setPriceFilter('under-50')}
                            className={cn(
                                "w-full px-4 py-3 text-xs font-bold uppercase tracking-wider border transition-all text-left",
                                priceFilter === 'under-50'
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-secondary border-border-custom hover:border-primary"
                            )}
                        >
                            Under ₹50
                        </button>
                        <button
                            onClick={() => setPriceFilter('50-100')}
                            className={cn(
                                "w-full px-4 py-3 text-xs font-bold uppercase tracking-wider border transition-all text-left",
                                priceFilter === '50-100'
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-secondary border-border-custom hover:border-primary"
                            )}
                        >
                            ₹50 - ₹100
                        </button>
                        <button
                            onClick={() => setPriceFilter('100-200')}
                            className={cn(
                                "w-full px-4 py-3 text-xs font-bold uppercase tracking-wider border transition-all text-left",
                                priceFilter === '100-200'
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-secondary border-border-custom hover:border-primary"
                            )}
                        >
                            ₹100 - ₹200
                        </button>
                        <button
                            onClick={() => setPriceFilter('200-500')}
                            className={cn(
                                "w-full px-4 py-3 text-xs font-bold uppercase tracking-wider border transition-all text-left",
                                priceFilter === '200-500'
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-secondary border-border-custom hover:border-primary"
                            )}
                        >
                            ₹200 - ₹500
                        </button>
                        <button
                            onClick={() => setPriceFilter('500-plus')}
                            className={cn(
                                "w-full px-4 py-3 text-xs font-bold uppercase tracking-wider border transition-all text-left",
                                priceFilter === '500-plus'
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-secondary border-border-custom hover:border-primary"
                            )}
                        >
                            ₹500+
                        </button>
                    </div>
                </div>

                {/* Size Filter */}
                {availableFilters.sizes.length > 0 && (
                    <div className="sidebar-section">
                        <h3 className="font-inter text-[11px] font-black uppercase tracking-widest text-secondary border-b-2 border-primary inline-block pb-1 mb-6">
                            Size
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            {availableFilters.sizes.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => toggleSize(size)}
                                    className={cn(
                                        "px-3 py-2 text-xs font-bold uppercase tracking-wider border transition-all relative",
                                        selectedSizes.includes(size)
                                            ? "bg-primary text-white border-primary"
                                            : "bg-white text-secondary border-border-custom hover:border-primary"
                                    )}
                                >
                                    {size}
                                    {selectedSizes.includes(size) && (
                                        <Check className="w-3 h-3 absolute top-0.5 right-0.5" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Color Filter */}
                {availableFilters.colors.length > 0 && (
                    <div className="sidebar-section">
                        <h3 className="font-inter text-[11px] font-black uppercase tracking-widest text-secondary border-b-2 border-primary inline-block pb-1 mb-6">
                            Color
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {availableFilters.colors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => toggleColor(color)}
                                    className={cn(
                                        "px-3 py-2 text-xs font-medium border transition-all",
                                        selectedColors.includes(color)
                                            ? "bg-secondary text-white border-secondary"
                                            : "bg-white text-secondary border-border-custom hover:border-secondary"
                                    )}
                                >
                                    {color}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Material Filter */}
                {availableFilters.materials.length > 0 && (
                    <div className="sidebar-section">
                        <h3 className="font-inter text-[11px] font-black uppercase tracking-widest text-secondary border-b-2 border-primary inline-block pb-1 mb-6">
                            Material
                        </h3>
                        <div className="space-y-2">
                            {availableFilters.materials.map((material) => (
                                <label
                                    key={material}
                                    className="flex items-center gap-3 cursor-pointer group py-1"
                                >
                                    <div className={cn(
                                        "w-4 h-4 border-2 rounded-sm flex items-center justify-center transition-all",
                                        selectedMaterials.includes(material)
                                            ? "bg-primary border-primary"
                                            : "bg-white border-border-custom group-hover:border-primary"
                                    )}>
                                        {selectedMaterials.includes(material) && (
                                            <Check className="w-3 h-3 text-white" />
                                        )}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedMaterials.includes(material)}
                                        onChange={() => toggleMaterial(material)}
                                    />
                                    <span className="text-sm text-secondary group-hover:text-primary transition-colors">
                                        {material}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;

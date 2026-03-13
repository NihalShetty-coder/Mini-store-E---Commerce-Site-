'use client';

import React from 'react';
import { Tag, AlertTriangle } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { CATEGORIES } from './types';

interface ProductDetailsSectionProps {
    name: string;
    setName: (value: string) => void;
    description: string;
    setDescription: (value: string) => void;
    price: string;
    setPrice: (value: string) => void;
    originalPrice: string;
    setOriginalPrice: (value: string) => void;
    stock: string;
    setStock: (value: string) => void;
    sku: string;
    setSku: (value: string) => void;
    category: string;
    setCategory: (value: string) => void;
    subCategory: string;
    setSubCategory: (value: string) => void;
    brand: string;
    setBrand: (value: string) => void;
    material: string;
    setMaterial: (value: string) => void;
    status: string;
    setStatus: (value: 'Active' | 'Draft' | 'Out of Stock') => void;
    badge: string;
    setBadge: (value: string) => void;
    lowStockThreshold: string;
    setLowStockThreshold: (value: string) => void;
    hasVariants: boolean;
}

export function ProductDetailsSection({
    name, setName,
    description, setDescription,
    price, setPrice,
    originalPrice, setOriginalPrice,
    stock, setStock,
    sku, setSku,
    category, setCategory,
    subCategory, setSubCategory,
    brand, setBrand,
    material, setMaterial,
    status, setStatus,
    badge, setBadge,
    lowStockThreshold, setLowStockThreshold,
    hasVariants,
}: ProductDetailsSectionProps) {
    const stockNum = parseInt(stock, 10) || 0;
    const thresholdNum = parseInt(lowStockThreshold, 10) || 5;
    const isLowStock = stockNum > 0 && stockNum <= thresholdNum;

    return (
        <section>
            <SectionHeader icon={Tag} title="Product Details" subtitle="Name, pricing, and inventory information." />
            <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">Product Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Classic Leather Oxford"
                            className="w-full p-3 border border-border-custom outline-none focus:border-primary text-sm font-semibold transition-colors"
                            required
                            minLength={3}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">SKU</label>
                        <input
                            type="text"
                            value={sku}
                            onChange={e => setSku(e.target.value)}
                            placeholder="Auto-generated"
                            className="w-full p-3 border border-border-custom outline-none focus:border-primary text-sm transition-colors text-muted-custom"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">Description</label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Describe your product..."
                        className="w-full p-3 border border-border-custom outline-none focus:border-primary text-sm min-h-[90px] resize-y transition-colors"
                    />
                </div>

                <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">Price *</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full p-3 border border-border-custom outline-none focus:border-primary text-sm font-black transition-colors"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">Original Price</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={originalPrice}
                            onChange={e => setOriginalPrice(e.target.value)}
                            placeholder="Compare at"
                            className="w-full p-3 border border-border-custom outline-none focus:border-primary text-sm transition-colors text-muted-custom"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">
                            Stock *
                            {hasVariants && (
                                <span className="ml-1 text-primary normal-case tracking-normal font-medium">(auto)</span>
                            )}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                value={stock}
                                onChange={e => setStock(e.target.value)}
                                className={`w-full p-3 border outline-none text-sm transition-colors ${
                                    hasVariants
                                        ? 'border-border-custom bg-surface text-muted-custom cursor-not-allowed'
                                        : stockNum === 0
                                            ? 'border-red-200 bg-red-50/50 text-red-900 focus:border-red-400'
                                            : isLowStock
                                                ? 'border-yellow-200 bg-yellow-50/50 text-yellow-900 focus:border-yellow-400'
                                                : 'border-border-custom focus:border-primary'
                                }`}
                                required
                                readOnly={hasVariants}
                                tabIndex={hasVariants ? -1 : undefined}
                            />
                            {isLowStock && !hasVariants && (
                                <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
                            )}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">Low Stock Alert</label>
                        <input
                            type="number"
                            min="1"
                            value={lowStockThreshold}
                            onChange={e => setLowStockThreshold(e.target.value)}
                            placeholder="5"
                            className="w-full p-3 border border-border-custom outline-none focus:border-primary text-sm transition-colors"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">Category *</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full p-3 border border-border-custom outline-none focus:border-primary text-sm transition-colors"
                            required
                        >
                            <option value="">Select category</option>
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">Sub-Category</label>
                        <input
                            type="text"
                            value={subCategory}
                            onChange={e => setSubCategory(e.target.value)}
                            placeholder="e.g. Leather Boots"
                            className="w-full p-3 border border-border-custom outline-none focus:border-primary text-sm transition-colors"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">Brand</label>
                        <input
                            type="text"
                            value={brand}
                            onChange={e => setBrand(e.target.value)}
                            placeholder="e.g. Nike"
                            className="w-full p-3 border border-border-custom outline-none focus:border-primary text-sm transition-colors"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">Material</label>
                        <input
                            type="text"
                            value={material}
                            onChange={e => setMaterial(e.target.value)}
                            placeholder="e.g. 100% Cotton"
                            className="w-full p-3 border border-border-custom outline-none focus:border-primary text-sm transition-colors"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value as 'Active' | 'Draft' | 'Out of Stock')} className="w-full p-3 border border-border-custom outline-none focus:border-primary text-sm transition-colors">
                            <option value="Active">Active</option>
                            <option value="Draft">Draft</option>
                            <option value="Archived">Archived</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">Badge</label>
                        <select value={badge} onChange={e => setBadge(e.target.value)} className="w-full p-3 border border-border-custom outline-none focus:border-primary text-sm transition-colors">
                            <option value="">None</option>
                            <option value="NEW">NEW</option>
                            <option value="SALE">SALE</option>
                            <option value="LIMITED">LIMITED</option>
                            <option value="BESTSELLER">BESTSELLER</option>
                        </select>
                    </div>
                </div>
            </div>
        </section>
    );
}

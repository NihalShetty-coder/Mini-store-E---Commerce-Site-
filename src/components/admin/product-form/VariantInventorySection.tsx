'use client';

import React, { useMemo } from 'react';
import { Boxes, AlertTriangle } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

interface VariantInventorySectionProps {
    sizes: string[];
    colors: string[];
    variantInventory: Record<string, number>;
    setVariantInventory: (inventory: Record<string, number>) => void;
    lowStockThreshold: number;
}

function getVariantKey(size: string, color: string): string {
    return `${size}|${color}`;
}

export function VariantInventorySection({
    sizes,
    colors,
    variantInventory,
    setVariantInventory,
    lowStockThreshold,
}: VariantInventorySectionProps) {
    const hasVariants = sizes.length > 0 || colors.length > 0;

    // Build rows and columns for the matrix
    const rows = useMemo(() => (sizes.length > 0 ? sizes : ['']), [sizes]);
    const cols = useMemo(() => (colors.length > 0 ? colors : ['']), [colors]);
    const isSingleDimension = (sizes.length > 0 && colors.length === 0) || (sizes.length === 0 && colors.length > 0);

    // Calculate total stock from all variant entries
    const totalStock = useMemo(() => {
        return Object.values(variantInventory).reduce((sum, v) => sum + (v || 0), 0);
    }, [variantInventory]);

    // Find low stock variants
    const lowStockVariants = useMemo(() => {
        return Object.entries(variantInventory).filter(
            ([, stock]) => stock > 0 && stock <= lowStockThreshold
        );
    }, [variantInventory, lowStockThreshold]);

    const outOfStockVariants = useMemo(() => {
        const variants: string[] = [];
        for (const row of rows) {
            for (const col of cols) {
                const key = getVariantKey(row, col);
                if ((variantInventory[key] ?? 0) === 0) {
                    const label = [row, col].filter(Boolean).join(' / ') || 'Default';
                    variants.push(label);
                }
            }
        }
        return variants;
    }, [rows, cols, variantInventory]);

    if (!hasVariants) {
        return null;
    }

    const handleStockChange = (size: string, color: string, value: string) => {
        const key = getVariantKey(size, color);
        const numValue = value === '' ? 0 : Math.max(0, parseInt(value, 10) || 0);
        setVariantInventory({ ...variantInventory, [key]: numValue });
    };

    const getStockValue = (size: string, color: string): number => {
        return variantInventory[getVariantKey(size, color)] ?? 0;
    };

    const getCellColor = (stock: number): string => {
        if (stock === 0) return 'border-red-200 bg-red-50/50';
        if (stock <= lowStockThreshold) return 'border-yellow-200 bg-yellow-50/50';
        return 'border-border-custom';
    };

    // Set all variants to a specific value
    const handleSetAll = (value: number) => {
        const newInventory: Record<string, number> = {};
        for (const row of rows) {
            for (const col of cols) {
                newInventory[getVariantKey(row, col)] = value;
            }
        }
        setVariantInventory(newInventory);
    };

    return (
        <section>
            <SectionHeader
                icon={Boxes}
                title="Variant Inventory"
                subtitle="Set stock levels for each size and color combination."
            />
            <div className="space-y-4">
                {/* Quick Actions */}
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">Quick Set:</span>
                    {[0, 5, 10, 25, 50, 100].map((val) => (
                        <button
                            key={val}
                            type="button"
                            onClick={() => handleSetAll(val)}
                            className="px-2.5 py-1 text-[10px] font-bold border border-border-custom hover:border-primary hover:text-primary transition-colors"
                        >
                            {val}
                        </button>
                    ))}
                </div>

                {/* Matrix Table */}
                {isSingleDimension ? (
                    /* Single dimension: simple list layout */
                    <div className="space-y-2">
                        {(sizes.length > 0 ? sizes : colors).map((variant) => {
                            const size = sizes.length > 0 ? variant : '';
                            const color = colors.length > 0 ? variant : '';
                            const stock = getStockValue(size, color);
                            return (
                                <div
                                    key={variant}
                                    className={`flex items-center gap-4 p-3 border ${getCellColor(stock)} transition-colors`}
                                >
                                    <span className="text-xs font-bold text-secondary min-w-[80px]">
                                        {variant}
                                    </span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={stock}
                                        onChange={(e) => handleStockChange(size, color, e.target.value)}
                                        className="w-20 p-2 border border-border-custom outline-none focus:border-primary text-sm text-center font-bold transition-colors"
                                    />
                                    <span className="text-[10px] text-muted-custom">units</span>
                                    {stock === 0 && (
                                        <span className="text-[9px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 border border-red-200">
                                            Out of Stock
                                        </span>
                                    )}
                                    {stock > 0 && stock <= lowStockThreshold && (
                                        <span className="text-[9px] font-black uppercase tracking-wider text-yellow-700 bg-yellow-50 px-2 py-0.5 border border-yellow-200">
                                            Low Stock
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Two dimensions: full matrix */
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-2 text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom text-left border border-border-custom bg-surface">
                                        Size / Color
                                    </th>
                                    {cols.map((color) => (
                                        <th
                                            key={color}
                                            className="p-2 text-[9px] font-black uppercase tracking-[0.1em] text-secondary text-center border border-border-custom bg-surface min-w-[80px]"
                                        >
                                            {color || 'Default'}
                                        </th>
                                    ))}
                                    <th className="p-2 text-[9px] font-black uppercase tracking-[0.1em] text-muted-custom text-center border border-border-custom bg-surface min-w-[60px]">
                                        Row Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((size) => {
                                    const rowTotal = cols.reduce(
                                        (sum, color) => sum + getStockValue(size, color),
                                        0
                                    );
                                    return (
                                        <tr key={size}>
                                            <td className="p-2 text-xs font-bold text-secondary border border-border-custom bg-surface">
                                                {size || 'Default'}
                                            </td>
                                            {cols.map((color) => {
                                                const stock = getStockValue(size, color);
                                                return (
                                                    <td
                                                        key={color}
                                                        className={`p-1 border ${getCellColor(stock)} transition-colors`}
                                                    >
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={stock}
                                                            onChange={(e) =>
                                                                handleStockChange(size, color, e.target.value)
                                                            }
                                                            className="w-full p-1.5 outline-none text-sm text-center font-bold bg-transparent"
                                                        />
                                                    </td>
                                                );
                                            })}
                                            <td className="p-2 text-xs font-bold text-center text-muted-custom border border-border-custom bg-surface">
                                                {rowTotal}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {/* Column totals */}
                                <tr>
                                    <td className="p-2 text-[9px] font-black uppercase tracking-[0.1em] text-muted-custom border border-border-custom bg-surface">
                                        Col Total
                                    </td>
                                    {cols.map((color) => {
                                        const colTotal = rows.reduce(
                                            (sum, size) => sum + getStockValue(size, color),
                                            0
                                        );
                                        return (
                                            <td
                                                key={color}
                                                className="p-2 text-xs font-bold text-center text-muted-custom border border-border-custom bg-surface"
                                            >
                                                {colTotal}
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 text-xs font-black text-center text-secondary border border-border-custom bg-surface">
                                        {totalStock}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Summary Bar */}
                <div className="flex items-center justify-between p-3 bg-surface border border-border-custom">
                    <div className="flex items-center gap-4">
                        <div className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">
                            Total Stock:{' '}
                            <span className="text-secondary text-sm ml-1">{totalStock}</span>
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-custom">
                            Variants:{' '}
                            <span className="text-secondary text-sm ml-1">{rows.length * cols.length}</span>
                        </div>
                    </div>
                    {(lowStockVariants.length > 0 || outOfStockVariants.length > 0) && (
                        <div className="flex items-center gap-3">
                            {outOfStockVariants.length > 0 && (
                                <span className="text-[9px] font-black uppercase tracking-wider text-red-600">
                                    {outOfStockVariants.length} out of stock
                                </span>
                            )}
                            {lowStockVariants.length > 0 && (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-yellow-700">
                                    <AlertTriangle className="w-3 h-3" />
                                    {lowStockVariants.length} low stock
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

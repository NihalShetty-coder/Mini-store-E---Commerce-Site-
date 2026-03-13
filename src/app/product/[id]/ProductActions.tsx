'use client';

import React, { useState, useCallback, memo, lazy, Suspense } from 'react';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/use-analytics';
import type { Product } from '@/lib/firestore';

// Lazy-load the size guide modal (only loaded when opened)
const SizeGuideModal = lazy(() => import('./SizeGuideModal'));

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

const PRESET_COLOR_MAP: Record<string, string> = {
    'Black': '#000000', 'White': '#FFFFFF', 'Navy': '#1B2A4A', 'Grey': '#9CA3AF',
    'Red': '#DC2626', 'Burgundy': '#7F1D1D', 'Blue': '#2563EB', 'Green': '#16A34A',
    'Beige': '#D4C5A9', 'Brown': '#78350F', 'Pink': '#EC4899', 'Yellow': '#EAB308',
    'Orange': '#EA580C', 'Purple': '#9333EA', 'Teal': '#0D9488', 'Olive': '#4D7C0F',
};

interface ProductActionsProps {
    product: Product & { id: string };
}

function ProductActionsComponent({ product }: ProductActionsProps) {
    const addItem = useCart(state => state.addItem);
    const { addToast } = useToast();
    const { trackEvent } = useAnalytics();

    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [sizeError, setSizeError] = useState(false);
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

    const handleAddToCart = useCallback(() => {
        if (!selectedSize) {
            setSizeError(true);
            addToast('Please select a size first', 'error');
            return;
        }
        if (product.colors && product.colors.length > 0 && !selectedColor) {
            addToast('Please select a color', 'error');
            return;
        }
        setSizeError(false);
        for (let i = 0; i < quantity; i++) {
            addItem({ ...product, id: product.id }, selectedSize, selectedColor || undefined);
        }
        trackEvent('ADD_TO_CART', { path: `/product/${product.id}`, value: product.price * quantity, productId: product.id });
        addToast(`${product.name} added to your bag`, 'success');
    }, [selectedSize, selectedColor, product, quantity, addItem, trackEvent, addToast]);

    const handleSizeSelect = useCallback((size: string) => {
        setSelectedSize(size);
        setSizeError(false);
    }, []);

    const handleColorSelect = useCallback((color: string) => {
        setSelectedColor(color);
    }, []);

    const incrementQuantity = useCallback(() => {
        setQuantity(q => Math.min(10, q + 1));
    }, []);

    const decrementQuantity = useCallback(() => {
        setQuantity(q => Math.max(1, q - 1));
    }, []);

    const openSizeGuide = useCallback(() => {
        setIsSizeGuideOpen(true);
    }, []);

    const closeSizeGuide = useCallback(() => {
        setIsSizeGuideOpen(false);
    }, []);

    return (
        <>
            {/* Size Selector */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", sizeError ? "text-primary" : "text-secondary")}>
                        Select Size {!selectedSize && <span className="text-muted-custom font-normal ml-1">(required)</span>}
                    </span>
                    <button
                        onClick={openSizeGuide}
                        className="text-[10px] text-muted-custom font-bold uppercase tracking-widest underline hover:text-secondary transition-colors"
                    >
                        Size Guide
                    </button>
                </div>
                <div className="flex gap-3 flex-wrap">
                    {(product.sizes && product.sizes.length > 0 ? product.sizes : DEFAULT_SIZES).map(size => (
                        <button
                            key={size}
                            onClick={() => handleSizeSelect(size)}
                            className={cn(
                                "min-w-[48px] h-12 px-3 text-xs font-black uppercase tracking-wider border transition-all",
                                selectedSize === size
                                    ? "border-secondary bg-secondary text-white"
                                    : sizeError
                                        ? "border-primary text-secondary hover:border-secondary"
                                        : "border-border-custom text-secondary hover:border-secondary"
                            )}
                        >
                            {size}
                        </button>
                    ))}
                </div>
                {sizeError && (
                    <div className="flex items-center gap-1.5 mt-3 animate-[fadeSlideDown_0.2s_ease-out]">
                        <AlertCircle className="w-3 h-3 text-primary" />
                        <p className="text-[10px] text-primary font-bold">Please select a size to continue</p>
                    </div>
                )}
            </div>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
                <div className="mb-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary block mb-2">Available Colors</span>
                    <div className="flex gap-3 flex-wrap">
                        {product.colors.map(color => (
                            <button
                                key={color}
                                onClick={() => handleColorSelect(color)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 border transition-all",
                                    selectedColor === color ? "border-secondary bg-surface" : "border-border-custom bg-white hover:border-secondary"
                                )}
                            >
                                <span
                                    className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                                    style={{ backgroundColor: PRESET_COLOR_MAP[color] || color.toLowerCase() }}
                                />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">{color}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex items-center border border-border-custom shrink-0">
                    <button
                        onClick={decrementQuantity}
                        className="px-4 py-3 hover:bg-surface transition-colors font-bold text-lg leading-none"
                    >
                        &minus;
                    </button>
                    <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                    <button
                        onClick={incrementQuantity}
                        className="px-4 py-3 hover:bg-surface transition-colors font-bold text-lg leading-none"
                    >
                        +
                    </button>
                </div>
                <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-secondary text-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all hover:bg-primary active:scale-[0.98]"
                >
                    <ShoppingBag className="w-4 h-4" />
                    Add to Bag &bull; ₹{(product.price * quantity).toFixed(2)}
                </button>
            </div>

            {/* Size Guide Modal — lazy loaded */}
            {isSizeGuideOpen && (
                <Suspense fallback={null}>
                    <SizeGuideModal onClose={closeSizeGuide} />
                </Suspense>
            )}
        </>
    );
}

// Memoize to prevent unnecessary re-renders
const ProductActions = memo(ProductActionsComponent);
export default ProductActions;

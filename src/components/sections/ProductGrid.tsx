'use client';

import React from 'react';
import { Star, ShoppingBag } from 'lucide-react';
import { Product } from '@/lib/firestore';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useCart } from '@/hooks/use-cart';
import Link from 'next/link';

const PLACEHOLDER_IMAGE = '/placeholder-product.svg';

// Helper to check if URL is valid
const isValidImageUrl = (url: string | undefined | null): boolean => {
    if (!url || typeof url !== 'string') return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/') || url.startsWith('data:image');
};

// Get valid image URL or fallback
const getProductImage = (product: Product): string => {
    if (isValidImageUrl(product.image)) return product.image;
    if (product.images && product.images.length > 0 && isValidImageUrl(product.images[0])) {
        return product.images[0];
    }
    return PLACEHOLDER_IMAGE;
};

interface ProductCardProps {
    product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
    const addItem = useCart((state) => state.addItem);
    
    const imageSrc = getProductImage(product);

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="group relative bg-surface border border-border-custom overflow-hidden transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
        >
            {/* Badge */}
            {product.badge && (
                <div className={cn(
                    "absolute top-4 left-4 z-10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white",
                    product.badge === 'SALE' ? 'bg-primary' : 'bg-accent'
                )}>
                    {product.badge}
                </div>
            )}

            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-background">
                <Link href={`/product/${product.id}`}>
                    <img
                        src={imageSrc}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                            e.currentTarget.src = PLACEHOLDER_IMAGE;
                        }}
                    />
                </Link>
                <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/10 transition-colors pointer-events-none" />

                {/* Quick Add Button */}
                <button
                    onClick={() => addItem({ ...product, id: product.id! })}
                    className="absolute bottom-4 left-4 right-4 bg-surface text-secondary px-4 py-3 text-[10px] font-bold uppercase tracking-widest opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:bg-primary hover:text-white flex items-center justify-center gap-2"
                >
                    <ShoppingBag className="w-4 h-4" />
                    Quick Add
                </button>
            </div>

            {/* Info */}
            <div className="p-3 text-center">
                <div className="flex justify-center gap-0.5 mb-1.5">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={cn("w-2.5 h-2.5", i < (product.rating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-border-custom")}
                        />
                    ))}
                </div>

                <h3 className="font-playfair text-sm font-bold text-secondary mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {product.name}
                </h3>

                <div className="flex items-center justify-center gap-2 text-xs">
                    <span className="text-secondary font-bold font-inter tracking-tight">
                        ₹{product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                        <span className="text-xs text-muted-custom line-through ml-2">
                            ₹{product.originalPrice.toFixed(2)}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const ProductGrid = ({
    products,
    isLoading = false,
    className
}: {
    products: Product[],
    isLoading?: boolean,
    className?: string
}) => {
    if (isLoading && products.length === 0) {
        return (
            <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6", className)}>
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="bg-surface border border-border-custom overflow-hidden animate-pulse">
                        <div className="aspect-square bg-background" />
                        <div className="p-4 space-y-3">
                            <div className="h-4 w-24 bg-background mx-auto" />
                            <div className="h-6 w-48 bg-background mx-auto" />
                            <div className="h-4 w-16 bg-background mx-auto" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6", className)}>
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    );
};

export default ProductGrid;

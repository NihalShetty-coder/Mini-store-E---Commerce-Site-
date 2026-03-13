'use client';

import React, { useState, useCallback, memo } from 'react';
import { Heart, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/hooks/use-wishlist';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/firestore';

const PLACEHOLDER_IMAGE = '/placeholder-product.svg';

/** Get all displayable images — keeps all non-empty URLs, falls back to product.image */
const getValidImages = (product: Product): string[] => {
    const valid: string[] = [];
    if (product.images && product.images.length > 0) {
        for (const img of product.images) {
            if (img && typeof img === 'string' && img.trim() !== '') valid.push(img);
        }
    }
    if (valid.length === 0 && product.image && product.image.trim() !== '') {
        valid.push(product.image);
    }
    return valid;
};

interface ProductGalleryProps {
    product: Product & { id: string };
}

function ProductGalleryComponent({ product }: ProductGalleryProps) {
    const { toggleItem, isWishlisted } = useWishlist();
    const { addToast } = useToast();
    const { user } = useAuth();

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [mainImageLoaded, setMainImageLoaded] = useState(false);

    const wishlisted = isWishlisted(product.id);
    const validImages = getValidImages(product);
    const mainImage = validImages[currentImageIndex] || PLACEHOLDER_IMAGE;

    const handleMainImageLoad = useCallback(() => {
        setMainImageLoaded(true);
    }, []);

    const handleWishlistToggle = useCallback(() => {
        if (!user) {
            addToast('Sign in to save items to your wishlist', 'info');
            return;
        }
        toggleItem(user.id, { ...product, id: product.id });
        addToast(wishlisted ? 'Removed from wishlist' : 'Saved to your wishlist', wishlisted ? 'info' : 'success');
    }, [user, product, wishlisted, toggleItem, addToast]);

    const handleThumbnailClick = useCallback((idx: number) => {
        setCurrentImageIndex(idx);
        setMainImageLoaded(false);
    }, []);

    return (
        <div className="w-full lg:w-5/12 flex flex-col gap-4">
            <div className="relative aspect-square w-full bg-surface border border-border-custom overflow-hidden shadow-sm">
                {/* Skeleton pulse while loading */}
                {!mainImageLoaded && mainImage !== PLACEHOLDER_IMAGE && (
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse z-[1]">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ImageOff className="w-8 h-8 text-gray-300" />
                        </div>
                    </div>
                )}
                <img
                    key={mainImage}
                    src={mainImage}
                    alt={product.name}
                    className={cn(
                        "w-full h-full object-cover object-top transition-opacity duration-300",
                        mainImageLoaded || mainImage === PLACEHOLDER_IMAGE ? "opacity-100" : "opacity-0"
                    )}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    onLoad={handleMainImageLoad}
                    onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; setMainImageLoaded(true); }}
                />
                {product.badge && (
                    <div className={cn(
                        "absolute top-8 left-8 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white z-10",
                        product.badge === 'SALE' ? 'bg-primary' : 'bg-accent'
                    )}>
                        {product.badge}
                    </div>
                )}
                <button
                    onClick={handleWishlistToggle}
                    className="absolute top-8 right-8 w-10 h-10 bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors group z-10"
                >
                    <Heart className={cn("w-4 h-4 transition-all", wishlisted ? "fill-primary text-primary scale-110" : "text-secondary group-hover:text-primary")} />
                </button>
            </div>
            {validImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                    {validImages.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleThumbnailClick(idx)}
                            className={cn(
                                "relative aspect-square border overflow-hidden transition-all bg-surface",
                                currentImageIndex === idx ? "border-secondary ring-1 ring-secondary" : "border-border-custom hover:border-secondary/50"
                            )}
                        >
                            <img
                                src={img}
                                alt={`${product.name} ${idx + 1}`}
                                className="w-full h-full object-cover object-top"
                                loading={idx === 0 ? "eager" : "lazy"}
                                decoding="async"
                                onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// Memoize to prevent unnecessary re-renders
const ProductGallery = memo(ProductGalleryComponent);
export default ProductGallery;

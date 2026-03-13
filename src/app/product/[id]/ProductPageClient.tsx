'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Star } from 'lucide-react';
import type { Product } from '@/lib/firestore';

// Dynamic imports with loading skeletons - reduces initial bundle size
const ProductGallery = dynamic(() => import('./ProductGallery'), {
    loading: () => <GallerySkeleton />,
    ssr: true,
});

const ProductActions = dynamic(() => import('./ProductActions'), {
    loading: () => <ActionsSkeleton />,
    ssr: true,
});

// Lazy-load heavy layout components
const Navbar = dynamic(() => import('@/components/layout/Navbar'), {
    loading: () => <NavbarSkeleton />,
    ssr: true,
});

const Footer = dynamic(() => import('@/components/layout/Footer'), {
    loading: () => <FooterSkeleton />,
    ssr: true,
});

// ─── Skeleton Components ────────────────────────────────────────────
function NavbarSkeleton() {
    return (
        <header className="sticky top-0 z-50 w-full bg-surface border-b border-border-custom px-4 lg:px-0">
            <div className="container mx-auto">
                <div className="flex h-20 items-center justify-between gap-4 px-6 md:px-10 lg:px-16">
                    <div className="h-8 w-32 bg-gray-200 animate-pulse" />
                    <div className="hidden md:flex flex-1 max-w-md">
                        <div className="h-10 w-full bg-gray-100 animate-pulse rounded" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
                        <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
                        <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
                    </div>
                </div>
            </div>
        </header>
    );
}

function FooterSkeleton() {
    return (
        <footer className="bg-secondary text-[#ccc] pt-20 pb-12 mt-20">
            <div className="container mx-auto px-6 md:px-10 lg:px-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="space-y-4">
                            <div className="h-6 w-24 bg-white/10 animate-pulse rounded" />
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-white/5 animate-pulse rounded" />
                                <div className="h-4 w-3/4 bg-white/5 animate-pulse rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </footer>
    );
}

function GallerySkeleton() {
    return (
        <div className="w-full lg:w-5/12 flex flex-col gap-4">
            <div className="aspect-square w-full bg-surface border border-border-custom animate-pulse" />
            <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="aspect-square bg-surface border border-border-custom animate-pulse" />
                ))}
            </div>
        </div>
    );
}

function ActionsSkeleton() {
    return (
        <div className="space-y-6">
            {/* Size selector skeleton */}
            <div>
                <div className="h-4 w-24 bg-gray-200 animate-pulse mb-2" />
                <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-12 h-12 bg-gray-100 border border-border-custom animate-pulse" />
                    ))}
                </div>
            </div>
            {/* Add to cart skeleton */}
            <div className="flex gap-3">
                <div className="w-32 h-12 bg-gray-100 border border-border-custom animate-pulse" />
                <div className="flex-1 h-12 bg-secondary/50 animate-pulse" />
            </div>
        </div>
    );
}

// ─── Product Info (inline - no dynamic import needed for static text) ───
function ProductInfo({ product }: { product: Product & { id: string; totalStock?: number } }) {
    const displayStock = product.totalStock ?? product.stock ?? 0;
    const isLowStock = displayStock > 0 && displayStock <= 5;
    
    return (
        <>
            <div className="mb-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">{product.category}</div>
                <h1 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-black text-secondary mb-3 leading-tight">{product.name}</h1>
                <div className="flex items-center gap-4 mb-4 text-secondary">
                    <div className="flex items-center gap-1.5">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-border-custom" />
                        ))}
                        <span className="text-[10px] font-bold ml-2">(0 Reviews)</span>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex items-baseline gap-4 mb-2">
                    <span className="text-2xl font-playfair font-black text-secondary">₹{product.price}</span>
                    {product.originalPrice && (
                        <span className="text-lg text-muted-custom line-through font-playfair">₹{product.originalPrice}</span>
                    )}
                </div>
                
                {/* Stock Display */}
                <div className="flex items-center gap-2 mb-3">
                    {displayStock > 0 ? (
                        <>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isLowStock ? 'text-yellow-600' : 'text-green-600'}`}>
                                {isLowStock ? 'Low Stock' : 'In Stock'}
                            </span>
                            <span className="text-[10px] text-muted-custom">
                                ({displayStock} {displayStock === 1 ? 'unit' : 'units'} available)
                            </span>
                        </>
                    ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                            Out of Stock
                        </span>
                    )}
                </div>
                
                <p className="text-muted-custom text-sm leading-relaxed max-w-lg whitespace-pre-line">
                    {product.description || <span className="italic">No description available.</span>}
                </p>
            </div>
        </>
    );
}

// ─── Reviews Section (static, no interactivity) ─────────────────────
function ReviewsSection({ productName }: { productName: string }) {
    return (
        <div className="mt-16 border-t border-border-custom pt-16">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                <div>
                    <h2 className="font-playfair text-3xl font-black text-secondary mb-3">Customer Experience</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-5 h-5 text-border-custom" />
                            ))}
                        </div>
                        <span className="text-sm font-bold text-secondary">0.0 / 5.0 Based on 0 reviews</span>
                    </div>
                </div>
                <button className="bg-secondary text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-primary active:scale-[0.98]">
                    Write a Review
                </button>
            </div>

            <div className="py-12 text-center border border-dashed border-border-custom bg-surface">
                <p className="text-muted-custom text-sm font-medium">No reviews yet. Be the first to share your experience with the {productName}.</p>
            </div>
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────
interface ProductPageClientProps {
    product: Product & { id: string };
}

export default function ProductPageClient({ product }: ProductPageClientProps) {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background">
            <Suspense fallback={<NavbarSkeleton />}>
                <Navbar />
            </Suspense>

            <main className="container mx-auto px-6 md:px-10 lg:px-16 py-4 md:py-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-muted-custom hover:text-secondary transition-colors mb-6 group"
                >
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Back to Collection</span>
                </button>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 max-w-7xl mx-auto items-start justify-start">
                    {/* Product Gallery - Dynamic with skeleton */}
                    <Suspense fallback={<GallerySkeleton />}>
                        <ProductGallery product={product} />
                    </Suspense>

                    {/* Product Details */}
                    <div className="w-full lg:w-7/12 flex flex-col pt-0 lg:pt-2">
                        {/* Static info - renders immediately */}
                        <ProductInfo product={product} />

                        {/* Interactive actions - Dynamic with skeleton */}
                        <Suspense fallback={<ActionsSkeleton />}>
                            <ProductActions product={product} />
                        </Suspense>
                    </div>
                </div>

                {/* Reviews - Static content */}
                <ReviewsSection productName={product.name} />
            </main>

            <Suspense fallback={<FooterSkeleton />}>
                <Footer />
            </Suspense>
        </div>
    );
}

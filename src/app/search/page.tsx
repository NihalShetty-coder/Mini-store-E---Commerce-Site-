'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ProductCard } from '@/components/sections/ProductGrid';
import { useInventory } from '@/hooks/use-inventory';

const SearchContent = () => {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const { products, isLoading, fetchProducts } = useInventory();

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase().trim();
        return products.filter(p => {
            const isActive = p.status === 'Active' || !p.status;
            if (!isActive) return false;
            return p.name.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                (p.tags && p.tags.some(t => t.toLowerCase().includes(q)));
        });
    }, [query, products]);

    return (
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 pb-12 border-b border-border-custom">
                <Search className="w-8 h-8 text-primary mx-auto mb-6" />
                <h1 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary mb-4">
                    Search Results
                </h1>
                <p className="font-playfair text-3xl md:text-5xl font-black text-secondary">
                    &ldquo;{query}&rdquo;
                </p>
                <p className="text-muted-custom text-sm mt-6">
                    {isLoading && products.length === 0 ? 'Searching...' : `${results.length} items found`}
                </p>
            </div>

            {(isLoading && products.length === 0) ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent flex items-center justify-center rounded-full animate-spin shrink-0" />
                </div>
            ) : results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                    {results.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : !isLoading ? (
                <div className="text-center py-20 px-6 bg-surface border border-dashed border-border-custom">
                    <p className="font-playfair text-2xl font-black text-secondary mb-2">No matching items found</p>
                    <p className="text-muted-custom text-sm">Try using different keywords or checking your spelling.</p>
                </div>
            ) : (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent flex items-center justify-center rounded-full animate-spin shrink-0" />
                </div>
            )}
        </div>
    );
};

export default function SearchPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-6 md:px-10 lg:px-16 py-12 md:py-20 min-h-[60vh]">
                <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
                    <SearchContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}

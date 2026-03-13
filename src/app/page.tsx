'use client';

import React, { useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/sections/Hero';
import StatsBanner from '@/components/sections/StatsBanner';
import ProductGrid from '@/components/sections/ProductGrid';
import Footer from '@/components/layout/Footer';
import { useInventory } from '@/hooks/use-inventory';

export default function Home() {
  const { products, fetchProducts, isLoading } = useInventory();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, [fetchProducts]);

  const featuredProducts = useMemo(() => {
    // We filter locally here to be 100% sure we are using the current products state
    return products.filter(p => !p.status || p.status === 'Active').slice(0, 8);
  }, [products]);

  // Prevent hydration mismatch
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <StatsBanner />

      <main id="product-grid" className="container mx-auto px-6 md:px-10 lg:px-16 py-24">
        <div className="flex items-center justify-between mb-12 border-b border-border-custom pb-6">
          <h2 className="font-playfair text-3xl font-bold text-secondary">
            Featured Collection
          </h2>
          <a href="/shop" className="text-xs font-bold uppercase tracking-widest text-primary hover:underline transition-all">
            View All Collection
          </a>
        </div>

        {/* 
            Logic: 
            1. If isLoading is true and we have NOTHING yet -> show skeletons
            2. If we have products -> show grid (even if still loading in background)
            3. If isLoading is false and we still have NOTHING -> "New arrivals coming soon"
        */}
        {(isLoading && products.length === 0) ? (
          <ProductGrid products={[]} isLoading={true} />
        ) : featuredProducts.length > 0 ? (
          <ProductGrid products={featuredProducts} isLoading={isLoading} />
        ) : !isLoading ? (
          <div className="text-center py-20 bg-surface border border-dashed border-border-custom">
            <p className="text-muted-custom font-playfair text-xl">New arrivals coming soon.</p>
          </div>
        ) : (
          <ProductGrid products={[]} isLoading={true} />
        )}
      </main>

      <Footer />
    </div>
  );
}

'use client';

import React, { useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import ProductGrid from '@/components/sections/ProductGrid';
import Footer from '@/components/layout/Footer';
import { useInventory } from '@/hooks/use-inventory';
import { useFilter, type SortOption } from '@/hooks/use-filter';
import { ArrowUpDown } from 'lucide-react';

export default function ShopPage() {
    const { 
        searchQuery, 
        selectedCategory, 
        selectedBadge, 
        selectedSizes,
        selectedColors,
        selectedMaterials,
        priceFilter,
        sortBy,
        setSortBy
    } = useFilter();
    const { products, fetchProducts, isLoading } = useInventory();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        fetchProducts();
    }, [fetchProducts]);

    const filteredProducts = useMemo(() => {
        // Filter active products inline instead of using getActiveProducts
        const activeProducts = products.filter((p) => !p.status || p.status === 'Active');
        
        const filtered = activeProducts.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

            const matchesCategory = selectedCategory === 'All' ||
                product.category === selectedCategory ||
                product.subCategory === selectedCategory;

            const matchesBadge = !selectedBadge || product.badge === selectedBadge;

            const matchesSize = selectedSizes.length === 0 || 
                (product.sizes && selectedSizes.some(size => product.sizes?.includes(size)));

            const matchesColor = selectedColors.length === 0 || 
                (product.colors && selectedColors.some(color => product.colors?.includes(color)));

            const matchesMaterial = selectedMaterials.length === 0 || 
                (product.material && selectedMaterials.includes(product.material));

            // Price filter logic
            let matchesPrice = true;
            switch (priceFilter) {
                case 'under-50':
                    matchesPrice = product.price < 50;
                    break;
                case '50-100':
                    matchesPrice = product.price >= 50 && product.price <= 100;
                    break;
                case '100-200':
                    matchesPrice = product.price >= 100 && product.price <= 200;
                    break;
                case '200-500':
                    matchesPrice = product.price >= 200 && product.price <= 500;
                    break;
                case '500-plus':
                    matchesPrice = product.price >= 500;
                    break;
                case 'all':
                default:
                    matchesPrice = true;
                    break;
            }

            return matchesSearch && matchesCategory && matchesBadge && matchesSize && matchesColor && matchesMaterial && matchesPrice;
        });

        // Apply sorting
        switch (sortBy) {
            case 'price-low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'name-az':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-za':
                filtered.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'newest':
            default:
                // Newest first (assuming createdAt exists, or keep original order)
                filtered.sort((a, b) => {
                    const toTime = (d: Date | { toDate?: () => Date } | undefined): number => {
                        if (!d) return 0;
                        if (d instanceof Date) return d.getTime();
                        if (typeof (d as { toDate?: () => Date }).toDate === 'function') return (d as { toDate: () => Date }).toDate().getTime();
                        return 0;
                    };
                    return toTime(b.createdAt) - toTime(a.createdAt);
                });
                break;
        }

        return filtered;
    }, [products, searchQuery, selectedCategory, selectedBadge, selectedSizes, selectedColors, selectedMaterials, priceFilter, sortBy]);

    const pageTitle = React.useMemo(() => {
        if (searchQuery) return `Search: "${searchQuery}"`;
        if (selectedCategory !== 'All') return selectedCategory;
        if (selectedBadge === 'NEW') return 'New Arrivals';
        if (selectedBadge === 'SALE') return 'Sale';
        if (selectedBadge === 'LIMITED') return 'Limited Edition';
        return 'All Collection';
    }, [searchQuery, selectedCategory, selectedBadge]);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-6 md:px-10 lg:px-16 pt-32 pb-24">
                <div className="mb-12 border-b border-border-custom pb-6">
                    <h1 className="font-playfair text-4xl md:text-5xl font-black text-secondary leading-tight">
                        {pageTitle}
                    </h1>
                    <p className="text-muted-custom text-sm mt-3 max-w-2xl">
                        Explore our carefully curated selection of elevated essentials designed for the modern wardrobe.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Sidebar - Hidden on mobile, shown on large screens */}
                    <Sidebar className="hidden lg:block w-72 shrink-0" />

                    {/* Main Product Grid */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <div className="text-xs font-bold uppercase tracking-widest text-secondary">
                                {isLoading ? "Fetching Products..." : `${filteredProducts.length} Results`}
                            </div>
                            
                            {/* Sort Dropdown */}
                            <div className="flex items-center gap-3">
                                <ArrowUpDown className="w-4 h-4 text-muted-custom" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    className="text-xs font-bold uppercase tracking-widest bg-white border border-border-custom px-4 py-2 outline-none focus:border-primary transition-all cursor-pointer"
                                >
                                    <option value="newest">Newest</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="name-az">Name: A-Z</option>
                                    <option value="name-za">Name: Z-A</option>
                                </select>
                            </div>
                        </div>

                        {isLoading && filteredProducts.length === 0 ? (
                            <ProductGrid products={[]} isLoading={true} />
                        ) : filteredProducts.length > 0 ? (
                            <ProductGrid products={filteredProducts} isLoading={isLoading} />
                        ) : !isLoading ? (
                            <div className="text-center py-20 bg-surface border border-dashed border-border-custom">
                                <p className="text-muted-custom font-playfair text-xl">No products found matching your criteria.</p>
                                <button
                                    onClick={() => useFilter.getState().resetFilters()}
                                    className="mt-6 text-primary font-black uppercase tracking-widest text-[10px] border-b border-primary pb-1 hover:border-transparent transition-colors"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            <ProductGrid products={[]} isLoading={true} />
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, Edit, Eye, Trash2, X, Trash, PackagePlus, AlertTriangle } from 'lucide-react';
import { useInventory } from '@/hooks/use-inventory';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ProductForm, { type ProductFormData } from '@/components/admin/ProductForm';
import { type Product } from '@/lib/firestore';

export default function AdminProductsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const { products, addProduct: storeAddProduct, deleteProduct: storeDeleteProduct, updateProduct: storeUpdateProduct, fetchAllProducts } = useInventory();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('All Statuses');
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | { id: string; name: string } | null>(null);
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
    const [productToRestock, setProductToRestock] = useState<Product | null>(null);
    const [restockQuantity, setRestockQuantity] = useState<string>('');
    const [isRestocking, setIsRestocking] = useState(false);
    const categoryRef = useRef<HTMLDivElement>(null);
    const statusRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
                setIsCategoryDropdownOpen(false);
            }
            if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => { fetchAllProducts(); }, [fetchAllProducts]);

    // Reset selection when filters change
    useEffect(() => { setSelectedIds([]); }, [searchQuery, categoryFilter, statusFilter]);

    // Categories & statuses
    const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
    const statuses = ['All Statuses', 'Active', 'Draft', 'Archived'];

    // Body scroll lock
    useEffect(() => {
        if (isFormOpen || isViewModalOpen || isDeleteModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isFormOpen, isViewModalOpen, isDeleteModalOpen]);

    // ─── Form Submit ─────────────────────────────────────
    const handleFormSubmit = (data: ProductFormData) => {
        if (formMode === 'edit' && selectedProduct?.id) {
            storeUpdateProduct(selectedProduct.id, data);
            addToast('Product updated successfully', 'success');
        } else {
            storeAddProduct(data);
            addToast('New product added to inventory', 'success');
        }
        setIsFormOpen(false);
        setSelectedProduct(null);
    };

    // ─── Sorting & Filtering ────────────────────────────
    const sortedAndFilteredProducts = useMemo(() => {
        const result = products.filter(p =>
            (categoryFilter === 'All' || p.category === categoryFilter) &&
            (statusFilter === 'All Statuses' || p.status === statusFilter) &&
            (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.category.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = (a as unknown as Record<string, string | number>)[sortConfig.key];
                const bValue = (b as unknown as Record<string, string | number>)[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [products, searchQuery, sortConfig, categoryFilter, statusFilter]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedIds(sortedAndFilteredProducts.map(p => p.id!));
        else setSelectedIds([]);
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        setProductToDelete({ id: 'bulk', name: `${selectedIds.length} products` });
        setIsDeleteModalOpen(true);
    };

    const handleDelete = (id: string) => {
        const product = products.find(p => p.id === id);
        if (!product) return;
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;
        try {
            if (productToDelete.id === 'bulk') {
                await Promise.all(selectedIds.map(id => storeDeleteProduct(id)));
                setSelectedIds([]);
                addToast('Selected products deleted', 'success');
            } else {
                await storeDeleteProduct(productToDelete.id!);
                addToast('Product deleted successfully', 'success');
            }
        } catch {
            addToast('An unexpected error occurred during deletion', 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
        }
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setFormMode('edit');
        setIsFormOpen(true);
    };

    const handleView = (product: Product) => {
        setSelectedProduct(product);
        setIsViewModalOpen(true);
    };

    const handleRestock = (product: Product) => {
        setProductToRestock(product);
        setRestockQuantity('');
        setIsRestockModalOpen(true);
    };

    const confirmRestock = async () => {
        if (!productToRestock || !restockQuantity) return;
        
        const quantity = parseInt(restockQuantity, 10);
        if (isNaN(quantity) || quantity <= 0) {
            addToast('Please enter a valid quantity', 'error');
            return;
        }

        setIsRestocking(true);
        try {
            const newStock = (productToRestock.stock || 0) + quantity;
            await storeUpdateProduct(productToRestock.id!, {
                stock: newStock,
                status: 'Active'
            });
            addToast(`Restocked ${quantity} units. New stock: ${newStock}`, 'success');
            setIsRestockModalOpen(false);
            setProductToRestock(null);
            setRestockQuantity('');
        } catch {
            addToast('Failed to restock product', 'error');
        } finally {
            setIsRestocking(false);
        }
    };

    const handleAddClick = () => {
        setSelectedProduct(null);
        setFormMode('add');
        setIsFormOpen(true);
    };

    const handleExportCSV = () => {
        const headers = ['ID', 'Name', 'SKU', 'Category', 'Price', 'Stock', 'Status'];
        const csvContent = [
            headers.join(','),
            ...sortedAndFilteredProducts.map(p =>
                [p.id, `"${p.name}"`, p.sku, `"${p.category}"`, p.price, p.stock, p.status].join(',')
            )
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('Exported successfully', 'success');
    };

    if (!mounted) return null;

    return (
        <div className="max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-custom">
                <div>
                    <h1 className="font-playfair text-4xl font-black text-secondary">Products</h1>
                    <p className="text-muted-custom text-sm mt-2">Manage your inventory, pricing, and product details.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handleExportCSV} className="bg-white border border-border-custom text-secondary px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-surface">
                        Export CSV
                    </button>
                    <button onClick={handleAddClick} className="bg-secondary text-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:bg-primary">
                        + New Product
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex gap-4 w-full max-w-lg">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-custom" />
                            <input 
                                id="admin-product-search"
                                name="productSearch"
                                type="text" 
                                placeholder="Filter products by name or category..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                className="w-full pl-12 pr-6 py-3 border border-border-custom bg-white text-xs outline-none focus:border-primary transition-all" 
                            />
                        </div>
                        <div className="relative" ref={categoryRef}>
                            <button onClick={() => { setIsCategoryDropdownOpen(!isCategoryDropdownOpen); setIsStatusDropdownOpen(false); }} className="px-6 py-3 border border-border-custom bg-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-surface w-40 justify-between">
                                <span className="flex items-center gap-2"><Filter className="w-3 h-3" />{categoryFilter === 'All' ? 'Category' : categoryFilter.split(' ')[0]}</span>
                                {isCategoryDropdownOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {isCategoryDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-border-custom shadow-xl z-50">
                                    {categories.map((cat) => (
                                        <button key={cat} onClick={() => { setCategoryFilter(cat); setIsCategoryDropdownOpen(false); }} className={cn("w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-surface", categoryFilter === cat ? "bg-secondary text-white hover:bg-secondary" : "text-secondary")}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="relative" ref={statusRef}>
                            <button onClick={() => { setIsStatusDropdownOpen(!isStatusDropdownOpen); setIsCategoryDropdownOpen(false); }} className="px-6 py-3 border border-border-custom bg-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-surface w-40 justify-between">
                                <span className="flex items-center gap-2"><Filter className="w-3 h-3" />{statusFilter === 'All Statuses' ? 'Status' : statusFilter}</span>
                                {isStatusDropdownOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {isStatusDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-border-custom shadow-xl z-50">
                                    {statuses.map((stat) => (
                                        <button key={stat} onClick={() => { setStatusFilter(stat); setIsStatusDropdownOpen(false); }} className={cn("w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-surface", statusFilter === stat ? "bg-secondary text-white hover:bg-secondary" : "text-secondary")}>
                                            {stat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div className="bg-surface border border-border-custom px-6 py-3 flex items-center justify-between">
                        <span className="text-secondary font-bold text-[10px] uppercase tracking-widest">{selectedIds.length} products selected</span>
                        <button onClick={handleBulkDelete} className="text-red-500 hover:text-red-600 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors">
                            <Trash className="w-3 h-3" /> Delete Selected
                        </button>
                    </div>
                )}

                {/* Product Table */}
                <div className="bg-white border border-border-custom overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border-custom bg-surface">
                                <th className="pl-6 pr-2 py-4 w-12">
                                    <input 
                                        id="select-all-products"
                                        name="selectAll"
                                        type="checkbox" 
                                        onChange={handleSelectAll} 
                                        checked={selectedIds.length > 0 && selectedIds.length === sortedAndFilteredProducts.length} 
                                        className="accent-primary cursor-pointer w-4 h-4"
                                        aria-label="Select all products" 
                                    />
                                </th>
                                <th onClick={() => handleSort('name')} className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-secondary cursor-pointer hover:bg-black/5 transition-colors">
                                    <div className="flex items-center gap-2">Product {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}</div>
                                </th>
                                <th onClick={() => handleSort('category')} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary cursor-pointer hover:bg-black/5 transition-colors">
                                    <div className="flex items-center gap-2">Category {sortConfig?.key === 'category' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}</div>
                                </th>
                                <th onClick={() => handleSort('stock')} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary cursor-pointer hover:bg-black/5 transition-colors">
                                    <div className="flex items-center gap-2">Stock {sortConfig?.key === 'stock' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}</div>
                                </th>
                                <th onClick={() => handleSort('price')} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary cursor-pointer hover:bg-black/5 transition-colors">
                                    <div className="flex items-center gap-2">Price {sortConfig?.key === 'price' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}</div>
                                </th>
                                <th onClick={() => handleSort('status')} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary cursor-pointer hover:bg-black/5 transition-colors">
                                    <div className="flex items-center gap-2">Status {sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}</div>
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-custom">
                            {sortedAndFilteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-muted-custom bg-surface/30">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="p-4 bg-white border border-border-custom rounded-full mb-2">
                                                <Search className="w-8 h-8 text-border-custom" />
                                            </div>
                                            <p className="font-playfair font-black text-xl text-secondary">No products found</p>
                                            <p className="text-xs uppercase tracking-widest font-bold">Use &ldquo;+ New Product&rdquo; to add your first product.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedAndFilteredProducts.map((product) => (
                                    <tr key={product.id ?? ''} className={cn("hover:bg-surface/50 transition-colors group", selectedIds.includes(product.id ?? '') && "bg-surface/80")}>
                                        <td className="pl-6 pr-2 py-4">
                                            <input 
                                                id={`select-product-${product.id}`}
                                                name={`selectProduct-${product.id}`}
                                                type="checkbox" 
                                                checked={selectedIds.includes(product.id ?? '')} 
                                                onChange={() => handleSelectOne(product.id ?? '')} 
                                                className="accent-primary cursor-pointer w-4 h-4"
                                                aria-label={`Select ${product.name}`} 
                                            />
                                        </td>
                                        <td className="px-4 py-4 text-xs">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white border border-border-custom shrink-0 overflow-hidden">
                                                    <img src={product.image || product.images?.[0] || '/placeholder-product.svg'} alt={product.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-secondary">{product.name}</span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-custom">{product.sku}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-custom">{product.category}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-2 h-2 rounded-full",
                                                    (product.stock ?? 0) > (product.lowStockThreshold ?? 5) ? "bg-accent" :
                                                    (product.stock ?? 0) > 0 ? "bg-yellow-500" : "bg-red-500"
                                                )} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-secondary">{product.stock ?? 0} in stock</span>
                                                {(product.stock ?? 0) > 0 && (product.stock ?? 0) <= (product.lowStockThreshold ?? 5) && (
                                                    <span title="Low stock"><AlertTriangle className="w-3 h-3 text-yellow-500" /></span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-playfair font-black text-secondary">₹{product.price.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 border",
                                                product.status === 'Active' ? "border-accent text-accent bg-accent/5" :
                                                    product.status === 'Draft' ? "border-yellow-500 text-yellow-600 bg-yellow-500/5" :
                                                        "border-red-500 text-red-500 bg-red-500/5"
                                            )}>
                                                {product.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(product)} className="p-2 hover:bg-white border border-transparent hover:border-border-custom hover:text-primary transition-all text-muted-custom shadow-sm"><Edit className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => handleView(product)} className="p-2 hover:bg-white border border-transparent hover:border-border-custom hover:text-primary transition-all text-muted-custom shadow-sm"><Eye className="w-3.5 h-3.5" /></button>
                                                {(product.status === 'Out of Stock' || (product.stock ?? 0) === 0) && (
                                                    <button onClick={() => handleRestock(product)} className="p-2 hover:bg-green-50 border border-transparent hover:border-green-200 hover:text-green-600 transition-all text-muted-custom shadow-sm" title="Restock"><PackagePlus className="w-3.5 h-3.5" /></button>
                                                )}
                                                <button onClick={() => handleDelete(product.id!)} className="p-2 hover:bg-red-50 border border-transparent hover:border-red-200 hover:text-red-500 transition-all text-muted-custom shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ═══ SLIDE-OVER PANEL (Add/Edit Product) ═══ */}
            <AnimatePresence>
                {isFormOpen && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFormOpen(false)}
                            className="absolute inset-0 bg-secondary/30 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="relative bg-white w-full max-w-3xl h-full shadow-2xl flex flex-col"
                        >
                            {/* Panel Header */}
                            <div className="shrink-0 px-8 py-6 border-b border-border-custom flex items-center justify-between bg-surface">
                                <div>
                                    <h2 className="font-playfair text-2xl font-black text-secondary">
                                        {formMode === 'add' ? 'Add New Product' : 'Edit Product'}
                                    </h2>
                                    <p className="text-[10px] text-muted-custom font-bold uppercase tracking-widest mt-1">
                                        {formMode === 'add' ? 'Fill in the details below to create a new product.' : `Editing: ${selectedProduct?.name}`}
                                    </p>
                                </div>
                                <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-white border border-transparent hover:border-border-custom transition-all text-muted-custom">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Product Form */}
                            <div className="flex-1 overflow-hidden">
                                <ProductForm
                                    key={selectedProduct?.id || 'new'}
                                    mode={formMode}
                                    initialData={formMode === 'edit' && selectedProduct ? {
                                        name: selectedProduct.name,
                                        description: selectedProduct.description,
                                        price: selectedProduct.price,
                                        originalPrice: selectedProduct.originalPrice,
                                        category: selectedProduct.category,
                                        subCategory: selectedProduct.subCategory,
                                        stock: selectedProduct.stock,
                                        sku: selectedProduct.sku,
                                        status: selectedProduct.status || 'Active',
                                        badge: selectedProduct.badge || '',
                                        image: selectedProduct.image,
                                        images: selectedProduct.images || (selectedProduct.image ? [selectedProduct.image] : []),
                                        videos: selectedProduct.videos || [],
                                        sizes: selectedProduct.sizes || [],
                                        colors: selectedProduct.colors || [],
                                        material: selectedProduct.material || '',
                                        brand: selectedProduct.brand || '',
                                        tags: selectedProduct.tags || [],
                                        seo: {
                                            title: selectedProduct.seo?.title ?? '',
                                            description: selectedProduct.seo?.description ?? '',
                                            keywords: selectedProduct.seo?.keywords ?? [],
                                        },
                                        variantInventory: selectedProduct.variantInventory || {},
                                        lowStockThreshold: selectedProduct.lowStockThreshold ?? 5,
                                    } : undefined}
                                    onSubmit={handleFormSubmit}
                                    onCancel={() => setIsFormOpen(false)}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══ VIEW MODAL ═══ */}
            <AnimatePresence>
                {isViewModalOpen && selectedProduct && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsViewModalOpen(false)} className="absolute inset-0 bg-secondary/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-lg p-10 shadow-2xl">
                            <button onClick={() => setIsViewModalOpen(false)} className="absolute top-6 right-6 text-muted-custom hover:text-secondary"><X className="w-5 h-5" /></button>
                            <h2 className="font-playfair text-2xl font-black text-secondary mb-8">Product Details</h2>
                            <div className="space-y-6">
                                <div className="aspect-square bg-surface border border-border-custom overflow-hidden">
                                    <img src={selectedProduct.image || selectedProduct.images?.[0] || '/placeholder-product.svg'} alt={selectedProduct.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{selectedProduct.category}</div>
                                    <div className="text-xl font-bold text-secondary">{selectedProduct.name}</div>
                                    <div className="text-lg font-playfair font-black text-secondary mt-2">₹{selectedProduct.price.toFixed(2)}</div>
                                    {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                                        <div className="mt-4">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-custom">Sizes: </span>
                                            <span className="text-xs font-bold text-secondary">{selectedProduct.sizes.join(', ')}</span>
                                        </div>
                                    )}
                                    {selectedProduct.colors && selectedProduct.colors.length > 0 && (
                                        <div className="mt-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-custom">Colors: </span>
                                            <span className="text-xs font-bold text-secondary">{selectedProduct.colors.join(', ')}</span>
                                        </div>
                                    )}
                                    <div className="mt-4 flex items-center gap-3">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-custom">Stock: </span>
                                        <span className={cn("text-xs font-bold", (selectedProduct.stock ?? 0) === 0 ? "text-red-600" : (selectedProduct.stock ?? 0) <= (selectedProduct.lowStockThreshold ?? 5) ? "text-yellow-600" : "text-secondary")}>
                                            {selectedProduct.stock ?? 0} units
                                        </span>
                                        {(selectedProduct.stock ?? 0) > 0 && (selectedProduct.stock ?? 0) <= (selectedProduct.lowStockThreshold ?? 5) && (
                                            <span className="text-[8px] font-black uppercase tracking-wider text-yellow-700 bg-yellow-50 px-1.5 py-0.5 border border-yellow-200">Low Stock</span>
                                        )}
                                    </div>
                                    {selectedProduct.variantInventory && Object.keys(selectedProduct.variantInventory).length > 0 && (
                                        <div className="mt-4">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-custom block mb-2">Variant Stock:</span>
                                            <div className="space-y-1">
                                                {Object.entries(selectedProduct.variantInventory).map(([key, qty]) => {
                                                    const [size, color] = key.split('|');
                                                    const label = [size, color].filter(Boolean).join(' / ') || 'Default';
                                                    return (
                                                        <div key={key} className="flex items-center justify-between text-xs px-2 py-1 bg-surface border border-border-custom">
                                                            <span className="font-bold text-secondary">{label}</span>
                                                            <span className={cn("font-bold", qty === 0 ? "text-red-600" : qty <= (selectedProduct.lowStockThreshold ?? 5) ? "text-yellow-600" : "text-secondary")}>{qty}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══ DELETE MODAL ═══ */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteModalOpen(false)} className="absolute inset-0 bg-secondary/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-md p-10 shadow-2xl border-t-4 border-red-500">
                            <div className="text-center space-y-6">
                                <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                                    <Trash2 className="w-8 h-8 text-red-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-playfair text-2xl font-black text-secondary">Confirm Deletion</h3>
                                    <p className="text-muted-custom text-sm">Are you sure you want to permanently delete <span className="font-bold text-secondary">{productToDelete?.name}</span>? This action cannot be undone.</p>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-8 py-4 border border-border-custom text-secondary text-[10px] font-black uppercase tracking-widest hover:bg-surface transition-colors">Cancel</button>
                                    <button onClick={confirmDelete} className="flex-1 px-8 py-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-200">Delete Product</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══ RESTOCK MODAL ═══ */}
            <AnimatePresence>
                {isRestockModalOpen && productToRestock && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRestockModalOpen(false)} className="absolute inset-0 bg-secondary/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-md p-10 shadow-2xl border-t-4 border-green-500">
                            <div className="text-center space-y-6">
                                <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                                    <PackagePlus className="w-8 h-8 text-green-600" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-playfair text-2xl font-black text-secondary">Restock Product</h3>
                                    <p className="text-muted-custom text-sm">Add inventory to <span className="font-bold text-secondary">{productToRestock.name}</span></p>
                                    <p className="text-xs text-muted-custom">Current stock: <span className="font-bold text-secondary">{productToRestock.stock || 0}</span> units</p>
                                </div>
                                <div className="pt-2">
                                    <label className="block text-left text-[10px] font-black uppercase tracking-widest text-secondary mb-2">Quantity to Add</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={restockQuantity}
                                        onChange={(e) => setRestockQuantity(e.target.value)}
                                        placeholder="Enter quantity..."
                                        className="w-full px-4 py-3 border border-border-custom text-sm outline-none focus:border-green-500 transition-colors"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && restockQuantity) {
                                                confirmRestock();
                                            }
                                        }}
                                    />
                                    {restockQuantity && parseInt(restockQuantity, 10) > 0 && (
                                        <p className="text-xs text-green-600 mt-2 font-bold">New stock will be: {(productToRestock.stock || 0) + parseInt(restockQuantity, 10)} units</p>
                                    )}
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setIsRestockModalOpen(false)} className="flex-1 px-8 py-4 border border-border-custom text-secondary text-[10px] font-black uppercase tracking-widest hover:bg-surface transition-colors">Cancel</button>
                                    <button 
                                        onClick={confirmRestock} 
                                        disabled={isRestocking || !restockQuantity || parseInt(restockQuantity, 10) <= 0}
                                        className="flex-1 px-8 py-4 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-colors shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isRestocking ? 'Restocking...' : 'Add Stock'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

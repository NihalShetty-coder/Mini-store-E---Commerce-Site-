'use client';

import { create } from 'zustand';
import {
    getProducts,
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    type Product,
} from '@/lib/firestore';
import { logger } from '@/lib/logger';

export type { Product };

interface InventoryStore {
    products: Product[];
    isLoading: boolean;
    error: string | null;
    _fetched: boolean; // cache flag — prevent redundant Firestore reads
    _fetchPromise: Promise<void> | null; // active fetch promise
    // Data fetching
    fetchProducts: () => Promise<void>;
    fetchAllProducts: () => Promise<void>;
    // CRUD — writes directly to Firestore
    addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<string>;
    updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;
    // Derived selectors
    getTopPerformers: (limit?: number) => Product[];
    getActiveProducts: () => Product[];
}

export const useInventory = create<InventoryStore>((set, get) => ({
    products: [],
    isLoading: false,
    error: null,
    _fetched: false,
    _fetchPromise: null,

    fetchProducts: async (force: boolean = false) => {
        const state = get();

        // If there's an active fetch, just return that same promise to avoid race conditions
        if (state._fetchPromise && !force) {
            return state._fetchPromise as Promise<void>;
        }

        // Only skip fetch if we already have products AND we're not forcing a refresh
        if (!force && state._fetched && state.products.length > 0) {
            return Promise.resolve();
        }

        const promise = (async () => {
            set({ isLoading: true, error: null });
            try {
                const products = await getProducts({ status: 'Active' });
                set({ products, isLoading: false, _fetched: true, _fetchPromise: null });
                logger.info(`Fetched ${products.length} active products`, 'INVENTORY');
            } catch (e: unknown) {
                logger.error('Critical error in fetchProducts', e, 'INVENTORY');
                set({ error: e instanceof Error ? e.message : 'Unknown error', isLoading: false, _fetchPromise: null });
            }
        })();

        set({ _fetchPromise: promise });
        return promise;
    },

    fetchAllProducts: async () => {
        set({ isLoading: true, error: null });
        try {
            const products = await getAllProducts();
            set({ products, isLoading: false, _fetched: true });
        } catch (e: unknown) {
            set({ error: e instanceof Error ? e.message : 'Unknown error', isLoading: false });
        }
    },

    addProduct: async (productData) => {
        const id = await createProduct({
            ...productData,
            rating: productData.rating ?? 5,
            status: productData.status ?? 'Active',
            sku: productData.sku ?? `SKU-${Math.floor(Math.random() * 10000)}`,
        });
        // Refetch to get the new product with server timestamp
        set({ _fetched: false });
        await get().fetchAllProducts();
        return id as string;
    },

    updateProduct: async (id, updates) => {
        await updateProduct(id, updates);
        set((state) => ({
            products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
    },

    deleteProduct: async (id) => {
        try {
            await deleteProduct(id);
            set((state) => ({
                products: state.products.filter((p) => p.id !== id),
            }));
        } catch (e: unknown) {
            throw e;
        }
    },

    getTopPerformers: (limit = 3) =>
        get().products.filter((p) => !p.status || p.status === 'Active').slice(0, limit),

    getActiveProducts: () =>
        get().products.filter((p) => !p.status || p.status === 'Active'),
}));

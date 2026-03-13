'use client';

import { create } from 'zustand';
import {
    getUserWishlist,
    addToWishlist,
    removeFromWishlist,
    type WishlistItem,
} from '@/lib/firestore';
import { type Product } from '@/lib/firestore';
import { logger } from '@/lib/logger';

interface WishlistStore {
    items: WishlistItem[];
    isLoading: boolean;
    // Sync from Firestore for authenticated users
    fetchWishlist: (userId: string) => Promise<void>;
    addItem: (userId: string, product: Product) => Promise<void>;
    removeItem: (userId: string, productId: string) => Promise<void>;
    isWishlisted: (productId: string) => boolean;
    toggleItem: (userId: string, product: Product) => Promise<void>;
    // Sync wishlist with active inventory
    syncWithInventory: (userId: string, activeProducts: Product[]) => Promise<void>;
    // Clear when user logs out
    clearWishlist: () => void;
}

export const useWishlist = create<WishlistStore>((set, get) => ({
    items: [],
    isLoading: false,

    fetchWishlist: async (userId) => {
        set({ isLoading: true });
        try {
            const items = await getUserWishlist(userId);
            set({ items, isLoading: false });
        } catch {
            set({ isLoading: false });
        }
    },

    addItem: async (userId, product) => {
        const item: WishlistItem = {
            productId: product.id!,
            name: product.name,
            price: product.price,
            image: product.image,
        };
        // Optimistic update
        set((state) => ({ items: [item, ...state.items] }));
        try {
            await addToWishlist(userId, item);
        } catch {
            // Rollback on failure
            set((state) => ({
                items: state.items.filter((i) => i.productId !== product.id),
            }));
        }
    },

    removeItem: async (userId, productId) => {
        // Optimistic update
        set((state) => ({
            items: state.items.filter((i) => i.productId !== productId),
        }));
        try {
            await removeFromWishlist(userId, productId);
        } catch {
            // Re-fetch on failure
            await get().fetchWishlist(userId);
        }
    },

    isWishlisted: (productId) => {
        return get().items.some((i) => i.productId === productId);
    },

    toggleItem: async (userId, product) => {
        if (get().isWishlisted(product.id!)) {
            await get().removeItem(userId, product.id!);
        } else {
            await get().addItem(userId, product);
        }
    },

    syncWithInventory: async (userId, activeProducts) => {
        const currentItems = get().items;
        const activeProductIds = new Set(activeProducts.map(p => p.id));
        
        // Find wishlist items that reference products that are no longer active
        const itemsToRemove = currentItems.filter(item => !activeProductIds.has(item.productId));
        
        if (itemsToRemove.length > 0) {
            logger.info(`Syncing wishlist: removing ${itemsToRemove.length} unavailable products`, 'WISHLIST');
            
            // Remove items from Firestore and local state
            for (const item of itemsToRemove) {
                try {
                    await removeFromWishlist(userId, item.productId);
                } catch (error) {
                    logger.error(`Failed to remove product ${item.productId} from wishlist`, error, 'WISHLIST');
                }
            }
            
            // Update local state to remove all unavailable items at once
            set((state) => ({
                items: state.items.filter(item => activeProductIds.has(item.productId))
            }));
            
            logger.info(`Wishlist synced: ${itemsToRemove.length} items removed`, 'WISHLIST');
        }
    },

    clearWishlist: () => set({ items: [] }),
}));

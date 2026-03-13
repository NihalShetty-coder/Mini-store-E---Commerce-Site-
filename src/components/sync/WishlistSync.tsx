'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useWishlist } from '@/hooks/use-wishlist';
import { useInventory } from '@/hooks/use-inventory';

/**
 * WishlistSync component - Automatically syncs user's wishlist with active inventory
 * 
 * This component runs in the background and removes wishlist items for products that:
 * - Have been deleted from inventory
 * - Have been marked as inactive/draft
 * - Are no longer available
 * 
 * Sync happens automatically when:
 * - User logs in
 * - Inventory is updated
 * - Component mounts (page load/refresh)
 */
export default function WishlistSync() {
    const { user, isAuthenticated } = useAuth();
    const { syncWithInventory } = useWishlist();
    const { getActiveProducts, products } = useInventory();
    const lastSyncedUserId = useRef<string | null>(null);
    const lastSyncedProductCount = useRef<number>(0);

    useEffect(() => {
        // Only sync if user is authenticated
        if (!isAuthenticated || !user?.id) {
            lastSyncedUserId.current = null;
            return;
        }

        // Only sync if we have products loaded
        if (products.length === 0) {
            return;
        }

        // Skip sync if already synced for this user and product count hasn't changed
        if (lastSyncedUserId.current === user.id && lastSyncedProductCount.current === products.length) {
            return;
        }

        // Get active products and sync wishlist
        const activeProducts = getActiveProducts();
        
        // Run sync asynchronously (non-blocking)
        syncWithInventory(user.id, activeProducts).then(() => {
            lastSyncedUserId.current = user.id;
            lastSyncedProductCount.current = products.length;
        }).catch((error) => {
            console.error('Wishlist sync failed:', error);
        });

    }, [isAuthenticated, user?.id, products.length, getActiveProducts, syncWithInventory]);

    // This component renders nothing - it's just for side effects
    return null;
}

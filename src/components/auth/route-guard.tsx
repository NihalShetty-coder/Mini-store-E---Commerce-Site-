'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useAuth, useAuthInit } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { logger } from '@/lib/logger';

interface RouteGuardProps {
    children: React.ReactNode;
}

/**
 * Optimized RouteGuard with lazy-loaded store dependencies
 * 
 * Key optimizations:
 * 1. Only loads wishlist/orders stores when user is authenticated
 * 2. Uses dynamic imports to reduce initial bundle size
 * 3. Prevents redundant fetches with userId tracking
 * 4. Settings are loaded independently (not user-dependent)
 */
const RouteGuard: React.FC<RouteGuardProps> = React.memo(({ children }) => {
    useAuthInit(); // Initialize Firebase auth listener
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = React.useState(false);

    // Track which userId's data we've already fetched — prevents refetch on every render
    const fetchedUserId = useRef<string | null>(null);
    const storesLoaded = useRef(false);

    // Lazy load user-specific stores only when authenticated
    const loadUserData = useCallback(async (userId: string) => {
        if (fetchedUserId.current === userId) return;
        
        try {
            // Dynamic import stores only when needed
            const [wishlistModule, ordersModule] = await Promise.all([
                import('@/hooks/use-wishlist'),
                import('@/hooks/use-orders'),
            ]);
            
            fetchedUserId.current = userId;
            storesLoaded.current = true;
            
            // Fetch user data in parallel
            await Promise.all([
                wishlistModule.useWishlist.getState().fetchWishlist(userId),
                ordersModule.useOrders.getState().fetchUserOrders(userId),
            ]);
        } catch (error) {
            logger.error('Failed to load user data', error, 'AUTH');
        }
    }, []);

    // Clear user data on logout
    const clearUserData = useCallback(async () => {
        if (!storesLoaded.current) return;
        
        try {
            const wishlistModule = await import('@/hooks/use-wishlist');
            wishlistModule.useWishlist.getState().clearWishlist();
        } catch {
            // Store not loaded, nothing to clear
        }
        
        fetchedUserId.current = null;
    }, []);

    useEffect(() => {
        setMounted(true);
        
        // Load settings independently (always needed for storeName, etc.)
        import('@/hooks/use-settings').then(({ useSettings }) => {
            useSettings.getState().fetchSettings();
        });
    }, []);

    // Initialize user-specific data when auth state changes
    useEffect(() => {
        if (user) {
            loadUserData(user.id);
        } else {
            clearUserData();
        }
    }, [user, loadUserData, clearUserData]);

    useEffect(() => {
        if (!mounted || isLoading) return;

        const isAdminRoute = pathname.startsWith('/admin');
        const isAccountRoute = pathname.startsWith('/account');
        const isAuthRoute = pathname === '/login' || pathname === '/signup';

        // Redirect unauthenticated users away from protected routes
        if (!isAuthenticated && (isAdminRoute || isAccountRoute)) {
            router.replace('/login');
            return;
        }

        // Redirect authenticated users away from login/signup
        if (isAuthenticated && isAuthRoute) {
            router.replace('/');
            return;
        }

        // Strict Admin Restriction
        if (isAuthenticated && isAdminRoute && user?.role !== 'admin') {
            router.replace('/');
        }
    }, [isAuthenticated, isLoading, pathname, router, user, mounted]);

    if (!mounted || (isLoading && (pathname.startsWith('/admin') || pathname.startsWith('/account')))) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
});

RouteGuard.displayName = 'RouteGuard';

export default RouteGuard;

'use client';

import { create } from 'zustand';
import { trackAnalyticsEvent } from '@/lib/firestore';

type EventType = 'PAGE_VIEW' | 'PRODUCT_VIEW' | 'ADD_TO_CART' | 'REMOVE_FROM_CART' | 'CHECKOUT_START' | 'PURCHASE' | 'WISHLIST_ADD';

interface AnalyticsState {
    sessionId: string;
    trackEvent: (
        type: EventType, 
        options?: {
            path?: string;
            value?: number;
            productId?: string;
            source?: string;
            referrer?: string;
        }
    ) => void;
    trackProductView: (productId: string, productName?: string) => void;
    trackAddToCart: (productId: string, value: number) => void;
    trackRemoveFromCart: (productId: string, value: number) => void;
    trackWishlistAdd: (productId: string) => void;
}

// Generate a UUID for session tracking
function generateSessionId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Get or create session ID from sessionStorage
function getSessionId(): string {
    if (typeof window === 'undefined') return generateSessionId();
    
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = generateSessionId();
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
}

export const useAnalytics = create<AnalyticsState>()(() => ({
    sessionId: getSessionId(),
    
    trackEvent: async (type, options = {}) => {
        // Only track meaningful business events — not every page view
        // PAGE_VIEW events were causing a Firestore write on every navigation (massive overhead)
        // Use GA4 for page view tracking instead
        if (type === 'PAGE_VIEW') return;

        try {
            await trackAnalyticsEvent({ 
                type, 
                sessionId: getSessionId(),
                ...options 
            });
        } catch {
            // Silently ignore analytics failures — never break the UX
        }
    },
    
    trackProductView: async (productId, productName) => {
        try {
            await trackAnalyticsEvent({
                type: 'PRODUCT_VIEW',
                productId,
                path: productName,
                sessionId: getSessionId(),
            });
        } catch {
            // Silently ignore analytics failures
        }
    },
    
    trackAddToCart: async (productId, value) => {
        try {
            await trackAnalyticsEvent({
                type: 'ADD_TO_CART',
                productId,
                value,
                sessionId: getSessionId(),
            });
        } catch {
            // Silently ignore analytics failures
        }
    },
    
    trackRemoveFromCart: async (productId, value) => {
        try {
            await trackAnalyticsEvent({
                type: 'REMOVE_FROM_CART',
                productId,
                value,
                sessionId: getSessionId(),
            });
        } catch {
            // Silently ignore analytics failures
        }
    },
    
    trackWishlistAdd: async (productId) => {
        try {
            await trackAnalyticsEvent({
                type: 'WISHLIST_ADD',
                productId,
                sessionId: getSessionId(),
            });
        } catch {
            // Silently ignore analytics failures
        }
    },
}));

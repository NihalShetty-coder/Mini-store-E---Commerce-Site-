'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

// Custom event tracking for GA4
export const GA4Event = {
    // E-commerce events
    viewItem: (productId: string, productName: string, price: number, category?: string) => {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'view_item', {
                currency: 'USD',
                value: price,
                items: [{
                    item_id: productId,
                    item_name: productName,
                    item_category: category,
                    price: price,
                }]
            });
        }
    },
    
    addToCart: (productId: string, productName: string, price: number, quantity: number = 1) => {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'add_to_cart', {
                currency: 'USD',
                value: price * quantity,
                items: [{
                    item_id: productId,
                    item_name: productName,
                    price: price,
                    quantity: quantity,
                }]
            });
        }
    },
    
    removeFromCart: (productId: string, productName: string, price: number, quantity: number = 1) => {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'remove_from_cart', {
                currency: 'USD',
                value: price * quantity,
                items: [{
                    item_id: productId,
                    item_name: productName,
                    price: price,
                    quantity: quantity,
                }]
            });
        }
    },
    
    beginCheckout: (value: number, items: Array<{ id: string; name: string; price: number; quantity: number }>) => {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'begin_checkout', {
                currency: 'USD',
                value: value,
                items: items.map(item => ({
                    item_id: item.id,
                    item_name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                }))
            });
        }
    },
    
    purchase: (transactionId: string, value: number, items: Array<{ id: string; name: string; price: number; quantity: number }>) => {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'purchase', {
                transaction_id: transactionId,
                currency: 'USD',
                value: value,
                items: items.map(item => ({
                    item_id: item.id,
                    item_name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                }))
            });
        }
    },
    
    // Custom events
    search: (searchTerm: string) => {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'search', {
                search_term: searchTerm
            });
        }
    },
    
    filterApplied: (filterType: string, filterValue: string) => {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'filter_applied', {
                filter_type: filterType,
                filter_value: filterValue
            });
        }
    },
};

// Extend Window interface for gtag
declare global {
    interface Window {
        gtag: (
            command: 'config' | 'event' | 'js',
            targetId: string | Date,
            config?: Record<string, unknown>
        ) => void;
        dataLayer: unknown[];
    }
}

export default function GoogleAnalytics() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Track page views on route change
    useEffect(() => {
        if (!GA_MEASUREMENT_ID) return;
        
        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
        
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('config', GA_MEASUREMENT_ID, {
                page_path: url,
            });
        }
    }, [pathname, searchParams]);

    // Don't render scripts if GA4 is not configured
    if (!GA_MEASUREMENT_ID) {
        return null;
    }

    return (
        <>
            <Script
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${GA_MEASUREMENT_ID}', {
                            page_path: window.location.pathname,
                        });
                    `,
                }}
            />
        </>
    );
}

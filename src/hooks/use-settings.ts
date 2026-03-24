'use client';

import { create } from 'zustand';
import {
    getStoreSettings,
    updateStoreSettings,
    type StoreSettings,
    type FooterLink,
    type ContactMethod,
} from '@/lib/firestore';

export type { FooterLink, ContactMethod };

const DEFAULT_LINKS: FooterLink[] = [
    { id: '1', section: 'Shop', name: 'New Arrivals', url: '/shop?badge=NEW' },
    { id: '2', section: 'Shop', name: 'Best Sellers', url: '/shop' },
    { id: '3', section: 'Shop', name: 'Collections', url: '/shop' },
    { id: '4', section: 'Shop', name: 'Sustainability', url: '#' },
    { id: '5', section: 'Customer Care', name: 'Track Order', url: '/track' },
    { id: '6', section: 'Customer Care', name: 'Shipping & Returns', url: '/shipping-returns' },
    { id: '7', section: 'Customer Care', name: 'Privacy Policy', url: '/privacy' },
    { id: '8', section: 'Customer Care', name: 'Terms of Service', url: '/terms' },
    { id: '9', section: 'Customer Care', name: 'FAQ', url: '#' },
];

export const DEFAULT_CONTACTS: ContactMethod[] = [
    { id: 'c1', label: 'Email', value: 'nihalnshetty42@gmail.com', isLink: false },
    { id: 'c2', label: 'Phone', value: '+1 (555) 000-LUXE', isLink: false },
    { id: 'c3', label: 'Instagram', value: 'https://instagram.com/nihalshetty', isLink: true },
    { id: 'c4', label: 'Facebook', value: 'https://facebook.com', isLink: true },
    { id: 'c5', label: 'Twitter', value: 'https://twitter.com', isLink: true },
    { id: 'c6', label: 'Pinterest', value: 'https://pinterest.com', isLink: true },
];

export const DEFAULT_HERO = {
    title: 'Elevated Essentials',
    subtitle: 'Discover our new collection of editorial-inspired fashion designed for the modern individual.',
    backgroundImage: '/hero/hero-banner.webp'
};

export const DEFAULT_STATS = [
    { label: 'Happy Customers', value: '15K+' },
    { label: 'Luxury Brands', value: '200+' },
    { label: 'Expert Support', value: '24/7' },
    { label: 'Curated Quality', value: '100%' },
];

interface SettingsState extends StoreSettings {
    isLoading: boolean;
    _fetched: boolean; // prevent redundant Firestore reads
    storeName: string;
    footerLinks: FooterLink[];
    contactMethods: ContactMethod[];
    heroConfig: typeof DEFAULT_HERO;
    statsConfig: typeof DEFAULT_STATS;
    stripeConfig?: { publishableKey: string; };
    // Fetch from Firestore
    fetchSettings: () => Promise<void>;
    // Store name
    setStoreName: (name: string) => Promise<void>;
    // Footer links
    addFooterLink: (link: Omit<FooterLink, 'id'>) => Promise<void>;
    updateFooterLink: (id: string, updatedLink: Partial<FooterLink>) => Promise<void>;
    removeFooterLink: (id: string) => Promise<void>;
    resetFooterLinks: () => Promise<void>;
    // Contact Methods
    addContactMethod: (method: Omit<ContactMethod, 'id'>) => Promise<void>;
    updateContactMethod: (id: string, updatedMethod: Partial<ContactMethod>) => Promise<void>;
    removeContactMethod: (id: string) => Promise<void>;
    // Hero and Stats
    updateHeroConfig: (config: typeof DEFAULT_HERO) => Promise<void>;
    updateStatsConfig: (config: typeof DEFAULT_STATS) => Promise<void>;
    // Stripe
    updateStripeConfig: (config: { publishableKey: string; }) => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
    storeName: 'Nihal Shetty',
    footerLinks: DEFAULT_LINKS,
    contactMethods: DEFAULT_CONTACTS,
    heroConfig: DEFAULT_HERO,
    statsConfig: DEFAULT_STATS,
    stripeConfig: undefined,
    isLoading: false,
    _fetched: false,

    fetchSettings: async () => {
        // Must return a resolved promise for React/Next.js router stability during navigation
        if (get()._fetched) return Promise.resolve();
        set({ isLoading: true });
        try {
            const settings = await getStoreSettings();
            if (settings) {
                set({
                    storeName: settings.storeName ?? 'Nihal Shetty',
                    footerLinks: settings.footerLinks ?? DEFAULT_LINKS,
                    contactMethods: settings.contactMethods ?? DEFAULT_CONTACTS,
                    heroConfig: settings.heroConfig ?? DEFAULT_HERO,
                    statsConfig: settings.statsConfig ?? DEFAULT_STATS,
                    stripeConfig: settings.stripeConfig,
                    _fetched: true,
                });
            } else {
                set({ _fetched: true });
            }
        } catch {
            // Silently fall back to defaults if Firestore is unavailable
            set({ _fetched: true });
        } finally {
            set({ isLoading: false });
        }
    },

    setStoreName: async (name) => {
        set({ storeName: name });
        try { await updateStoreSettings({ storeName: name }); } catch { /* silent */ }
    },

    addFooterLink: async (link) => {
        const newLink = { ...link, id: Math.random().toString(36).substr(2, 9) };
        const updated = [...get().footerLinks, newLink];
        set({ footerLinks: updated });
        try { await updateStoreSettings({ footerLinks: updated }); } catch { /* silent */ }
    },

    updateFooterLink: async (id, updatedLink) => {
        const updated = get().footerLinks.map((l) =>
            l.id === id ? { ...l, ...updatedLink } : l
        );
        set({ footerLinks: updated });
        try { await updateStoreSettings({ footerLinks: updated }); } catch { /* silent */ }
    },

    removeFooterLink: async (id) => {
        const updated = get().footerLinks.filter((l) => l.id !== id);
        set({ footerLinks: updated });
        try { await updateStoreSettings({ footerLinks: updated }); } catch { /* silent */ }
    },

    resetFooterLinks: async () => {
        set({ footerLinks: DEFAULT_LINKS });
        try { await updateStoreSettings({ footerLinks: DEFAULT_LINKS }); } catch { /* silent */ }
    },

    addContactMethod: async (method) => {
        const newMethod = { ...method, id: Math.random().toString(36).substr(2, 9) };
        const updated = [...get().contactMethods, newMethod];
        set({ contactMethods: updated });
        try { await updateStoreSettings({ contactMethods: updated }); } catch { /* silent */ }
    },

    updateContactMethod: async (id, updatedMethod) => {
        const updated = get().contactMethods.map((m) =>
            m.id === id ? { ...m, ...updatedMethod } : m
        );
        set({ contactMethods: updated });
        try { await updateStoreSettings({ contactMethods: updated }); } catch { /* silent */ }
    },

    removeContactMethod: async (id) => {
        const updated = get().contactMethods.filter((m) => m.id !== id);
        set({ contactMethods: updated });
        try { await updateStoreSettings({ contactMethods: updated }); } catch { /* silent */ }
    },

    updateHeroConfig: async (config) => {
        set({ heroConfig: config });
        try { await updateStoreSettings({ heroConfig: config }); } catch { /* silent */ }
    },

    updateStatsConfig: async (config) => {
        set({ statsConfig: config });
        try { await updateStoreSettings({ statsConfig: config }); } catch { /* silent */ }
    },

    updateStripeConfig: async (config) => {
        set({ stripeConfig: config });
        try { await updateStoreSettings({ stripeConfig: config }); } catch { /* silent */ }
    },
}));

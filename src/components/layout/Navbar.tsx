'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Heart, ShoppingBag, User, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import stores with selective subscriptions to prevent unnecessary re-renders
import { useFilter } from '@/hooks/use-filter';
import { useSettings } from '@/hooks/use-settings';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { useToast } from '@/hooks/use-toast';

// Internal UserMenu component
function UserMenuComponent({
    user,
    onLogout
}: {
    user: { firstName: string; role: string };
    onLogout: () => void;
}) {
    return (
        <div className="flex items-center gap-4">
            <Link
                href="/account"
                className="flex items-center gap-2 hover:text-primary transition-colors group"
            >
                <div className="w-7 h-7 bg-secondary text-white text-[10px] font-black flex items-center justify-center rounded-sm group-hover:bg-primary transition-colors">
                    {user.firstName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden lg:inline text-sm font-bold">{user.firstName}</span>
            </Link>

            {user.role === 'admin' && (
                <Link
                    href="/admin"
                    className="px-3 py-1.5 border border-secondary text-[10px] font-black uppercase tracking-widest hover:bg-secondary hover:text-white transition-all"
                >
                    Console
                </Link>
            )}

            <button
                onClick={onLogout}
                className="hidden lg:flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-custom hover:text-primary transition-colors"
                title="Sign Out"
            >
                <LogOut className="w-4 h-4" />
            </button>
        </div>
    );
}

interface NavItem {
    label: string;
    action: string;
    submenu?: { label: string; action: string }[];
}

const NAV_ITEMS: NavItem[] = [
    { label: 'HOME', action: 'HOME' },
    {
        label: 'SHOP',
        action: 'SHOP',
        submenu: [
            { label: 'ALL PRODUCTS', action: 'SHOP' },
            { label: 'NEW ARRIVALS', action: 'NEW ARRIVALS' },
            { label: 'LIMITED EDITION', action: 'LIMITED' },
            { label: 'SALE ITEMS', action: 'SALE' },
        ]
    },
    { label: 'ACCESSORIES', action: 'ACCESSORIES' },
    { label: 'NEW ARRIVALS', action: 'NEW ARRIVALS' },
    { label: 'SALE', action: 'SALE' },
];

const Navbar = () => {
    // Selective store subscriptions - only subscribe to specific state slices
    const { storeName } = useSettings();
    const router = useRouter();
    const [mounted, setMounted] = React.useState(false);

    // Use selective subscription for cart to only re-render when totalItems changes
    const totalItems = useCart(state => state.totalItems());
    const setCartOpen = useCart(state => state.setIsOpen);

    // Auth state - useAuth returns an object, not a store
    const { user, isAuthenticated, logout } = useAuth();

    // Wishlist count only - selective subscription
    const wishlistCount = useWishlist(state => state.items.length);

    // Toast - selective subscription
    const addToast = useToast(state => state.addToast);

    // Filter state
    const { searchQuery, setSearchQuery } = useFilter();
    const [localSearch, setLocalSearch] = React.useState(searchQuery);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Debounce search query
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(localSearch);
        }, 400);
        return () => clearTimeout(timer);
    }, [localSearch, setSearchQuery]);

    const handleLogout = useCallback(async () => {
        try {
            await logout();
            addToast('You have been signed out.', 'info');
            router.push('/');
        } catch {
            addToast('Failed to sign out', 'error');
        }
    }, [addToast, router, logout]);

    const handleNavClick = useCallback((item: string) => {
        if (item === 'HOME') {
            router.push('/');
            return;
        }

        setSearchQuery('');
        const filterStore = useFilter.getState();

        if (item === 'SHOP') {
            filterStore.resetFilters();
        } else if (item === 'ACCESSORIES') {
            filterStore.setBadge(null);
            filterStore.setCategory('Accessories');
        } else if (item === 'SALE') {
            filterStore.setCategory('All');
            filterStore.setBadge('SALE');
        } else if (item === 'LIMITED') {
            filterStore.setCategory('All');
            filterStore.setBadge('LIMITED');
        } else if (item === 'NEW ARRIVALS') {
            filterStore.setCategory('All');
            filterStore.setBadge('NEW');
        }

        if (window.location.pathname !== '/shop') {
            router.push('/shop');
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [router, setSearchQuery]);

    return (
        <header className="sticky top-0 z-50 w-full bg-surface border-b border-border-custom px-4 lg:px-0">
            <div className="container mx-auto">
                {/* Top Bar */}
                <div className="flex h-20 items-center justify-between gap-4 px-6 md:px-10 lg:px-16">
                    <Link href="/" className="font-playfair text-3xl font-black tracking-tighter text-secondary">
                        {storeName || 'Nihal Shetty'}
                    </Link>

                    <div className="hidden md:flex flex-1 max-w-md relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-custom" />
                        <input
                            id="search-products"
                            name="search"
                            type="text"
                            placeholder="Search for products"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setSearchQuery(localSearch);
                                    if (window.location.pathname !== '/shop') {
                                        router.push('/shop');
                                    }
                                }
                            }}
                            className="w-full bg-background rounded-full py-2.5 pl-11 pr-4 text-sm outline-none border border-transparent focus:border-primary transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-6 text-secondary">
                        {/* Auth-aware Account Button */}
                        {mounted && isAuthenticated && user ? (
                            <UserMenuComponent user={user} onLogout={handleLogout} />
                        ) : (
                            <Link
                                href="/login"
                                className="flex items-center gap-2 hover:text-primary transition-colors group"
                            >
                                <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="hidden lg:inline text-sm font-medium">Sign In</span>
                            </Link>
                        )}

                        {/* Wishlist */}
                        <Link href="/account" className="relative hover:text-primary transition-colors">
                            <Heart className="w-5 h-5" />
                            {mounted && wishlistCount > 0 && (
                                <span className={cn(
                                    "absolute -top-1 -right-2 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold"
                                )}>
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>

                        {/* Cart */}
                        <button
                            onClick={() => setCartOpen(true)}
                            className="relative hover:text-primary transition-colors"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            {mounted && totalItems > 0 && (
                                <span className="absolute -top-1 -right-2 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-in zoom-in duration-300">
                                    {totalItems}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Lower Nav */}
                <nav className="hidden md:block py-3 border-t border-border-custom">
                    <ul className="menu mx-auto">
                        {NAV_ITEMS.map((item) => (
                            <li key={item.label} className="item">
                                <button
                                    type="button"
                                    onClick={() => handleNavClick(item.action)}
                                    className="link"
                                >
                                    <span>{item.label}</span>
                                    {item.submenu && (
                                        <ChevronDown className="w-3 h-3 transition-transform duration-300" />
                                    )}
                                </button>
                                {item.submenu && (
                                    <div className="submenu">
                                        {item.submenu.map((sub) => (
                                            <div key={sub.label} className="submenu-item">
                                                <button
                                                    type="button"
                                                    onClick={() => handleNavClick(sub.action)}
                                                    className="submenu-link"
                                                >
                                                    {sub.label}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Navbar;

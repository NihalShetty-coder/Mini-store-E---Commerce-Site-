'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    BarChart3,
    Settings,
    LogOut,
    Search,
    Bell,
    ChevronLeft,
    ChevronRight,
    Home,
    Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useInventory } from '@/hooks/use-inventory';
import { useSettings } from '@/hooks/use-settings';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const { fetchAllProducts } = useInventory();
    const { fetchSettings } = useSettings();
    const { addToast } = useToast();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const hasInitialized = React.useRef(false);

    // Proactive fetching for admin data to prevent "late rendering"
    // Only fetch once on mount
    React.useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            fetchAllProducts();
            fetchSettings();
        }
    }, [fetchAllProducts, fetchSettings]);

    // Map strict paths to active tabs
    const getActiveTab = () => {
        if (pathname === '/admin') return 'Overview';
        if (pathname.includes('/admin/orders')) return 'Orders';
        if (pathname.includes('/admin/products')) return 'Products';
        if (pathname.includes('/admin/analytics')) return 'Analytics';
        if (pathname.includes('/admin/customers')) return 'Customers';
        if (pathname.includes('/admin/settings')) return 'Settings';
        return 'Overview';
    };

    const activeTab = getActiveTab();

    const handleLogout = () => {
        logout();
        addToast('Admin signed out.', 'info');
        router.push('/');
    };

    return (
        <div className="h-screen bg-[#F9FAFB] flex font-inter overflow-hidden">
            {/* Sidebar */}
            <aside className={cn(
                "bg-secondary text-white shrink-0 hidden lg:flex flex-col border-r border-white/5 relative transition-all duration-300",
                isCollapsed ? "w-24" : "w-72"
            )}>
                {/* Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-8 bg-white border border-border-custom text-secondary rounded-full p-1 z-10 hover:text-primary transition-colors shadow-sm"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>

                <div className={cn("transition-all duration-300 overflow-hidden", isCollapsed ? "p-8 pt-10 flex justify-center" : "p-10 pt-12")}>
                    <Link href="/" className={cn("font-playfair font-black tracking-tighter uppercase leading-none cursor-pointer hover:opacity-80 transition-opacity", isCollapsed ? "text-4xl" : "text-3xl")}>
                        {isCollapsed ? "N" : "Nihal Shetty"}
                    </Link>
                    {!isCollapsed && <div className="text-[10px] uppercase tracking-[0.4em] text-white/40 mt-3 font-black whitespace-nowrap">Admin Console</div>}
                </div>

                <div className="h-px bg-white/5 mx-6 mt-4 shrink-0" />

                <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {[
                        { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
                        { icon: Package, label: 'Orders', href: '/admin/orders' },
                        { icon: ShoppingBag, label: 'Products', href: '/admin/products' },
                        { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
                        { icon: Users, label: 'Customers', href: '/admin/customers' },
                        { icon: Settings, label: 'Settings', href: '/admin/settings' },
                    ].map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            title={isCollapsed ? item.label : undefined}
                            className={cn(
                                "flex items-center transition-all duration-300 w-full overflow-hidden",
                                isCollapsed ? "justify-center py-4 rounded-xl" : "gap-5 px-6 py-4 rounded-none",
                                activeTab === item.label
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 shrink-0", activeTab === item.label ? "text-white" : "text-white/40")} strokeWidth={1.5} />
                            {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-[0.25em] whitespace-nowrap">{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className={cn("mt-auto shrink-0 border-t border-white/5", isCollapsed ? "p-4" : "p-6")}>
                    <Link
                        href="/"
                        title={isCollapsed ? "Back to Home" : undefined}
                        className={cn(
                            "flex items-center transition-all text-white/30 hover:text-white hover:bg-white/5 group w-full mb-1",
                            isCollapsed ? "justify-center py-4 rounded-xl" : "gap-5 px-6 py-4"
                        )}
                    >
                        <Home className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                        {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-[0.25em] whitespace-nowrap">Back to Home</span>}
                    </Link>
                    <button
                        onClick={handleLogout}
                        title={isCollapsed ? "Logout" : undefined}
                        className={cn(
                            "flex items-center transition-all text-white/30 hover:text-white hover:bg-white/5 group w-full",
                            isCollapsed ? "justify-center py-4 rounded-xl" : "gap-5 px-6 py-4"
                        )}
                    >
                        <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                        {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-[0.25em] whitespace-nowrap">Logout</span>}
                    </button>
                    {!isCollapsed && (
                        <div className="mt-4 px-6 text-[8px] font-black uppercase tracking-[0.3em] text-white/10 whitespace-nowrap">
                            v1.0.4 Build Final
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Navbar */}
                <header className="h-20 bg-white border-b border-border-custom flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-4 bg-surface border border-border-custom px-4 py-2 w-full max-w-md">
                        <Search className="w-4 h-4 text-muted-custom" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab.toLowerCase()}...`}
                            className="bg-transparent text-sm outline-none w-full"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative p-2 text-muted-custom hover:text-secondary transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />
                        </button>
                        <div className="h-8 w-px bg-border-custom" />
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <div className="text-xs font-black uppercase tracking-widest text-secondary">{user?.firstName || 'Admin'}</div>
                                <div className="text-[10px] text-muted-custom font-bold uppercase tracking-widest">Super Admin</div>
                            </div>
                            <div className="w-10 h-10 bg-secondary rounded-none flex items-center justify-center text-white font-black text-xs">
                                {user?.firstName?.charAt(0).toUpperCase() || 'A'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Page Content */}
                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}

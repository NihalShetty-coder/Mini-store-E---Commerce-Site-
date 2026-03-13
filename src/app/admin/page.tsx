'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, ShoppingCart, DollarSign, Package, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInventory } from '@/hooks/use-inventory';
import { getAllOrders, type Order } from '@/lib/firestore';
import { motion } from 'framer-motion';
import { logger } from '@/lib/logger';

export default function AdminOverviewPage() {
    const { products, getTopPerformers, isLoading: isInventoryLoading } = useInventory();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isOrdersLoading, setIsOrdersLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        async function loadOrders() {
            try {
                const data = await getAllOrders();
                setOrders(data);
            } catch (error) {
                logger.error('Error fetching orders', error, 'ADMIN');
            } finally {
                setIsOrdersLoading(false);
            }
        }
        loadOrders();
    }, []);

    // --- Dynamic Trend Calculations ---
    const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return { change: current > 0 ? '+100.0%' : '0.0%', trend: 'up' as const };
        const diff = ((current - previous) / previous) * 100;
        const sign = diff >= 0 ? '+' : '-';
        return {
            change: `${sign}${Math.abs(diff).toFixed(1)}%`,
            trend: (diff >= 0 ? 'up' : 'down') as 'up' | 'down'
        };
    };

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

    const currentPeriodOrders = orders.filter(o => {
        const date = o.createdAt instanceof Date ? o.createdAt : o.createdAt ? new Date(o.createdAt.toMillis()) : new Date(0);
        return date >= thirtyDaysAgo;
    });

    const previousPeriodOrders = orders.filter(o => {
        const date = o.createdAt instanceof Date ? o.createdAt : o.createdAt ? new Date(o.createdAt.toMillis()) : new Date(0);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    });

    const currentRevenue = currentPeriodOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const previousRevenue = previousPeriodOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const revenueTrend = calculateTrend(currentRevenue, previousRevenue);

    const orderVolumeTrend = calculateTrend(currentPeriodOrders.length, previousPeriodOrders.length);

    // Total Stats for display
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrdersCount = orders.length;
    const inventoryValue = products.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);
    const activeProductsCount = products.filter(p => p.status === 'Active').length;

    const stats = [
        {
            label: 'Total Revenue',
            value: `₹${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            change: revenueTrend.change,
            trend: revenueTrend.trend,
            icon: DollarSign
        },
        {
            label: 'Total Orders',
            value: totalOrdersCount.toLocaleString(),
            change: orderVolumeTrend.change,
            trend: orderVolumeTrend.trend,
            icon: ShoppingCart
        },
        {
            label: 'Inventory Value',
            value: `₹${inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}`,
            change: 'Stable',
            trend: 'up',
            icon: Package
        },
        {
            label: 'Active Products',
            value: activeProductsCount.toString(),
            change: 'Live',
            trend: 'up',
            icon: Activity
        },
    ];

    const formatRelativeTime = (createdAt: Date | { toMillis?: () => number } | { toDate?: () => Date } | string | null | undefined) => {
        if (!createdAt) return 'Recently';
        let date: Date;
        if (createdAt instanceof Date) {
            date = createdAt;
        } else if (createdAt && typeof createdAt === 'object') {
            if ('toMillis' in createdAt && typeof createdAt.toMillis === 'function') {
                date = new Date(createdAt.toMillis());
            } else if ('toDate' in createdAt && typeof createdAt.toDate === 'function') {
                date = createdAt.toDate();
            } else {
                date = new Date(createdAt as string);
            }
        } else {
            date = new Date(createdAt as string);
        }
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const isGlobalLoading = isInventoryLoading || isOrdersLoading;

    if (!mounted) return null;

    if (isGlobalLoading && products.length === 0) {
        return (
            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-custom">
                    <div className="space-y-4">
                        <div className="h-10 w-48 bg-surface animate-pulse" />
                        <div className="h-4 w-96 bg-surface animate-pulse" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white p-8 border border-border-custom h-32 animate-pulse" />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white border border-border-custom h-96 animate-pulse" />
                    <div className="bg-white border border-border-custom h-96 animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto space-y-12"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-custom">
                <div>
                    <h1 className="font-playfair text-4xl font-black text-secondary">Overview</h1>
                    <p className="text-muted-custom text-sm mt-2">Manage your luxury editorial collection and monitor performance.</p>
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-custom flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    Live Data Updated: {new Date().toLocaleTimeString()}
                </div>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white p-8 border border-border-custom hover:border-primary transition-all duration-300 group shadow-sm hover:shadow-md">
                        <div className="flex items-start justify-between mb-4">
                            <div className="text-[10px] font-black tracking-widest text-muted-custom uppercase">{stat.label}</div>
                            <stat.icon className="w-4 h-4 text-border-custom group-hover:text-primary transition-colors" />
                        </div>
                        <div className="flex items-end justify-between">
                            <div className="text-3xl font-playfair font-black text-secondary">{stat.value}</div>
                            <div className={cn(
                                "flex items-center gap-1 text-[9px] font-black px-2 py-1",
                                stat.trend === 'up' ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                            )}>
                                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {stat.change}
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <section className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">Recent Transactions</h2>
                        <button className="text-[10px] font-black uppercase tracking-widest text-muted-custom hover:text-primary transition-colors border-b border-transparent hover:border-primary">View All Orders</button>
                    </div>
                    <div className="bg-white border border-border-custom overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-border-custom bg-surface">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Order ID</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary text-center">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Customer</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-custom">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-custom font-black uppercase tracking-widest text-[10px]">
                                            No orders recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.slice(0, 5).map((order) => (
                                        <tr key={order.id} className="hover:bg-surface/50 transition-colors cursor-pointer group">
                                            <td className="px-6 py-5">
                                                <span className="text-[10px] font-black text-secondary group-hover:text-primary transition-colors">#{order.id?.slice(-6).toUpperCase()}</span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="text-[10px] text-muted-custom font-black uppercase tracking-widest">{formatRelativeTime(order.createdAt)}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-bold text-secondary">{order.customerEmail.split('@')[0]}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 border",
                                                    order.status === 'Processing' ? "border-secondary text-secondary" :
                                                        order.status === 'Shipped' ? "border-primary text-primary" :
                                                            "border-accent text-accent bg-accent/5"
                                                )}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <span className="text-sm font-playfair font-black text-secondary">₹{order.total?.toFixed(2)}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">Top Performers</h2>
                    </div>
                    <div className="bg-white border border-border-custom p-8 space-y-8 shadow-sm">
                        {getTopPerformers(3).length === 0 ? (
                            <div className="text-center py-8 text-muted-custom text-[10px] font-black uppercase tracking-widest">
                                No sales data yet
                            </div>
                        ) : (
                            getTopPerformers(3).map((product) => (
                                <div key={product.id} className="flex items-center gap-4 group">
                                    <div className="w-12 h-16 bg-surface border border-border-custom shrink-0 overflow-hidden">
                                        <img src={product.image || product.images?.[0] || '/placeholder-product.svg'} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">{product.category}</div>
                                        <h4 className="font-playfair text-sm font-bold text-secondary truncate group-hover:text-primary transition-colors">{product.name}</h4>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[9px] text-muted-custom font-black uppercase tracking-widest">{product.stock || 0} In Stock</span>
                                            <span className="text-xs font-black text-secondary">₹{product.price}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-6 bg-secondary text-white border border-secondary shadow-xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-2">Pro Insights</h3>
                            <p className="text-[10px] text-white/70 leading-relaxed italic">
                                {totalOrdersCount > 0
                                    ? `&ldquo;You've processed ${totalOrdersCount} orders to date. ${activeProductsCount} products are currently live and ready for fulfillment.&rdquo;`
                                    : `&ldquo;Your boutique is live with ${activeProductsCount} products. Share your store link to start receiving your first orders!&rdquo;`}
                            </p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-700" />
                    </div>
                </section>
            </div>
        </motion.div>
    );
}

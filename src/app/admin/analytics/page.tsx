'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import nextDynamic from 'next/dynamic';
import {
    ArrowUpRight,
    ShoppingBag,
    BarChart3,
    TrendingUp,
    Activity,
    Users,
    Package,
    LineChart as LineChartIcon,
    AlertTriangle,
    XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

import { getAllOrders, getAnalyticsEvents, getAllProducts, type Order, type AnalyticsEvent, type Product } from '@/lib/firestore';
import { logger } from '@/lib/logger';
import { toSafeDate } from '@/lib/utils';

// Lazy-load Recharts components to reduce initial bundle by ~50 modules
const RechartsAreaChart = nextDynamic(
    () => import('recharts').then(mod => mod.AreaChart),
    { ssr: false }
);
const Area = nextDynamic(
    () => import('recharts').then(mod => mod.Area),
    { ssr: false }
);
const XAxis = nextDynamic(
    () => import('recharts').then(mod => mod.XAxis),
    { ssr: false }
);
const YAxis = nextDynamic(
    () => import('recharts').then(mod => mod.YAxis),
    { ssr: false }
);
const CartesianGrid = nextDynamic(
    () => import('recharts').then(mod => mod.CartesianGrid),
    { ssr: false }
);
const RechartsTooltip = nextDynamic(
    () => import('recharts').then(mod => mod.Tooltip),
    { ssr: false }
);
const ResponsiveContainer = nextDynamic(
    () => import('recharts').then(mod => mod.ResponsiveContainer),
    { ssr: false }
);
const RechartsBarChart = nextDynamic(
    () => import('recharts').then(mod => mod.BarChart),
    { ssr: false }
);
const Bar = nextDynamic(
    () => import('recharts').then(mod => mod.Bar),
    { ssr: false }
);

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

// Chart skeleton component for loading states
function ChartSkeleton({ height = 300 }: { height?: number }) {
    return (
        <div 
            className="w-full bg-surface/50 rounded-2xl animate-pulse flex items-center justify-center"
            style={{ height }}
        >
            <div className="text-muted-custom text-xs">Loading chart...</div>
        </div>
    );
}

export default function AdminAnalyticsPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [events, setEvents] = useState<AnalyticsEvent[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [timeframe, setTimeframe] = useState<'7D' | '30D' | '1Y'>('30D');
    const [isLoading, setIsLoading] = useState(true);
    const [chartsReady, setChartsReady] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        Promise.all([getAllOrders(), getAnalyticsEvents(), getAllProducts()]).then(([fetchedOrders, fetchedEvents, fetchedProducts]) => {
            setOrders(fetchedOrders);
            setEvents(fetchedEvents);
            setProducts(fetchedProducts);
            setIsLoading(false);
            // Delay chart rendering slightly to prevent blocking
            requestAnimationFrame(() => setChartsReady(true));
        }).catch((err) => {
            logger.error('Failed to fetch analytics data', err, 'ADMIN');
            setIsLoading(false);
        });
    }, []);

    // Time cutoff — computed once per render but kept stable since timeframe drives re-renders
    // eslint-disable-next-line react-hooks/purity
    const now = useMemo(() => Date.now(), [timeframe]); // eslint-disable-line react-hooks/exhaustive-deps
    const days = timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 365;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    const previousCutoff = cutoff - days * 24 * 60 * 60 * 1000;

    const filteredOrders = orders.filter(o => {
        const ts = toSafeDate(o.createdAt)?.getTime() ?? 0;
        return ts >= cutoff;
    });
    
    const previousOrders = orders.filter(o => {
        const ts = toSafeDate(o.createdAt)?.getTime() ?? 0;
        return ts >= previousCutoff && ts < cutoff;
    });
    
    const filteredEvents = events.filter(e => {
        const ts = toSafeDate(e.createdAt)?.getTime() ?? 0;
        return ts >= cutoff;
    });

    // Only count orders that have been paid/processed for revenue metrics
    const paidOrders = filteredOrders.filter(o => o.status !== 'Pending');
    const previousPaidOrders = previousOrders.filter(o => o.status !== 'Pending');

    const hasData = paidOrders.length > 0 || filteredEvents.length > 0;

    // Stats calculated dynamically
    const totalRevenue = paidOrders.reduce((acc, o) => acc + o.total, 0);
    const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
    const newCustomers = new Set(paidOrders.map(o => o.customerEmail)).size;
    const unitsSold = paidOrders.reduce((acc, o) => acc + o.items.reduce((sum, item) => sum + item.quantity, 0), 0);

    // Previous period stats for growth calculation
    const previousRevenue = previousPaidOrders.reduce((acc, o) => acc + o.total, 0);
    const previousAov = previousPaidOrders.length > 0 ? previousRevenue / previousPaidOrders.length : 0;
    
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const aovGrowth = previousAov > 0 ? ((avgOrderValue - previousAov) / previousAov) * 100 : 0;

    // Funnel Stats
    const sessions = filteredEvents.filter(e => e.type === 'PAGE_VIEW').length || 1;
    const addToCarts = filteredEvents.filter(e => e.type === 'ADD_TO_CART').length;
    const checkoutStarts = filteredEvents.filter(e => e.type === 'CHECKOUT_START').length;
    const purchases = paidOrders.length;

    // Abandonment rates
    const cartAbandonmentRate = addToCarts > 0 ? ((addToCarts - Math.max(checkoutStarts, purchases)) / addToCarts) * 100 : 0;
    const checkoutAbandonmentRate = checkoutStarts > 0 ? ((checkoutStarts - purchases) / checkoutStarts) * 100 : 0;

    // Repeat customer analytics
    const customerOrderCounts = new Map<string, number>();
    paidOrders.forEach(order => {
        const email = order.customerEmail;
        customerOrderCounts.set(email, (customerOrderCounts.get(email) || 0) + 1);
    });
    const repeatCustomers = Array.from(customerOrderCounts.values()).filter(count => count > 1).length;
    const repeatCustomerRate = newCustomers > 0 ? (repeatCustomers / newCustomers) * 100 : 0;
    
    const repeatCustomerRevenue = paidOrders
        .filter(order => (customerOrderCounts.get(order.customerEmail) || 0) > 1)
        .reduce((acc, o) => acc + o.total, 0);
    const repeatRevenuePercent = totalRevenue > 0 ? (repeatCustomerRevenue / totalRevenue) * 100 : 0;

    // Inventory insights
    const LOW_STOCK_THRESHOLD = 10;
    // Calculate sales by product in current timeframe
    const productSalesMap = new Map<string, number>();
    paidOrders.forEach(order => {
        order.items.forEach(item => {
            productSalesMap.set(item.productId, (productSalesMap.get(item.productId) || 0) + item.quantity);
        });
    });
    
    // Analyze inventory
    const lowStockProducts = products.filter(p => (p.stock || 0) <= LOW_STOCK_THRESHOLD && (p.stock || 0) > 0 && p.status === 'Active');
    const outOfStockProducts = products.filter(p => (p.stock || 0) === 0 && p.status === 'Active');
    const slowMovingProducts = products.filter(p => {
        const sales = productSalesMap.get(p.id || '') || 0;
        return sales === 0 && p.status === 'Active' && (p.stock || 0) > 0;
    }).slice(0, 10); // Top 10 slow movers

    // Top customers analytics
    const customerRevenueMap = new Map<string, { email: string; revenue: number; orders: number }>();
    paidOrders.forEach(order => {
        const email = order.customerEmail;
        const existing = customerRevenueMap.get(email) || { email, revenue: 0, orders: 0 };
        customerRevenueMap.set(email, {
            email,
            revenue: existing.revenue + order.total,
            orders: existing.orders + 1
        });
    });
    const topCustomers = Array.from(customerRevenueMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10); // Top 10 customers

    // Charts Data
    const getSalesData = () => {
        const salesByDay = new Map<string, number>();
        const formatStr = timeframe === '1Y' ? { month: 'short' as const } : { month: 'short' as const, day: 'numeric' as const };
        const interval = timeframe === '1Y' ? 30 : 1;
        const totalPoints = timeframe === '1Y' ? 12 : days;

        for (let i = totalPoints - 1; i >= 0; i--) {
            const d = new Date(now - i * interval * 24 * 60 * 60 * 1000);
            salesByDay.set(d.toLocaleDateString('en-US', formatStr), 0);
        }

        paidOrders.forEach(order => {
            const rawDate = toSafeDate(order.createdAt) ?? new Date(0);
            const key = rawDate.toLocaleDateString('en-US', formatStr);
            if (salesByDay.has(key)) {
                salesByDay.set(key, salesByDay.get(key)! + order.total);
            }
        });

        return Array.from(salesByDay.entries()).map(([day, value]) => ({ day, value }));
    };

    const getEngagementData = () => {
        const visitsByDay = new Map<string, number>();
        const formatStr = timeframe === '1Y' ? { month: 'short' as const } : { month: 'short' as const, day: 'numeric' as const };
        const interval = timeframe === '1Y' ? 30 : 1;
        const totalPoints = timeframe === '1Y' ? 12 : days;

        for (let i = totalPoints - 1; i >= 0; i--) {
            const d = new Date(now - i * interval * 24 * 60 * 60 * 1000);
            visitsByDay.set(d.toLocaleDateString('en-US', formatStr), 0);
        }

        filteredEvents.forEach(e => {
            if (e.type !== 'PAGE_VIEW') return;
            const rawDate = toSafeDate(e.createdAt) ?? new Date(0);
            const key = rawDate.toLocaleDateString('en-US', formatStr);
            if (visitsByDay.has(key)) {
                visitsByDay.set(key, visitsByDay.get(key)! + 1);
            }
        });

        return Array.from(visitsByDay.entries()).map(([day, value]) => ({ day, value }));
    };

    const getCategoryData = () => {
        const categoryMap = new Map<string, number>();
        paidOrders.forEach(order => {
            order.items.forEach(item => {
                const cat = item.category || 'Uncategorized';
                categoryMap.set(cat, (categoryMap.get(cat) || 0) + item.price * item.quantity);
            });
        });
        const data = Array.from(categoryMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return data.length > 0 ? data : [{ name: 'No Data', value: 0 }];
    };

    const getBestSellers = () => {
        const itemSales = new Map<string, { name: string, price: number, sold: number }>();
        paidOrders.forEach(order => {
            order.items.forEach(item => {
                const id = item.productId;
                const current = itemSales.get(id) || { name: item.name, price: item.price, sold: 0 };
                current.sold += item.quantity;
                itemSales.set(id, current);
            });
        });
        return Array.from(itemSales.values()).sort((a, b) => b.sold - a.sold).slice(0, 5);
    };

    const getOrderStatusBreakdown = () => {
        const statusMap = new Map<string, number>();
        filteredOrders.forEach(order => {
            const status = order.status || 'Unknown';
            statusMap.set(status, (statusMap.get(status) || 0) + 1);
        });
        return Array.from(statusMap.entries())
            .map(([status, count]) => ({ status, count }))
            .sort((a, b) => b.count - a.count);
    };

    const SALES_DATA = getSalesData();
    const CATEGORY_DATA = getCategoryData();
    const ENGAGEMENT_DATA = getEngagementData();
    const BEST_SELLERS = getBestSellers();
    const ORDER_STATUS_DATA = getOrderStatusBreakdown();

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-custom">
                    <div>
                        <div className="h-10 w-64 bg-surface rounded-full animate-pulse mb-4" />
                        <div className="h-4 w-96 bg-surface rounded-full animate-pulse" />
                    </div>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_2.5fr] min-h-[800px] border border-border-custom overflow-hidden">
                    <div className="bg-[#1C1D1F] p-8 flex flex-col gap-12">
                        <div className="h-40 w-full bg-white/5 rounded-2xl animate-pulse" />
                        <div className="h-60 w-full bg-white/5 rounded-2xl animate-pulse" />
                        <div className="h-40 w-full bg-white/5 rounded-2xl animate-pulse" />
                    </div>
                    <div className="bg-[#FAF9F6] p-8 flex flex-col gap-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-gray-200">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-surface rounded-xl animate-pulse" />)}
                        </div>
                        <div className="h-[250px] bg-surface rounded-2xl animate-pulse" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-6 border-t border-gray-200">
                            <div className="h-[180px] bg-surface rounded-2xl animate-pulse" />
                            <div className="h-[180px] bg-surface rounded-2xl animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border-custom">
                <div>
                    <h1 className="font-playfair text-4xl font-black text-secondary">Analytics</h1>
                    <p className="text-muted-custom text-sm mt-2">Deep dive into your store&apos;s performance metrics.</p>
                </div>
                <div className="flex items-center gap-2 bg-white border border-border-custom p-1">
                    {['7D', '30D', '1Y'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTimeframe(t as '7D' | '30D' | '1Y')}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${timeframe === t ? 'bg-secondary text-white shadow-sm' : 'text-muted-custom hover:text-secondary hover:bg-surface'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 xl:grid-cols-[1fr_2.5fr] min-h-[800px] border border-border-custom overflow-hidden bg-white shadow-sm"
            >
                {/* Left Dark Panel */}
                <div className="bg-[#1C1D1F] text-white p-8 flex flex-col gap-12 relative overflow-hidden">
                    {/* Decorative subtle texture/gradient */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    {/* Conversion Funnel */}
                    <motion.div variants={itemVariants}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-medium tracking-wide text-gray-300">CONVERSION FUNNEL</h3>
                            <ArrowUpRight className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex flex-col items-center gap-2 relative">
                            <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
                            <div className="w-full bg-[#EFE9E1] text-[#1C1D1F] text-[10px] font-black py-4 text-center uppercase tracking-widest rounded-sm">
                                {sessions.toLocaleString()} Sessions
                            </div>
                            <div className="w-[85%] bg-[#FFFFFF] text-[#1C1D1F] text-[10px] font-black py-4 text-center uppercase tracking-widest rounded-sm">
                                {addToCarts.toLocaleString()} Add to Cart ({sessions > 1 ? ((addToCarts / sessions) * 100).toFixed(1) : '0.0'}%)
                            </div>
                            <div className="w-[65%] bg-accent text-[#1C1D1F] text-[10px] font-black py-4 text-center uppercase tracking-widest rounded-sm shadow-lg shadow-accent/20">
                                {purchases.toLocaleString()} Purchase ({sessions > 1 ? ((purchases / sessions) * 100).toFixed(1) : '0.0'}%)
                            </div>
                        </div>
                    </motion.div>

                    {/* Order Status Breakdown */}
                    <motion.div variants={itemVariants}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-medium tracking-wide text-gray-300">ORDER STATUS<br /><span className="text-[10px] text-gray-500 font-normal">Current Period</span></h3>
                            <Package className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="space-y-3">
                            {ORDER_STATUS_DATA.length === 0 ? (
                                <div className="text-xs text-gray-500 flex flex-col items-center justify-center py-8 opacity-50 border border-dashed border-white/20 rounded-xl">
                                    <Package className="w-6 h-6 mb-2" />
                                    No orders yet
                                </div>
                            ) : (
                                ORDER_STATUS_DATA.map((item) => {
                                    const percentage = filteredOrders.length > 0 ? ((item.count / filteredOrders.length) * 100).toFixed(1) : '0.0';
                                    const statusColors: Record<string, string> = {
                                        'Pending': '#FCD34D',
                                        'Processing': '#60A5FA',
                                        'Shipped': '#A78BFA',
                                        'Delivered': '#34D399',
                                        'Cancelled': '#F87171',
                                        'Refunded': '#FB923C'
                                    };
                                    const color = statusColors[item.status] || '#E8B4B8';
                                    return (
                                        <div key={item.status} className="bg-white/5 p-3 rounded-lg border border-white/5">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                                    <span className="text-xs font-medium text-gray-300">{item.status}</span>
                                                </div>
                                                <span className="text-xs font-bold text-white">{item.count}</span>
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: color }} />
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-1 text-right">{percentage}%</div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>

                    {/* Cart Abandonment Metrics */}
                    <motion.div variants={itemVariants}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-medium tracking-wide text-gray-300">ABANDONMENT RATES<br /><span className="text-[10px] text-gray-500 font-normal">Drop-off Analysis</span></h3>
                            <Activity className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="space-y-4">
                            <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-gray-300">Cart Abandonment</span>
                                    <span className="text-lg font-black text-white">{cartAbandonmentRate.toFixed(1)}%</span>
                                </div>
                                <p className="text-[10px] text-gray-500">
                                    {addToCarts} added to cart, {Math.max(checkoutStarts, purchases)} proceeded
                                </p>
                            </div>
                            {checkoutStarts > 0 && (
                                <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-gray-300">Checkout Abandonment</span>
                                        <span className="text-lg font-black text-white">{checkoutAbandonmentRate.toFixed(1)}%</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500">
                                        {checkoutStarts} started checkout, {purchases} completed
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Top Customers */}
                    <motion.div variants={itemVariants}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-medium tracking-wide text-gray-300">TOP CUSTOMERS<br /><span className="text-[10px] text-gray-500 font-normal">By Revenue</span></h3>
                            <Users className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="space-y-3">
                            {topCustomers.length === 0 ? (
                                <div className="text-xs text-gray-500 flex flex-col items-center justify-center py-8 opacity-50 border border-dashed border-white/20 rounded-xl">
                                    <Users className="w-6 h-6 mb-2" />
                                    No customers yet
                                </div>
                            ) : (
                                topCustomers.map((customer, i) => (
                                    <div key={customer.email} className="bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                <span className="shrink-0 text-white/40 font-black text-xs">{i + 1}.</span>
                                                <span className="truncate text-xs font-medium text-gray-300">{customer.email}</span>
                                            </div>
                                            <span className="font-bold text-sm text-accent shrink-0">₹{customer.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 ml-5">
                                            {customer.orders} {customer.orders === 1 ? 'order' : 'orders'} • ₹{(customer.revenue / customer.orders).toFixed(2)} avg
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Best Selling Items */}
                    <motion.div variants={itemVariants} className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-medium tracking-wide text-gray-300">BEST-SELLING ITEMS<br /><span className="text-[10px] text-gray-500 font-normal">By Volume</span></h3>
                            <ShoppingBag className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="space-y-4">
                            {BEST_SELLERS.length === 0 ? (
                                <div className="text-xs text-gray-500 flex flex-col items-center justify-center py-8 opacity-50 border border-dashed border-white/20 rounded-xl">
                                    <Package className="w-6 h-6 mb-2" />
                                    No items sold yet
                                </div>
                            ) : (
                                BEST_SELLERS.map((p, i) => (
                                    <div key={p.name} className="flex items-center justify-between text-xs text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-3 overflow-hidden w-2/3">
                                            <span className="shrink-0 text-white/40 font-black">{i + 1}.</span>
                                            <span className="truncate font-medium">{p.name}</span>
                                        </div>
                                        <span className="font-bold shrink-0 text-accent">
                                            {p.sold} x ₹{p.price} = ₹{(p.sold * p.price).toLocaleString()}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Right Light Panel */}
                <div className="bg-[#FAF9F6] p-6 lg:p-10 flex flex-col gap-10">
                    {/* Top Stats */}
                    <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-8 border-b border-border-custom">
                        <div className="bg-white p-6 border border-border-custom rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-custom mb-3">
                                <TrendingUp className="w-3 h-3" /> Total Revenue
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-playfair font-black text-secondary">₹{totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                {previousRevenue > 0 && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${revenueGrowth >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                        {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="bg-white p-6 border border-border-custom rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-custom mb-3">
                                <Activity className="w-3 h-3" /> Avg. Order Value
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-playfair font-black text-secondary">₹{avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                {previousAov > 0 && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${aovGrowth >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                        {aovGrowth >= 0 ? '+' : ''}{aovGrowth.toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="bg-white p-6 border border-border-custom rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-custom mb-3">
                                <Users className="w-3 h-3" /> New Customers
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-playfair font-black text-secondary">{newCustomers.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="bg-white p-6 border border-border-custom rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-custom mb-3">
                                <ShoppingBag className="w-3 h-3" /> Units Sold
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-playfair font-black text-secondary">{unitsSold.toLocaleString()}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Area Chart */}
                    <motion.div variants={itemVariants} className="relative">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black uppercase tracking-widest text-secondary">SALES TRENDS</h3>
                            <LineChartIcon className="w-4 h-4 text-muted-custom" />
                        </div>
                        <div className="h-[300px] w-full border border-border-custom bg-white p-4 rounded-3xl shadow-sm relative">
                            {!hasData && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-3xl">
                                    <TrendingUp className="w-8 h-8 text-muted-custom mb-4 opacity-50" />
                                    <p className="font-playfair font-black text-xl text-secondary">No Sales Data Yet</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-custom mt-2">Waiting for your first order...</p>
                                </div>
                            )}
                            {chartsReady ? (
                                <Suspense fallback={<ChartSkeleton />}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsAreaChart data={SALES_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#1C1D1F" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#1C1D1F" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 'bold' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 'bold' }} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
                                            <RechartsTooltip cursor={{ stroke: '#1C1D1F', strokeWidth: 1, strokeDasharray: '5 5' }} contentStyle={{ backgroundColor: '#1C1D1F', color: '#fff', fontSize: '10px', fontWeight: 'bold', border: 'none', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} itemStyle={{ color: '#fff' }} />
                                            <Area type="monotone" dataKey="value" name="Revenue ₹" stroke="#1C1D1F" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                        </RechartsAreaChart>
                                    </ResponsiveContainer>
                                </Suspense>
                            ) : (
                                <ChartSkeleton />
                            )}
                        </div>
                    </motion.div>

                    {/* Repeat Customer Insights */}
                    <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6 pb-8 border-b border-border-custom">
                        <div className="bg-white p-6 border border-border-custom rounded-2xl shadow-sm">
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-custom mb-3">Repeat Customers</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-playfair font-black text-secondary">{repeatCustomers}</span>
                                <span className="text-xs text-muted-custom">of {newCustomers}</span>
                            </div>
                            <div className="text-[10px] text-muted-custom mt-2">{repeatCustomerRate.toFixed(1)}% return rate</div>
                        </div>
                        <div className="bg-white p-6 border border-border-custom rounded-2xl shadow-sm">
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-custom mb-3">Repeat Revenue</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-playfair font-black text-secondary">₹{repeatCustomerRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="text-[10px] text-muted-custom mt-2">{repeatRevenuePercent.toFixed(1)}% of total</div>
                        </div>
                        <div className="bg-white p-6 border border-border-custom rounded-2xl shadow-sm">
                            <div className="text-[9px] font-black uppercase tracking-widest text-muted-custom mb-3">Avg Orders/Customer</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-playfair font-black text-secondary">
                                    {newCustomers > 0 ? (paidOrders.length / newCustomers).toFixed(1) : '0.0'}
                                </span>
                            </div>
                            <div className="text-[10px] text-muted-custom mt-2">Customer lifetime value indicator</div>
                        </div>
                    </motion.div>

                    {/* Inventory Insights */}
                    <motion.div variants={itemVariants} className="pb-8 border-b border-border-custom">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-custom mb-4">Inventory Insights</div>
                        
                        <div className="grid grid-cols-3 gap-6 mb-6">
                            <div className="bg-white p-6 border border-border-custom rounded-2xl shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-custom">Low Stock</div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-playfair font-black text-yellow-600">{lowStockProducts.length}</span>
                                    <span className="text-xs text-muted-custom">products</span>
                                </div>
                                <div className="text-[10px] text-muted-custom mt-2">≤{LOW_STOCK_THRESHOLD} units remaining</div>
                            </div>
                            
                            <div className="bg-white p-6 border border-border-custom rounded-2xl shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-custom">Out of Stock</div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-playfair font-black text-red-600">{outOfStockProducts.length}</span>
                                    <span className="text-xs text-muted-custom">products</span>
                                </div>
                                <div className="text-[10px] text-muted-custom mt-2">Needs restocking</div>
                            </div>
                            
                            <div className="bg-white p-6 border border-border-custom rounded-2xl shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <Package className="w-4 h-4 text-purple-600" />
                                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-custom">Slow Moving</div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-playfair font-black text-purple-600">{slowMovingProducts.length}</span>
                                    <span className="text-xs text-muted-custom">products</span>
                                </div>
                                <div className="text-[10px] text-muted-custom mt-2">No sales in {days} days</div>
                            </div>
                        </div>

                        {/* Slow Moving Products Table */}
                        {slowMovingProducts.length > 0 && (
                            <div className="bg-white border border-border-custom rounded-2xl shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-border-custom">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-custom">Slow Moving Products</div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border-custom bg-gray-50">
                                                <th className="text-left text-[9px] font-black uppercase tracking-widest text-muted-custom p-3">Product</th>
                                                <th className="text-left text-[9px] font-black uppercase tracking-widest text-muted-custom p-3">Category</th>
                                                <th className="text-right text-[9px] font-black uppercase tracking-widest text-muted-custom p-3">Stock</th>
                                                <th className="text-right text-[9px] font-black uppercase tracking-widest text-muted-custom p-3">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {slowMovingProducts.map((product) => (
                                                <tr key={product.id} className="border-b border-border-custom last:border-0 hover:bg-gray-50 transition-colors">
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                                <img 
                                                                    src={product.image || product.images?.[0] || '/placeholder-product.svg'} 
                                                                    alt={product.name} 
                                                                    className="w-full h-full object-cover" 
                                                                />
                                                            </div>
                                                            <div className="text-xs font-semibold text-secondary truncate max-w-xs">{product.name}</div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="text-xs text-muted-custom">{product.category}</div>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <div className="text-xs font-semibold text-secondary">{product.stock || 0}</div>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <div className="text-xs font-semibold text-secondary">₹{product.price.toFixed(2)}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Bottom Row */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-8 border-t border-border-custom">
                        {/* Bar Graph */}
                        <div className="relative">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-secondary">TOP CATEGORIES<br /><span className="text-[9px] text-muted-custom font-normal">By Revenue</span></h3>
                                <BarChart3 className="w-4 h-4 text-muted-custom" />
                            </div>
                            <div className="h-[220px] w-full bg-white border border-border-custom rounded-3xl p-4 shadow-sm relative">
                                {!hasData && (
                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-3xl">
                                        <p className="font-playfair font-black text-lg text-secondary">No Data</p>
                                    </div>
                                )}
                                {chartsReady ? (
                                    <Suspense fallback={<ChartSkeleton height={200} />}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartsBarChart data={CATEGORY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280', fontWeight: 'bold' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280', fontWeight: 'bold' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                                <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1C1D1F', color: '#fff', fontSize: '10px', borderRadius: '8px', border: 'none' }} />
                                                <Bar dataKey="value" name="Revenue ₹" fill="#E8B4B8" radius={[4, 4, 0, 0]} />
                                            </RechartsBarChart>
                                        </ResponsiveContainer>
                                    </Suspense>
                                ) : (
                                    <ChartSkeleton height={200} />
                                )}
                            </div>
                        </div>

                        {/* Line Graph */}
                        <div className="relative">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-secondary">VISITOR ENGAGEMENT<br /><span className="text-[9px] text-muted-custom font-normal">Daily Traffic</span></h3>
                                <Activity className="w-4 h-4 text-muted-custom" />
                            </div>
                            {/* Note: PAGE_VIEW events are disabled to save Firestore costs */}
                            {/* For visitor tracking, integrate Google Analytics 4 - see docs/GA4_INTEGRATION.md */}
                            <div className="h-[220px] w-full bg-white border border-border-custom rounded-3xl p-4 shadow-sm relative">
                                {ENGAGEMENT_DATA.length === 0 ? (
                                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm rounded-3xl px-6">
                                        <Activity className="w-8 h-8 text-muted-custom mb-3 opacity-50" />
                                        <p className="font-playfair font-black text-base text-secondary text-center mb-2">Visitor Tracking Disabled</p>
                                        <p className="text-[10px] text-muted-custom text-center leading-relaxed max-w-xs">
                                            PAGE_VIEW events are disabled to save Firestore costs. 
                                            Integrate Google Analytics 4 for visitor tracking.
                                        </p>
                                        <a 
                                            href="https://analytics.google.com" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="mt-4 text-[10px] font-black uppercase tracking-wider text-accent hover:underline"
                                        >
                                            Set Up GA4 →
                                        </a>
                                    </div>
                                ) : null}
                                {chartsReady ? (
                                    <Suspense fallback={<ChartSkeleton height={200} />}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartsAreaChart data={ENGAGEMENT_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#C9B6A8" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#C9B6A8" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280', fontWeight: 'bold' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#6B7280', fontWeight: 'bold' }} tickFormatter={(v) => `${v}k`} />
                                                <RechartsTooltip contentStyle={{ backgroundColor: '#1C1D1F', color: '#fff', fontSize: '10px', borderRadius: '8px', border: 'none' }} />
                                                <Area type="monotone" dataKey="value" name="Sessions" stroke="#C9B6A8" strokeWidth={2} fillOpacity={1} fill="url(#colorEng)" />
                                            </RechartsAreaChart>
                                        </ResponsiveContainer>
                                    </Suspense>
                                ) : (
                                    <ChartSkeleton height={200} />
                                )}
                            </div>
                        </div>
                    </motion.div>

                </div>
            </motion.div>
        </div>
    );
}

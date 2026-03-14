'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Truck, Search, MapPin, Package, AlertCircle, ArrowRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useOrders } from '@/hooks/use-orders';
import { getOrder, type Order } from '@/lib/firestore';
import { Timestamp } from 'firebase/firestore';

const STATUS_COLORS: Record<string, string> = {
    Delivered: 'bg-accent/10 text-accent',
    Shipped: 'bg-secondary/10 text-secondary',
    Processing: 'bg-primary/10 text-primary',
};

const TrackContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isAuthenticated } = useAuth();
    const { orders, fetchUserOrders, isLoading } = useOrders();
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const initialId = searchParams.get('id') || '';
    const [searchId, setSearchId] = useState(initialId);
    const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    useEffect(() => {
        if (user) {
            fetchUserOrders(user.id);
        }
    }, [user, fetchUserOrders]);

    const handleSearch = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchId.trim()) return;

        setIsSearching(true);
        setSearchError('');
        setSearchedOrder(null);

        try {
            const data = await getOrder(searchId.trim());
            if (data) {
                setSearchedOrder(data);
            } else {
                setSearchError('Order not found. Please check your ID and try again.');
            }
        } catch {
            setSearchError('An error occurred while fetching your order.');
        } finally {
            setIsSearching(false);
        }
    }, [searchId]);

    useEffect(() => {
        if (initialId) {
            handleSearch();
        }
    }, [initialId, handleSearch]);

    return (
        <div className="max-w-4xl mx-auto min-h-[50vh]">
            <div className="text-center mb-12">
                <Truck className="w-10 h-10 text-primary mx-auto mb-6" />
                <h1 className="font-playfair text-4xl md:text-5xl font-black text-secondary mb-4">Track Your Order</h1>
                <p className="text-muted-custom text-sm mb-8">Enter your order ID below or log in to view your real-time shipping status.</p>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                    <input
                        type="text"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="e.g. 5rAxyz..."
                        className="flex-1 px-6 py-4 bg-surface border border-border-custom outline-none focus:border-secondary text-sm transition-colors"
                        required
                    />
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="bg-secondary text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all hover:bg-primary disabled:opacity-70"
                    >
                        {isSearching ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                        ) : (
                            <>
                                <Search className="w-4 h-4" />
                                Search
                            </>
                        )}
                    </button>
                </form>
            </div>

            {searchError && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-3 mb-8 max-w-2xl mx-auto">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {searchError}
                </motion.div>
            )}

            {searchedOrder && (
                <div className="mb-16">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-6 border-b border-border-custom pb-4">Search Result</h2>
                    <OrderCard order={searchedOrder} expandedOrderId={expandedOrderId} setExpandedOrderId={setExpandedOrderId} />
                </div>
            )}

            {isAuthenticated ? (
                <>
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-6 border-b border-border-custom pb-4">Your Order History</h2>
                    {isLoading ? (
                        <div className="py-20 flex justify-center">
                            <div className="w-8 h-8 border-4 border-border-custom border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-20 border border-border-custom bg-surface">
                            <Package className="w-10 h-10 text-border-custom mx-auto mb-4" />
                            <p className="text-muted-custom font-bold uppercase tracking-widest text-[11px]">No active orders</p>
                            <button
                                onClick={() => router.push('/')}
                                className="mt-6 text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary pb-0.5 hover:text-secondary hover:border-secondary transition-colors"
                            >
                                Browse Collection
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {orders.map(order => (
                                <OrderCard key={order.id} order={order} expandedOrderId={expandedOrderId} setExpandedOrderId={setExpandedOrderId} />
                            ))}
                        </div>
                    )}
                </>
            ) : (
                !searchedOrder && (
                    <div className="text-center py-12 border border-border-custom bg-surface mt-12">
                        <p className="text-muted-custom text-sm mb-4">Have an account? Log in to see all your past orders at once.</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="inline-flex items-center gap-2 bg-secondary text-white px-8 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-colors mt-2"
                        >
                            Sign In
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )
            )}
        </div>
    );
};

const OrderCard = ({ order, expandedOrderId, setExpandedOrderId }: { order: Order, expandedOrderId: string | null, setExpandedOrderId: (id: string | null) => void }) => {
    return (
        <div className="border border-border-custom group hover:border-secondary transition-colors overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="text-[10px] font-black text-primary uppercase tracking-widest">Order #{order.id?.slice(-6).toUpperCase()}</div>
                    <div className="font-playfair text-xl font-bold text-secondary">
                        {order.createdAt instanceof Timestamp 
                          ? order.createdAt.toDate().toLocaleDateString() 
                          : order.createdAt instanceof Date 
                            ? order.createdAt.toLocaleDateString() 
                            : 'Recent'}
                    </div>
                    <div className="flex items-center gap-4 text-[10px]">
                        <span className="text-muted-custom font-bold uppercase tracking-widest">{order.items.length} Items</span>
                        <span className="w-1 h-1 rounded-full bg-border-custom" />
                        <span className={cn("font-black uppercase tracking-widest px-2 py-0.5 text-[9px]", STATUS_COLORS[order.status] ?? 'bg-surface text-secondary')}>{order.status}</span>
                        <span className="w-1 h-1 rounded-full bg-border-custom" />
                        {order.paymentStatus === 'Paid' ? (
                            <span className="font-black uppercase tracking-widest px-2 py-0.5 text-[9px] bg-green-100 text-green-700">Paid</span>
                        ) : (
                            <span className="font-black uppercase tracking-widest px-2 py-0.5 text-[9px] bg-yellow-100 text-yellow-700">Unpaid</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                    <div className="text-2xl font-playfair font-black text-secondary shrink-0">₹{order.total.toFixed(2)}</div>
                    <button
                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : (order.id || null))}
                        className="flex-1 md:flex-none border border-secondary px-6 md:px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary hover:bg-secondary hover:text-white transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        {expandedOrderId === order.id ? 'Hide Details' : 'Track Order'}
                        <ArrowRight className={cn("w-3 h-3 transition-transform", expandedOrderId === order.id ? "-rotate-90" : "rotate-90 md:rotate-0")} />
                    </button>
                </div>
            </div>
            <AnimatePresence>
                {expandedOrderId === order.id && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border-custom bg-surface"
                    >
                        <div className="p-6 md:p-8 space-y-8">

                             {/* New Stepper Visualizer */}
                             <div className="mb-12">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-8">Delivery Status</h4>
                                <div className="stepper-box">
                                    {(['Pending', 'Processing', 'Shipped', 'Delivered'] as const).map((step, idx) => {
                                        const statusLabels = {
                                            Pending: { title: 'Order Placed', desc: 'Your order has been confirmed' },
                                            Processing: { title: 'Processing', desc: 'Preparing your items' },
                                            Shipped: { title: 'Shipping', desc: 'Your order is on the way' },
                                            Delivered: { title: 'Delivered', desc: 'Order received' },
                                        };

                                        const currentStatusIdx = ['Pending', 'Processing', 'Shipped', 'Delivered'].indexOf(order.status);
                                        const isCompleted = idx < currentStatusIdx || order.status === 'Delivered';
                                        const isActive = idx === currentStatusIdx && order.status !== 'Delivered';
                                        const isPending = idx > currentStatusIdx && order.status !== 'Delivered';

                                        let stepperClass = "stepper-pending";
                                        if (isCompleted) stepperClass = "stepper-completed";
                                        else if (isActive) stepperClass = "stepper-active";

                                        const getStatusText = () => {
                                            if (isCompleted) return 'Completed';
                                            if (isActive) return 'In Progress';
                                            return 'Pending';
                                        };

                                        const getTimeText = () => {
                                            if (idx === 0) {
                                                const date = order.createdAt instanceof Timestamp ? order.createdAt.toDate() : order.createdAt instanceof Date ? order.createdAt : null;
                                                return date ? date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';
                                            }
                                            if (isActive || (isCompleted && idx === currentStatusIdx)) {
                                                const date = order.updatedAt instanceof Timestamp ? order.updatedAt.toDate() : order.updatedAt instanceof Date ? order.updatedAt : null;
                                                return date ? date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';
                                            }
                                            if (isPending && idx === currentStatusIdx + 1) {
                                                return 'Estimated Soon';
                                            }
                                            return '';
                                        };

                                        return (
                                            <div key={step} className={`stepper-step ${stepperClass}`}>
                                                <div className="stepper-circle">
                                                    {isCompleted ? (
                                                        <svg viewBox="0 0 16 16" fill="currentColor" height="16" width="16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"></path></svg>
                                                    ) : (
                                                        idx + 1
                                                    )}
                                                </div>
                                                {step !== 'Delivered' && <div className="stepper-line"></div>}
                                                <div className="stepper-content">
                                                    <div className="stepper-title">{statusLabels[step].title}</div>
                                                    <div className="stepper-status">{getStatusText()}</div>
                                                    <div className="stepper-time">{getTimeText()}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border-custom/50">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-4 flex items-center gap-2"><Package className="w-3 h-3 text-primary" /> Items Ordered</h4>
                                    <div className="space-y-4">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex flex-row items-center gap-4">
                                                <div className="w-12 h-16 bg-background border border-border-custom shrink-0 overflow-hidden">
                                                    <img src={item.image || '/placeholder-product.svg'} alt={item.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-playfair font-bold text-secondary text-sm line-clamp-1">{item.name}</p>
                                                    <p className="text-[10px] text-muted-custom uppercase font-black tracking-widest mt-1">Qty: {item.quantity} • ₹{(item.price * item.quantity).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-4 flex items-center gap-2"><MapPin className="w-3 h-3 text-primary" /> Tracking Info</h4>
                                    <div className="space-y-4 text-sm bg-background p-4 border border-border-custom">
                                        {order.trackingNumber ? (
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">Waybill Number</p>
                                                <p className="font-mono text-primary font-bold">{order.trackingNumber}</p>
                                                <p className="text-[10px] text-muted-custom mt-2 leading-relaxed">Your order is currently in transit. Use the waybill number on your local postal service to get pinpoint locations.</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-custom uppercase tracking-widest leading-relaxed">
                                                    {order.status === 'Pending' || order.status === 'Processing'
                                                        ? "Your order is currently being processed. A tracking number will be assigned once it ships."
                                                        : "No tracking number was provided for this order."}
                                                </p>
                                            </div>
                                        )}
                                        <div className="pt-4 mt-4 border-t border-border-custom">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-1">Destination Address</p>
                                            <p className="text-sm text-muted-custom whitespace-pre-wrap">{order.shippingAddress || 'No address provided'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function TrackPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-6 md:px-10 lg:px-16 py-12 md:py-20">
                <Suspense fallback={<div className="text-center">Loading...</div>}>
                    <TrackContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}

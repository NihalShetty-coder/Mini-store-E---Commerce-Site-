'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useOrders } from '@/hooks/use-orders';
import { type Order } from '@/lib/firestore';
import { Package, Search, RefreshCw, Eye, X, Save, Printer, Ban, Clock } from 'lucide-react';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';

export default function AdminOrdersPage() {
    const { orders, fetchAllOrders, updateOrderStatus, updateOrderDetails, isLoading } = useOrders();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCancelling, setIsCancelling] = useState<string | null>(null);
    const { addToast } = useToast();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // New State for Order Details Editing
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingCarrier, setTrackingCarrier] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [isSavingDetails, setIsSavingDetails] = useState(false);
    const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);

    useEffect(() => {
        if (selectedOrder) {
            setTrackingNumber(selectedOrder.trackingNumber || '');
            setTrackingCarrier(selectedOrder.trackingCarrier || '');
            setAdminNotes(selectedOrder.adminNotes || '');
        }
    }, [selectedOrder]);

    // Auto-cleanup expired pending orders on page load
    const cleanupExpiredOrders = useCallback(async () => {
        try {
            const res = await fetch('/api/cleanup-orders', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                if (data.deletedCount > 0) {
                    addToast(`Cleaned up ${data.deletedCount} expired pending order(s)`, 'info');
                    await fetchAllOrders();
                }
            }
        } catch {
            // Silently fail - cleanup is best-effort
        }
    }, [addToast, fetchAllOrders]);

    useEffect(() => {
        fetchAllOrders();
        cleanupExpiredOrders();
    }, [fetchAllOrders, cleanupExpiredOrders]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await cleanupExpiredOrders();
        await fetchAllOrders();
        setIsRefreshing(false);
        addToast('Orders refreshed', 'success');
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            addToast(`Order status updated to ${newStatus}`, 'success');
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch {
            addToast('Failed to update status', 'error');
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        setCancelModalOrderId(null);
        setIsCancelling(orderId);
        try {
            const res = await fetch('/api/cancel-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to cancel order');
            }

            addToast('Order cancelled successfully', 'success');

            // Update local state
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: 'Cancelled' });
            }
            await fetchAllOrders();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Failed to cancel order';
            addToast(msg, 'error');
        } finally {
            setIsCancelling(null);
        }
    };

    const handleSaveDetails = async () => {
        if (!selectedOrder) return;
        setIsSavingDetails(true);
        try {
            await updateOrderDetails(selectedOrder.id!, {
                trackingNumber,
                trackingCarrier,
                adminNotes,
            });
            addToast('Order details saved', 'success');
            setSelectedOrder({ ...selectedOrder, trackingNumber, trackingCarrier, adminNotes });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to save details';
            addToast(msg, 'error');
        } finally {
            setIsSavingDetails(false);
        }
    };

    const handlePrintPackingSlip = () => {
        window.print();
    };

    // Helper to check if an order is expired (older than 30 min, pending, unpaid)
    const isExpiredPending = (order: Order): boolean => {
        if (order.status.toLowerCase() !== 'pending' || order.paymentStatus === 'Paid') return false;
        if (!order.createdAt) return false;

        let createdAtMs: number;
        if (order.createdAt instanceof Date) {
            createdAtMs = order.createdAt.getTime();
        } else if (typeof (order.createdAt as { toMillis?: () => number }).toMillis === 'function') {
            createdAtMs = (order.createdAt as { toMillis: () => number }).toMillis();
        } else {
            return false;
        }

        return (Date.now() - createdAtMs) > 30 * 60 * 1000;
    };

    // Show ALL orders in "All" tab (including pending) — no longer filtering them out
    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            (order.id?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
            order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'All'
            ? true
            : order.status.toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="font-playfair text-4xl font-black text-secondary">Orders</h1>
                    <p className="text-muted-custom text-sm mt-2">Manage customer orders, track shipments, and update statuses.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 bg-white border border-border-custom px-4 py-2 text-xs font-bold uppercase tracking-widest hover:border-secondary transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                    Refresh
                </button>
            </div>

            <div className="bg-white border border-border-custom p-6 space-y-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex items-center gap-4 bg-surface border border-border-custom px-4 py-2 flex-1 max-w-md">
                        <Search className="w-4 h-4 text-muted-custom" />
                        <input
                            type="text"
                            placeholder="Search by Order ID or Email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent text-sm outline-none w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={cn(
                                    "px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all border",
                                    statusFilter === status
                                        ? "bg-secondary text-white border-secondary"
                                        : "bg-surface text-muted-custom border-border-custom hover:border-secondary hover:text-secondary"
                                )}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-secondary text-[10px] font-black uppercase tracking-widest text-secondary">
                                <th className="p-4 pl-0">Order ID</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Payment</th>
                                <th className="p-4">Total</th>
                                <th className="p-4 text-right pr-0">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-custom">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-custom font-bold">
                                        Loading orders...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-custom font-bold">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className={cn(
                                        "hover:bg-surface/50 transition-colors group",
                                        isExpiredPending(order) && "opacity-60"
                                    )}>
                                        <td className="p-4 pl-0">
                                            <div className="text-xs font-bold text-secondary font-mono">
                                                {order.id && order.id.length > 8 ? `${order.id.substring(0, 8)}...` : order.id}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm font-medium text-secondary">{order.customerEmail}</div>
                                        </td>
                                        <td className="p-4 text-sm text-muted-custom">
                                            <div className="flex items-center gap-1.5">
                                                {formatDate(order.createdAt, 'Just now')}
                                                {isExpiredPending(order) && (
                                                    <span title="Expired - will be auto-deleted">
                                                        <Clock className="w-3 h-3 text-red-400" />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.id!, e.target.value)}
                                                className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border outline-none cursor-pointer appearance-none",
                                                    getStatusColor(order.status)
                                                )}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Processing">Processing</option>
                                                <option value="Shipped">Shipped</option>
                                                <option value="Delivered">Delivered</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td className="p-4">
                                            {order.paymentStatus === 'Paid' ? (
                                                <span className="bg-green-100 text-green-800 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-black border border-green-200 inline-flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                    Paid
                                                </span>
                                            ) : (
                                                <span className="bg-yellow-100 text-yellow-800 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-black border border-yellow-200 inline-flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                                    Unpaid
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm font-bold text-secondary">
                                                ₹{order.total.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="p-4 pr-0">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-2 hover:text-primary transition-colors text-muted-custom"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {order.status.toLowerCase() !== 'cancelled' && order.status.toLowerCase() !== 'delivered' && (
                                                    <button
                                                        onClick={() => setCancelModalOrderId(order.id!)}
                                                        disabled={isCancelling === order.id}
                                                        className="p-2 hover:text-red-600 transition-colors text-muted-custom disabled:opacity-50"
                                                        title="Cancel Order"
                                                    >
                                                        {isCancelling === order.id ? (
                                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Ban className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Details Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-secondary/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-3xl shadow-2xl flex flex-col max-h-full print:shadow-none print:max-w-none print:h-auto"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-border-custom shrink-0">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="font-playfair text-2xl font-black text-secondary">
                                            Order {selectedOrder.id && selectedOrder.id.length > 8 ? `${selectedOrder.id.substring(0, 8)}...` : selectedOrder.id}
                                        </h2>
                                        {selectedOrder.paymentStatus === 'Paid' ? (
                                            <span className="bg-green-100 text-green-800 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-black border border-green-200 inline-flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                Paid
                                            </span>
                                        ) : (
                                            <span className="bg-yellow-100 text-yellow-800 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-black border border-yellow-200 inline-flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                                Unpaid
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-custom mt-1">
                                        {formatDateTime(selectedOrder.createdAt, 'Just now')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-2 text-muted-custom hover:text-secondary hover:bg-surface transition-all rounded-full print:hidden"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 flex-1 print:overflow-visible">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-custom border-b border-border-custom pb-2">Customer & Shipping</h3>
                                        <div>
                                            <div className="text-xs font-bold text-secondary mb-1">Email</div>
                                            <div className="text-sm text-muted-custom">{selectedOrder.customerEmail}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-secondary mb-1">Shipping Address</div>
                                            <div className="text-sm text-muted-custom whitespace-pre-line">{selectedOrder.shippingAddress}</div>
                                        </div>
                                        <div className="print:hidden">
                                            <div className="text-xs font-bold text-secondary mb-2 mt-2">Tracking Info</div>
                                            <div className="flex flex-col gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Carrier (UPS, USPS)"
                                                    value={trackingCarrier}
                                                    onChange={e => setTrackingCarrier(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-border-custom outline-none focus:border-secondary"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Tracking Number"
                                                    value={trackingNumber}
                                                    onChange={e => setTrackingNumber(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-border-custom outline-none focus:border-secondary"
                                                />
                                            </div>
                                        </div>
                                        <div className="hidden print:block mt-4">
                                            <div className="text-xs font-bold text-secondary mb-1">Tracking</div>
                                            <div className="text-sm text-muted-custom">
                                                {selectedOrder.trackingCarrier || trackingNumber ? `${selectedOrder.trackingCarrier} ${trackingNumber}`.trim() : 'Not assigned yet'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4 flex flex-col">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-custom border-b border-border-custom pb-2">Order Summary</h3>
                                        <div className="flex justify-between items-center text-sm print:hidden">
                                            <span className="text-muted-custom">Status</span>
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border", getStatusColor(selectedOrder.status))}>
                                                {selectedOrder.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-custom">Payment</span>
                                            <span className="font-bold text-secondary">
                                                {selectedOrder.paymentStatus === 'Paid' ? 'Paid (Stripe)' : 'Unpaid'}
                                            </span>
                                        </div>
                                        {selectedOrder.stripeSessionId && (
                                            <div className="flex justify-between items-center text-[10px] mt-1 text-muted-custom">
                                                <span>Stripe Session</span>
                                                <span className="font-mono">{selectedOrder.stripeSessionId.slice(0, 12)}...</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-lg font-playfair font-black pt-4 border-t border-border-custom">
                                            <span className="text-secondary">Total</span>
                                            <span className="text-primary">₹{selectedOrder.total.toFixed(2)}</span>
                                        </div>
                                        <div className="mt-auto pt-4 print:hidden">
                                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-custom mb-2">Internal Admin Notes</div>
                                            <textarea
                                                value={adminNotes}
                                                onChange={e => setAdminNotes(e.target.value)}
                                                rows={3}
                                                placeholder="Add private team notes here..."
                                                className="w-full px-3 py-2 text-sm border border-border-custom outline-none focus:border-secondary resize-none custom-scrollbar"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-custom border-b border-border-custom pb-2 mb-4">Items ({selectedOrder.items?.length || 0})</h3>
                                    <div className="space-y-4">
                                        {selectedOrder.items?.map((item, idx: number) => (
                                            <div key={idx} className="flex gap-4 p-4 border border-border-custom bg-surface/30">
                                                <div className="w-16 h-20 shrink-0 bg-surface border border-border-custom overflow-hidden">
                                                    <img src={item.image || '/placeholder-product.svg'} alt={item.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm text-secondary truncate">{item.name}</h4>
                                                    <div className="text-xs text-muted-custom mt-1">Prod ID: <span className="font-mono">{item.productId}</span></div>
                                                    <div className="flex justify-between items-center mt-3 text-sm font-bold">
                                                        <span className="text-secondary">{item.quantity} x ₹{item.price.toFixed(2)}</span>
                                                        <span className="text-primary">₹{(item.quantity * item.price).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-border-custom bg-surface shrink-0 print:hidden">
                                <div className="flex flex-wrap justify-end gap-3">
                                    <button
                                        onClick={handlePrintPackingSlip}
                                        className="px-6 py-3 border border-border-custom text-secondary text-[10px] font-black uppercase tracking-widest hover:border-secondary transition-colors flex items-center gap-2"
                                    >
                                        <Printer className="w-4 h-4" /> Print Packing Slip
                                    </button>
                                    <button
                                        onClick={handleSaveDetails}
                                        disabled={isSavingDetails}
                                        className="px-6 py-3 border border-border-custom text-secondary text-[10px] font-black uppercase tracking-widest hover:border-secondary transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" /> {isSavingDetails ? 'Saving...' : 'Save Details'}
                                    </button>
                                    {selectedOrder.status.toLowerCase() !== 'cancelled' && selectedOrder.status.toLowerCase() !== 'delivered' && (
                                        <button
                                            onClick={() => setCancelModalOrderId(selectedOrder.id!)}
                                            disabled={isCancelling === selectedOrder.id}
                                            className="px-6 py-3 border border-red-300 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:border-red-500 transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <Ban className="w-4 h-4" /> {isCancelling === selectedOrder.id ? 'Cancelling...' : 'Cancel Order'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="px-6 py-3 border border-border-custom text-secondary text-[10px] font-black uppercase tracking-widest hover:border-secondary transition-colors"
                                    >
                                        Close
                                    </button>
                                    {selectedOrder.status.toLowerCase() !== 'cancelled' && (
                                        <button
                                            onClick={() => {
                                                const nextStatus = selectedOrder.status === 'Pending' ? 'Processing'
                                                    : selectedOrder.status === 'Processing' ? 'Shipped'
                                                        : selectedOrder.status === 'Shipped' ? 'Delivered'
                                                            : 'Pending';
                                                handleStatusChange(selectedOrder.id!, nextStatus);
                                            }}
                                            className="px-6 py-3 bg-secondary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-colors flex items-center gap-2"
                                        >
                                            <Package className="w-4 h-4" /> Move to {
                                                selectedOrder.status === 'Pending' ? 'Processing'
                                                    : selectedOrder.status === 'Processing' ? 'Shipped'
                                                        : selectedOrder.status === 'Shipped' ? 'Delivered'
                                                            : 'Pending'
                                            }
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ═══ CANCEL ORDER CONFIRMATION MODAL ═══ */}
            <AnimatePresence>
                {cancelModalOrderId && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCancelModalOrderId(null)} className="absolute inset-0 bg-secondary/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-md p-10 shadow-2xl border-t-4 border-red-500">
                            <div className="text-center space-y-6">
                                <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                                    <Ban className="w-8 h-8 text-red-500" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-playfair text-2xl font-black text-secondary">Cancel Order</h3>
                                    <p className="text-muted-custom text-sm">Are you sure you want to cancel order <span className="font-bold text-secondary">#{cancelModalOrderId}</span>? Stock will be restored for unpaid orders. This action cannot be undone.</p>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setCancelModalOrderId(null)} className="flex-1 px-8 py-4 border border-border-custom text-secondary text-[10px] font-black uppercase tracking-widest hover:bg-surface transition-colors">Cancel</button>
                                    <button onClick={() => handleCancelOrder(cancelModalOrderId)} className="flex-1 px-8 py-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-200">Cancel Order</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

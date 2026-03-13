'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, ShoppingBag, Mail, Hash, Truck, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getOrder, type Order } from '@/lib/firestore';
import { logger } from '@/lib/logger';

const SuccessContent = () => {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const sessionId = searchParams.get('session_id');
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(!!orderId);
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'failed'>('pending');

    useEffect(() => {
        let isMounted = true;

        const verifyAndFetch = async () => {
            if (!orderId) return;

            try {
                // If we also have a sessionId, verify it first to update firestore
                if (sessionId) {
                    try {
                        const res = await fetch('/api/verify-session', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sessionId, orderId })
                        });
                        const data = await res.json();
                        if (!res.ok) {
                            throw new Error(data?.error || 'Session verification request failed');
                        }
                        if (isMounted) {
                            setVerificationStatus(data.payment_status === 'paid' ? 'success' : 'failed');
                        }
                    } catch (e) {
                        logger.error('Session verification failed', e, 'ORDER');
                        if (isMounted) setVerificationStatus('failed');
                    }
                } else {
                    if (isMounted) setVerificationStatus('success'); // Assume success if no session ID pattern used
                }

                // Wait a tiny bit for firestore to sync the update
                if (sessionId) await new Promise(r => setTimeout(r, 500));

                const data = await getOrder(orderId);
                if (isMounted) {
                    setOrder(data);
                    setLoading(false);
                }
            } catch (err) {
                logger.error('Failed to fetch order', err, 'ORDER');
                if (isMounted) {
                    setLoading(false);
                    setVerificationStatus('failed');
                }
            }
        };

        verifyAndFetch();

        return () => { isMounted = false; };
    }, [orderId, sessionId]);

    return (
        <div className="max-w-2xl mx-auto text-center">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-12 shadow-[0_10px_40px_rgba(255,143,156,0.3)]"
            >
                <CheckCircle className="w-12 h-12" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h1 className="font-playfair text-5xl md:text-6xl font-black text-secondary mb-6 leading-tight">
                    Order Confirmed
                </h1>

                {orderId && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border-custom mb-6 rounded-full">
                        <Hash className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-secondary tracking-widest uppercase">Order #{orderId.slice(0, 8)}</span>
                    </div>
                )}

                <p className="text-lg text-muted-custom mb-12 leading-relaxed">
                    Thank you for your order. Your premium selection is being prepared for delivery. A confirmation email has been sent to your inbox.
                </p>

                {loading ? (
                    <div className="flex flex-col items-center justify-center mb-16 space-y-4">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent flex items-center justify-center rounded-full animate-spin shrink-0" />
                        <p className="text-secondary text-sm font-bold uppercase tracking-widest">Verifying Payment...</p>
                    </div>
                ) : verificationStatus === 'failed' ? (
                    <div className="mb-16">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-red-600 mb-6">Payment Unverified</h3>
                        <p className="text-muted-custom text-sm">We could not verify your payment at this moment. Your order has been marked as unpaid. If you were charged, your order will be updated automatically shortly.</p>
                    </div>
                ) : order ? (
                    <div className="mb-16 text-left">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-6 pb-4 border-b border-border-custom">Order Summary</h3>
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                            <div className="space-y-6">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 bg-surface border border-border-custom hover:border-secondary/20 transition-colors">
                                        <div className="w-16 h-20 shrink-0 relative bg-background border border-border-custom overflow-hidden">
                                            <img src={item.image || '/placeholder-product.svg'} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-playfair text-sm font-bold text-secondary mb-1">{item.name}</h4>
                                            <p className="text-[10px] text-muted-custom uppercase tracking-wider mb-2">
                                                QTY: {item.quantity} • ₹{(item.price).toFixed(2)}
                                            </p>
                                            <p className="text-sm font-playfair font-black text-primary">
                                            ₹{(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-surface border border-border-custom p-6 lg:p-8 self-start">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-6">Details</h3>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-secondary mb-1">Shipping Address</p>
                                            <p className="text-xs text-muted-custom leading-relaxed whitespace-pre-line">{order.shippingAddress}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Truck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-secondary mb-1">Status</p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="inline-flex items-center px-2 py-1 bg-white border border-border-custom text-[10px] font-bold tracking-widest uppercase text-secondary">
                                                    {order.status}
                                                </span>
                                                {order.paymentStatus === 'Paid' ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold tracking-widest uppercase">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                        Paid
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 text-[10px] font-bold tracking-widest uppercase">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                                        Unpaid
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-border-custom">
                                    <div className="flex justify-between items-center text-sm mb-3">
                                        <span className="text-muted-custom">Subtotal</span>
                                        <span className="text-secondary font-medium">₹{order.total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm mb-6">
                                        <span className="text-muted-custom">Shipping</span>
                                        <span className="text-accent text-[9px] font-black uppercase tracking-widest">Complimentary</span>
                                    </div>
                                    <div className="flex justify-between items-end border-t border-border-custom pt-6">
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary">Total</span>
                                        <span className="font-playfair text-2xl font-black text-secondary">₹{order.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                        <div className="p-8 bg-surface border border-border-custom text-left">
                            <Mail className="w-5 h-5 text-primary mb-4" />
                            <div className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Confirmation Info</div>
                            <div className="text-sm text-muted-custom">Details sent to your email</div>
                        </div>
                        <div className="p-8 bg-surface border border-border-custom text-left">
                            <ShoppingBag className="w-5 h-5 text-primary mb-4" />
                            <div className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Order Status</div>
                            <div className="text-sm text-muted-custom">Tracking will be sent shortly</div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    {orderId && (
                        <Link
                            href={`/track?id=${orderId}`}
                            className="w-full sm:w-auto bg-surface text-secondary border border-border-custom px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:bg-black/5"
                        >
                            <Truck className="w-4 h-4" />
                            Track Order
                        </Link>
                    )}
                    <Link
                        href="/"
                        className="w-full sm:w-auto bg-secondary text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:bg-primary"
                    >
                        Back to Collection
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

const SuccessPage = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-6 md:px-10 lg:px-16 py-24 md:py-32">
                <Suspense fallback={<div className="text-center font-playfair text-xl">Loading...</div>}>
                    <SuccessContent />
                </Suspense>
            </main>

            <Footer />
        </div>
    );
};

export default SuccessPage;

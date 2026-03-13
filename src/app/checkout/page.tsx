'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/hooks/use-cart';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Lock, ArrowRight, AlertCircle, Truck } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAuth } from '@/hooks/use-auth';
import { getCartItemKey } from '@/types/cart';
import { logger } from '@/lib/logger';

type FormData = {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    postalCode: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;



const CheckoutPage = () => {
    const { items, clearCart, totalPrice } = useCart();
    const { trackEvent } = useAnalytics();
    const { user } = useAuth();

    const router = useRouter();
    const { addToast } = useToast();
    const [mounted, setMounted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        firstName: '', lastName: '', address: '', city: '', postalCode: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && items.length === 0) {
            router.push('/');
        }
    }, [items, mounted, router]);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (mounted && !user && items.length > 0) {
            router.push('/login?redirect=/checkout');
        }
    }, [mounted, user, items, router]);

    if (!mounted || items.length === 0) return null;

    // Show login required message if not authenticated
    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto px-6 py-20">
                    <div className="max-w-md mx-auto text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-surface border border-border-custom flex items-center justify-center">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="font-playfair text-2xl font-black text-secondary mb-4">Login Required</h1>
                        <p className="text-muted-custom mb-8">Please login or create an account to complete your checkout.</p>
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => router.push('/login?redirect=/checkout')}
                                className="w-full bg-secondary text-white py-4 text-xs font-black uppercase tracking-[0.2em] hover:bg-primary transition-colors"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => router.push('/signup?redirect=/checkout')}
                                className="w-full bg-white text-secondary border border-border-custom py-4 text-xs font-black uppercase tracking-[0.2em] hover:border-secondary transition-colors"
                            >
                                Create Account
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (field === 'postalCode') value = value.toUpperCase().slice(0, 10);

        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const validate = (): FormErrors => {
        const errs: FormErrors = {};
        if (!formData.firstName.trim()) errs.firstName = 'First name is required';
        if (!formData.lastName.trim()) errs.lastName = 'Last name is required';
        if (!formData.address.trim()) errs.address = 'Address is required';
        if (!formData.city.trim()) errs.city = 'City is required';
        if (!formData.postalCode.trim()) errs.postalCode = 'Postal code is required';
        return errs;
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setIsSubmitting(true);

        try {
            const shippingAddress = `${formData.address}, ${formData.city}, ${formData.postalCode}`;
            const customerEmail = user?.email || `${formData.firstName.toLowerCase()}.guest@checkout.local`;

            // Server-side: verify prices, decrement stock, create order, and build Stripe session atomically
            const res = await fetch('/api/place-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: items.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                        size: item.selectedSize,
                        color: item.selectedColor,
                    })),
                    shippingAddress,
                    customerEmail,
                    userId: user?.id,
                }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                logger.error('Place-order failed', { status: res.status, error: errorText }, 'CHECKOUT');
                throw new Error(errorText || 'Failed to place order');
            }

            const data = await res.json();

            if (!data.url) {
                logger.error('No checkout URL returned', data, 'CHECKOUT');
                throw new Error('Payment system error: No checkout URL');
            }

            trackEvent('CHECKOUT_START', { path: '/checkout', value: 0 });
            logger.info('Redirecting to Stripe checkout', { orderId: data.orderId }, 'CHECKOUT');
            clearCart();
            window.location.href = data.url;

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Something went wrong during checkout. Please try again.';
            logger.error('Checkout error', error, 'CHECKOUT');
            addToast(message, 'error');
            setIsSubmitting(false);
        }
    };

    const ErrorMsg = ({ field }: { field: keyof FormData }) =>
        errors[field] ? (
            <div className="flex items-center gap-1.5 mt-1.5">
                <AlertCircle className="w-3 h-3 text-primary shrink-0" />
                <p className="text-[10px] text-primary font-bold">{errors[field]}</p>
            </div>
        ) : null;

    const inputClass = (field: keyof FormData) =>
        cn("w-full border px-4 py-4 text-sm outline-none transition-colors",
            errors[field] ? "border-primary bg-primary/5" : "bg-surface border-border-custom focus:border-secondary");

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-6 md:px-10 lg:px-16 py-8 md:py-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-4 border-b border-border-custom">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-muted-custom hover:text-secondary transition-colors mb-4 group"
                        >
                            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Back to Bag</span>
                        </button>
                        <h1 className="font-playfair text-3xl md:text-4xl font-black text-secondary">Checkout</h1>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-custom">
                        <Lock className="w-4 h-4" />SECURE CHECKOUT
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 max-w-7xl mx-auto w-full items-start">
                    <div className="flex-[1.5] w-full bg-surface p-[10px] border border-border-custom">
                        <form onSubmit={handleCheckout} className="space-y-6" noValidate>
                            {/* Shipping */}
                            <section className="bg-background p-[10px] border border-border-custom shadow-sm">
                                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-6 flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-[10px]">1</span>
                                    Shipping Details
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-custom">First Name</label>
                                        <input value={formData.firstName} onChange={handleChange('firstName')} className={inputClass('firstName')} />
                                        <ErrorMsg field="firstName" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-custom">Last Name</label>
                                        <input value={formData.lastName} onChange={handleChange('lastName')} className={inputClass('lastName')} />
                                        <ErrorMsg field="lastName" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-custom">Address</label>
                                        <input value={formData.address} onChange={handleChange('address')} className={inputClass('address')} />
                                        <ErrorMsg field="address" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-custom">City</label>
                                        <input value={formData.city} onChange={handleChange('city')} className={inputClass('city')} />
                                        <ErrorMsg field="city" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-custom">Postal Code</label>
                                        <input value={formData.postalCode} onChange={handleChange('postalCode')} className={inputClass('postalCode')} />
                                        <ErrorMsg field="postalCode" />
                                    </div>
                                </div>
                            </section>

                            {/* Payment Info Blob */}
                            <section className="bg-background p-[10px] border border-border-custom shadow-sm relative overflow-hidden group">
                                <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors" />
                                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-4 flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center text-[10px]">2</span>
                                    Payment Processing
                                </h2>
                                <div className="flex items-start gap-4 p-4 border border-border-custom bg-surface rounded-none">
                                    <div className="w-10 h-10 shrink-0 bg-secondary flex items-center justify-center rounded-none shadow-sm">
                                        <Lock className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-secondary text-xs font-black uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                            Secure Checkout
                                            <span className="flex gap-1.5 opacity-60">
                                                <div className="w-6 h-4 bg-muted-custom rounded-sm border border-secondary/10" />
                                                <div className="w-6 h-4 bg-muted-custom rounded-sm border border-secondary/10" />
                                            </span>
                                        </h3>
                                        <p className="text-[10px] text-muted-custom leading-relaxed max-w-[90%]">
                                            You will be redirected to our secure payment partner (Stripe) to complete your purchase using a Credit Card, Debit Card, or Apple Pay securely.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={cn(
                                    "w-full bg-secondary text-white py-6 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all hover:bg-primary active:scale-[0.99]",
                                    isSubmitting && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing Order
                                    </>
                                ) : (
                                    <>
                                        Complete Purchase
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="flex-1 w-full bg-surface border border-border-custom p-[10px] lg:sticky lg:top-8">
                        <div>
                            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-6 pb-4 border-b border-border-custom">
                                Order Summary
                            </h2>
                            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {items.map(item => (
                                    <div key={getCartItemKey(item)} className="flex gap-4">
                                        <div className="w-16 h-20 bg-background border border-border-custom shrink-0 overflow-hidden">
                                            <img src={item.image || '/placeholder-product.svg'} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <h4 className="font-playfair text-sm font-bold text-secondary line-clamp-1">{item.name}</h4>
                                            {(item.selectedSize || item.selectedColor) && (
                                                <div className="text-[9px] text-muted-custom mt-1 font-bold uppercase tracking-wider">
                                                    {item.selectedSize && `Size: ${item.selectedSize}`}
                                                    {item.selectedSize && item.selectedColor && ' • '}
                                                    {item.selectedColor && `Color: ${item.selectedColor}`}
                                                </div>
                                            )}
                                            <div className="text-[10px] text-muted-custom mt-1">Qty: {item.quantity}</div>
                                            <div className="text-xs font-bold text-secondary mt-2">₹{(item.price * item.quantity).toFixed(2)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4 pt-6 border-t border-border-custom">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-custom">Subtotal</span>
                                    <span className="font-bold text-secondary">${totalPrice().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-custom">Shipping</span>
                                    <span className="text-accent font-bold uppercase tracking-widest text-[10px]">Complimentary</span>
                                </div>
                                <div className="pt-6 flex justify-between">
                                    <span className="font-playfair text-2xl font-black text-secondary">Total</span>
                                    <span className="font-playfair text-2xl font-black text-secondary">${totalPrice().toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="mt-8 p-4 bg-background/50 border border-border-custom flex items-start gap-3">
                                <Truck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <p className="text-[10px] text-muted-custom leading-relaxed">
                                    Your premium selection arrives in signature editorial packaging within 2–4 business days.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default CheckoutPage;

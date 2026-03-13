'use client';

import React from 'react';
import { useCart } from '@/hooks/use-cart';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAnalytics } from '@/hooks/use-analytics';
import { getCartItemKey } from '@/types/cart';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

const CartDrawer = () => {
    const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice } = useCart();
    const { trackEvent } = useAnalytics();
    const { user } = useAuth();
    const router = useRouter();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[101] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-border-custom flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="w-5 h-5 text-secondary" />
                                <h2 className="font-playfair text-xl font-black text-secondary uppercase tracking-tight">Your Bag</h2>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-surface rounded-full transition-colors group"
                            >
                                <X className="w-5 h-5 text-muted-custom group-hover:text-secondary transition-colors" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-6">
                                        <ShoppingBag className="w-8 h-8 text-muted-custom" />
                                    </div>
                                    <h3 className="font-playfair text-xl font-bold text-secondary mb-2">Bag is empty</h3>
                                    <p className="text-sm text-muted-custom mb-8">Items you add will appear here</p>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-[10px] font-black uppercase tracking-widest text-primary border-b-2 border-primary pb-1"
                                    >
                                        Continue Shopping
                                    </button>
                                </div>
                            ) : (
                                items.map((item) => {
                                    const itemKey = getCartItemKey(item);
                                    return (
                                    <div key={itemKey} className="flex gap-6 group">
                                        <div className="w-24 h-32 bg-surface border border-border-custom overflow-hidden shrink-0">
                                            <img
                                                src={item.image || '/placeholder-product.svg'}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-playfair text-base font-bold text-secondary line-clamp-1">
                                                        {item.name}
                                                    </h4>
                                                    <button
                                                        onClick={() => removeItem(itemKey)}
                                                        className="text-muted-custom hover:text-primary transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="text-[10px] font-bold text-muted-custom uppercase tracking-widest mb-1 flex items-center gap-2 flex-wrap">
                                                    <span>{item.category}</span>
                                                    {(item.selectedSize || item.selectedColor) && (
                                                        <>
                                                            <span className="w-1 h-1 bg-border-custom rounded-full" />
                                                            <span className="text-secondary">
                                                                {item.selectedSize && `Size: ${item.selectedSize}`}
                                                                {item.selectedSize && item.selectedColor && ' • '}
                                                                {item.selectedColor && `Color: ${item.selectedColor}`}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center border border-border-custom">
                                                    <button
                                                        onClick={() => updateQuantity(itemKey, Math.max(1, item.quantity - 1))}
                                                        className="px-2 py-1 hover:bg-surface transition-colors"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                                                        className="px-2 py-1 hover:bg-surface transition-colors"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <div className="font-playfair font-bold text-secondary">
                                                    ₹{(item.price * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-8 bg-surface border-t border-border-custom space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-custom">Subtotal</span>
                                        <span className="font-bold text-secondary">₹{totalPrice().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold">
                                        <span className="text-muted-custom">Shipping</span>
                                        <span className="text-accent">Free</span>
                                    </div>
                                    <div className="pt-4 flex justify-between border-t border-border-custom">
                                        <span className="font-playfair text-xl font-black text-secondary">Total</span>
                                        <span className="font-playfair text-xl font-black text-secondary">₹{totalPrice().toFixed(2)}</span>
                                    </div>
                                </div>

                                {user ? (
                                    <Link
                                        href="/checkout"
                                        onClick={() => {
                                    trackEvent('CHECKOUT_START', { path: '/checkout', value: totalPrice() });
                                            setIsOpen(false);
                                        }}
                                        className="w-full bg-secondary text-white py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:bg-primary"
                                    >
                                        Checkout Now
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            router.push('/login?redirect=/checkout');
                                        }}
                                        className="w-full bg-secondary text-white py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:bg-primary"
                                    >
                                        Login to Checkout
                                        <Lock className="w-4 h-4" />
                                    </button>
                                )}
                                <div className="text-center">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-[10px] font-bold text-muted-custom hover:text-secondary transition-colors uppercase tracking-[0.1em]"
                                    >
                                        Or Continue Shopping
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;

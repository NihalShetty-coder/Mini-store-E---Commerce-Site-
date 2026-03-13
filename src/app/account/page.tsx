'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Settings, LogOut, ArrowRight, ExternalLink, Edit3, Mail, Package, User, Check, X } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/hooks/use-auth';
import { useWishlist } from '@/hooks/use-wishlist';
import { useOrders } from '@/hooks/use-orders';
import { useToast } from '@/hooks/use-toast';
import { cn, formatDate } from '@/lib/utils';

type Tab = 'Profile Settings' | 'Order History' | 'My Wishlist' | 'Preferences';

const NAV_ITEMS: { icon: React.ElementType; label: Tab }[] = [
    { icon: User, label: 'Profile Settings' },
    { icon: Package, label: 'Order History' },
    { icon: Heart, label: 'My Wishlist' },
    { icon: Settings, label: 'Preferences' },
];

const STATUS_COLORS: Record<string, string> = {
    Delivered: 'bg-accent/10 text-accent',
    Shipped: 'bg-secondary/10 text-secondary',
    Processing: 'bg-primary/10 text-primary',
};

const AccountPage = () => {
    const router = useRouter();
    const { user, isAuthenticated, logout, updateProfile } = useAuth();
    const { items: wishlistItems, removeItem: removeWishlistItem } = useWishlist();
    const { orders, fetchUserOrders } = useOrders();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<Tab>('Profile Settings');

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    const [preferences, setPreferences] = useState<{ newArrivals: boolean; exclusiveOffers: boolean; orderUpdates: boolean }>({
        newArrivals: true,
        exclusiveOffers: true,
        orderUpdates: false
    });

    React.useEffect(() => {
        if (user) {
            setEditFirstName(user.firstName || '');
            setEditLastName(user.lastName || '');
            if ('preferences' in user) {
                setPreferences((user as { preferences: typeof preferences }).preferences);
            }
            fetchUserOrders(user.id);
        }
    }, [user, fetchUserOrders]);

    const handleTogglePreference = async (key: keyof typeof preferences) => {
        if (!user) return;
        const newPrefs = { ...preferences, [key]: !preferences[key] };
        setPreferences(newPrefs);

        try {
            await updateProfile(user.id, {
                preferences: newPrefs
            } as Record<string, unknown>);
            addToast('Preferences updated', 'success');
        } catch {
            setPreferences(preferences); // revert on failure
            addToast('Failed to update preferences', 'error');
        }
    };

    const handleSaveProfile = async () => {
        if (!user || (!editFirstName.trim() && !editLastName.trim())) return;
        setIsSaving(true);
        try {
            await updateProfile(user.id, {
                firstName: editFirstName.trim(),
                lastName: editLastName.trim()
            });
            addToast('Profile updated successfully', 'success');
            setIsEditingProfile(false);
        } catch {
            addToast('Failed to update profile', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        addToast('You have been signed out.', 'info');
        router.push('/');
    };

    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-6">
                    <h1 className="font-playfair text-4xl font-black text-secondary">Please Sign In</h1>
                    <p className="text-muted-custom text-sm">You need to be logged in to view your account.</p>
                    <button
                        onClick={() => router.push('/login')}
                        className="inline-flex items-center gap-2 bg-secondary text-white px-8 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-colors"
                    >
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    const fullName = `${user.firstName} ${user.lastName}`.trim();

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-6 md:px-10 lg:px-16 py-12 md:py-24">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16 pb-8 border-b border-border-custom">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Member Dashboard</div>
                        <h1 className="font-playfair text-5xl md:text-6xl font-black text-secondary">{fullName}</h1>
                        <div className="flex items-center gap-2 mt-3 text-muted-custom">
                            <Mail className="w-3 h-3" />
                            <span className="text-[11px] font-bold uppercase tracking-widest">{user.email}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-custom hover:text-primary transition-colors group"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-16">
                    {/* Sidebar Nav */}
                    <aside className="w-full lg:w-64 shrink-0">
                        <nav className="space-y-2">
                            {NAV_ITEMS.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => setActiveTab(item.label)}
                                    className={cn(
                                        'w-full flex items-center gap-4 px-6 py-4 border transition-all text-left',
                                        activeTab === item.label
                                            ? 'border-secondary bg-surface text-secondary'
                                            : 'border-border-custom text-muted-custom hover:border-secondary hover:text-secondary'
                                    )}
                                >
                                    <item.icon className="w-4 h-4 shrink-0" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                                    {item.label === 'My Wishlist' && wishlistItems.length > 0 && (
                                        <span className="ml-auto text-[9px] font-black bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center">
                                            {wishlistItems.length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-16"
                            >
                                {activeTab === 'Profile Settings' && (
                                    <>
                                        {/* Stats */}
                                        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {[
                                                { label: 'Total Orders', value: orders.length.toString() },
                                                { label: 'Wishlist Items', value: wishlistItems.length.toString() },
                                                { label: 'Member Since', value: '2025' },
                                            ].map(stat => (
                                                <div key={stat.label} className="p-8 bg-surface border border-border-custom">
                                                    <div className="text-[10px] font-bold text-muted-custom uppercase tracking-widest mb-2">{stat.label}</div>
                                                    <div className="text-3xl font-playfair font-black text-secondary">{stat.value}</div>
                                                </div>
                                            ))}
                                        </section>

                                        {/* Profile Form */}
                                        <section>
                                            <div className="flex items-center justify-between mb-8">
                                                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">Profile Information</h2>
                                                {!isEditingProfile ? (
                                                    <button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                                                        <Edit3 className="w-3 h-3" /> Edit
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-4">
                                                        <button onClick={() => {
                                                            setIsEditingProfile(false);
                                                            setEditFirstName(user.firstName || '');
                                                            setEditLastName(user.lastName || '');
                                                        }} className="flex items-center gap-1 text-[10px] font-bold text-muted-custom uppercase tracking-widest hover:text-secondary">
                                                            <X className="w-3 h-3" /> Cancel
                                                        </button>
                                                        <button disabled={isSaving} onClick={handleSaveProfile} className="flex items-center gap-1 text-[10px] font-bold text-secondary uppercase tracking-widest hover:underline disabled:opacity-50">
                                                            <Check className="w-3 h-3" /> {isSaving ? 'Saving...' : 'Save'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-custom">First Name</label>
                                                    <input
                                                        readOnly={!isEditingProfile}
                                                        value={isEditingProfile ? editFirstName : user.firstName}
                                                        onChange={(e) => setEditFirstName(e.target.value)}
                                                        className={cn("w-full bg-surface border px-4 py-4 text-sm outline-none", isEditingProfile ? "border-secondary focus:border-primary" : "border-border-custom cursor-default")}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-custom">Last Name</label>
                                                    <input
                                                        readOnly={!isEditingProfile}
                                                        value={isEditingProfile ? editLastName : (user.lastName || '—')}
                                                        onChange={(e) => setEditLastName(e.target.value)}
                                                        className={cn("w-full bg-surface border px-4 py-4 text-sm outline-none", isEditingProfile ? "border-secondary focus:border-primary" : "border-border-custom cursor-default")}
                                                    />
                                                </div>
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-custom">Email</label>
                                                    <input readOnly defaultValue={user.email} className="w-full bg-surface/50 text-muted-custom border border-border-custom px-4 py-4 text-sm outline-none cursor-not-allowed" title="Email cannot be changed" />
                                                </div>
                                            </div>
                                        </section>
                                    </>
                                )}

                                {activeTab === 'Order History' && (
                                    <section>
                                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary mb-8 underline decoration-primary decoration-4 underline-offset-8">
                                            Order History
                                        </h2>
                                        <div className="space-y-6">
                                            {orders.length === 0 ? (
                                                <div className="text-center py-20 border border-border-custom">
                                                    <Package className="w-10 h-10 text-border-custom mx-auto mb-4" />
                                                    <p className="text-muted-custom font-bold uppercase tracking-widest text-[11px]">No orders yet</p>
                                                </div>
                                            ) : orders.map(order => (
                                                <div key={order.id} className="border border-border-custom group hover:border-secondary transition-colors overflow-hidden">
                                                    <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                                        <div className="space-y-2">
                                                            <div className="text-[10px] font-black text-primary uppercase tracking-widest">#{order.id?.slice(-6).toUpperCase()}</div>
                                                            <div className="font-playfair text-xl font-bold text-secondary">
                                                                {formatDate(order.createdAt, 'Recent')}
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
                                                        <div className="flex items-center gap-8 w-full md:w-auto">
                                                            <div className="text-2xl font-playfair font-black text-secondary shrink-0">₹{order.total.toFixed(2)}</div>
                                                            <button
                                                                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : (order.id || null))}
                                                                className="flex-1 md:flex-none border border-secondary px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary hover:bg-secondary hover:text-white transition-all flex items-center justify-center gap-2"
                                                            >
                                                                {expandedOrderId === order.id ? 'Hide Details' : 'View Details'}
                                                                <ArrowRight className={cn("w-3 h-3 transition-transform", expandedOrderId === order.id ? "-rotate-90" : "")} />
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
                                                                <div className="p-8 space-y-6">
                                                                    <div>
                                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-4">Items</h4>
                                                                        <div className="space-y-4">
                                                                            {order.items.map((item, idx) => (
                                                                                <div key={idx} className="flex items-center gap-4">
                                                                                    <div className="w-16 h-20 bg-background border border-border-custom shrink-0 overflow-hidden">
                                                                                        <img src={item.image || '/placeholder-product.svg'} alt={item.name} className="w-full h-full object-cover" />
                                                                                    </div>
                                                                                    <div className="flex-1">
                                                                                        <p className="font-playfair font-bold text-secondary text-sm">{item.name}</p>
                                                                                        <p className="text-[10px] text-muted-custom uppercase font-black tracking-widest mt-1">Qty: {item.quantity} • ₹{(item.price * item.quantity).toFixed(2)}</p>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border-custom">
                                                                        <div>
                                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-2">Shipping Address</h4>
                                                                            <p className="text-sm text-muted-custom whitespace-pre-wrap">{order.shippingAddress || 'No address provided'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-2">Order Info</h4>
                                                                            <p className="text-sm text-muted-custom leading-relaxed">
                                                                                Email: {order.customerEmail}<br />
                                                                                {order.trackingNumber && `Tracking: ${order.trackingNumber}`}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="mt-12 text-[10px] font-black uppercase tracking-widest text-muted-custom hover:text-secondary flex items-center gap-2 transition-colors">
                                            View All Orders <ExternalLink className="w-3 h-3" />
                                        </button>
                                    </section>
                                )}

                                {activeTab === 'My Wishlist' && (
                                    <section>
                                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary mb-8 underline decoration-primary decoration-4 underline-offset-8">
                                            My Wishlist
                                        </h2>
                                        {wishlistItems.length === 0 ? (
                                            <div className="text-center py-24 border border-border-custom">
                                                <Heart className="w-12 h-12 text-border-custom mx-auto mb-4" />
                                                <p className="text-muted-custom font-bold uppercase tracking-widest text-[11px]">Your wishlist is empty</p>
                                                <button onClick={() => router.push('/')} className="mt-6 text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary hover:text-secondary transition-colors">
                                                    Browse Collection
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {wishlistItems.map(item => (
                                                    <div key={item.productId} className="group border border-border-custom hover:border-secondary transition-all">
                                                        <div className="aspect-[4/5] bg-surface overflow-hidden">
                                                            <img src={item.image || '/placeholder-product.svg'} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                        </div>
                                                        <div className="p-4 space-y-3">
                                                            <h3 className="font-playfair font-bold text-secondary text-sm">{item.name}</h3>
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-playfair font-black text-secondary">₹{item.price}</span>
                                                                <button
                                                                    onClick={() => { removeWishlistItem(user!.id, item.productId); addToast('Removed from wishlist', 'info'); }}
                                                                    className="text-[9px] font-black uppercase tracking-widest text-muted-custom hover:text-primary transition-colors"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>
                                )}

                                {activeTab === 'Preferences' && (
                                    <section className="space-y-8 max-w-lg">
                                        <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">Preferences</h2>
                                        <div className="space-y-6">
                                            {[
                                                { id: 'newArrivals' as const, label: 'New Arrivals', desc: 'Be the first to know about new products' },
                                                { id: 'exclusiveOffers' as const, label: 'Exclusive Offers', desc: 'Receive member-only discounts' },
                                                { id: 'orderUpdates' as const, label: 'Order Updates', desc: 'Shipping and delivery notifications' },
                                            ].map(pref => (
                                                <div key={pref.id} className="flex items-center justify-between p-6 border border-border-custom">
                                                    <div>
                                                        <div className="text-[11px] font-black uppercase tracking-widest text-secondary">{pref.label}</div>
                                                        <div className="text-[10px] text-muted-custom mt-1">{pref.desc}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleTogglePreference(pref.id)}
                                                        className={cn("w-10 h-5 rounded-full relative transition-colors cursor-pointer", preferences[pref.id] ? "bg-secondary" : "bg-border-custom")}
                                                    >
                                                        <div className={cn("w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm", preferences[pref.id] ? "right-0.5" : "left-0.5")} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AccountPage;

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, User as UserIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllUsers, getAllOrders, type Order } from '@/lib/firestore';
import { motion } from 'framer-motion';
import { logger } from '@/lib/logger';
import { CustomDropdown } from '@/components/ui/CustomDropdown';

type Customer = {
    id?: string;
    name: string;
    email: string;
    joined: string;
    orders: number;
    spent: number;
    status: 'VIP' | 'Active' | 'New';
};

export default function AdminCustomersPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'orders' | 'spent'>('spent');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [users, orders] = await Promise.all([
                    getAllUsers(),
                    getAllOrders()
                ]);

                // Create a map of customer aggregated data
                const customerMap = new Map<string, {
                    name: string;
                    email: string;
                    joined: string;
                    orders: number;
                    spent: number;
                }>();

                // 1. Initialize from users collection
                users.forEach((user: Record<string, unknown>) => {
                    const joinedDate = user.createdAt ? new Date(user.createdAt as string) : new Date();
                    const email = (user.email as string || '').toLowerCase();
                    customerMap.set(email, {
                        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous User',
                        email: user.email as string || '',
                        joined: joinedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                        orders: 0,
                        spent: 0
                    });
                });

                // 2. Aggregate from orders (finds users + potentially guest checkouts)
                orders.forEach((order: Order) => {
                    const email = order.customerEmail.toLowerCase();
                    const existing = customerMap.get(email);

                    if (existing) {
                        existing.orders += 1;
                        existing.spent += order.total;
                    } else {
                        // Customer found in orders but not in users collection (guest?)
                        const joinedDate = order.createdAt instanceof Date ? order.createdAt : order.createdAt ? new Date(order.createdAt.toMillis()) : new Date();
                        customerMap.set(email, {
                            name: 'Guest Customer',
                            email: order.customerEmail,
                            joined: joinedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                            orders: 1,
                            spent: order.total
                        });
                    }
                });

                const aggregated: Customer[] = Array.from(customerMap.values()).map(c => ({
                    ...c,
                    status: c.spent > 2000 ? 'VIP' : (c.orders > 0 ? 'Active' : 'New')
                }));

                setCustomers(aggregated);
            } catch (error) {
                logger.error('Error loading customers', error, 'ADMIN');
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, []);

    const sortedAndFiltered = useMemo(() => {
        return customers
            .filter(c =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.email.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                if (sortBy === 'orders') return b.orders - a.orders;
                if (sortBy === 'spent') return b.spent - a.spent;
                return 0;
            });
    }, [customers, searchQuery, sortBy]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-custom">Loading Customer Base...</p>
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
                    <h1 className="font-playfair text-4xl font-black text-secondary">Customers</h1>
                    <p className="text-muted-custom text-sm mt-2">View and manage your customer base.</p>
                </div>
                <div className="bg-surface px-4 py-2 border border-border-custom">
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary">
                        Total Reach: <span className="text-primary ml-1">{customers.length}</span>
                    </span>
                </div>
            </div>

            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-custom" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-3 border border-border-custom bg-white text-xs outline-none focus:border-primary transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-custom">Sort by:</span>
                        <CustomDropdown
                            options={[
                                { label: 'Total Spent', value: 'spent' },
                                { label: 'Total Orders', value: 'orders' },
                                { label: 'Name', value: 'name' },
                            ]}
                            value={sortBy}
                            onChange={(val) => setSortBy(val as 'name' | 'orders' | 'spent')}
                            className="w-40"
                        />
                    </div>
                </div>

                <div className="bg-white border border-border-custom overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-border-custom bg-surface">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary text-center">Joined</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary text-center">Orders</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary">Total Spent</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-secondary text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-custom">
                            {sortedAndFiltered.map((c) => (
                                <tr key={c.email} className="hover:bg-surface/50 transition-all duration-200 group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-surface border border-border-custom flex items-center justify-center group-hover:bg-white transition-colors">
                                                <UserIcon className="w-4 h-4 text-muted-custom" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-secondary group-hover:text-primary transition-colors">{c.name}</span>
                                                <span className="text-[10px] text-muted-custom uppercase font-black tracking-widest">{c.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-muted-custom">{c.joined}</td>
                                    <td className="px-6 py-5 text-center text-sm font-playfair font-black text-secondary">{c.orders}</td>
                                    <td className="px-6 py-5 text-sm font-playfair font-black text-secondary">₹{c.spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-5 text-right">
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 border transition-all",
                                            c.status === 'VIP' ? "border-primary bg-primary text-white" :
                                                c.status === 'Active' ? "border-secondary text-secondary" :
                                                    "bg-surface text-muted-custom border-border-custom"
                                        )}>
                                            {c.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {sortedAndFiltered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-muted-custom bg-surface/30">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="p-4 bg-white border border-border-custom rounded-full mb-2">
                                                <Search className="w-8 h-8 text-border-custom" />
                                            </div>
                                            <p className="font-playfair font-black text-xl text-secondary">No customers match your search.</p>
                                            <p className="text-[10px] uppercase tracking-widest font-black">Try a different name or email address</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}

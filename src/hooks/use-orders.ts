'use client';

import { create } from 'zustand';
import {
    getUserOrders,
    getAllOrders,
    createOrder,
    updateOrderStatus,
    updateOrderDetails,
    type Order,
    type OrderItem,
} from '@/lib/firestore';

export type { Order, OrderItem };

interface OrdersState {
    orders: Order[];
    isLoading: boolean;
    error: string | null;
    fetchUserOrders: (userId: string) => Promise<void>;
    fetchAllOrders: () => Promise<void>;
    addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<string>;
    updateOrderStatus: (id: string, status: string) => Promise<void>;
    updateOrderDetails: (id: string, details: Partial<Order>) => Promise<void>;
}

export const useOrders = create<OrdersState>((set) => ({
    orders: [],
    isLoading: false,
    error: null,

    fetchUserOrders: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            const orders = await getUserOrders(userId);
            set({ orders, isLoading: false });
        } catch (e: unknown) {
            set({ error: e instanceof Error ? e.message : 'Unknown error', isLoading: false });
        }
    },

    fetchAllOrders: async () => {
        set({ isLoading: true, error: null });
        try {
            const orders = await getAllOrders();
            set({ orders, isLoading: false });
        } catch (e: unknown) {
            set({ error: e instanceof Error ? e.message : 'Unknown error', isLoading: false });
        }
    },

    addOrder: async (orderData) => {
        const id = await createOrder(orderData);
        // Refresh after creation if needed
        return id;
    },

    updateOrderStatus: async (id, status) => {
        await updateOrderStatus(id, status);
        set((state) => ({
            orders: state.orders.map((o) =>
                o.id === id ? { ...o, status } : o
            ),
        }));
    },

    updateOrderDetails: async (id, details) => {
        await updateOrderDetails(id, details);
        set((state) => ({
            orders: state.orders.map((o) =>
                o.id === id ? { ...o, ...details } : o
            ),
        }));
    },
}));

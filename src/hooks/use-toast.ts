import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastStore {
    toasts: Toast[];
    addToast: (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
}

export const useToast = create<ToastStore>()((set, get) => ({
    toasts: [],

    addToast: (message: string, type: ToastType = 'success') => {
        const id = crypto.randomUUID();
        set({ toasts: [...get().toasts, { id, message, type }] });
        // Auto-dismiss after 3.5 seconds
        setTimeout(() => {
            set({ toasts: get().toasts.filter(t => t.id !== id) });
        }, 3500);
    },

    removeToast: (id: string) => {
        set({ toasts: get().toasts.filter(t => t.id !== id) });
    },
}));

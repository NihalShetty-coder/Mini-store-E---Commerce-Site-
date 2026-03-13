'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
};

const STYLES = {
    success: 'bg-secondary text-white border-black/10',
    error: 'bg-primary text-white border-black/10',
    info: 'bg-white text-secondary border-border-custom',
};

const ToastContainer = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => {
                    const Icon = ICONS[toast.type];
                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 60, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 60, scale: 0.9 }}
                            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
                            className={cn(
                                'flex items-center gap-4 px-6 py-4 border shadow-2xl pointer-events-auto min-w-[300px] max-w-sm',
                                STYLES[toast.type]
                            )}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="text-[11px] font-bold uppercase tracking-widest flex-1">{toast.message}</span>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="opacity-60 hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;

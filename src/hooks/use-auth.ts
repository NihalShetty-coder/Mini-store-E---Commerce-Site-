'use client';

import { create } from 'zustand';
import { useEffect } from 'react';
import { authLogin, authSignUp, authLogout, onAuthChange, authLoginWithGoogle, updateAuthProfile, type AppUser } from '@/lib/auth-service';
import { logger } from '@/lib/logger';

export type { AppUser as User };

interface AuthStore {
    user: AppUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    _setUser: (user: AppUser | null) => void;
    _setLoading: (loading: boolean) => void;
}

const useAuthStore = create<AuthStore>()((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true, // true until onAuthChange fires at least once
    _setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
    _setLoading: (loading) => set({ isLoading: loading }),
}));

export function useAuthInit() {
    const { _setUser, _setLoading } = useAuthStore();
    useEffect(() => {
        // Safety timeout: If Firebase auth listener fails to fire within 3 seconds
        // (due to network blocking, adblockers, or strict mode bugs), forcefully unblock the UI.
        const safetyTimeout = setTimeout(() => {
            if (useAuthStore.getState().isLoading) {
                logger.warn('Firebase Auth timeout reached. Forcefully unblocking UI.', 'AUTH');
                _setLoading(false);
            }
        }, 3000);

        // Firebase calls this automatically with current user (or null) on load
        const unsub = onAuthChange((user) => {
            clearTimeout(safetyTimeout);
            _setUser(user);
        });

        // Cleanup unsubscribes the listener when component unmounts
        return () => {
            clearTimeout(safetyTimeout);
            unsub();
        };
    }, [_setUser, _setLoading]);
}

export function useAuth() {
    const { user, isAuthenticated, isLoading } = useAuthStore();

    const login = async (email: string, password: string) => {
        // Directly authenticate — no loading spinner that blocks RouteGuard
        const appUser = await authLogin(email, password);
        useAuthStore.getState()._setUser(appUser);
        // onAuthChange will fire async to update role from Firestore in background
    };

    const signup = async (firstName: string, lastName: string, email: string, password: string) => {
        useAuthStore.getState()._setLoading(true);
        const appUser = await authSignUp(firstName, lastName, email, password);
        useAuthStore.getState()._setUser(appUser);
    };

    const logout = async () => {
        await authLogout();
        useAuthStore.getState()._setUser(null);
    };

    const loginWithGoogle = async () => {
        useAuthStore.getState()._setLoading(true);
        try {
            const appUser = await authLoginWithGoogle();
            useAuthStore.getState()._setUser(appUser);
        } finally {
            useAuthStore.getState()._setLoading(false);
        }
    };

    const updateProfile = async (uid: string, data: Partial<AppUser>) => {
        useAuthStore.getState()._setLoading(true);
        try {
            await updateAuthProfile(uid, data);
            const currentUser = useAuthStore.getState().user;
            if (currentUser && currentUser.id === uid) {
                useAuthStore.getState()._setUser({ ...currentUser, ...data });
            }
        } finally {
            useAuthStore.getState()._setLoading(false);
        }
    };

    return { user, isAuthenticated, isLoading, login, signup, logout, loginWithGoogle, updateProfile };
}

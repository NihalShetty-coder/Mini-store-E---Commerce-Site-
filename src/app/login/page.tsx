'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Chrome, AlertCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

const LoginPage = () => {
    const router = useRouter();
    const { login, loginWithGoogle } = useAuth();
    const { addToast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Please enter a valid email';
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});
        setIsLoading(true);
        try {
            await login(email, password);
            addToast('Welcome back! You are now signed in.', 'success');
            router.push('/account');
        } catch (err: unknown) {
            const code = (err as { code?: string })?.code || '';
            const errMsg = (err as Error)?.message;
            const message =
                code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found'
                    ? 'Incorrect email or password. Please try again.'
                    : code === 'auth/too-many-requests'
                        ? 'Too many failed attempts. Please wait a moment and try again.'
                        : code === 'auth/network-request-failed'
                            ? 'Network error. Please check your connection.'
                            : errMsg || 'Sign in failed. Please try again.';
            setErrors({ general: message });
            logger.error('Firebase authentication error', { code, message: errMsg }, 'AUTH');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await loginWithGoogle();
            addToast('Signed in with Google!', 'success');
            router.push('/account');
        } catch {
            setErrors({ general: 'Google sign-in failed. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-6 py-24 md:py-32 flex justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="text-center mb-12">
                        <h1 className="font-playfair text-4xl md:text-5xl font-black text-secondary mb-4">Welcome Back</h1>
                        <p className="text-muted-custom text-sm">Enter your credentials to access your account</p>
                    </div>

                    <AnimatePresence>
                        {errors.general && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center gap-3 bg-primary/5 border border-primary/20 p-4 mb-6 text-primary"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span className="text-[11px] font-bold">{errors.general}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                                placeholder="nina@example.com"
                                className={cn(
                                    "w-full bg-surface border px-4 py-4 text-sm outline-none transition-colors",
                                    errors.email ? "border-primary" : "border-border-custom focus:border-secondary"
                                )}
                            />
                            {errors.email && <p className="text-[10px] text-primary font-bold">{errors.email}</p>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                                    <Lock className="w-3 h-3" />
                                    Password
                                </label>
                                <button type="button" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                                    Forgot?
                                </button>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                                placeholder="••••••••"
                                className={cn(
                                    "w-full bg-surface border px-4 py-4 text-sm outline-none transition-colors",
                                    errors.password ? "border-primary" : "border-border-custom focus:border-secondary"
                                )}
                            />
                            {errors.password && <p className="text-[10px] text-primary font-bold">{errors.password}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-secondary text-white py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:bg-primary disabled:opacity-70 group"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12">
                        <div className="relative mb-12">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border-custom"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                                <span className="bg-background px-4 text-muted-custom">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-3 border border-border-custom px-4 py-4 hover:bg-surface transition-colors disabled:opacity-50"
                            >
                                <Chrome className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Google</span>
                            </button>
                        </div>
                    </div>

                    <p className="mt-12 text-center text-[11px] text-muted-custom leading-relaxed">
                        New to Nihal Shetty?{' '}
                        <Link href="/signup" className="text-secondary font-black border-b border-secondary/20 hover:border-secondary transition-colors uppercase tracking-widest ml-1">
                            Create an account
                        </Link>
                    </p>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
};

export default LoginPage;

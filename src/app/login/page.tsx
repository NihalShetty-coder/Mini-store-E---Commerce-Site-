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
            router.push('/');
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
            router.push('/');
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
                    <form onSubmit={handleSubmit} className="auth-form" noValidate>
                        <p className="auth-heading">Login</p>

                        <AnimatePresence>
                            {errors.general && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-4 mb-4 text-red-500 rounded-lg"
                                >
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span className="text-[11px] font-bold">{errors.general}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className={cn("auth-field", errors.email && "border-red-500")}>
                            <svg className="auth-input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M13.106 7.222c0-2.967-2.249-5.032-5.482-5.032-3.35 0-5.646 2.318-5.646 5.702 0 3.493 2.235 5.708 5.762 5.708.862 0 1.689-.123 2.304-.335v-.862c-.43.199-1.354.328-2.29.328-2.926 0-4.813-1.88-4.813-4.798 0-2.844 1.921-4.881 4.594-4.881 2.735 0 4.608 1.688 4.608 4.156 0 1.682-.554 2.769-1.416 2.769-.492 0-.772-.28-.772-.76V5.206H8.923v.834h-.11c-.266-.595-.881-.964-1.6-.964-1.4 0-2.378 1.162-2.378 2.823 0 1.737.957 2.906 2.379 2.906.8 0 1.415-.39 1.709-1.087h.11c.081.67.703 1.148 1.503 1.148 1.572 0 2.57-1.415 2.57-3.643zm-7.177.704c0-1.197.54-1.907 1.456-1.907.93 0 1.524.738 1.524 1.907S8.308 9.84 7.371 9.84c-.895 0-1.442-.725-1.442-1.914z"></path>
                            </svg>
                            <input
                                autoComplete="off"
                                placeholder="Email Address"
                                className="auth-input-field"
                                type="email"
                                value={email}
                                onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                            />
                        </div>
                        {errors.email && <p className="text-[10px] text-red-500 font-bold px-4">{errors.email}</p>}

                        <div className={cn("auth-field", errors.password && "border-red-500")}>
                            <svg className="auth-input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"></path>
                            </svg>
                            <input
                                placeholder="Password"
                                className="auth-input-field"
                                type="password"
                                value={password}
                                onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                            />
                        </div>
                        {errors.password && <p className="text-[10px] text-red-500 font-bold px-4">{errors.password}</p>}

                        <div className="auth-btn-group">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="auth-button1"
                            >
                                {isLoading ? "Authenticating..." : "Login"}
                            </button>
                            <Link href="/signup" className="auth-button2 text-center text-[10px] font-black uppercase tracking-widest no-underline">
                                Sign Up
                            </Link>
                        </div>

                        <div className="flex flex-col gap-4 mt-4">
                            <button type="button" className="auth-button3">Forgot Password</button>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border-custom opacity-20"></div>
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                                    <span className="bg-secondary px-4 text-muted-custom">Or</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="auth-button2 flex items-center justify-center gap-3"
                            >
                                <Chrome className="w-4 h-4 text-white" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Google</span>
                            </button>
                        </div>
                    </form>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
};

export default LoginPage;

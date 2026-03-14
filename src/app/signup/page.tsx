'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, ShieldCheck, Chrome } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const getPasswordStrength = (password: string): { label: string; color: string; width: string } => {
    if (password.length === 0) return { label: '', color: '', width: '0%' };
    if (password.length < 6) return { label: 'Weak', color: 'bg-primary', width: '33%' };
    if (password.length < 10 || !/\d/.test(password)) return { label: 'Medium', color: 'bg-yellow-500', width: '66%' };
    return { label: 'Strong', color: 'bg-accent', width: '100%' };
};

const SignUpPage = () => {
    const router = useRouter();
    const { signup, loginWithGoogle } = useAuth();
    const { addToast } = useToast();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState<Partial<typeof formData>>({});
    const [isLoading, setIsLoading] = useState(false);

    const strength = getPasswordStrength(formData.password);

    const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const validate = () => {
        const newErrors: Partial<typeof formData> = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'Required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Required';
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Minimum 8 characters';
        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setIsLoading(true);
        try {
            await signup(formData.firstName, formData.lastName, formData.email, formData.password);
            addToast(`Welcome, ${formData.firstName}! Your account is ready.`, 'success');
            router.push('/');
        } catch {
            addToast('Something went wrong. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setIsLoading(true);
        try {
            await loginWithGoogle();
            addToast('Signed in with Google!', 'success');
            router.push('/');
        } catch {
            addToast('Google sign-in failed. Please try again.', 'error');
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
                        <p className="auth-heading">Sign Up</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className={cn("auth-field", errors.firstName && "border-red-500")}>
                                <User className="w-3 h-3 text-primary" />
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    className="auth-input-field"
                                    value={formData.firstName}
                                    onChange={handleChange('firstName')}
                                />
                            </div>
                            <div className={cn("auth-field", errors.lastName && "border-red-500")}>
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    className="auth-input-field"
                                    value={formData.lastName}
                                    onChange={handleChange('lastName')}
                                />
                            </div>
                        </div>
                        {(errors.firstName || errors.lastName) && (
                            <div className="flex justify-between px-4">
                                <p className="text-[10px] text-red-500 font-bold">{errors.firstName}</p>
                                <p className="text-[10px] text-red-500 font-bold">{errors.lastName}</p>
                            </div>
                        )}

                        <div className={cn("auth-field", errors.email && "border-red-500")}>
                            <Mail className="w-3 h-3 text-primary" />
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="auth-input-field"
                                value={formData.email}
                                onChange={handleChange('email')}
                            />
                        </div>
                        {errors.email && <p className="text-[10px] text-red-500 font-bold px-4">{errors.email}</p>}

                        <div className={cn("auth-field", errors.password && "border-red-500")}>
                            <Lock className="w-3 h-3 text-primary" />
                            <input
                                type="password"
                                placeholder="Password"
                                className="auth-input-field"
                                value={formData.password}
                                onChange={handleChange('password')}
                            />
                        </div>
                        {formData.password && (
                            <div className="space-y-1 px-4">
                                <div className="h-0.5 w-full bg-border-custom">
                                    <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                                </div>
                                <div className={`text-[10px] font-bold uppercase tracking-widest ${strength.label === 'Weak' ? 'text-primary' : strength.label === 'Medium' ? 'text-yellow-500' : 'text-accent'}`}>
                                    {strength.label}
                                </div>
                            </div>
                        )}
                        {errors.password && <p className="text-[10px] text-red-500 font-bold px-4">{errors.password}</p>}

                        <div className="flex items-start gap-3 p-4 bg-white/5 border border-border-custom rounded-xl">
                            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-[10px] text-muted-custom leading-relaxed">
                                By creating an account, you agree to our <button type="button" className="underline font-bold">Terms</button> & <button type="button" className="underline font-bold">Privacy</button>.
                            </p>
                        </div>

                        <div className="auth-btn-group">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="auth-button1"
                            >
                                {isLoading ? "Creating Account..." : "Create Account"}
                            </button>
                            <Link href="/login" className="auth-button2 text-center text-[10px] font-black uppercase tracking-widest no-underline">
                                Sign In
                            </Link>
                        </div>

                        <div className="flex flex-col gap-4 mt-4">
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
                                onClick={handleGoogleSignup}
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

export default SignUpPage;

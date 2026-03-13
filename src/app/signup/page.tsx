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
            router.push('/account');
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
            router.push('/account');
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
                    <div className="text-center mb-12">
                        <h1 className="font-playfair text-4xl md:text-5xl font-black text-secondary mb-4">Join Us</h1>
                        <p className="text-muted-custom text-sm">Become a member for a curated shopping experience</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={handleChange('firstName')}
                                    className={cn("w-full bg-surface border px-4 py-4 text-sm outline-none transition-colors", errors.firstName ? "border-primary" : "border-border-custom focus:border-secondary")}
                                />
                                {errors.firstName && <p className="text-[10px] text-primary font-bold">{errors.firstName}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-secondary">Last Name</label>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={handleChange('lastName')}
                                    className={cn("w-full bg-surface border px-4 py-4 text-sm outline-none transition-colors", errors.lastName ? "border-primary" : "border-border-custom focus:border-secondary")}
                                />
                                {errors.lastName && <p className="text-[10px] text-primary font-bold">{errors.lastName}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={handleChange('email')}
                                placeholder="nina@example.com"
                                className={cn("w-full bg-surface border px-4 py-4 text-sm outline-none transition-colors", errors.email ? "border-primary" : "border-border-custom focus:border-secondary")}
                            />
                            {errors.email && <p className="text-[10px] text-primary font-bold">{errors.email}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-secondary flex items-center gap-2">
                                <Lock className="w-3 h-3" />
                                Password
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={handleChange('password')}
                                placeholder="••••••••"
                                className={cn("w-full bg-surface border px-4 py-4 text-sm outline-none transition-colors", errors.password ? "border-primary" : "border-border-custom focus:border-secondary")}
                            />
                            {formData.password && (
                                <div className="space-y-1">
                                    <div className="h-0.5 w-full bg-border-custom">
                                        <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }} />
                                    </div>
                                    <div className={`text-[10px] font-bold uppercase tracking-widest ${strength.label === 'Weak' ? 'text-primary' : strength.label === 'Medium' ? 'text-yellow-500' : 'text-accent'}`}>
                                        {strength.label}
                                    </div>
                                </div>
                            )}
                            {errors.password && <p className="text-[10px] text-primary font-bold">{errors.password}</p>}
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-muted-custom/5 border border-border-custom">
                            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-[10px] text-muted-custom leading-relaxed">
                                By creating an account, you agree to our <button type="button" className="underline font-bold">Terms of Service</button> and <button type="button" className="underline font-bold">Privacy Policy</button>.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-secondary text-white py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:bg-primary disabled:opacity-70 group"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    Create Account
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
                                onClick={handleGoogleSignup}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-3 border border-border-custom px-4 py-4 hover:bg-surface transition-colors disabled:opacity-50"
                            >
                                <Chrome className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Google</span>
                            </button>
                        </div>
                    </div>

                    <p className="mt-12 text-center text-[11px] text-muted-custom leading-relaxed">
                        Already have an account?{' '}
                        <Link href="/login" className="text-secondary font-black border-b border-secondary/20 hover:border-secondary transition-colors uppercase tracking-widest ml-1">
                            Sign In
                        </Link>
                    </p>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
};

export default SignUpPage;

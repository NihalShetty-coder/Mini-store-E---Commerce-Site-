'use client';

import React, { useState } from 'react';
import { Mail, MapPin, Clock } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useToast } from '@/hooks/use-toast';

export default function ContactPage() {
    const { addToast } = useToast();
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
            addToast('Please fill in all fields.', 'error');
            return;
        }
        setIsSubmitting(true);
        // Simulate submission
        setTimeout(() => {
            addToast('Message sent! We will get back to you shortly.', 'success');
            setFormData({ name: '', email: '', message: '' });
            setIsSubmitting(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-6 md:px-10 lg:px-16 py-16 md:py-24">
                <div className="max-w-5xl mx-auto">
                    <h1 className="font-playfair text-4xl md:text-5xl font-black text-secondary mb-4">
                        Contact Us
                    </h1>
                    <p className="text-sm text-muted-custom mb-12 max-w-xl">
                        Have questions about our products or services? Our team is here to help.
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12">
                        {/* Info */}
                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-secondary flex items-center justify-center shrink-0">
                                    <Mail className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-secondary mb-1">Email</h3>
                                    <p className="text-sm text-muted-custom">nihalnshetty42@gmail.com</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-secondary flex items-center justify-center shrink-0">
                                    <MapPin className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-secondary mb-1">Address</h3>
                                    <p className="text-sm text-muted-custom">Online only — worldwide shipping</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-secondary flex items-center justify-center shrink-0">
                                    <Clock className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-secondary mb-1">Hours</h3>
                                    <p className="text-sm text-muted-custom">Mon – Fri, 9 AM – 6 PM IST</p>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="bg-surface border border-border-custom p-8 space-y-6">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-custom">Name</label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                    className="w-full border border-border-custom bg-background px-4 py-4 text-sm outline-none focus:border-secondary transition-colors mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-custom">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                                    className="w-full border border-border-custom bg-background px-4 py-4 text-sm outline-none focus:border-secondary transition-colors mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-custom">Message</label>
                                <textarea
                                    rows={5}
                                    value={formData.message}
                                    onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                                    className="w-full border border-border-custom bg-background px-4 py-4 text-sm outline-none focus:border-secondary transition-colors mt-1 resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-secondary text-white py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-colors disabled:opacity-70"
                            >
                                {isSubmitting ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Box } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 flex items-center justify-center p-6 md:p-12">
                <div className="text-center max-w-xl mx-auto">
                    <Box className="w-16 h-16 text-primary mx-auto mb-8 opacity-50" />

                    <h1 className="font-playfair text-7xl md:text-9xl font-black text-secondary mb-4 tracking-tighter">
                        404
                    </h1>

                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary mb-6 border-y border-border-custom py-4">
                        Page Not Found
                    </h2>

                    <p className="text-muted-custom text-sm mb-12 leading-relaxed">
                        The page you are looking for does not exist, has been removed, named changed or is temporarily unavailable.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link
                            href="/"
                            className="w-full sm:w-auto bg-secondary text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:bg-primary"
                        >
                            Return Home
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

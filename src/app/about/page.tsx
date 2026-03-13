'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-6 md:px-10 lg:px-16 py-16 md:py-24">
                <div className="max-w-3xl mx-auto">
                    <h1 className="font-playfair text-4xl md:text-5xl font-black text-secondary mb-8">
                        About Us
                    </h1>

                    <div className="space-y-8 text-sm text-muted-custom leading-relaxed">
                        <p>
                            Nihal Shetty is a curated luxury fashion destination that brings together
                            the finest in contemporary style, editorial aesthetics, and exceptional
                            quality. We believe that fashion should elevate — that the right piece
                            can transform not just an outfit, but a mindset.
                        </p>

                        <div>
                            <h2 className="font-playfair text-2xl font-black text-secondary mb-4">
                                Our Philosophy
                            </h2>
                            <p>
                                Every product in our collection is hand-selected for its
                                craftsmanship, design integrity, and ability to stand the test of
                                time. We reject disposable trends in favour of pieces that carry
                                meaning and lasting appeal.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-playfair text-2xl font-black text-secondary mb-4">
                                Quality First
                            </h2>
                            <p>
                                We partner with artisans and designers who share our commitment to
                                excellence. From premium fabrics to meticulous construction, every
                                detail matters.
                            </p>
                        </div>

                        <div>
                            <h2 className="font-playfair text-2xl font-black text-secondary mb-4">
                                The Experience
                            </h2>
                            <p>
                                Shopping with Nihal Shetty means more than a transaction. From our
                                signature editorial packaging to complimentary shipping, every
                                touchpoint is designed to reflect the care we put into everything we
                                do.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

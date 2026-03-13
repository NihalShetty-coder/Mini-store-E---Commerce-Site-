'use client';

import React from 'react';
import { notFound } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Define expected slugs to avoid rendering for random strings
const validPolicies = ['privacy', 'terms', 'shipping-returns', 'faq', 'sustainability'];

export default function PolicyPage({ params }: { params: { slug: string } }) {
    const { slug } = params;

    if (!validPolicies.includes(slug)) {
        notFound();
    }

    const getTitle = (s: string) => {
        switch (s) {
            case 'privacy': return 'Privacy Policy';
            case 'terms': return 'Terms of Service';
            case 'shipping-returns': return 'Shipping & Returns';
            case 'faq': return 'Frequently Asked Questions';
            case 'sustainability': return 'Sustainability at Nihal Shetty';
            default: return 'Policy';
        }
    };

    const title = getTitle(slug);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-6 md:px-10 lg:px-16 pt-32 pb-24 max-w-4xl">
                <div className="mb-16 border-b border-border-custom pb-8">
                    <h1 className="font-playfair text-4xl md:text-5xl font-black text-secondary">{title}</h1>
                    <p className="text-muted-custom text-sm mt-4 font-bold uppercase tracking-widest">
                        Last Updated: October 2026
                    </p>
                </div>

                <div className="prose prose-sm md:prose-base prose-neutral max-w-none text-secondary">
                    {slug === 'privacy' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold font-playfair border-b border-border-custom pb-2">1. Information We Collect</h2>
                            <p>We collect information to provide better services to all our users. Information we collect includes your name, email address, payment information, and shipping address when you make a purchase.</p>

                            <h2 className="text-xl font-bold font-playfair border-b border-border-custom pb-2">2. How We Use Information</h2>
                            <p>We use the information we collect from all of our services to provide, maintain, protect and improve them, to develop new ones, and to protect Nihal Shetty and our users.</p>

                            <h2 className="text-xl font-bold font-playfair border-b border-border-custom pb-2">3. Information Security</h2>
                            <p>We work hard to protect Nihal Shetty and our users from unauthorized access to or unauthorized alteration, disclosure or destruction of information we hold.</p>
                        </div>
                    )}

                    {slug === 'terms' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold font-playfair border-b border-border-custom pb-2">1. Terms</h2>
                            <p>By accessing the website at Nihal Shetty, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>

                            <h2 className="text-xl font-bold font-playfair border-b border-border-custom pb-2">2. Use License</h2>
                            <p>Permission is granted to temporarily download one copy of the materials (information or software) on Nihal Shetty&apos;s website for personal, non-commercial transitory viewing only.</p>

                            <h2 className="text-xl font-bold font-playfair border-b border-border-custom pb-2">3. Limitations</h2>
                            <p>In no event shall Nihal Shetty or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use our materials.</p>
                        </div>
                    )}

                    {slug === 'shipping-returns' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold font-playfair border-b border-border-custom pb-2">Shipping Policies</h2>
                            <p>All orders are processed within 1 to 3 business days (excluding weekends and holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped.</p>

                            <p>Domestic shipping starts at ₹10. International shipping starts at ₹25. Free global shipping on orders over ₹500.</p>

                            <h2 className="text-xl font-bold font-playfair border-b border-border-custom pb-2 mt-8">Returns & Exchanges</h2>
                            <p>We accept returns up to 30 days after delivery, if the item is unused and in its original condition, and we will refund the full order amount minus the shipping costs for the return.</p>
                            <p>If your order arrives damaged in any way, please email us as soon as possible with your order number and a photo of the item&apos;s condition.</p>
                        </div>
                    )}

                    {slug === 'faq' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold font-playfair border-b border-border-custom pb-2">Frequently Asked Questions</h2>
                            <p className="font-bold mt-4">Where are your garments manufactured?</p>
                            <p>Our garments are responsibly manufactured in boutique ateliers across Portugal and Italy, ensuring the highest standards of craftsmanship and fair labor practices.</p>

                            <p className="font-bold mt-4">How should I care for my Nihal Shetty pieces?</p>
                            <p>Each item comes with a specific care label. Overarchingly, we recommend dry cleaning for structural outerwear and gentle hand washing for knitwear and delicate fabrics.</p>

                            <p className="font-bold mt-4">Do you offer bespoke sizing?</p>
                            <p>Currently, we do not offer bespoke or made-to-measure sizing online. However, our pieces are designed with a contemporary editorial fit that flatters various body types.</p>
                        </div>
                    )}

                    {slug === 'sustainability' && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold font-playfair border-b border-border-custom pb-2">Our Commitment to the Future</h2>
                            <p>At Nihal Shetty, we believe that true luxury lies in longevity. We are committed to minimizing our environmental footprint by using sustainably sourced materials, reducing waste in our production lines, and designing pieces that transcend seasonal trends.</p>

                            <h2 className="text-xl font-bold font-playfair border-b border-border-custom pb-2">Material Sourcing</h2>
                            <p>Over 70% of our cotton is organic, and we actively seek out recycled alternatives for synthetic fibers. Our leather is sourced exclusively from tanneries certified by the Leather Working Group.</p>

                            <h2 className="text-xl font-bold font-playfair border-b border-border-custom pb-2">Packaging</h2>
                            <p>All our packaging is 100% recyclable or biodegradable. We have eliminated single-use plastics from our supply chain and use FSC-certified paper for our tags and invoices.</p>
                        </div>
                    )}
                </div>

                <div className="mt-24 pt-8 border-t border-border-custom">
                    <p className="text-sm text-muted-custom">
                        If you have any further questions regarding this {title.toLowerCase()}, please contact our customer care team.
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}

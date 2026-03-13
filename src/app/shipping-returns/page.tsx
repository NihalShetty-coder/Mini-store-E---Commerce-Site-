import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function ShippingReturnsPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-6 md:px-10 lg:px-16 py-16 max-w-4xl">
                <h1 className="font-playfair text-4xl md:text-5xl font-black text-secondary mb-12">Shipping & Returns</h1>

                <div className="space-y-12 text-sm text-muted-custom leading-relaxed">
                    <div>
                        <h2 className="text-xl font-playfair font-black text-secondary mb-6 pb-2 border-b border-border-custom">Shipping Policy</h2>
                        <div className="space-y-6">
                            <section>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-2">Processing Time</h3>
                                <p>All orders are processed within 1–2 business days. Orders are not shipped or delivered on weekends or holidays. If we are experiencing a high volume of orders, shipments may be delayed by a few days.</p>
                            </section>

                            <section>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-2">Shipping Rates & Delivery Estimates</h3>
                                <p>We offer complimentary standard shipping on all orders. Expedited shipping options are available at checkout.</p>
                                <ul className="list-disc pl-5 mt-4 space-y-2">
                                    <li><strong>Standard Shipping:</strong> 2–4 business days (Complimentary)</li>
                                    <li><strong>Express Shipping:</strong> 1–2 business days (₹15.00)</li>
                                </ul>
                            </section>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-playfair font-black text-secondary mb-6 pb-2 border-b border-border-custom">Returns Policy</h2>
                        <div className="space-y-6">
                            <section>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-2">Return Processing</h3>
                                <p>You have 30 calendar days to return an item from the date you received it. To be eligible for a return, your item must be unused, in the same condition that you received it, and in the original packaging.</p>
                            </section>

                            <section>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-2">Refunds</h3>
                                <p>Once we receive your item, we will inspect it and notify you that we have received your returned item. If your return is approved, we will initiate a refund to your credit card (or original method of payment). You will receive the credit within a certain amount of days, depending on your card issuer&apos;s policies.</p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

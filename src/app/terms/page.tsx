import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-6 md:px-10 lg:px-16 py-16 max-w-4xl">
                <h1 className="font-playfair text-4xl md:text-5xl font-black text-secondary mb-12">Terms of Service</h1>

                <div className="space-y-8 text-sm text-muted-custom leading-relaxed">
                    <section>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-4">1. Acceptance of Terms</h2>
                        <p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.</p>
                    </section>

                    <section>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-4">2. Intellectual Property Rights</h2>
                        <p>The Site and its original content, features, and functionality are owned by Nihal Shetty and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.</p>
                    </section>

                    <section>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-4">3. Product Descriptions</h2>
                        <p>We attempt to be as accurate as possible. However, we do not warrant that product descriptions or other content of this site is accurate, complete, reliable, current, or error-free. If a product offered by us itself is not as described, your sole remedy is to return it in unused condition.</p>
                    </section>

                    <section>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-4">4. Limitation of Liability</h2>
                        <p>In no event shall Nihal Shetty, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}

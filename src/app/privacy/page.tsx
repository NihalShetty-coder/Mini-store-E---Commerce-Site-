import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto px-6 md:px-10 lg:px-16 py-16 max-w-4xl">
                <h1 className="font-playfair text-4xl md:text-5xl font-black text-secondary mb-12">Privacy Policy</h1>

                <div className="space-y-8 text-sm text-muted-custom leading-relaxed">
                    <section>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-4">1. Introduction</h2>
                        <p>Welcome to Nihal Shetty. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.</p>
                    </section>

                    <section>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-4">2. The Data We Collect About You</h2>
                        <p>Personal data, or personal information, means any information about an individual from which that person can be identified. We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
                        <ul className="list-disc pl-5 mt-4 space-y-2">
                            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
                            <li><strong>Contact Data</strong> includes billing address, delivery address, email address and telephone numbers.</li>
                            <li><strong>Financial Data</strong> includes bank account and payment card details.</li>
                            <li><strong>Transaction Data</strong> includes details about payments to and from you and other details of products and services you have purchased from us.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-4">3. How We Use Your Personal Data</h2>
                        <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                        <ul className="list-disc pl-5 mt-4 space-y-2">
                            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                            <li>Where we need to comply with a legal obligation.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary mb-4">4. Data Security</h2>
                        <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.</p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}

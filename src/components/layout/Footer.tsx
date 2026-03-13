'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSettings, DEFAULT_CONTACTS } from '@/hooks/use-settings';

const Footer = () => {
    const { footerLinks, contactMethods, storeName } = useSettings();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const shopLinks = footerLinks.filter((link) => link.section === 'Shop');
    const supportLinks = footerLinks.filter((link) => link.section === 'Customer Care');

    const actualContactMethods = contactMethods || DEFAULT_CONTACTS;

    // Separate text contacts (e.g., Email, Phone) and link contacts (e.g., Socials)
    const textContacts = actualContactMethods.filter(c => !c.isLink);
    const linkContacts = actualContactMethods.filter(c => c.isLink);

    return (
        <footer className="bg-secondary text-[#ccc] pt-20 pb-12 mt-20">
            <div className="container mx-auto px-6 md:px-10 lg:px-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    <div className="space-y-6">
                        <Link href="/" className="font-playfair text-2xl font-black tracking-tighter text-white">
                            {storeName || 'Nihal Shetty'}
                        </Link>
                        <p className="text-sm leading-relaxed max-w-xs">
                            Curating the world&apos;s most elegant fashion since 2026. Join our journey into editorial excellence and timeless style.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white text-xs font-black uppercase tracking-widest mb-8">Shop</h4>
                        <ul className="space-y-4 text-sm">
                            {mounted && shopLinks.map((link) => (
                                <li key={link.id}>
                                    <Link
                                        href={link.url}
                                        className="hover:text-primary transition-colors"
                                        target={link.isExternal ? "_blank" : undefined}
                                        rel={link.isExternal ? "noopener noreferrer" : undefined}
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                            {!mounted && <li>Loading...</li>}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white text-xs font-black uppercase tracking-widest mb-8">Support</h4>
                        <ul className="space-y-4 text-sm">
                            {mounted && supportLinks.map((link) => (
                                <li key={link.id}>
                                    <Link
                                        href={link.url}
                                        className="hover:text-primary transition-colors"
                                        target={link.isExternal ? "_blank" : undefined}
                                        rel={link.isExternal ? "noopener noreferrer" : undefined}
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                            {!mounted && <li>Loading...</li>}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white text-xs font-black uppercase tracking-widest mb-8">Contact</h4>
                        <ul className="space-y-4 text-sm">
                            {mounted ? textContacts.map((contact) => (
                                <li key={contact.id} className="flex flex-col">
                                    <span className="text-[10px] text-muted-custom uppercase font-bold">{contact.label}</span>
                                    <span className="text-white">{contact.value}</span>
                                </li>
                            )) : (
                                <li className="flex flex-col">
                                    <span className="text-[10px] text-muted-custom uppercase font-bold">Loading</span>
                                    <span className="text-white/50">...</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <p>© 2026 {storeName || 'Nihal Shetty'}. ALL RIGHTS RESERVED.</p>
                    {mounted && linkContacts.length > 0 && (
                        <div className="flex gap-6">
                            {linkContacts.map((social) => (
                                <Link key={social.id} href={social.value} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                    {social.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
};

export default Footer;

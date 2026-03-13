'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '@/hooks/use-settings';

const Hero = () => {
    const { heroConfig } = useSettings();

    return (
        <section className="relative h-[450px] w-full overflow-hidden bg-muted-custom flex items-center justify-center">
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000"
                style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url('${heroConfig.backgroundImage}')`
                }}
            />

            <div className="container relative z-10 text-center px-6 md:px-10 lg:px-16 text-[10px]">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="font-playfair text-5xl md:text-7xl font-black mb-4 tracking-tight text-[#FAF9F6] inline-block drop-shadow-md"
                >
                    {heroConfig.title}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="max-w-xl mx-auto text-lg md:text-xl font-light mb-10 text-[#FAF9F6] drop-shadow-sm"
                >
                    {heroConfig.subtitle}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                >
                    <button
                        onClick={() => {
                            document.getElementById('product-grid')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="bg-primary text-white hover:bg-opacity-90 transition-all px-10 py-4 font-bold uppercase tracking-widest text-sm rounded-none">
                        Shop Collection
                    </button>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;

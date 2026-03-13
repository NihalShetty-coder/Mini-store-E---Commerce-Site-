'use client';

import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface SizeGuideModalProps {
    onClose: () => void;
}

const SIZE_DATA = [
    { size: 'XS', chest: '30–32', waist: '24–26', hips: '33–35', us: '0–2', eu: '32–34' },
    { size: 'S',  chest: '33–35', waist: '27–29', hips: '36–38', us: '4–6', eu: '36–38' },
    { size: 'M',  chest: '36–38', waist: '30–32', hips: '39–41', us: '8–10', eu: '40–42' },
    { size: 'L',  chest: '39–41', waist: '33–35', hips: '42–44', us: '12–14', eu: '44–46' },
    { size: 'XL', chest: '42–44', waist: '36–38', hips: '45–47', us: '16–18', eu: '48–50' },
];

export default function SizeGuideModal({ onClose }: SizeGuideModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="relative bg-white border border-border-custom shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto z-10"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-custom">
                    <h2 className="font-playfair text-xl font-black text-secondary">Size Guide</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center hover:bg-surface transition-colors"
                    >
                        <X className="w-4 h-4 text-secondary" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">
                        Measurements in Inches
                    </p>

                    {/* Size Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border-custom">
                                    <th className="text-left py-2.5 pr-3 text-[10px] font-black uppercase tracking-widest text-secondary">Size</th>
                                    <th className="text-left py-2.5 px-3 text-[10px] font-black uppercase tracking-widest text-secondary">Chest</th>
                                    <th className="text-left py-2.5 px-3 text-[10px] font-black uppercase tracking-widest text-secondary">Waist</th>
                                    <th className="text-left py-2.5 px-3 text-[10px] font-black uppercase tracking-widest text-secondary">Hips</th>
                                    <th className="text-left py-2.5 px-3 text-[10px] font-black uppercase tracking-widest text-secondary">US</th>
                                    <th className="text-left py-2.5 pl-3 text-[10px] font-black uppercase tracking-widest text-secondary">EU</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SIZE_DATA.map((row) => (
                                    <tr key={row.size} className="border-b border-border-custom last:border-0">
                                        <td className="py-2.5 pr-3 font-bold text-secondary">{row.size}</td>
                                        <td className="py-2.5 px-3 text-muted-custom">{row.chest}</td>
                                        <td className="py-2.5 px-3 text-muted-custom">{row.waist}</td>
                                        <td className="py-2.5 px-3 text-muted-custom">{row.hips}</td>
                                        <td className="py-2.5 px-3 text-muted-custom">{row.us}</td>
                                        <td className="py-2.5 pl-3 text-muted-custom">{row.eu}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Tips */}
                    <div className="mt-5 pt-4 border-t border-border-custom">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-2">
                            How to Measure
                        </p>
                        <ul className="space-y-1.5 text-sm text-muted-custom">
                            <li><span className="font-bold text-secondary">Chest:</span> Measure around the fullest part of your chest.</li>
                            <li><span className="font-bold text-secondary">Waist:</span> Measure around your natural waistline.</li>
                            <li><span className="font-bold text-secondary">Hips:</span> Measure around the widest part of your hips.</li>
                        </ul>
                        <p className="mt-3 text-xs text-muted-custom italic">
                            If you fall between sizes, we recommend sizing up for a relaxed fit or sizing down for a fitted look.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

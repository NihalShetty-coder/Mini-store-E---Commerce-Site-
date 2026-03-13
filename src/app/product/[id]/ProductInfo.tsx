import { Star } from 'lucide-react';
import type { Product } from '@/lib/firestore';

interface ProductInfoProps {
    product: Product & { id: string };
}

/**
 * Server Component - Static product information
 * No client-side JS needed for this content
 */
export default function ProductInfo({ product }: ProductInfoProps) {
    return (
        <>
            <div className="mb-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">{product.category}</div>
                <h1 className="font-playfair text-3xl md:text-4xl lg:text-5xl font-black text-secondary mb-3 leading-tight">{product.name}</h1>
                <div className="flex items-center gap-4 mb-4 text-secondary">
                    <div className="flex items-center gap-1.5">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-border-custom" />
                        ))}
                        <span className="text-[10px] font-bold ml-2">(0 Reviews)</span>
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex items-baseline gap-4 mb-2">
                    <span className="text-2xl font-playfair font-black text-secondary">₹{product.price}</span>
                    {product.originalPrice && (
                        <span className="text-lg text-muted-custom line-through font-playfair">₹{product.originalPrice}</span>
                    )}
                </div>
                <p className="text-muted-custom text-sm leading-relaxed max-w-lg whitespace-pre-line">
                    {product.description || <span className="italic">No description available.</span>}
                </p>
            </div>
        </>
    );
}

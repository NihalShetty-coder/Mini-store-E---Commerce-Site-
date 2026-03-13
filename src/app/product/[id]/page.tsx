import { notFound } from 'next/navigation';
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { Product } from '@/lib/firestore';
import type { Metadata } from 'next';
import { cache } from 'react';
import ProductPageClient from './ProductPageClient';

// ISR: serve from cache, revalidate in background every 60 seconds
export const revalidate = 60;

// ── Cached Firestore fetch ─────────────────────────────────────────
// React `cache()` deduplicates calls with the same `id` within a single
// server request, so generateMetadata + the page function share ONE read.
const getProduct = cache(async (id: string) => {
    const db = getAdminFirestore();
    const snap = await db.collection('products').doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data()! } as Record<string, unknown> & { id: string };
});

// ── Static params (build-time only) ────────────────────────────────
// In dev mode this runs on EVERY navigation and fetches ALL products
// from Firestore (~1.8s wasted). Return empty in dev so pages render
// on-demand; in production the full list is generated at build time.
export async function generateStaticParams() {
    if (process.env.NODE_ENV === 'development') return [];

    try {
        const db = getAdminFirestore();
        // select() fetches only doc IDs — no field data transferred
        const snap = await db.collection('products').select().get();
        return snap.docs.map((doc) => ({ id: doc.id }));
    } catch {
        return [];
    }
}

// ── SEO metadata ───────────────────────────────────────────────────
interface ProductPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const { id } = await params;
    const data = await getProduct(id);

    if (!data) return { title: 'Product Not Found' };

    const name = data.name as string;
    const description = (data.description as string)?.slice(0, 160) || `Shop ${name} at Nihal Shetty`;
    const images = (data.images as string[]) || [];
    const image = (data.image as string) || '';
    const ogImage = images[0] || image;

    return {
        title: `${name} | Nihal Shetty`,
        description,
        openGraph: {
            title: name,
            description,
            ...(ogImage ? { images: [{ url: ogImage }] } : {}),
        },
    };
}

// ── Page component ─────────────────────────────────────────────────
export default async function ProductPage({ params }: ProductPageProps) {
    const { id } = await params;
    const data = await getProduct(id); // cached — reuses generateMetadata's result

    if (!data) notFound();

    // Don't show draft products or out of stock products
    if (data.status === 'Draft' || data.status === 'Out of Stock') notFound();

    // Calculate total stock from variantInventory if available, otherwise use stock field
    let totalStock = (data.stock as number) || 0;
    if (data.variantInventory && typeof data.variantInventory === 'object') {
        totalStock = Object.values(data.variantInventory as Record<string, number>)
            .reduce((sum, qty) => sum + (qty || 0), 0);
    }

    // Serialize for client component (Timestamps → ISO strings)
    const product: Product & { id: string; totalStock: number } = {
        id: data.id,
        name: data.name as string,
        price: data.price as number,
        originalPrice: data.originalPrice as number | undefined,
        category: data.category as string,
        subCategory: data.subCategory as string | undefined,
        description: data.description as string | undefined,
        image: (data.image as string) || '',
        images: Array.isArray(data.images) ? data.images : [],
        videos: data.videos as string[] | undefined,
        badge: data.badge as string | undefined,
        rating: data.rating as number | undefined,
        stock: totalStock,
        sku: data.sku as string | undefined,
        status: (data.status as 'Active' | 'Draft' | 'Out of Stock') || 'Active',
        sizes: data.sizes as string[] | undefined,
        colors: data.colors as string[] | undefined,
        material: data.material as string | undefined,
        brand: data.brand as string | undefined,
        tags: data.tags as string[] | undefined,
        seo: data.seo as { title?: string; description?: string; keywords?: string[] } | undefined,
        createdAt: (data.createdAt as { toDate?: () => Date })?.toDate
            ? (data.createdAt as { toDate: () => Date }).toDate()
            : (data.createdAt as Date),
        totalStock,
    };

    return <ProductPageClient product={product} />;
}

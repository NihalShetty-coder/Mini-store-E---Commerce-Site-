import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { rateLimit, getIdentifier, rateLimitConfigs } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

interface OrderRequestItem {
    productId: string;
    quantity: number;
    size?: string;
    color?: string;
}

interface PlaceOrderBody {
    items: OrderRequestItem[];
    shippingAddress: string;
    customerEmail: string;
    userId?: string;
}

type ResolvedItem = {
    productId: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    size: string;
    color: string;
    category?: string;
};

function generateShortId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 6; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    return id;
}

export async function POST(req: Request) {
    const identifier = getIdentifier(req);
    const rateLimitResult = rateLimit(identifier, rateLimitConfigs.checkout);

    if (!rateLimitResult.success) {
        return new NextResponse('Too many requests. Please try again later.', {
            status: 429,
            headers: {
                'X-RateLimit-Limit': rateLimitResult.limit.toString(),
                'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
            },
        });
    }

    let body: PlaceOrderBody;
    try {
        body = await req.json();
    } catch {
        return new NextResponse('Invalid request body', { status: 400 });
    }

    const { items, shippingAddress, customerEmail, userId } = body;

    if (!items?.length) {
        return new NextResponse('No items provided', { status: 400 });
    }

    if (!shippingAddress || !customerEmail) {
        return new NextResponse('Missing shipping address or email', { status: 400 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        logger.error('Stripe secret key is missing', undefined, 'PAYMENT');
        return new NextResponse('Payment system not configured', { status: 500 });
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const orderId = generateShortId();

    try {
        const db = getAdminFirestore();

        // Use a transaction to atomically check stock, decrement it, and create the order
        const resolvedItems: ResolvedItem[] = [];

        await db.runTransaction(async (tx) => {
            // Read all products inside the transaction
            const productSnaps = await Promise.all(
                items.map((item) => tx.get(db.collection('products').doc(item.productId)))
            );

            for (let i = 0; i < productSnaps.length; i++) {
                const snap = productSnaps[i];
                const reqItem = items[i];

                if (!snap.exists) {
                    throw new Error(`Product not found: ${reqItem.productId}`);
                }

                const product = snap.data() as {
                    name: string;
                    price: number;
                    image?: string;
                    images?: string[];
                    stock?: number;
                    status?: string;
                    category?: string;
                    variantInventory?: Record<string, number>;
                };

                if (product.status === 'Draft') {
                    throw new Error(`Product unavailable: ${product.name}`);
                }

                // Check variant-level stock if product uses variant inventory
                const variantKey = `${reqItem.size || ''}|${reqItem.color || ''}`;
                if (product.variantInventory && Object.keys(product.variantInventory).length > 0) {
                    const variantStock = product.variantInventory[variantKey] ?? 0;
                    if (variantStock < reqItem.quantity) {
                        const variantLabel = [reqItem.size, reqItem.color].filter(Boolean).join(' / ') || 'default';
                        throw new Error(`Insufficient stock for ${product.name} (${variantLabel}). Only ${variantStock} left.`);
                    }
                } else {
                    const stock = product.stock ?? Infinity;
                    if (stock < reqItem.quantity) {
                        throw new Error(`Insufficient stock for ${product.name}. Only ${stock} left.`);
                    }
                }

                resolvedItems.push({
                    productId: reqItem.productId,
                    name: product.name,
                    image: product.images?.[0] || product.image || '/placeholder-product.svg',
                    price: product.price,
                    quantity: reqItem.quantity,
                    size: reqItem.size || '',
                    color: reqItem.color || '',
                    category: product.category || 'Uncategorized',
                });

                // Decrement stock
                if (product.variantInventory && Object.keys(product.variantInventory).length > 0) {
                    // Variant-level stock deduction
                    const updatedVariantInventory = { ...product.variantInventory };
                    updatedVariantInventory[variantKey] = (updatedVariantInventory[variantKey] ?? 0) - reqItem.quantity;
                    const newTotalStock = Object.values(updatedVariantInventory).reduce((sum, v) => sum + v, 0);
                    tx.update(snap.ref, {
                        variantInventory: updatedVariantInventory,
                        stock: newTotalStock,
                        status: newTotalStock <= 0 ? 'Out of Stock' : 'Active',
                    });
                } else if (typeof product.stock === 'number') {
                    const newStock = product.stock - reqItem.quantity;
                    tx.update(snap.ref, {
                        stock: newStock,
                        status: newStock <= 0 ? 'Out of Stock' : 'Active',
                    });
                }
            }

            const total = resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

            // Create order document
            tx.set(db.collection('orders').doc(orderId), {
                userId: userId || null,
                customerEmail,
                items: resolvedItems,
                total,
                status: 'Pending',
                shippingAddress,
                createdAt: FieldValue.serverTimestamp(),
            });
        });

        // Create Stripe checkout session (outside transaction - not a Firestore op)
        const total = resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const stripe = new Stripe(secretKey, { apiVersion: '2026-02-25.clover' });

        const lineItems = resolvedItems.map((item) => {
            let absoluteImage: string | undefined;
            if (item.image.startsWith('http')) absoluteImage = item.image;
            else if (!item.image.startsWith('data:image')) absoluteImage = `${origin}${item.image.startsWith('/') ? '' : '/'}${item.image}`;

            return {
                price_data: {
                    currency: 'inr',
                    product_data: {
                        name: item.name,
                        images: absoluteImage ? [absoluteImage] : [],
                        metadata: { size: item.size || 'N/A', color: item.color || 'N/A' },
                    },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity,
            };
        });

        let session: Stripe.Checkout.Session;
        try {
            session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
                success_url: `${origin}/success?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${origin}/checkout?canceled=true`,
                metadata: { orderId },
                customer_email: customerEmail,
            });
        } catch (stripeErr) {
            // Stripe failed - revert the order and stock changes
            logger.error('Stripe session creation failed, reverting order', stripeErr, 'PAYMENT');
            try {
                await db.runTransaction(async (tx) => {
                    const orderRef = db.collection('orders').doc(orderId);
                    const orderSnap = await tx.get(orderRef);
                    if (!orderSnap.exists) return;

                    const orderData = orderSnap.data() as { items: { productId: string; quantity: number; size?: string; color?: string }[] };
                    for (const item of orderData.items) {
                        const productRef = db.collection('products').doc(item.productId);
                        const productSnap = await tx.get(productRef);
                        if (!productSnap.exists) continue;

                        const data = productSnap.data() as { stock?: number; variantInventory?: Record<string, number> };

                        if (data.variantInventory && Object.keys(data.variantInventory).length > 0) {
                            const variantKey = `${item.size || ''}|${item.color || ''}`;
                            const updatedVariantInventory = { ...data.variantInventory };
                            updatedVariantInventory[variantKey] = (updatedVariantInventory[variantKey] ?? 0) + item.quantity;
                            const newTotalStock = Object.values(updatedVariantInventory).reduce((sum, v) => sum + v, 0);
                            tx.update(productRef, {
                                variantInventory: updatedVariantInventory,
                                stock: newTotalStock,
                                status: 'Active',
                            });
                        } else if (typeof data.stock === 'number') {
                            tx.update(productRef, {
                                stock: data.stock + item.quantity,
                                status: 'Active',
                            });
                        }
                    }
                    tx.delete(orderRef);
                });
            } catch (revertErr) {
                logger.error('Failed to revert order after Stripe failure', revertErr, 'PAYMENT');
            }
            throw stripeErr;
        }

        logger.info('Order placed and Stripe session created', { orderId, total, sessionId: session.id }, 'CHECKOUT');
        return NextResponse.json({ orderId, url: session.url, sessionId: session.id });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Internal Server Error';
        logger.error('Error placing order', error, 'CHECKOUT');

        if (msg.includes('Stock changed') || msg.includes('Insufficient stock')) {
            return new NextResponse(msg, { status: 409 });
        }
        if (msg.includes('not found') || msg.includes('unavailable') || msg.includes('disappeared')) {
            return new NextResponse(msg, { status: 400 });
        }
        return new NextResponse(msg, { status: 500 });
    }
}

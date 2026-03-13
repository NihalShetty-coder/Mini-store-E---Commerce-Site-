import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { rateLimit, getIdentifier, rateLimitConfigs } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
    // Apply rate limiting (webhooks should be from Stripe, but protect anyway)
    const identifier = getIdentifier(req);
    const rateLimitResult = rateLimit(identifier, rateLimitConfigs.general);

    if (!rateLimitResult.success) {
        return new NextResponse('Too many requests', { status: 429 });
    }

    const payload = await req.text();
    const sig = req.headers.get('stripe-signature') as string;

    let event;

    try {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!secretKey) {
            logger.error('Stripe secret key not configured', undefined, 'WEBHOOK');
            return new NextResponse('Payment system not configured', { status: 500 });
        }

        if (!endpointSecret) {
            logger.error('Stripe webhook secret not configured - signature verification required', undefined, 'WEBHOOK');
            return new NextResponse('Webhook not configured', { status: 500 });
        }

        const stripe = new Stripe(secretKey, {
            apiVersion: '2026-02-25.clover',
        });

        // Always verify webhook signature for security
        event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Webhook signature verification failed', err, 'WEBHOOK');
        return new NextResponse(`Webhook Error: ${msg}`, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (orderId) {
            try {
                const adminDb = getAdminFirestore();
                // Update the order status in Firestore to Paid/Processing using Admin SDK (bypasses rules)
                await adminDb.collection('orders').doc(orderId).update({
                    status: 'Processing',
                    paymentStatus: 'Paid',
                    stripeSessionId: session.id,
                    updatedAt: FieldValue.serverTimestamp(),
                });
                logger.info(`Order ${orderId} marked as processing`, { sessionId: session.id }, 'WEBHOOK');
            } catch (error) {
                logger.error('Error updating order status in webhook', error, 'WEBHOOK');
                return new NextResponse('Error updating order status', { status: 500 });
            }
        }
    } else if (event.type === 'checkout.session.expired') {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (orderId) {
            try {
                logger.info(`Session expired for order ${orderId}, reverting stock`, { sessionId: session.id }, 'WEBHOOK');
                const adminDb = getAdminFirestore();
                await adminDb.runTransaction(async (tx) => {
                    const orderRef = adminDb.collection('orders').doc(orderId);
                    const orderSnap = await tx.get(orderRef);
                    if (!orderSnap.exists) return;

                    const orderData = orderSnap.data() as {
                        status: string;
                        items: { productId: string; quantity: number }[];
                    };

                    if (orderData.status !== 'Pending') return;

                    for (const item of orderData.items) {
                        const productRef = adminDb.collection('products').doc(item.productId);
                        const productSnap = await tx.get(productRef);
                        if (productSnap.exists) {
                            const data = productSnap.data() as { stock?: number };
                            if (typeof data.stock === 'number') {
                                tx.update(productRef, {
                                    stock: data.stock + item.quantity,
                                    status: 'Active',
                                });
                            }
                        }
                    }

                    tx.delete(orderRef);
                });
            } catch (error) {
                logger.error(`Error reverting order ${orderId}`, error, 'WEBHOOK');
                return new NextResponse('Error reverting order', { status: 500 });
            }
        }
    }

    return new NextResponse('OK', { status: 200 });
}

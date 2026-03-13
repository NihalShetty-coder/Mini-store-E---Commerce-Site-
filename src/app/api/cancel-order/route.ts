import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { rateLimit, getIdentifier, rateLimitConfigs } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
    const identifier = getIdentifier(req);
    const rateLimitResult = rateLimit(identifier, rateLimitConfigs.general);

    if (!rateLimitResult.success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    let body: { orderId: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { orderId } = body;
    if (!orderId) {
        return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    try {
        const db = getAdminFirestore();

        await db.runTransaction(async (tx) => {
            const orderRef = db.collection('orders').doc(orderId);
            const orderSnap = await tx.get(orderRef);

            if (!orderSnap.exists) {
                throw new Error('Order not found');
            }

            const orderData = orderSnap.data() as {
                status: string;
                paymentStatus?: string;
                items: { productId: string; quantity: number }[];
            };

            // Don't allow cancelling already cancelled or delivered orders
            if (orderData.status === 'Cancelled') {
                throw new Error('Order is already cancelled');
            }
            if (orderData.status === 'Delivered') {
                throw new Error('Cannot cancel a delivered order');
            }

            // If the order was unpaid (Pending), restore stock
            if (orderData.paymentStatus !== 'Paid') {
                for (const item of orderData.items) {
                    const productRef = db.collection('products').doc(item.productId);
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
            }

            tx.update(orderRef, {
                status: 'Cancelled',
                updatedAt: FieldValue.serverTimestamp(),
            });
        });

        logger.info(`Order ${orderId} cancelled`, undefined, 'ORDERS');
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Failed to cancel order';
        logger.error(`Error cancelling order ${orderId}`, error, 'ORDERS');
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

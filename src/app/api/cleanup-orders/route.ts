import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

export async function POST() {
    try {
        const db = getAdminFirestore();

        // Find all pending, unpaid orders
        const ordersSnap = await db
            .collection('orders')
            .where('status', '==', 'Pending')
            .get();

        const now = Date.now();
        let deletedCount = 0;

        for (const doc of ordersSnap.docs) {
            const data = doc.data();

            // Skip if already paid
            if (data.paymentStatus === 'Paid') continue;

            // Determine order age
            let createdAtMs: number | null = null;
            if (data.createdAt) {
                if (typeof data.createdAt.toMillis === 'function') {
                    createdAtMs = data.createdAt.toMillis();
                } else if (data.createdAt instanceof Date) {
                    createdAtMs = data.createdAt.getTime();
                } else if (typeof data.createdAt === 'number') {
                    createdAtMs = data.createdAt;
                }
            }

            if (!createdAtMs) continue;

            const ageMs = now - createdAtMs;
            if (ageMs < THIRTY_MINUTES_MS) continue;

            // Order is older than 30 minutes, unpaid, and pending - delete it and restore stock
            try {
                await db.runTransaction(async (tx) => {
                    const orderRef = db.collection('orders').doc(doc.id);
                    const orderSnap = await tx.get(orderRef);

                    if (!orderSnap.exists) return;

                    const orderData = orderSnap.data() as {
                        status: string;
                        paymentStatus?: string;
                        items: { productId: string; quantity: number }[];
                    };

                    // Double-check still pending and unpaid
                    if (orderData.status !== 'Pending' || orderData.paymentStatus === 'Paid') return;

                    // Restore stock for each item
                    for (const item of orderData.items) {
                        const productRef = db.collection('products').doc(item.productId);
                        const productSnap = await tx.get(productRef);
                        if (productSnap.exists) {
                            const productData = productSnap.data() as { stock?: number };
                            if (typeof productData.stock === 'number') {
                                tx.update(productRef, {
                                    stock: productData.stock + item.quantity,
                                    status: 'Active',
                                });
                            }
                        }
                    }

                    // Delete the expired order
                    tx.delete(orderRef);
                });

                deletedCount++;
                logger.info(`Auto-deleted expired pending order ${doc.id}`, undefined, 'CLEANUP');
            } catch (txErr) {
                logger.error(`Failed to cleanup order ${doc.id}`, txErr, 'CLEANUP');
            }
        }

        return NextResponse.json({
            success: true,
            deletedCount,
            message: deletedCount > 0
                ? `Cleaned up ${deletedCount} expired pending order(s)`
                : 'No expired pending orders found',
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Cleanup failed';
        logger.error('Error during order cleanup', error, 'CLEANUP');
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

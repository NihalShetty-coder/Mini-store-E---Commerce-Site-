import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { rateLimit, getIdentifier, rateLimitConfigs } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
    // Apply rate limiting
    const identifier = getIdentifier(req);
    const rateLimitResult = rateLimit(identifier, rateLimitConfigs.general);

    if (!rateLimitResult.success) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    try {
        const body = await req.json();
        const { sessionId, orderId } = body;

        if (!sessionId || !orderId) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Only use server-side secret key (never NEXT_PUBLIC_*)
        const secretKey = process.env.STRIPE_SECRET_KEY;
        
        if (!secretKey) {
            logger.error('Stripe secret key not configured', undefined, 'PAYMENT');
            return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 });
        }

        const stripe = new Stripe(secretKey, {
            apiVersion: '2026-02-25.clover',
        });

        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Verify that this session actually belongs to this order
        if (session.metadata?.orderId !== orderId) {
            return NextResponse.json({ error: 'Session mismatch - order verification failed' }, { status: 400 });
        }

        // Update order in Firestore based on payment status
        const db = getAdminFirestore();
        const orderRef = db.collection('orders').doc(orderId);

        if (session.payment_status === 'paid') {
            // Payment successful: mark as Paid and move to Processing
            await orderRef.update({
                paymentStatus: 'Paid',
                stripeSessionId: sessionId,
                status: 'Processing',
                updatedAt: FieldValue.serverTimestamp(),
            });
            logger.info(`Payment verified for order ${orderId} — marked as Paid/Processing`, { sessionId }, 'PAYMENT');
        } else {
            // Payment not completed: mark as Unpaid, keep as Pending
            await orderRef.update({
                paymentStatus: 'Unpaid',
                stripeSessionId: sessionId,
                updatedAt: FieldValue.serverTimestamp(),
            });
            logger.info(`Payment not completed for order ${orderId} — marked as Unpaid/Pending`, { sessionId, paymentStatus: session.payment_status }, 'PAYMENT');
        }

        return NextResponse.json({
            payment_status: session.payment_status,
            status: session.status
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Internal Server Error';
        logger.paymentError('Error verifying Stripe session', error);
        return NextResponse.json(
            { error: msg },
            { status: 500 }
        );
    }
}

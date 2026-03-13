import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    updateDoc,
    deleteDoc,
    setDoc,
    serverTimestamp,
    Timestamp,
    runTransaction,
    type QueryConstraint,
    type Firestore,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase-client';
import { logger } from './logger';

// Lazy db getter - caches after first call
let _dbCache: Firestore | null = null;
async function getDb(): Promise<Firestore> {
    if (!_dbCache) {
        _dbCache = await getFirebaseDb();
    }
    return _dbCache;
}

// Strip undefined and null values — Firestore rejects undefined fields
function cleanData<T extends object>(data: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined && v !== null)
    ) as Partial<T>;
}

// ─── Products ──────────────────────────────────────────────────
export interface Product {
    id?: string;
    name: string;
    price: number;
    originalPrice?: number;
    category: string;
    subCategory?: string;
    description?: string;
    image: string;
    images?: string[];
    videos?: string[]; // Added video support
    badge?: string;
    rating?: number;
    stock: number;
    sku?: string;
    status: 'Active' | 'Draft' | 'Out of Stock';
    // Variant-level inventory: keys are "size|color" e.g. "S|Red", "M|Blue"
    variantInventory?: Record<string, number>;
    lowStockThreshold?: number;
    // New fields for production-grade e-commerce
    sizes?: string[];
    colors?: string[];
    material?: string;
    brand?: string;
    tags?: string[];
    seo?: {
        title?: string;
        description?: string;
        keywords?: string[];
    };
    createdAt?: Timestamp | Date;
}

export async function getProducts(filters?: { category?: string; badge?: string; status?: string }) {
    const db = await getDb();
    const constraints: QueryConstraint[] = [];
    if (filters?.category) constraints.push(where('category', '==', filters.category));
    if (filters?.badge) constraints.push(where('badge', '==', filters.badge));

    // Remove orderBy from Firestore query to avoid needing a Composite Index
    const q = query(collection(db, 'products'), ...constraints);
    const snap = await getDocs(q);

    let results = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));

    // Client-side status filtering to handle older products that might be missing the status field entirely
    const targetStatus = filters?.status || 'Active';
    results = results.filter(p => {
        // If target is Active, treat missing status as Active
        if (targetStatus === 'Active') {
            return !p.status || p.status === 'Active';
        }
        return p.status === targetStatus;
    });

    // Sort descending by createdAt in JS
    results.sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
    });

    return results;
}

export async function getAllProducts() {
    const db = await getDb();
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
}

export async function getProduct(id: string): Promise<Product | null> {
    const db = await getDb();
    const snap = await getDoc(doc(db, 'products', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Product;
}

export async function createProduct(data: Omit<Product, 'id'>) {
    const db = await getDb();
    // cleanData removes undefined/null fields that Firestore rejects
    const ref = await addDoc(collection(db, 'products'), {
        ...cleanData(data),
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>) {
    const db = await getDb();
    // Remove undefined fields before updating
    await updateDoc(doc(db, 'products', id), cleanData(data) as object);
}

export async function deleteProduct(id: string) {
    const db = await getDb();
    await deleteDoc(doc(db, 'products', id));
}


// ─── Orders ────────────────────────────────────────────────────
export interface OrderItem {
    productId: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    
    // Variant details
    size?: string;
    color?: string;
    
    // Category snapshot (captured at order time)
    category?: string;
}

export interface Order {
    id?: string;
    userId?: string;
    customerEmail: string;
    items: OrderItem[];
    total: number;
    status: string;
    shippingAddress: string;
    trackingNumber?: string;
    trackingCarrier?: string;
    adminNotes?: string;
    paymentStatus?: string;
    stripeSessionId?: string;
    createdAt?: Timestamp | Date;
    updatedAt?: Timestamp | Date;
}

// Utility to generate a 6-character alphanumeric ID
function generateShortId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like I, 1, O, 0
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

export async function createOrder(data: Omit<Order, 'id'>) {
    const db = await getDb();
    const orderId = generateShortId();
    await setDoc(doc(db, 'orders', orderId), {
        ...cleanData(data),
        items: data.items, // always keep items array as-is
        createdAt: serverTimestamp(),
    });
    return orderId;
}

// Helper: build variant key from size/color
function getVariantKey(size?: string, color?: string): string {
    return `${size || ''}|${color || ''}`;
}

export async function createOrderWithStockUpdate(data: Omit<Order, 'id'>) {
    const db = await getDb();
    return await runTransaction(db, async (transaction) => {
        // 1. Verify all items first
        const productRefs = data.items.map(item => doc(db, 'products', item.productId));
        const productSnaps = await Promise.all(productRefs.map(ref => transaction.get(ref)));

        for (let i = 0; i < productSnaps.length; i++) {
            const snap = productSnaps[i];
            const item = data.items[i];
            if (!snap.exists()) {
                throw new Error(`Product ${item.name} not found.`);
            }
            const product = snap.data() as Product;

            // Check variant-level stock if product uses variant inventory
            if (product.variantInventory && Object.keys(product.variantInventory).length > 0) {
                const variantKey = getVariantKey(item.size, item.color);
                const variantStock = product.variantInventory[variantKey] ?? 0;
                if (variantStock < item.quantity) {
                    const variantLabel = [item.size, item.color].filter(Boolean).join(' / ') || 'default';
                    throw new Error(`Insufficient stock for ${item.name} (${variantLabel}). Only ${variantStock} left.`);
                }
            } else {
                const currentStock = product.stock ?? 0;
                if (currentStock < item.quantity) {
                    throw new Error(`Insufficient stock for ${item.name}. Only ${currentStock} left.`);
                }
            }
        }

        // 2. Perform updates
        for (let i = 0; i < productSnaps.length; i++) {
            const snap = productSnaps[i];
            const item = data.items[i];
            const product = snap.data() as Product;

            if (product.variantInventory && Object.keys(product.variantInventory).length > 0) {
                // Variant-level stock deduction
                const variantKey = getVariantKey(item.size, item.color);
                const updatedVariantInventory = { ...product.variantInventory };
                updatedVariantInventory[variantKey] = (updatedVariantInventory[variantKey] ?? 0) - item.quantity;

                // Recalculate total stock from all variants
                const newTotalStock = Object.values(updatedVariantInventory).reduce((sum, v) => sum + v, 0);

                transaction.update(snap.ref, {
                    variantInventory: updatedVariantInventory,
                    stock: newTotalStock,
                    status: newTotalStock <= 0 ? 'Out of Stock' : 'Active',
                });
            } else {
                // Simple product-level stock deduction
                const currentStock = product.stock ?? 0;
                const newStock = currentStock - item.quantity;
                transaction.update(snap.ref, {
                    stock: newStock,
                    status: newStock <= 0 ? 'Out of Stock' : 'Active',
                });
            }
        }

        // 3. Create the order with short ID
        const orderId = generateShortId();
        const orderRef = doc(db, 'orders', orderId);
        transaction.set(orderRef, {
            ...cleanData(data),
            items: data.items,
            createdAt: serverTimestamp(),
        });

        return orderId;
    });
}

export async function getUserOrders(userId: string): Promise<Order[]> {
    const db = await getDb();
    const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId)
    );
    const snap = await getDocs(q);

    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));

    orders.sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
    });

    return orders;
}

export async function getAllOrders(): Promise<Order[]> {
    const db = await getDb();
    const q = query(collection(db, 'orders'));
    const snap = await getDocs(q);

    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));

    orders.sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
    });

    return orders;
}

export async function updateOrderStatus(id: string, status: string) {
    const db = await getDb();
    await updateDoc(doc(db, 'orders', id), { status, updatedAt: serverTimestamp() });
}

export async function updateOrderDetails(id: string, details: Partial<Order>) {
    const db = await getDb();
    await updateDoc(doc(db, 'orders', id), { ...cleanData(details), updatedAt: serverTimestamp() });
}

export async function getOrder(id: string): Promise<Order | null> {
    const db = await getDb();
    const snap = await getDoc(doc(db, 'orders', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Order;
}

export async function getAllUsers(): Promise<Record<string, unknown>[]> {
    const db = await getDb();
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
}

export async function revertOrderStockAndDelete(orderId: string) {
    const db = await getDb();
    return await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await transaction.get(orderRef);

        if (!orderSnap.exists()) {
            logger.info(`Order ${orderId} not found for reversal, skipping.`, 'FIRESTORE');
            return;
        }

        const orderData = orderSnap.data() as Order;

        // Only revert if we are still pending
        if (orderData.status !== 'Pending') {
            logger.info(`Order ${orderId} is not pending (status: ${orderData.status}), skipping reversal.`, 'FIRESTORE');
            return;
        }

        // Get all products that need stock restored
        const productRefs = orderData.items.map(item => doc(db, 'products', item.productId));
        const productSnaps = await Promise.all(productRefs.map(ref => transaction.get(ref)));

        // Increment stock back
        for (let i = 0; i < productSnaps.length; i++) {
            const snap = productSnaps[i];
            const item = orderData.items[i];

            if (snap.exists()) {
                const product = snap.data() as Product;

                if (product.variantInventory && Object.keys(product.variantInventory).length > 0) {
                    // Revert variant-level stock
                    const variantKey = getVariantKey(item.size, item.color);
                    const updatedVariantInventory = { ...product.variantInventory };
                    updatedVariantInventory[variantKey] = (updatedVariantInventory[variantKey] ?? 0) + item.quantity;

                    const newTotalStock = Object.values(updatedVariantInventory).reduce((sum, v) => sum + v, 0);
                    transaction.update(snap.ref, {
                        variantInventory: updatedVariantInventory,
                        stock: newTotalStock,
                        status: 'Active',
                    });
                } else {
                    const currentStock = product.stock ?? 0;
                    transaction.update(snap.ref, {
                        stock: currentStock + item.quantity,
                        status: 'Active',
                    });
                }
            }
        }

        // Permanently delete the abandoned order
        transaction.delete(orderRef);
    });
}

// ─── Wishlist ──────────────────────────────────────────────────
/**
 * Wishlist synchronization with inventory:
 * - Individual user wishlists are automatically synced via WishlistSync component
 * - When products are deleted or deactivated, they're removed from wishlists on next user visit
 * - This approach is more efficient than batch-updating all user wishlists on product deletion
 */

export interface WishlistItem {
    productId: string;
    name: string;
    price: number;
    image: string;
    addedAt?: Timestamp | Date; // Firestore Timestamp
}

export async function getUserWishlist(userId: string): Promise<WishlistItem[]> {
    const db = await getDb();
    const q = query(collection(db, 'wishlists', userId, 'items'), orderBy('addedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ productId: d.id, ...d.data() } as WishlistItem));
}

export async function addToWishlist(userId: string, item: Omit<WishlistItem, 'addedAt'>) {
    const db = await getDb();
    await setDoc(doc(db, 'wishlists', userId, 'items', item.productId), {
        ...cleanData(item),
        addedAt: serverTimestamp(),
    });
}

export async function removeFromWishlist(userId: string, productId: string) {
    const db = await getDb();
    await deleteDoc(doc(db, 'wishlists', userId, 'items', productId));
}

// ─── Settings ──────────────────────────────────────────────────
export interface FooterLink {
    id: string;
    section: string;
    name: string;
    url: string;
    isExternal?: boolean;
}

export interface ContactMethod {
    id: string;
    label: string;
    value: string;
    isLink: boolean;
}

export interface StoreSettings {
    storeName?: string;
    footerLinks?: FooterLink[];
    contactMethods?: ContactMethod[];
    heroConfig?: {
        title: string;
        subtitle: string;
        backgroundImage: string;
    };
    statsConfig?: {
        label: string;
        value: string;
    }[];
    stripeConfig?: {
        publishableKey: string;
    };
}

export async function getStoreSettings(): Promise<StoreSettings | null> {
    const db = await getDb();
    const snap = await getDoc(doc(db, 'settings', 'global'));
    if (!snap.exists()) return null;
    return snap.data() as StoreSettings;
}

export async function updateStoreSettings(data: Partial<StoreSettings>) {
    const db = await getDb();
    await setDoc(doc(db, 'settings', 'global'), cleanData(data), { merge: true });
}

// ─── Analytics Events ──────────────────────────────────────────
export interface AnalyticsEvent {
    type: 'PAGE_VIEW' | 'PRODUCT_VIEW' | 'ADD_TO_CART' | 'REMOVE_FROM_CART' | 'CHECKOUT_START' | 'PURCHASE' | 'WISHLIST_ADD';
    path?: string;
    value?: number;
    userId?: string;
    sessionId?: string; // UUID for session tracking
    productId?: string; // Product ID for product-related events
    source?: string; // Traffic source (direct, organic, referral, social, etc.)
    referrer?: string; // Referrer URL
    createdAt?: Timestamp | Date;
}

export async function trackAnalyticsEvent(event: AnalyticsEvent) {
    const db = await getDb();
    await addDoc(collection(db, 'analytics_events'), {
        ...event,
        createdAt: serverTimestamp(),
    });
}

export async function getAnalyticsEvents(since?: Date): Promise<AnalyticsEvent[]> {
    const db = await getDb();
    const constraints: QueryConstraint[] = [];
    if (since) constraints.push(where('createdAt', '>=', Timestamp.fromDate(since)));

    // Remove orderBy to avoid requiring a custom Composite Index
    const q = query(collection(db, 'analytics_events'), ...constraints);
    const snap = await getDocs(q);

    const events = snap.docs.map((d) => d.data() as AnalyticsEvent);

    // Sort ascending by createdAt in memory
    events.sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt ? b.createdAt.toMillis() : 0;
        return timeA - timeB;
    });

    return events;
}

// ─── User Profile (for auth-service) ──────────────────────────
export async function getUserProfile(userId: string): Promise<Record<string, unknown> | null> {
    const db = await getDb();
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) return null;
    return snap.data();
}

export async function createUserProfile(userId: string, data: Record<string, unknown>) {
    const db = await getDb();
    await setDoc(doc(db, 'users', userId), data);
}

export async function updateUserProfile(userId: string, data: Record<string, unknown>) {
    const db = await getDb();
    await setDoc(doc(db, 'users', userId), data, { merge: true });
}

export async function checkAdminStatus(userId: string): Promise<boolean> {
    const db = await getDb();
    const snap = await getDoc(doc(db, 'admins', userId));
    return snap.exists();
}

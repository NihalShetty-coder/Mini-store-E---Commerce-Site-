/**
 * Analytics Data Seeding Script
 * 
 * This script generates realistic test data for the analytics dashboard:
 * - Orders with varied dates (last 30 days)
 * - Products across different categories
 * - Analytics events (ADD_TO_CART, CHECKOUT_START, PURCHASE)
 * - Repeat customers
 * - Low stock products for inventory insights
 * - Various order statuses
 * 
 * Usage: npm run seed:analytics
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { getAdminFirestore } from '../src/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const db = getAdminFirestore();

// Sample product categories
const CATEGORIES = [
    "Women's Clothing",
    "Men's Clothing",
    "Accessories",
    "Footwear"
];

// Sample products
const SAMPLE_PRODUCTS = [
    { name: "Classic White T-Shirt", price: 29.99, category: "Men's Clothing", stock: 150 },
    { name: "Denim Jacket", price: 89.99, category: "Men's Clothing", stock: 45 },
    { name: "Floral Summer Dress", price: 79.99, category: "Women's Clothing", stock: 8 }, // Low stock
    { name: "Leather Crossbody Bag", price: 129.99, category: "Accessories", stock: 25 },
    { name: "Running Sneakers", price: 119.99, category: "Footwear", stock: 60 },
    { name: "Wool Blend Sweater", price: 69.99, category: "Women's Clothing", stock: 3 }, // Low stock
    { name: "Slim Fit Jeans", price: 59.99, category: "Men's Clothing", stock: 80 },
    { name: "Silk Scarf", price: 39.99, category: "Accessories", stock: 120 },
    { name: "Ankle Boots", price: 149.99, category: "Footwear", stock: 35 },
    { name: "Cashmere Cardigan", price: 159.99, category: "Women's Clothing", stock: 0 }, // Out of stock
    { name: "Baseball Cap", price: 24.99, category: "Accessories", stock: 200 },
    { name: "Graphic Hoodie", price: 54.99, category: "Men's Clothing", stock: 5 }, // Low stock
];

// Sample customer emails (some will be repeat customers)
const CUSTOMER_EMAILS = [
    "sarah.johnson@example.com",
    "mike.wilson@example.com",
    "emma.davis@example.com", // Repeat customer
    "james.brown@example.com",
    "olivia.taylor@example.com", // Repeat customer
    "william.anderson@example.com",
    "sophia.martinez@example.com", // Repeat customer
    "lucas.garcia@example.com",
    "isabella.rodriguez@example.com",
    "mason.lee@example.com",
    "ava.hernandez@example.com",
    "ethan.clark@example.com",
];

// Repeat customers (will place multiple orders)
const REPEAT_CUSTOMERS = [
    "emma.davis@example.com",
    "olivia.taylor@example.com",
    "sophia.martinez@example.com",
];

// Order statuses
const ORDER_STATUSES = [
    { status: "Pending", weight: 1 },
    { status: "Processing", weight: 2 },
    { status: "Shipped", weight: 3 },
    { status: "Delivered", weight: 8 }, // Most orders delivered
    { status: "Cancelled", weight: 1 },
];

function weightedRandomStatus(): string {
    const totalWeight = ORDER_STATUSES.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const { status, weight } of ORDER_STATUSES) {
        random -= weight;
        if (random <= 0) return status;
    }
    
    return "Delivered";
}

function randomDate(daysAgo: number): Date {
    const now = new Date();
    const randomDays = Math.random() * daysAgo;
    const randomHours = Math.random() * 24;
    const randomMinutes = Math.random() * 60;
    
    return new Date(
        now.getTime() - 
        (randomDays * 24 * 60 * 60 * 1000) -
        (randomHours * 60 * 60 * 1000) -
        (randomMinutes * 60 * 1000)
    );
}

function randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateShortId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

interface ProductDoc {
    id: string;
    name: string;
    price: number;
    category: string;
    stock: number;
}

async function seedProducts(): Promise<ProductDoc[]> {
    console.log('📦 Seeding products...');
    
    const productDocs: ProductDoc[] = [];
    
    for (const product of SAMPLE_PRODUCTS) {
        const productRef = db.collection('products').doc();
        await productRef.set({
            name: product.name,
            price: product.price,
            category: product.category,
            stock: product.stock,
            status: product.stock > 0 ? 'Active' : 'Out of Stock',
            description: `High-quality ${product.name.toLowerCase()} for everyday wear.`,
            image: `https://via.placeholder.com/400x500.png?text=${encodeURIComponent(product.name)}`,
            badge: product.stock <= 5 && product.stock > 0 ? 'Low Stock' : undefined,
            rating: 4.0 + Math.random(),
            createdAt: Timestamp.fromDate(randomDate(60)),
        });
        
        productDocs.push({
            id: productRef.id,
            ...product,
        });
    }
    
    console.log(`✅ Created ${productDocs.length} products`);
    return productDocs;
}

async function seedOrders(products: ProductDoc[]): Promise<void> {
    console.log('🛒 Seeding orders...');
    
    const orderCount = 50;
    let ordersCreated = 0;
    let totalRevenue = 0;
    
    // Create orders distributed over the last 30 days
    for (let i = 0; i < orderCount; i++) {
        const orderDate = randomDate(30);
        
        // Select customer (repeat customers get more orders)
        let customerEmail: string;
        if (Math.random() < 0.3 && REPEAT_CUSTOMERS.length > 0) {
            // 30% chance of repeat customer
            customerEmail = randomElement(REPEAT_CUSTOMERS);
        } else {
            customerEmail = randomElement(CUSTOMER_EMAILS);
        }
        
        // Select 1-3 items for the order
        const itemCount = randomInt(1, 3);
        const orderItems = [];
        let orderTotal = 0;
        
        for (let j = 0; j < itemCount; j++) {
            const product = randomElement(products);
            const quantity = randomInt(1, 3);
            const itemTotal = product.price * quantity;
            
            orderItems.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                image: `https://via.placeholder.com/100x100.png?text=${encodeURIComponent(product.name)}`,
                category: product.category,
            });
            
            orderTotal += itemTotal;
        }
        
        // Create order with realistic status
        const status = weightedRandomStatus();
        const paymentStatus = status === "Cancelled" ? "failed" : "paid";
        
        const orderId = generateShortId();
        await db.collection('orders').doc(orderId).set({
            customerEmail,
            items: orderItems,
            total: orderTotal,
            status,
            paymentStatus,
            shippingAddress: `${randomInt(100, 9999)} Main St, City, State ${randomInt(10000, 99999)}`,
            trackingNumber: status === "Shipped" || status === "Delivered" ? `TRK${randomInt(100000, 999999)}` : null,
            trackingCarrier: status === "Shipped" || status === "Delivered" ? randomElement(["UPS", "FedEx", "USPS"]) : null,
            createdAt: Timestamp.fromDate(orderDate),
            updatedAt: Timestamp.fromDate(orderDate),
        });
        
        ordersCreated++;
        if (paymentStatus === "paid") {
            totalRevenue += orderTotal;
        }
    }
    
    console.log(`✅ Created ${ordersCreated} orders`);
    console.log(`💰 Total revenue: $${totalRevenue.toFixed(2)}`);
}

async function seedAnalyticsEvents(products: ProductDoc[]): Promise<void> {
    console.log('📊 Seeding analytics events...');
    
    let eventsCreated = 0;
    
    // Generate events over the last 30 days
    const eventCount = 150; // More events than orders (some abandoned carts)
    
    for (let i = 0; i < eventCount; i++) {
        const eventDate = randomDate(30);
        const product = randomElement(products);
        const customerEmail = randomElement(CUSTOMER_EMAILS);
        const sessionId = `session-${Math.random().toString(36).substr(2, 9)}`;
        
        // ADD_TO_CART event
        await db.collection('analytics_events').add({
            type: 'ADD_TO_CART',
            productId: product.id,
            path: `/product/${product.id}`,
            value: product.price,
            sessionId,
            createdAt: Timestamp.fromDate(eventDate),
        });
        eventsCreated++;
        
        // 70% proceed to checkout
        if (Math.random() < 0.7) {
            const checkoutDate = new Date(eventDate.getTime() + 2 * 60 * 1000); // 2 min later
            
            await db.collection('analytics_events').add({
                type: 'CHECKOUT_START',
                path: '/checkout',
                value: product.price,
                sessionId,
                createdAt: Timestamp.fromDate(checkoutDate),
            });
            eventsCreated++;
            
            // 60% of those complete purchase
            if (Math.random() < 0.6) {
                const purchaseDate = new Date(checkoutDate.getTime() + 5 * 60 * 1000); // 5 min later
                
                await db.collection('analytics_events').add({
                    type: 'PURCHASE',
                    path: '/success',
                    value: product.price,
                    sessionId,
                    createdAt: Timestamp.fromDate(purchaseDate),
                });
                eventsCreated++;
            }
        }
    }
    
    console.log(`✅ Created ${eventsCreated} analytics events`);
}

async function cleanExistingData(): Promise<void> {
    console.log('🧹 Cleaning existing test data...');
    
    // Delete existing products
    const productsSnapshot = await db.collection('products').get();
    const productBatch = db.batch();
    productsSnapshot.docs.forEach(doc => productBatch.delete(doc.ref));
    await productBatch.commit();
    console.log(`  Deleted ${productsSnapshot.size} products`);
    
    // Delete existing orders
    const ordersSnapshot = await db.collection('orders').get();
    const orderBatch = db.batch();
    ordersSnapshot.docs.forEach(doc => orderBatch.delete(doc.ref));
    await orderBatch.commit();
    console.log(`  Deleted ${ordersSnapshot.size} orders`);
    
    // Delete existing analytics events
    const eventsSnapshot = await db.collection('analytics_events').get();
    const eventBatch = db.batch();
    eventsSnapshot.docs.forEach(doc => eventBatch.delete(doc.ref));
    await eventBatch.commit();
    console.log(`  Deleted ${eventsSnapshot.size} analytics events`);
    
    console.log('✅ Cleanup complete\n');
}

async function main() {
    console.log('🌱 Starting analytics data seeding...\n');
    
    try {
        // Optional: Clean existing data (comment out if you want to keep existing data)
        await cleanExistingData();
        
        // Seed data
        const products = await seedProducts();
        await seedOrders(products);
        await seedAnalyticsEvents(products);
        
        console.log('\n🎉 Seeding completed successfully!');
        console.log('\n📊 Next steps:');
        console.log('  1. Refresh your analytics dashboard at /admin/analytics');
        console.log('  2. Try different timeframes (7D, 30D, 1Y)');
        console.log('  3. Check the new features:');
        console.log('     - Inventory Insights (low stock alerts)');
        console.log('     - Top Customers table');
        console.log('     - Repeat Customer analytics');
        console.log('     - Abandonment rates');
        console.log('     - Order status breakdown');
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

main();

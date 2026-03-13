/**
 * Analytics Data Seeding Script (Client SDK Version)
 * 
 * This script generates realistic test data for the analytics dashboard using the client SDK:
 * - Orders with varied dates (last 30 days)
 * - Products across different categories
 * - Analytics events (ADD_TO_CART, CHECKOUT_START, PURCHASE)
 * - Repeat customers
 * - Low stock products for inventory insights
 * - Various order statuses
 * 
 * Usage: node scripts/seed-analytics-client.js
 * 
 * Note: You need to be signed in as admin in the browser first.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, addDoc, getDocs, deleteDoc, Timestamp } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
require('dotenv').config({ path: '.env.local' });

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

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
    { name: "Floral Summer Dress", price: 79.99, category: "Women's Clothing", stock: 8 },
    { name: "Leather Crossbody Bag", price: 129.99, category: "Accessories", stock: 25 },
    { name: "Running Sneakers", price: 119.99, category: "Footwear", stock: 60 },
    { name: "Wool Blend Sweater", price: 69.99, category: "Women's Clothing", stock: 3 },
    { name: "Slim Fit Jeans", price: 59.99, category: "Men's Clothing", stock: 80 },
    { name: "Silk Scarf", price: 39.99, category: "Accessories", stock: 120 },
    { name: "Ankle Boots", price: 149.99, category: "Footwear", stock: 35 },
    { name: "Cashmere Cardigan", price: 159.99, category: "Women's Clothing", stock: 0 },
    { name: "Baseball Cap", price: 24.99, category: "Accessories", stock: 200 },
    { name: "Graphic Hoodie", price: 54.99, category: "Men's Clothing", stock: 5 },
];

// Sample customer emails
const CUSTOMER_EMAILS = [
    "sarah.johnson@example.com",
    "mike.wilson@example.com",
    "emma.davis@example.com",
    "james.brown@example.com",
    "olivia.taylor@example.com",
    "william.anderson@example.com",
    "sophia.martinez@example.com",
    "lucas.garcia@example.com",
    "isabella.rodriguez@example.com",
    "mason.lee@example.com",
    "ava.hernandez@example.com",
    "ethan.clark@example.com",
];

const REPEAT_CUSTOMERS = [
    "emma.davis@example.com",
    "olivia.taylor@example.com",
    "sophia.martinez@example.com",
];

const ORDER_STATUSES = [
    { status: "Pending", weight: 1 },
    { status: "Processing", weight: 2 },
    { status: "Shipped", weight: 3 },
    { status: "Delivered", weight: 8 },
    { status: "Cancelled", weight: 1 },
];

function weightedRandomStatus() {
    const totalWeight = ORDER_STATUSES.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const { status, weight } of ORDER_STATUSES) {
        random -= weight;
        if (random <= 0) return status;
    }
    
    return "Delivered";
}

function randomDate(daysAgo) {
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

function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateShortId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

async function seedProducts() {
    console.log('📦 Seeding products...');
    
    const productDocs = [];
    
    for (const product of SAMPLE_PRODUCTS) {
        const productRef = doc(collection(db, 'products'));
        const productData = {
            name: product.name,
            price: product.price,
            category: product.category,
            stock: product.stock,
            status: product.stock > 0 ? 'Active' : 'Out of Stock',
            description: `High-quality ${product.name.toLowerCase()} for everyday wear.`,
            image: `https://via.placeholder.com/400x500.png?text=${encodeURIComponent(product.name)}`,
            rating: 4.0 + Math.random(),
            createdAt: Timestamp.fromDate(randomDate(60)),
        };
        
        // Only add badge if product is low stock
        if (product.stock <= 5 && product.stock > 0) {
            productData.badge = 'Low Stock';
        }
        
        await setDoc(productRef, productData);
        
        productDocs.push({
            id: productRef.id,
            ...product,
        });
    }
    
    console.log(`✅ Created ${productDocs.length} products`);
    return productDocs;
}

async function seedOrders(products) {
    console.log('🛒 Seeding orders...');
    
    const orderCount = 50;
    let ordersCreated = 0;
    let totalRevenue = 0;
    
    for (let i = 0; i < orderCount; i++) {
        const orderDate = randomDate(30);
        
        let customerEmail;
        if (Math.random() < 0.3 && REPEAT_CUSTOMERS.length > 0) {
            customerEmail = randomElement(REPEAT_CUSTOMERS);
        } else {
            customerEmail = randomElement(CUSTOMER_EMAILS);
        }
        
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
        
        const status = weightedRandomStatus();
        const paymentStatus = status === "Cancelled" ? "failed" : "paid";
        
        const orderId = generateShortId();
        await setDoc(doc(db, 'orders', orderId), {
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

async function seedAnalyticsEvents(products) {
    console.log('📊 Seeding analytics events...');
    
    let eventsCreated = 0;
    const eventCount = 150;
    
    for (let i = 0; i < eventCount; i++) {
        const eventDate = randomDate(30);
        const product = randomElement(products);
        const sessionId = `session-${Math.random().toString(36).substr(2, 9)}`;
        
        await addDoc(collection(db, 'analytics_events'), {
            type: 'ADD_TO_CART',
            productId: product.id,
            path: `/product/${product.id}`,
            value: product.price,
            sessionId,
            createdAt: Timestamp.fromDate(eventDate),
        });
        eventsCreated++;
        
        if (Math.random() < 0.7) {
            const checkoutDate = new Date(eventDate.getTime() + 2 * 60 * 1000);
            
            await addDoc(collection(db, 'analytics_events'), {
                type: 'CHECKOUT_START',
                path: '/checkout',
                value: product.price,
                sessionId,
                createdAt: Timestamp.fromDate(checkoutDate),
            });
            eventsCreated++;
            
            if (Math.random() < 0.6) {
                const purchaseDate = new Date(checkoutDate.getTime() + 5 * 60 * 1000);
                
                await addDoc(collection(db, 'analytics_events'), {
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

async function cleanExistingData() {
    console.log('🧹 Cleaning existing test data...');
    
    const productsSnapshot = await getDocs(collection(db, 'products'));
    for (const docSnap of productsSnapshot.docs) {
        await deleteDoc(docSnap.ref);
    }
    console.log(`  Deleted ${productsSnapshot.size} products`);
    
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    for (const docSnap of ordersSnapshot.docs) {
        await deleteDoc(docSnap.ref);
    }
    console.log(`  Deleted ${ordersSnapshot.size} orders`);
    
    const eventsSnapshot = await getDocs(collection(db, 'analytics_events'));
    for (const docSnap of eventsSnapshot.docs) {
        await deleteDoc(docSnap.ref);
    }
    console.log(`  Deleted ${eventsSnapshot.size} analytics events`);
    
    console.log('✅ Cleanup complete\n');
}

async function main() {
    console.log('🌱 Starting analytics data seeding...\n');
    
    try {
        // Sign in with admin credentials
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'nihalnshetty42@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD;
        
        if (!adminPassword) {
            console.log('⚠️  ADMIN_PASSWORD not set in .env.local');
            console.log('Please add: ADMIN_PASSWORD=your_password');
            console.log('\nAlternatively, you can run this in the browser console instead.');
            process.exit(1);
        }
        
        console.log(`🔐 Signing in as ${adminEmail}...`);
        await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        console.log('✅ Authenticated\n');
        
        await cleanExistingData();
        
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
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
}

main();

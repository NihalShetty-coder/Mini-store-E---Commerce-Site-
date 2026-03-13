/**
 * Browser Console Analytics Data Seeding Script
 * 
 * USAGE:
 * 1. Open your app at localhost:3000/admin/analytics
 * 2. Make sure you're signed in as admin
 * 3. Open Browser DevTools (F12)
 * 4. Go to Console tab
 * 5. Copy and paste this entire file
 * 6. Press Enter
 * 7. Wait for completion message
 * 8. Refresh the page
 * 
 * This will seed your database with realistic test data:
 * - 12 products across 4 categories
 * - 50 orders over 30 days
 * - 150+ analytics events
 * - Repeat customers
 * - Low stock & out-of-stock products
 */

(async function seedAnalyticsData() {
    console.log('🌱 Starting analytics data seeding...\n');
    
    // Import Firestore functions
    const { getFirestore, collection, doc, setDoc, addDoc, getDocs, deleteDoc, Timestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Get Firestore instance (already initialized by your app)
    const db = getFirestore();
    
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
    
    const CUSTOMER_EMAILS = [
        "sarah.johnson@example.com", "mike.wilson@example.com", "emma.davis@example.com",
        "james.brown@example.com", "olivia.taylor@example.com", "william.anderson@example.com",
        "sophia.martinez@example.com", "lucas.garcia@example.com", "isabella.rodriguez@example.com",
        "mason.lee@example.com", "ava.hernandez@example.com", "ethan.clark@example.com",
    ];
    
    const REPEAT_CUSTOMERS = ["emma.davis@example.com", "olivia.taylor@example.com", "sophia.martinez@example.com"];
    const ORDER_STATUSES = [
        { status: "Pending", weight: 1 }, { status: "Processing", weight: 2 },
        { status: "Shipped", weight: 3 }, { status: "Delivered", weight: 8 }, { status: "Cancelled", weight: 1 },
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
        return new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000);
    }
    
    function randomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    function generateShortId() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
    
    try {
        // Clean existing data
        console.log('🧹 Cleaning existing test data...');
        const collections = ['products', 'orders', 'analytics_events'];
        for (const collName of collections) {
            const snapshot = await getDocs(collection(db, collName));
            for (const docSnap of snapshot.docs) {
                await deleteDoc(docSnap.ref);
            }
            console.log(`  Deleted ${snapshot.size} ${collName}`);
        }
        console.log('✅ Cleanup complete\n');
        
        // Seed products
        console.log('📦 Seeding products...');
        const productDocs = [];
        for (const product of SAMPLE_PRODUCTS) {
            const productRef = doc(collection(db, 'products'));
            await setDoc(productRef, {
                ...product,
                status: product.stock > 0 ? 'Active' : 'Out of Stock',
                description: `High-quality ${product.name.toLowerCase()} for everyday wear.`,
                image: `https://via.placeholder.com/400x500.png?text=${encodeURIComponent(product.name)}`,
                badge: product.stock <= 5 && product.stock > 0 ? 'Low Stock' : undefined,
                rating: 4.0 + Math.random(),
                createdAt: Timestamp.fromDate(randomDate(60)),
            });
            productDocs.push({ id: productRef.id, ...product });
        }
        console.log(`✅ Created ${productDocs.length} products`);
        
        // Seed orders
        console.log('🛒 Seeding orders...');
        let totalRevenue = 0;
        for (let i = 0; i < 50; i++) {
            const orderDate = randomDate(30);
            const customerEmail = Math.random() < 0.3 ? randomElement(REPEAT_CUSTOMERS) : randomElement(CUSTOMER_EMAILS);
            const itemCount = randomInt(1, 3);
            const orderItems = [];
            let orderTotal = 0;
            
            for (let j = 0; j < itemCount; j++) {
                const product = randomElement(productDocs);
                const quantity = randomInt(1, 3);
                orderItems.push({
                    productId: product.id, name: product.name, price: product.price, quantity,
                    image: `https://via.placeholder.com/100x100.png?text=${encodeURIComponent(product.name)}`,
                    category: product.category,
                });
                orderTotal += product.price * quantity;
            }
            
            const status = weightedRandomStatus();
            const paymentStatus = status === "Cancelled" ? "failed" : "paid";
            const orderId = generateShortId();
            
            await setDoc(doc(db, 'orders', orderId), {
                customerEmail, items: orderItems, total: orderTotal, status, paymentStatus,
                shippingAddress: `${randomInt(100, 9999)} Main St, City, State ${randomInt(10000, 99999)}`,
                trackingNumber: ["Shipped", "Delivered"].includes(status) ? `TRK${randomInt(100000, 999999)}` : null,
                trackingCarrier: ["Shipped", "Delivered"].includes(status) ? randomElement(["UPS", "FedEx", "USPS"]) : null,
                createdAt: Timestamp.fromDate(orderDate),
                updatedAt: Timestamp.fromDate(orderDate),
            });
            
            if (paymentStatus === "paid") totalRevenue += orderTotal;
        }
        console.log(`✅ Created 50 orders`);
        console.log(`💰 Total revenue: $${totalRevenue.toFixed(2)}`);
        
        // Seed analytics events
        console.log('📊 Seeding analytics events...');
        let eventsCreated = 0;
        for (let i = 0; i < 150; i++) {
            const eventDate = randomDate(30);
            const product = randomElement(productDocs);
            const sessionId = `session-${Math.random().toString(36).substr(2, 9)}`;
            
            await addDoc(collection(db, 'analytics_events'), {
                type: 'ADD_TO_CART', productId: product.id, path: `/product/${product.id}`,
                value: product.price, sessionId, createdAt: Timestamp.fromDate(eventDate),
            });
            eventsCreated++;
            
            if (Math.random() < 0.7) {
                const checkoutDate = new Date(eventDate.getTime() + 2 * 60 * 1000);
                await addDoc(collection(db, 'analytics_events'), {
                    type: 'CHECKOUT_START', path: '/checkout', value: product.price,
                    sessionId, createdAt: Timestamp.fromDate(checkoutDate),
                });
                eventsCreated++;
                
                if (Math.random() < 0.6) {
                    const purchaseDate = new Date(checkoutDate.getTime() + 5 * 60 * 1000);
                    await addDoc(collection(db, 'analytics_events'), {
                        type: 'PURCHASE', path: '/success', value: product.price,
                        sessionId, createdAt: Timestamp.fromDate(purchaseDate),
                    });
                    eventsCreated++;
                }
            }
        }
        console.log(`✅ Created ${eventsCreated} analytics events`);
        
        console.log('\n🎉 Seeding completed successfully!');
        console.log('\n📊 Next steps:');
        console.log('  1. Refresh this page (Ctrl+R or Cmd+R)');
        console.log('  2. Check all metrics are now populated');
        console.log('  3. Try different timeframes (7D, 30D, 1Y)');
        console.log('  4. Explore all new features!');
        
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
})();
